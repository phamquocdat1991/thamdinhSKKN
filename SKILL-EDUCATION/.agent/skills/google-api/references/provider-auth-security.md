# Google AI Provider and Credential Security

Last verified against official Google documentation: **2026-09-04 UTC**.

## 1. Provider model

Use explicit product-facing names and stable internal values:

```ts
export type GoogleAiProvider = 'gemini-developer' | 'agent-platform-express';

export interface GoogleAiSettings {
  provider: GoogleAiProvider;
  credentialRef: string; // server-side identifier, never the secret
  modelId: string;
}
```

If an existing app stores `gemini` and `agent-platform`, migrate deterministically and preserve the user's explicit choice. A key prefix is never migration evidence.

For full Gemini Enterprise Agent Platform with ADC/service-account auth, use a separate provider mode and current enterprise SDK configuration; do not overload express-mode API-key settings.

## 2. Opaque input checks

Local syntax validation is only an input-quality check. It must not display “key hợp lệ”.

```ts
export type KeySyntaxResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: 'EMPTY' | 'WHITESPACE_OR_CONTROL' | 'TOO_LONG' };

export function checkOpaqueApiKeyInput(raw: string): KeySyntaxResult {
  const normalized = raw.trim();
  if (!normalized) return { ok: false, reason: 'EMPTY' };
  if (/\s|[\u0000-\u001F\u007F]/u.test(normalized)) {
    return { ok: false, reason: 'WHITESPACE_OR_CONTROL' };
  }
  if (normalized.length > 4096) return { ok: false, reason: 'TOO_LONG' };
  return { ok: true, normalized };
}
```

Do not replace this with `startsWith('AIza')`, `startsWith('AQ')`, or a prefix regex. Official Google docs describe standard and authorization keys but do not define a permanent textual prefix contract.

## 3. Server-side client factory

Keep this in a server-only module and enforce that boundary using the framework's server marker where available.

```ts
import { GoogleGenAI } from '@google/genai';

export function createGoogleAiClient(
  provider: GoogleAiProvider,
  apiKey: string,
): GoogleGenAI {
  if (provider === 'agent-platform-express') {
    return new GoogleGenAI({ vertexai: true, apiKey });
  }
  return new GoogleGenAI({ apiKey });
}
```

The `vertexai: true` setting routes the SDK to Agent Platform/Vertex AI behavior. It does not identify a key's origin and must not be toggled by prefix inspection.

For server-owned keys, prefer `GEMINI_API_KEY`/`GOOGLE_API_KEY` or a secret manager. On Vercel, use server-only environment variables. Never prefix secrets with `VITE_`, `NEXT_PUBLIC_`, `PUBLIC_`, or `REACT_APP_`.

## 4. Production boundary

Google's current guidance says not to expose Gemini API keys client-side in production. Recommended flow:

```text
Browser/mobile UI -> authenticated app backend/serverless route -> Google AI API
```

The backend must enforce:

- user authentication/authorization where the app is not public,
- request-size and rate limits,
- input schema validation,
- server-side provider/model allowlists,
- timeouts and bounded retries,
- CORS/CSRF rules appropriate to the framework,
- redacted errors and logs,
- abuse and billing controls.

A fully static site cannot securely hold a shared production key. Add a backend or explicitly limit the app to local/self-hosted development. Obfuscation, base64, minification, and browser storage do not protect a key.

## 5. “Kiểm tra API key” contract

The button must call a backend route with an explicit provider. Prefer a non-generating provider-scoped operation such as model listing/get when supported. If only a generation probe can confirm access, use a minimal request, tell the user it may consume quota, and run it only on explicit click.

Safe response shape:

```ts
type VerifyCredentialResponse =
  | {
      ok: true;
      provider: GoogleAiProvider;
      credentialFingerprint: string;
      checkedAt: string;
      models: Array<{ id: string; displayName?: string }>;
    }
  | {
      ok: false;
      provider: GoogleAiProvider;
      category: 'AUTHENTICATION' | 'PERMISSION' | 'RATE_LIMIT' | 'QUOTA' | 'SERVICE' | 'UNKNOWN';
      message: string;
      checkedAt: string;
    };
```

