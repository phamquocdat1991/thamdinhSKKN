# Current Gemini Model Routing Snapshot

Last verified: **2026-09-04 UTC**. Model availability, pricing, quotas, and provider access can change. Runtime discovery for the configured provider is authoritative.

## General text and multimodal-input models

| Model ID | Status | Suggested role |
| --- | --- | --- |
| `gemini-3.8-flash` | Stable/GA | Default quality route for complex education content, coding, and long multi-step work |
| `gemini-3.7-flash` | Stable/GA | First same-family fallback |
| `gemini-3.6-flash` | Stable/GA | Second same-family fallback |
| `gemini-3.5-flash` | Stable/GA | Older quality fallback; validate cost before automatic use |
| `gemini-3.5-flash-lite` | Stable/GA | Economy route for extraction, classification, summaries, and high volume |
| `gemini-3.1-flash-lite` | Stable; shutdown announced for 2027-05-07 | Compatibility fallback only; plan migration to 3.5 Flash-Lite |
| `gemini-2.5-flash-lite` | Stable | Legacy economy fallback when the provider exposes it |
| `gemini-2.5-flash` | Stable | Legacy balanced fallback when needed |
| `gemini-2.5-pro` | Stable | Explicit high-reasoning route, not a generic automatic fallback |
| `gemini-3.1-pro-preview` | Preview | Opt-in only; do not mix into a stable production chain by default |

Gemini 3.8, 3.7, 3.6, 3.5 Flash, and 3.5 Flash-Lite accept text, image, video, audio, and PDF inputs and return text. Their documented input limit is 1,048,576 tokens and output limit is 65,536 tokens, but the app should still read current provider metadata and enforce its own task budget.

## Default routing profiles

Use profiles as bootstrap candidates, then intersect them with the live provider list and task requirements.

```ts
export const BOOTSTRAP_MODEL_PROFILES = {
  quality: [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
  ],
  economy: [
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite',
  ],
} as const;
```

Do not append Pro, preview, media, Live, TTS, embedding, image-output, or video-output models to these generic chains.

## Specialized routes stay separate

- Image generation/editing: `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, `gemini-3-pro-image`.
- Video generation: `veo-3.1-generate-preview`, `veo-3.1-lite-generate-preview`, or another provider-confirmed video model.
- Realtime voice/translation, TTS, transcription, embeddings, Deep Research, and computer-use models require their own request/response contracts and fallback pools.

Never infer compatibility from the substring `flash`. Filter on actual endpoint/provider support and the task's capabilities.

## Runtime discovery

The current JavaScript SDK exposes `client.models.list()`. Build the selector from the provider-scoped result and cache a last-known-good catalog with a short TTL. If discovery fails:

1. Keep the user's current compatible selection if it was previously verified.
2. Use only a dated bootstrap candidate that belongs to the same provider and capability profile.
3. Mark the catalog as stale in diagnostics.
4. Never silently switch providers.

If a model is returned but the required capability cannot be confirmed, disable that task/model combination until a safe probe succeeds.

## Pricing snapshot

For Gemini Developer API Standard requests on 2026-09-04:

- Gemini 3.8/3.7/3.6 Flash: free tier available; introductory paid price through 2026-12-31 is USD 0.75/1M input and USD 3.75/1M output tokens. Announced 2027 price is USD 1.50 and USD 7.50.
- Gemini 3.5 Flash: USD 1.50 input and USD 9.00 output; free tier available.
- Gemini 3.5 Flash-Lite: USD 0.30 input and USD 2.50 output; free tier available.

Treat this as release-review context, not executable billing logic. Link users to the live pricing page instead of promising a price.

## Official sources

- Models: https://ai.google.dev/gemini-api/docs/models
- Latest model: https://ai.google.dev/gemini-api/docs/latest-model
- Deprecations: https://ai.google.dev/gemini-api/docs/deprecations
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Enterprise Agent Platform models: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models
- JavaScript SDK Models API: https://googleapis.github.io/js-genai/release_docs/classes/models.Models.html

