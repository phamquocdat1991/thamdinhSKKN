# Gemini Runtime Resilience Pattern

Use this reference when implementing the shared request gateway, retry/fallback policy, streaming recovery, or tests. Adapt names to the repository; preserve the decision rules.

## 1. Normalize errors from structured fields

Prefer HTTP status and machine-readable API codes. Message matching is a last-resort compatibility fallback and must be conservative.

```ts
export type AiErrorKind =
  | 'INVALID_REQUEST'
  | 'AUTHENTICATION'
  | 'PERMISSION_DENIED'
  | 'MODEL_NOT_FOUND'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'QUOTA_EXHAUSTED'
  | 'TRANSIENT_SERVICE'
  | 'DEADLINE_EXCEEDED'
  | 'CONTENT_BLOCKED'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface NormalizedAiError {
  kind: AiErrorKind;
  httpStatus?: number;
  apiCode?: string;
  retryAfterMs?: number;
  message: string;
  cause: unknown;
}

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const normalizeCode = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;

const parseRetryAfter = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : undefined;
};

export function normalizeAiError(cause: unknown): NormalizedAiError {
  const error = asRecord(cause);
  const response = asRecord(error.response);
  const bodyError = asRecord(error.error ?? response.data?.error);

  const numericCandidates = [
    response.status,
    error.status,
    error.statusCode,
    typeof bodyError.code === 'number' ? bodyError.code : undefined,
  ];
  const httpStatus = numericCandidates.find(Number.isFinite) as number | undefined;
  const apiCode = normalizeCode(
    typeof bodyError.code === 'string'
      ? bodyError.code
      : error.code ?? error.statusText ?? bodyError.status,
  );
  const message = String(bodyError.message ?? error.message ?? 'Google AI request failed');
  const retryAfterMs = parseRetryAfter(
    response.headers?.get?.('retry-after') ?? response.headers?.['retry-after'],
  );

  const is = (...codes: string[]) => !!apiCode && codes.includes(apiCode);
  let kind: AiErrorKind = 'UNKNOWN';

  if (httpStatus === 400 || is('invalid_request', 'invalid_argument', 'parameter_unknown')) {
    kind = 'INVALID_REQUEST';
  } else if (httpStatus === 401 || is('authentication', 'unauthenticated', 'api_key_invalid')) {
    kind = 'AUTHENTICATION';
  } else if (httpStatus === 403 || is('permission_denied')) {
    kind = 'PERMISSION_DENIED';
  } else if (is('model_not_found')) {
    kind = 'MODEL_NOT_FOUND';
  } else if (httpStatus === 404 || is('not_found')) {
    kind = 'NOT_FOUND';
  } else if (is('quota_exceeded')) {
    kind = 'QUOTA_EXHAUSTED';
  } else if (
    httpStatus === 429 ||
    is('rate_limit_exceeded', 'too_many_requests', 'resource_exhausted')
  ) {
    kind = 'RATE_LIMITED';
  } else if (httpStatus === 504 || is('deadline_exceeded')) {
    kind = 'DEADLINE_EXCEEDED';
  } else if (
    httpStatus === 408 ||
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    is('api_error', 'service_unavailable', 'unavailable')
  ) {
    kind = 'TRANSIENT_SERVICE';
  } else if (
    is('safety', 'recitation', 'prohibited_content', 'content_blocked', 'spii', 'blocklist')
  ) {
    kind = 'CONTENT_BLOCKED';
  } else if (httpStatus === 499 || is('cancelled', 'canceled')) {
    kind = 'CANCELLED';
  } else if (!apiCode && !httpStatus) {
    const lower = message.toLowerCase();
    if (/\b(503|unavailable|overloaded|high demand|temporarily unavailable)\b/.test(lower)) {
      kind = 'TRANSIENT_SERVICE';
    }
  }

  return { kind, httpStatus, apiCode, retryAfterMs, message, cause };
}
```

Do not serialize an arbitrary error object to logs: SDK errors can contain request headers or other sensitive data.

## 2. Decision table

