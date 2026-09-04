---
name: google-ai-api-key-validation
description: Audit or update Google AI authentication and provider routing so Gemini Developer API and Gemini Enterprise Agent Platform credentials are handled as opaque secrets, verified against the explicitly selected provider, and never exposed in production clients. Use for rejected AQ/AIza keys, prefix validators, API-key test buttons, frontend/localStorage secrets, public environment variables, provider inference, 401/403/429 misclassification, or standard-to-auth-key migration. Do not use for model overload/fallback unless authentication changes are also requested.
---

# Google AI Authentication and Provider Safety

Accept current and future key formats without guessing their provider, verify credentials safely, and keep production secrets behind a server boundary.

## Workflow

1. Establish the architecture and threat model.
   - Identify Gemini Developer API versus Gemini Enterprise Agent Platform (including express mode), SDK/version, deployment target, server routes, key ownership, multi-user behavior, and whether the app is production, local-only, or a trusted internal tool.
   - For a production web/mobile app, client-side key storage or a public build-time environment variable is a release blocker. Add a backend/serverless proxy.
2. Run the read-only scanner:

   ```bash
   python3 scripts/scan_google_ai_key_validation.py <project-root>
   ```

   Use `--format json` for automation and `--fail-on high` in CI. It redacts key-like values. Treat results as leads and inspect context before editing.
3. Remove prefix-as-authentication logic.
   - Keys are opaque credentials. Do not require `AIza`, `AIzaSy`, or `AQ`.
   - Local checks may trim input, reject empty/control/whitespace-containing values, and cap unreasonable length; they must not claim the key is valid.
   - Continue accepting legacy `AIzaSy...` and newer `AQ...` values, but never infer provider or key type from either prefix.
4. Make provider selection explicit. Store provider, credential reference, model selection, and verification state separately. Changing provider or key invalidates prior verification.
5. Route all SDK construction through one server-side provider factory. Do not instantiate `GoogleGenAI` in UI components or feature helpers.
6. Implement “Kiểm tra API key” as a server-side provider-scoped live verification. Return only normalized status, provider, safe model metadata, and timestamp. Never echo the key or raw upstream error.
7. Store secrets correctly.
   - Server-owned keys: server-only environment variables or a secret manager.
   - User-supplied keys: encrypted server-side storage or a short-lived server session with access control and deletion/rotation support.
   - Never persist production keys in `localStorage`, `sessionStorage`, IndexedDB, source code, logs, analytics, prompts, crash reports, URLs, or `VITE_`/`NEXT_PUBLIC_`/`PUBLIC_` variables.
8. Keep error meanings distinct: `401` authentication, `403` permission/restriction/IAM, `429` rate/quota, `5xx` service health. Only `401` should normally invalidate credential verification.
9. If standard keys are present, prompt migration to current Google AI Studio authorization keys. Do not attempt to determine key type from its text.
10. Follow [references/provider-auth-security.md](references/provider-auth-security.md) for implementation patterns, Vercel guidance, verification state, and tests.

## Guardrails

- Do not call a live API without the user's configured credential and an action within the requested scope.
- Do not print, serialize, or include full keys in diffs, scanner output, screenshots, test fixtures, or error messages.
- Masking is for display only; it is not safe storage.
- Do not silently copy a key between providers or auto-switch provider after an error.
- Do not retry `400`, `401`, or `403` with other models. A different model is not a fix for malformed authentication or missing permission.
- Do not weaken backend authentication/CORS/CSRF controls to make a test route work.
- Do not use key rotation to evade quotas or rate limits.

## Completion Criteria

- No prefix-only validator blocks a plausible opaque key.
- Provider is chosen explicitly and survives reload without being inferred from the key.
- Production secrets do not reach client bundles or browser storage.
- Test-key status is bound to provider plus a non-reversible credential fingerprint and is invalidated on edit.
- `401`, `403`, `429`, and `5xx` produce distinct, actionable UI states.
- All Google AI calls use the shared server-side factory/gateway.
- Secret scanning, typecheck, tests, and production build pass, or pre-existing failures are documented.