Requirements:

- The fingerprint is a keyed server-side HMAC or a credential-record ID, not a reversible hash shown to users.
- Never return the key, even masked, from the server.
- Store verification state against `(user, provider, credentialFingerprint)` with a timestamp/TTL.
- Editing/replacing the key or changing provider invalidates state immediately.
- A successful format check is not a successful live verification.
- Do not expose raw upstream responses; retain only safe diagnostics on the server.

## 6. Credential lifecycle

### Server-owned credentials

- Store in a secret manager or server-only deployment variable.
- Use separate credentials/config per environment and provider.
- Restrict access, configure billing alerts, rotate safely, and audit usage.
- Never commit `.env` files containing values.

### User-supplied credentials

- Prefer short-lived use in a server session when persistence is unnecessary.
- If persistence is required, encrypt at rest with managed key material, scope records per authenticated user and provider, and support deletion/rotation.
- Never send a stored secret back to the browser. UI may show `Đã cấu hình` plus a server-held credential record label.
- Clear plaintext from application variables as soon as practical; do not place it in analytics or crash context.

### Migration in September 2026

Google AI Studio creates authorization keys by default. Current official documentation states that Gemini API is transitioning away from standard keys and announces rejection of standard keys in September 2026. Add a migration notice and operational checklist, but detect the key type from authoritative account metadata/UI—not from its characters.

## 7. Error categories

| Signal | Meaning | UI/action |
| --- | --- | --- |
| `401` / authentication | Missing, invalid, expired, or rejected credential | Mark verification invalid; ask user/admin to replace or recheck |
| `403` / permission denied | Credential recognized but lacks provider/model/IAM/API restriction access | Do not call it a bad key; show provider/permission/billing checks |
| `429 rate_limit_exceeded` | Short-window throttling | Keep credential valid; bounded backoff |
| `429 quota_exceeded` | Quota exhausted | Keep credential valid; show reset/increase-quota guidance |
| `5xx` | Service/model health | Keep credential valid; bounded retry/fallback in the resilience layer |
| model-specific `404` | Model unavailable | Refresh provider model list; do not invalidate key |
| `400` | Bad request/config | Fix payload; do not retry credentials |

Do not try a different model for `401` or generic `403`. Do not silently switch providers.

## 8. Provider-scoped models

Create a separate client for the explicit provider, call `models.list()` where supported, and filter the returned models by the feature's real needs. Cache only safe model metadata. If live listing fails, show a stale/bootstrap state rather than pretending a hard-coded list is current.

Switching provider must:

1. load that provider's own credential reference,
2. clear prior verification/model selection if incompatible,
3. fetch or load that provider's model catalog,
4. require a compatible model selection,
5. never copy secret values between providers.

## 9. Required tests

- Opaque nonempty keys, including `AIzaSy...` and `AQ...`, pass syntax checks without provider inference.
- Empty, internal-whitespace/control-character, and oversized inputs fail locally.
- UI cannot claim verified until the backend succeeds.
- Changing one character, provider, credential record, or user invalidates verification state.
- Client bundles contain no server secret or public-key environment name.
- Browser storage APIs never receive API keys.
- Server response/log/error snapshots contain no full or masked secret.
- `401`, `403`, rate limit, quota, and `5xx` remain distinct.
- Gemini Developer and Agent Platform express clients route to the intended backend.
- Production build plus a secret scanner pass.

## Official sources

- Gemini API keys and security: https://ai.google.dev/gemini-api/docs/api-key
- Gemini API errors: https://ai.google.dev/gemini-api/docs/api-errors
- Gemini retry guidance: https://ai.google.dev/gemini-api/docs/troubleshooting
- Agent Platform API keys: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys
- Agent Platform express-mode tutorial: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/express-mode/vertex-ai-express-mode-api-quickstart
- Google Gen AI SDK: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/sdks/overview

