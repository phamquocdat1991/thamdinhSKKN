---
name: gemini-model-overload-fallback
description: Audit or update Gemini Developer API and Gemini Enterprise Agent Platform integrations for resilient model routing, structured error handling, bounded retry/fallback, and safe streaming recovery. Use for 429/5xx/timeout/model-not-found failures, stale hard-coded Gemini model lists, calls that bypass a shared gateway, or UI that mislabels service failures as API-key errors. Do not use for general API-key storage or provider-authentication work unless resilience is also in scope.
---

# Gemini Model Resilience

Build one observable, bounded AI gateway that preserves the user's provider, task capabilities, cost policy, and partial work when a Gemini request fails.

## Workflow

1. Inspect the project before editing.
   - Identify the SDK and version, provider(s), server/client boundary, model selectors, streaming paths, REST calls, tool/function execution, key manager, and user-facing error mapping.
   - Search `generateContent`, `generateContentStream`, `interactions.create`, `sendMessage`, direct REST endpoints, and every `new GoogleGenAI(...)`.
2. Run the read-only scanner:

   ```bash
   python3 scripts/scan_gemini_model_overload.py <project-root>
   ```

   Use `--format json` for automation and `--fail-on high` in CI. Treat findings as review leads, not proof of a bug.
3. Build a call-site inventory. Record each task's provider, modality, required tools, structured-output contract, streaming behavior, timeout, and whether replay can cause an external side effect.
4. Centralize requests behind one gateway. Components and feature helpers must not implement their own retry, model fallback, key mutation, or error-copy logic.
5. Parse structured status/code fields before message text. Keep at least these categories distinct:
   - authentication (`401`)
   - permission (`403`)
   - invalid request (`400`)
   - model not found (`model_not_found`/model-specific `404`)
   - rate limited versus quota exhausted (`429`)
   - transient service failure (`408`, `500`, `502`, `503`; cautiously `504`)
   - safety/content blocked
   - cancelled
   - unknown
6. Apply the bounded policy in [references/runtime-resilience.md](references/runtime-resilience.md). Retry transient failures with exponential backoff and jitter; only then consider a capability-compatible fallback. Never retry or switch model for `400`, `401`, `403`, a generic `404`, safety blocks, cancellation, or unknown errors.
7. When model configuration or selection is in scope, read [references/current-models.md](references/current-models.md). Discover models from the configured provider at runtime where supported; use the dated snapshot only as a bootstrap/last-known-good list.
8. Preserve transaction boundaries.
   - Do not automatically replay a stream after visible chunks were emitted.
   - Do not replay a request after an external tool side effect unless the operation has a verified idempotency key.
   - Do not discard a completed earlier step when a later step falls back.
9. Keep model health separate from credential health. Service overload, timeout, rate limit, or model removal must not mark a key invalid. Do not rotate keys to evade a project quota.
10. Validate with focused unit tests, a project build, and at least one injected failure per branch. Re-run the scanner and inspect any remaining direct call sites.

## Required Runtime Invariants

- Provider choice is explicit and never changes during fallback.
- Fallback candidates match modality, required capabilities, response schema, context/output limits, and the configured cost ceiling.
- The user's selected model is first only when it is available and compatible.
- One layer owns retries. Account for SDK automatic retries so nested wrappers do not multiply attempts.
- Attempts, elapsed time, and candidate count have hard limits.
- `Retry-After` is honored when present.
- Logs contain model, provider, attempt, latency, normalized error category, and request/correlation ID where available; never log keys or full sensitive prompts.
- UI copy reports the real category and says when a different model is being tried.

## Completion Criteria

- Every relevant AI call is routed through the shared gateway or explicitly documented as an intentional exception.
- Structured error parsing and the retry/fallback decision table have tests.
- `429 rate_limit_exceeded` can back off; `429 quota_exceeded` stops with quota guidance.
- `503` is never shown as an invalid key.
- Streaming and tool-call replay guards are tested.
- The model list is provider-scoped, capability-filtered, and not silently stale.
- Build/typecheck/test commands complete, or pre-existing failures are reported with evidence.

