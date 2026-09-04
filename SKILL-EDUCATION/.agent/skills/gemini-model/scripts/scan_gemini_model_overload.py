#!/usr/bin/env python3
"""Read-only heuristic audit for Gemini retry, fallback, and routing gaps."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


DEFAULT_SKIP_DIRS = {
    ".git", ".hg", ".svn", ".agent", ".next", ".nuxt", ".svelte-kit",
    ".turbo", ".venv", "__pycache__", "build", "coverage", "dist",
    "node_modules", "vendor",
}
SKIP_FILES = {"package-lock.json", "pnpm-lock.yaml", "yarn.lock"}
TEXT_EXTENSIONS = {
    ".cjs", ".cs", ".go", ".html", ".java", ".js", ".jsx", ".json",
    ".kt", ".md", ".mjs", ".php", ".py", ".rb", ".rs", ".tsx",
    ".ts", ".txt", ".vue", ".yaml", ".yml",
}
MAX_FILE_BYTES = 2 * 1024 * 1024
SEVERITY_ORDER = {"info": 0, "low": 1, "medium": 2, "high": 3}

SECRET_PATTERNS = (
    re.compile(r"AIzaSy[A-Za-z0-9_-]{12,}"),
    re.compile(r"\bAQ[A-Za-z0-9._~-]{12,}\b"),
    re.compile(
        r"(?i)((?:api[_-]?key|gemini[_-]?key)\s*[:=]\s*['\"])[^'\"\r\n]+(['\"])",
    ),
)


@dataclass(frozen=True)
class Rule:
    rule_id: str
    severity: str
    description: str
    pattern: re.Pattern[str]


RULES = (
    Rule(
        "direct-generate-call",
        "medium",
        "Inspect whether this call is routed through the shared AI gateway.",
        re.compile(
            r"(?:models\.(?:generateContent|generate_content|generateContentStream|generate_content_stream)"
            r"|interactions\.(?:create|stream)|sendMessage(?:Stream)?|send_message(?:_stream)?"
            r"|:(?:streamGenerateContent|generateContent)\b)"
        ),
    ),
    Rule(
        "direct-client-construction",
        "medium",
        "Multiple client factories can bypass shared retry/provider policy.",
        re.compile(r"(?:new\s+GoogleGenAI\s*\(|genai\.Client\s*\()"),
    ),
    Rule(
        "message-only-error-branch",
        "medium",
        "Prefer structured status/code parsing before matching error text.",
        re.compile(
            r"(?i)(?:message|toString\(\)|str\([^)]*error)[^\n]{0,100}"
            r"(?:503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand)"
        ),
    ),
    Rule(
        "credential-health-mutation",
        "high",
        "Verify this does not invalidate/cool down a key for model or service health errors.",
        re.compile(
            r"(?i)(?:markKey(?:Error|Invalid)|rotateToNextKey|invalidateKey|key[^\n]{0,30}cooldown)"
        ),
    ),
    Rule(
        "hard-coded-model-array",
        "low",
        "Confirm this list is provider-scoped, capability-filtered, and backed by live discovery.",
        re.compile(r"(?:FALLBACK_MODELS|FREE_GENERAL_GEMINI_MODELS|MODEL_FALLBACKS)"),
    ),
    Rule(
        "unsafe-latest-alias",
        "medium",
        "A latest alias can move; use a stable model ID when deterministic production behavior matters.",
        re.compile(r"gemini-[A-Za-z0-9-]*latest\b"),
    ),
    Rule(
        "streaming-call",
        "low",
        "Verify retry is blocked after a user-visible chunk or external side effect.",
        re.compile(r"(?:generateContentStream|generate_content_stream|sendMessageStream|streamGenerateContent)"),
    ),
)


@dataclass
class Finding:
    path: str
    line: int
    rule_id: str
    severity: str
    message: str
    snippet: str


def redact(text: str) -> str:
    result = text
    for pattern in SECRET_PATTERNS:
        if pattern.groups == 2:
            result = pattern.sub(r"\1<redacted>\2", result)
        else:
            result = pattern.sub("<redacted-key>", result)
    return result


def iter_files(root: Path, include_generated: bool, extra_excludes: set[str]) -> Iterable[Path]:
    skip_dirs = set(extra_excludes)
    if not include_generated:
        skip_dirs |= DEFAULT_SKIP_DIRS

    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        dirnames[:] = [
            name for name in dirnames
            if name not in skip_dirs and not (Path(dirpath) / name).is_symlink()
        ]
        current = Path(dirpath)
        for filename in filenames:
            path = current / filename
            if filename in SKIP_FILES or filename in extra_excludes or path.is_symlink():
                continue
            if path.suffix.lower() not in TEXT_EXTENSIONS and not filename.startswith(".env"):
                continue
            try:
                if path.stat().st_size > MAX_FILE_BYTES:
                    continue
            except OSError:
                continue
            yield path


def read_text(path: Path) -> str | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if b"\0" in data:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return data.decode("utf-8-sig")
        except UnicodeDecodeError:
            return None


def scan(root: Path, include_generated: bool, excludes: set[str]) -> list[Finding]:
    findings: list[Finding] = []

    for path in iter_files(root, include_generated, excludes):
        content = read_text(path)
        if content is None:
            continue
        rel = str(path.relative_to(root))
        file_findings: list[Finding] = []

        for line_no, line in enumerate(content.splitlines(), start=1):
            for rule in RULES:
                if not rule.pattern.search(line):
                    continue
                item = Finding(
                    path=rel,
                    line=line_no,
                    rule_id=rule.rule_id,
                    severity=rule.severity,
                    message=rule.description,
                    snippet=redact(line.strip())[:240],
                )
                findings.append(item)
                file_findings.append(item)

        has_call = any(item.rule_id == "direct-generate-call" for item in file_findings)
        has_policy_marker = bool(re.search(
            r"normalizeAiError|parseApiError|executeWithModelPolicy|withModelFallback|RetryPolicy",
            content,
        ))
        if has_call and not has_policy_marker:
            findings.append(Finding(
                path=rel,
                line=1,
                rule_id="no-local-policy-marker",
                severity="medium",
                message="Calls were found without a nearby shared error/retry policy marker; inspect routing.",
                snippet="",
            ))

        has_overload = bool(re.search(r"(?i)503|UNAVAILABLE|overloaded|high demand", content))
        has_invalid_copy = bool(re.search(r"(?i)invalid API key|API key kh[oô]ng h[oợ]p l[eệ]", content))
        if has_overload and has_invalid_copy:
            findings.append(Finding(
                path=rel,
                line=1,
                rule_id="mixed-service-and-key-copy",
                severity="medium",
                message="This file contains service-overload and invalid-key handling; verify branches cannot cross.",
                snippet="",
            ))

    return findings


def print_text(findings: list[Finding]) -> None:
    for finding in findings:
        suffix = f": {finding.snippet}" if finding.snippet else ""
        print(
            f"{finding.path}:{finding.line}: {finding.severity}: {finding.rule_id}: "
            f"{finding.message}{suffix}"
        )

    counts = {severity: 0 for severity in SEVERITY_ORDER}
    for finding in findings:
        counts[finding.severity] += 1
    print("\nSummary:")
    for severity in ("high", "medium", "low", "info"):
        print(f"  {severity}: {counts[severity]}")
    print("Heuristic only: inspect each finding before editing.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="Audit Gemini call sites for retry, fallback, and error-routing gaps."
    )
    parser.add_argument("project_root", nargs="?", default=".", help="Project root to scan")
    parser.add_argument(
        "--include-generated",
        action="store_true",
        help="Also scan generated/dependency directories such as dist and node_modules",
    )
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="NAME",
        help="Additional file or directory basename to skip; repeatable",
    )
    parser.add_argument("--format", choices=("text", "json"), default="text")
    parser.add_argument(
        "--fail-on",
        choices=("never", "low", "medium", "high"),
        default="never",
        help="Exit 2 when a finding at or above this severity exists",
    )
    args = parser.parse_args()

    root = Path(args.project_root).resolve()
    if not root.is_dir():
        parser.error(f"project root is not a directory: {root}")

    findings = scan(root, args.include_generated, set(args.exclude))
    if args.format == "json":
        print(json.dumps(
            {"root": str(root), "findings": [asdict(item) for item in findings]},
            ensure_ascii=False,
            indent=2,
        ))
    else:
        print_text(findings)

    if args.fail_on != "never":
        threshold = SEVERITY_ORDER[args.fail_on]
        if any(SEVERITY_ORDER[item.severity] >= threshold for item in findings):
            return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

