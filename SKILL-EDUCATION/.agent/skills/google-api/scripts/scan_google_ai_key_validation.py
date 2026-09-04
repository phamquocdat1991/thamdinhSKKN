#!/usr/bin/env python3
"""Read-only, redacting audit for Google AI credential handling risks."""

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
TEXT_EXTENSIONS = {
    ".cjs", ".cs", ".env", ".go", ".html", ".java", ".js", ".jsx",
    ".json", ".kt", ".md", ".mjs", ".php", ".py", ".rb", ".rs",
    ".tsx", ".ts", ".txt", ".vue", ".yaml", ".yml",
}
MAX_FILE_BYTES = 2 * 1024 * 1024
SEVERITY_ORDER = {"info": 0, "low": 1, "medium": 2, "high": 3}

KEY_LITERALS = (
    re.compile(r"AIzaSy[A-Za-z0-9_-]{12,}"),
    re.compile(r"\bAQ[A-Za-z0-9._~-]{12,}\b"),
)
ASSIGNMENT_SECRET = re.compile(
    r"(?i)((?:api[_-]?key|gemini[_-]?key|google[_-]?api[_-]?key)\s*[:=]\s*['\"])[^'\"\r\n]+(['\"])",
)


@dataclass(frozen=True)
class Rule:
    rule_id: str
    severity: str
    description: str
    pattern: re.Pattern[str]


RULES = (
    Rule(
        "public-secret-env",
        "high",
        "Google AI secrets must not use client-public environment variable prefixes.",
        re.compile(r"(?i)\b(?:VITE|NEXT_PUBLIC|PUBLIC|REACT_APP)_[A-Z0-9_]*(?:API_?KEY|GEMINI_?KEY)\b"),
    ),
    Rule(
        "browser-secret-storage",
        "high",
        "Do not persist production API keys in browser storage.",
        re.compile(
            r"(?i)(?:localStorage|sessionStorage|indexedDB)[^\n]{0,160}"
            r"(?:api[_-]?key|gemini[_-]?key|google[_-]?key)"
            r"|(?:api[_-]?key|gemini[_-]?key|google[_-]?key)[^\n]{0,160}"
            r"(?:localStorage|sessionStorage|indexedDB)"
        ),
    ),
    Rule(
        "credential-logging",
        "high",
        "Inspect for secret logging; scanner output is redacted but runtime output may not be.",
        re.compile(
            r"(?i)(?:console\.(?:log|debug|info|warn|error)|logger\.(?:debug|info|warn|error)|print)"
            r"[^\n]{0,180}(?:api[_-]?key|gemini[_-]?key|google[_-]?key)"
        ),
    ),
    Rule(
        "prefix-only-validator",
        "medium",
        "Treat keys as opaque; do not use AIza/AQ prefix checks as authentication.",
        re.compile(
            r"(?:startsWith\s*\(\s*['\"](?:AIza|AIzaSy|AQ)['\"]"
            r"|\^\(\?:AIza|\^AIza|\^AQ|AIzaSy\|AQ|AIza\|AQ)"
        ),
    ),
    Rule(
        "provider-inference",
        "high",
        "Provider choice must be explicit and must not be inferred from credential text.",
        re.compile(
            r"(?i)(?:startsWith|match|test)[^\n]{0,100}(?:AIza|AQ)[^\n]{0,140}"
            r"(?:provider|vertex|agent.?platform|gemini)"
            r"|(?:provider|vertex|agent.?platform|gemini)[^\n]{0,140}"
            r"(?:startsWith|match|test)[^\n]{0,100}(?:AIza|AQ)"
        ),
    ),
    Rule(
        "direct-client-construction",
        "medium",
        "Verify SDK construction is confined to one server-side provider factory.",
        re.compile(r"(?:new\s+GoogleGenAI\s*\(|genai\.Client\s*\()"),
    ),
    Rule(
        "direct-google-endpoint",
        "medium",
        "Inspect whether this Google AI call runs server-side and uses the shared gateway.",
        re.compile(r"(?:generativelanguage\.googleapis\.com|aiplatform\.googleapis\.com)"),
    ),
    Rule(
        "ambiguous-invalid-key-copy",
        "low",
        "Ensure this copy is used only for authentication failures, not 403/429/5xx.",
        re.compile(r"(?i)Invalid API Key|API Key kh[oô]ng h[oợ]p l[eệ]|Key ph[aả]i b[aắ]t"),
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
    for pattern in KEY_LITERALS:
        result = pattern.sub("<redacted-key>", result)
    return ASSIGNMENT_SECRET.sub(r"\1<redacted>\2", result)


def has_key_literal(text: str) -> bool:
    return any(pattern.search(text) for pattern in KEY_LITERALS)


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
            if filename in extra_excludes or path.is_symlink():
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


def likely_client_file(path: Path) -> bool:
    lower_parts = {part.lower() for part in path.parts}
    return bool(
        lower_parts & {"browser", "client", "components", "pages"}
        or path.suffix.lower() in {".jsx", ".tsx", ".vue", ".html"}
    )


def scan(root: Path, include_generated: bool, excludes: set[str]) -> list[Finding]:
    findings: list[Finding] = []

    for path in iter_files(root, include_generated, excludes):
        content = read_text(path)
        if content is None:
            continue
        rel_path = path.relative_to(root)
        rel = str(rel_path)

        for line_no, line in enumerate(content.splitlines(), start=1):
            if has_key_literal(line):
                findings.append(Finding(
                    path=rel,
                    line=line_no,
                    rule_id="key-like-literal",
                    severity="high",
                    message="Potential credential-like literal found; rotate if real and remove from source/history.",
                    snippet=redact(line.strip())[:240],
                ))

            for rule in RULES:
                if not rule.pattern.search(line):
                    continue
                severity = rule.severity
                message = rule.description
                if rule.rule_id in {"direct-client-construction", "direct-google-endpoint"} and likely_client_file(rel_path):
                    severity = "high"
                    message = "Potential production client-side Google AI credential/API path; verify server-only boundary."
                findings.append(Finding(
                    path=rel,
                    line=line_no,
                    rule_id=rule.rule_id,
                    severity=severity,
                    message=message,
                    snippet=redact(line.strip())[:240],
                ))

        is_env_template = path.name.lower().endswith((".example", ".sample", ".template"))
        if path.name.startswith(".env") and not is_env_template and re.search(
            r"(?im)^\s*(?:GOOGLE_API_KEY|GEMINI_API_KEY|[A-Z0-9_]*(?:GEMINI|GOOGLE_AI)[A-Z0-9_]*KEY)\s*=\s*\S+",
            content,
        ):
            findings.append(Finding(
                path=rel,
                line=1,
                rule_id="env-secret-present",
                severity="high",
                message="A key assignment exists in an env file; verify the file is ignored and never committed.",
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
    print("Potential key values are redacted. Heuristic only: inspect before editing.")


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="Audit Google AI credential validation, storage, exposure, and provider routing."
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