| Category | Retry same model | Try another compatible model | Credential action |
| --- | --- | --- | --- |
| `INVALID_REQUEST` | No | No | None; fix payload/model parameters |
| `AUTHENTICATION` | No | No | Mark this credential unverified; ask user/admin to replace it |
| `PERMISSION_DENIED` | No | No | Keep separate from invalid key; inspect provider, IAM, API restrictions, billing |
| `MODEL_NOT_FOUND` | No | Yes | None; refresh provider model catalog |
| generic `NOT_FOUND` | No | No | Fix resource or endpoint |
| `RATE_LIMITED` | Yes, bounded; honor `Retry-After` | Only when policy confirms per-model capacity and cost compatibility | Never mark invalid; do not rotate keys to evade limits |
| `QUOTA_EXHAUSTED` | No automatic retry | Normally no; same-project model switching often cannot restore daily quota | Show reset/increase-quota guidance |
| `TRANSIENT_SERVICE` | Yes, exponential backoff + jitter | Yes after retry budget is exhausted | Never mark invalid |
| `DEADLINE_EXCEEDED` | At most once if idempotent and no output/side effect occurred | Only after timeout configuration is checked | None |
| `CONTENT_BLOCKED` | No blind retry | No | Show safe, non-sensitive guidance |
| `CANCELLED` | No | No | None |
| `UNKNOWN` | No | No | Preserve evidence and stop |

Google's current troubleshooting guide treats `429` and `503` as retryable and recommends exponential backoff. The Interactions API distinguishes `rate_limit_exceeded`/`too_many_requests` from `quota_exceeded`; preserve that distinction.

## 3. Bounded gateway

Use a single retry owner. If the SDK already retries transient failures, either configure it or reduce application-level attempts so total calls stay bounded.

```ts
type Candidate = {
  id: string;
  provider: 'gemini-developer' | 'agent-platform';
  capabilities: ReadonlySet<string>;
  estimatedCostClass: 'economy' | 'standard' | 'premium';
};

type RetryPolicy = {
  maxModels: number;
  maxRetriesPerModel: number;
  maxElapsedMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });

const backoffMs = (attempt: number, policy: RetryPolicy, retryAfterMs?: number) => {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  const jittered = Math.floor(exponential * (0.5 + Math.random() * 0.5));
  return Math.max(jittered, retryAfterMs ?? 0);
};

const canRetrySameModel = (error: NormalizedAiError, replaySafe: boolean) =>
  replaySafe && (
    error.kind === 'RATE_LIMITED' ||
    error.kind === 'TRANSIENT_SERVICE' ||
    error.kind === 'DEADLINE_EXCEEDED'
  );

const canFallback = (error: NormalizedAiError, replaySafe: boolean) =>
  replaySafe && (
    error.kind === 'MODEL_NOT_FOUND' ||
    error.kind === 'TRANSIENT_SERVICE' ||
    error.kind === 'RATE_LIMITED'
  );

export async function executeWithModelPolicy<T>({
  candidates,
  policy,
  replaySafe,
  signal,
  call,
  onAttempt,
}: {
  candidates: Candidate[];
  policy: RetryPolicy;
  replaySafe: () => boolean;
  signal?: AbortSignal;
  call: (candidate: Candidate, signal?: AbortSignal) => Promise<T>;
  onAttempt?: (event: {
    model: string;
    modelIndex: number;
    attempt: number;
    errorKind?: AiErrorKind;
  }) => void;
}): Promise<T> {
  const startedAt = Date.now();
  let lastError: NormalizedAiError | undefined;

  for (const [modelIndex, candidate] of candidates.slice(0, policy.maxModels).entries()) {
    for (let attempt = 0; attempt <= policy.maxRetriesPerModel; attempt += 1) {
      if (signal?.aborted) throw signal.reason;
      if (Date.now() - startedAt >= policy.maxElapsedMs) throw lastError ?? new Error('AI deadline exceeded');

      onAttempt?.({ model: candidate.id, modelIndex, attempt });
      try {
        return await call(candidate, signal);
      } catch (cause) {
        lastError = normalizeAiError(cause);
        onAttempt?.({ model: candidate.id, modelIndex, attempt, errorKind: lastError.kind });

        const safe = replaySafe();
        const hasRetry = attempt < policy.maxRetriesPerModel;
        if (hasRetry && canRetrySameModel(lastError, safe)) {
          await delay(backoffMs(attempt, policy, lastError.retryAfterMs), signal);
          continue;
        }

        const hasNextModel = modelIndex + 1 < Math.min(candidates.length, policy.maxModels);
        if (hasNextModel && canFallback(lastError, safe)) break;
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('No compatible Gemini model was available');
}
```

