# BÁO CÁO RÀ SOÁT VÀ NÂNG CẤP HAI SKILL GOOGLE AI

> Phạm vi: `gemini-model`, `google-api` và tài liệu dùng chung `api.md` trong gói SKILL EDUCATION.  
> Ngày kiểm chứng nguồn chính thức: 04/09/2026 UTC.

## Kết luận

Hai skill cũ có định hướng đúng nhưng chưa an toàn để dùng như quy tắc production. Bản nâng cấp giữ nguyên tên skill và tên thư mục để thay thế trực tiếp, đồng thời bổ sung reference theo cơ chế progressive disclosure, script quét có redaction/JSON/CI threshold và tài liệu `api.md` phiên bản 5.0.

## Phát hiện ưu tiên

| Mức | Vấn đề bản cũ | Rủi ro | Cách sửa trong bản 5.0 |
| --- | --- | --- | --- |
| Critical | Code mẫu fallback chỉ dừng với `INVALID_API_KEY`, nên các lỗi quota, payload, permission và unknown vẫn có thể chạy qua model khác | Tạo bão request, tăng chi phí, che lỗi thật | Decision table rõ; chỉ retry/fallback đúng category, giới hạn attempt/time/model |
| Critical | Xác thực key bằng regex prefix `AIzaSy|AQ` | Từ chối định dạng tương lai và tạo cảm giác “đã xác thực” giả | Coi key là opaque; chỉ kiểm tra input tối thiểu và live verify server-side |
| Critical | Quy tắc cho phép lưu key trong frontend/localStorage và dùng `VITE_*` | Key có thể bị trích khỏi bundle/trình duyệt | Backend/serverless proxy; biến môi trường server-only; cấm browser storage |
| High | Tất cả `429` bị dừng; trái với hướng dẫn retry cho rate limit | Trải nghiệm kém hoặc xử lý sai quota | Tách `rate_limit_exceeded` (backoff) và `quota_exceeded` (dừng) |
| High | Agent Platform `403` có thể thử model khác | Retry lỗi permission không giải quyết gốc và phát sinh request | Dừng `403`; báo IAM/provider/restriction/billing |
| High | Danh sách model đã cũ, thiếu Gemini 3.8/3.7 | Chọn model không tối ưu, cấu hình sai trạng thái | Runtime discovery + snapshot 04/09/2026; quality default 3.8 |
| High | Một chuỗi fallback có thể bị áp cho mọi modality | Gửi request sai endpoint/schema | Pool riêng cho text, image, video, Live, TTS, embedding |
| High | Script cũ in nguyên dòng chứa key | Có thể lộ secret vào terminal/CI log | Redact key-like literal và assignment trước khi xuất text/JSON |
| High | Retry stream không có ranh giới chunk/tool side effect | Nội dung lặp hoặc hành động ngoài bị chạy hai lần | Replay guard theo chunk đã commit và idempotency record |
| Medium | Error parser dựa nhiều vào message/serialized object | Dễ phân loại sai và có thể log dữ liệu nhạy cảm | Ưu tiên HTTP status + machine-readable code; message chỉ fallback bảo thủ |
| Medium | Scanner trả exit 0 và chỉ đếm pattern | CI không chặn lỗi quan trọng | `--fail-on high|medium|low`, JSON output, severity, file-size/symlink guards |
| Medium | `SKILL.md` chứa nhiều chi tiết biến động | Tốn context và dễ stale | Chuyển model snapshot/runtime patterns sang `references/` có routing rõ |
| Medium | `upload/api.md` và `start/api.md` trong ZIP giống hệt nhau | Hai bản sao có thể lệch ở lần cập nhật sau | Chọn `api.md` v5.0 làm bản canonical; nếu cần đặt trong `start/`, sao chép từ đúng bản này |

## Nội dung đã bổ sung

### Skill `gemini-model-overload-fallback`

- Kiểm kê call site và một AI gateway chung.
- Taxonomy cho 400/401/403/404/429/5xx/timeout/safety/cancel/unknown.
- Retry exponential backoff + jitter + `Retry-After`, giới hạn tổng thời gian và số model.
- Lọc fallback theo provider, modality, capability, stable/preview, context, output và cost.
- Bảo vệ partial stream và tool side effect.
- Model catalog động, cache last-known-good có TTL/stale.
- Snapshot Gemini 3.8/3.7/3.6/3.5 và route media riêng.
- Script quét mở rộng cho Interactions API, REST, streaming, client factory, key mutation và latest alias.

### Skill `google-ai-api-key-validation`

- Mở rộng từ “regex key” thành authentication/provider/security workflow.
- Provider được chọn rõ, không suy luận từ prefix.
- Backend/serverless proxy và secret lifecycle cho Vercel/production.
- Test-key endpoint an toàn, verification gắn với fingerprint/provider/user/TTL.
- Phân biệt 401, 403, rate limit, quota, model health.
- Migration standard key sang authorization key trong tháng 09/2026.
- Scanner phát hiện public env, browser storage, logging, key-like literal, provider inference và client-side SDK; mọi giá trị bị redaction.

### `api.md` 5.0

- Cập nhật Gemini 3.8 và 3.7.
- Sửa giá Gemini 3.8/3.7/3.6 theo giai đoạn ưu đãi đến 31/12/2026.
- Bổ sung model discovery, route theo capability và stale-cache behavior.
- Sửa toàn bộ retry/error matrix.
- Bổ sung security boundary, key migration, observability, cost và privacy.
- Thêm release gate và test matrix có thể kiểm chứng.

## Kiểm chứng cần chạy khi áp dụng vào app thật

1. Chạy hai scanner trên root của app.
2. Lập danh sách mọi Google AI call site và xác nhận gateway chung.
3. Chạy unit test với lỗi giả lập; không cần đốt quota live cho từng nhánh.
4. Chạy typecheck, lint, test, build production.
5. Dùng key thật chỉ cho một smoke test có chủ đích trên từng provider.
6. Kiểm tra bundle/build output và Git history bằng secret scanner của dự án.

## Nguồn chính

- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/latest-model
- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/api-errors
- https://ai.google.dev/gemini-api/docs/troubleshooting
- https://ai.google.dev/gemini-api/docs/api-key
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys
- https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/express-mode/vertex-ai-express-mode-api-quickstart

