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
  userFriendlyVi: string;
  cause: unknown;
}

export type KeySyntaxResult =
  | { ok: true; normalized: string }
  | { ok: false; reason: 'EMPTY' | 'WHITESPACE_OR_CONTROL' | 'TOO_LONG' };

export function checkOpaqueApiKeyInput(raw: string): KeySyntaxResult {
  const normalized = raw.trim();
  if (!normalized) return { ok: false, reason: 'EMPTY' };
  if (/\s|[\u0000-\u001F\u007F]/.test(normalized)) {
    return { ok: false, reason: 'WHITESPACE_OR_CONTROL' };
  }
  if (normalized.length > 4096) return { ok: false, reason: 'TOO_LONG' };
  return { ok: true, normalized };
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
  let userFriendlyVi = 'Đã xảy ra lỗi không xác định khi kết nối dịch vụ AI. Vui lòng thử lại sau.';

  if (httpStatus === 400 || is('invalid_request', 'invalid_argument', 'parameter_unknown')) {
    kind = 'INVALID_REQUEST';
    userFriendlyVi = 'Yêu cầu gửi đi không hợp lệ hoặc tham số chưa chuẩn xác. Vui lòng kiểm tra lại nội dung SKKN.';
  } else if (httpStatus === 401 || is('authentication', 'unauthenticated', 'api_key_invalid')) {
    kind = 'AUTHENTICATION';
    userFriendlyVi = 'Không thể xác thực API Key. Hãy kiểm tra hoặc thay key trong phần Cài đặt API Key.';
  } else if (httpStatus === 403 || is('permission_denied')) {
    kind = 'PERMISSION_DENIED';
    userFriendlyVi = 'Google đã nhận thông tin xác thực nhưng dự án/tài khoản chưa có quyền dùng dịch vụ hoặc model này. Hãy kiểm tra billing hoặc hạn mức Google Cloud.';
  } else if (is('model_not_found')) {
    kind = 'MODEL_NOT_FOUND';
    userFriendlyVi = 'Model đã chọn không còn khả dụng cho dịch vụ này; ứng dụng đang thử chuyển sang model tương thích.';
  } else if (httpStatus === 404 || is('not_found')) {
    kind = 'NOT_FOUND';
    userFriendlyVi = 'Không tìm thấy tài nguyên endpoint Google AI yêu cầu.';
  } else if (is('quota_exceeded')) {
    kind = 'QUOTA_EXHAUSTED';
    userFriendlyVi = 'Quota hiện tại của API Key đã hết. Hãy chờ kỳ quota mới hoặc nâng hạn mức tại Google AI Studio.';
  } else if (
    httpStatus === 429 ||
    is('rate_limit_exceeded', 'too_many_requests', 'resource_exhausted')
  ) {
    kind = 'RATE_LIMITED';
    userFriendlyVi = 'Hệ thống đang nhận quá nhiều yêu cầu trong thời gian ngắn. Đang tự động thử lại sau ít giây...';
  } else if (httpStatus === 504 || is('deadline_exceeded')) {
    kind = 'DEADLINE_EXCEEDED';
    userFriendlyVi = 'Thời gian xử lý quá lâu vượt quá hạn mức kết nối.';
  } else if (
    httpStatus === 408 ||
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    is('api_error', 'service_unavailable', 'unavailable')
  ) {
    kind = 'TRANSIENT_SERVICE';
    userFriendlyVi = 'Dịch vụ Google AI đang tạm thời quá tải; ứng dụng đang tự động kết nối lại.';
  } else if (
    is('safety', 'recitation', 'prohibited_content', 'content_blocked', 'spii', 'blocklist')
  ) {
    kind = 'CONTENT_BLOCKED';
    userFriendlyVi = 'Nội dung bị bộ lọc an toàn của Google chặn. Vui lòng rà soát lại các từ ngữ nhạy cảm.';
  } else if (httpStatus === 499 || is('cancelled', 'canceled')) {
    kind = 'CANCELLED';
    userFriendlyVi = 'Yêu cầu thẩm định đã bị hủy.';
  } else if (!apiCode && !httpStatus) {
    const lower = message.toLowerCase();
    if (/\b(503|unavailable|overloaded|high demand|temporarily unavailable)\b/.test(lower)) {
      kind = 'TRANSIENT_SERVICE';
      userFriendlyVi = 'Dịch vụ Google AI tạm thời quá tải.';
    }
  }

  return { kind, httpStatus, apiCode, retryAfterMs, message, userFriendlyVi, cause };
}