Before invoking this gateway, construct `candidates` by intersecting:

1. the explicit provider,
2. live available models,
3. the required modality and capabilities,
4. stable/preview policy,
5. context/output limits,
6. allowed cost class,
7. current model circuit-breaker state.

Do not use fallback to change provider, remove required tools, weaken structured-output guarantees, or silently exceed cost policy.

## 4. Streaming and tool-call safety

Track whether any user-visible chunk was committed and whether any external tool action ran.

```ts
let emitted = false;
let externalSideEffectCommitted = false;

const replaySafe = () => !emitted && !externalSideEffectCommitted;
```

- If a stream fails before the first visible chunk, an automatic replay is acceptable within the retry budget.
- If chunks were emitted, keep or clearly mark the partial response and offer an explicit retry. Do not append a second model's output as if it were a continuation.
- Buffering the entire stream can permit transparent fallback, but it sacrifices perceived latency; make this a product choice.
- Tool calls must be deduplicated with an application idempotency key and a durable execution record before automatic replay is allowed.
- Commit conversation history only after a successful terminal response. Preserve model thought signatures or provider-required continuation metadata when the SDK requires them.

## 5. User-facing messages

Messages should be actionable and must not expose raw provider payloads.

| Kind | Suggested Vietnamese copy |
| --- | --- |
| Authentication | `Không thể xác thực API key. Hãy kiểm tra hoặc thay key trong Cài đặt.` |
| Permission | `Google đã nhận thông tin xác thực nhưng tài khoản/dự án chưa có quyền dùng dịch vụ hoặc model này.` |
| Rate limited | `Hệ thống đang nhận quá nhiều yêu cầu. Ứng dụng sẽ thử lại sau một khoảng chờ ngắn.` |
| Quota exhausted | `Quota hiện tại đã hết. Hãy chờ kỳ quota mới hoặc tăng hạn mức.` |
| Service transient | `Dịch vụ/model đang tạm thời quá tải. Ứng dụng đang thử lại hoặc chuyển sang model tương thích.` |
| Model not found | `Model đã chọn không còn khả dụng cho dịch vụ này; danh sách model đang được làm mới.` |
| Partial stream | `Phản hồi bị gián đoạn sau khi đã hiển thị một phần. Nội dung chưa hoàn tất; hãy thử lại.` |

## 6. Minimum tests

Use injected/fake errors; do not spend live quota merely to test branches.

- `503`: retry with jitter, then fallback; key remains healthy.
- `429 rate_limit_exceeded`: honor `Retry-After`; attempts stop at the configured cap.
- `429 quota_exceeded`: no retry storm and no key invalidation.
- `400`, `401`, `403`, generic `404`, unknown: immediate stop, no fallback.
- `model_not_found`: refresh catalog/try next compatible candidate.
- stream failure before first chunk: replay allowed.
- stream failure after first chunk: replay blocked.
- tool side effect committed: replay blocked without a verified idempotency record.
- candidate filter rejects wrong provider, modality, preview policy, or cost class.
- SDK retry plus wrapper retry never exceeds the end-to-end attempt budget.

## Official references

- Errors: https://ai.google.dev/gemini-api/docs/api-errors
- Retry guidance: https://ai.google.dev/gemini-api/docs/troubleshooting
- Models: https://ai.google.dev/gemini-api/docs/models
- Latest-model migration: https://ai.google.dev/gemini-api/docs/latest-model

