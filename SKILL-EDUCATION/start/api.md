# QUY TẮC PHÁT TRIỂN GOOGLE AI CHO ỨNG DỤNG GIÁO DỤC

> **Phiên bản:** 5.0  
> **Kiểm chứng:** 04/09/2026 UTC  
> **Phạm vi:** Gemini Developer API và Gemini Enterprise Agent Platform (đặc biệt express mode), dùng Google Gen AI SDK.  
> **Nguyên tắc:** API/danh sách model sống là nguồn quyết định; bảng trong tài liệu chỉ là snapshot dự phòng có ngày kiểm chứng.

---

## I. CÁC THAY ĐỔI BẮT BUỘC SO VỚI BẢN 4.1

1. Model mặc định mới cho luồng chất lượng là `gemini-3.8-flash`; `3.7` và `3.6` là fallback cùng họ.
2. Không xác thực key bằng tiền tố. `AIzaSy...` và `AQ...` đều phải được chấp nhận như chuỗi bí mật opaque; provider phải do người dùng/chủ hệ thống chọn rõ ràng.
3. Production web/mobile không được giữ key trong bundle hoặc trình duyệt. Mọi request đi qua backend/serverless route.
4. `429` không còn bị gom thành lỗi dừng tuyệt đối: `rate_limit_exceeded` được retry có backoff; `quota_exceeded` dừng và báo quota.
5. Không retry/fallback khi gặp `400`, `401`, `403`, generic `404`, safety block, cancel hoặc unknown. Chỉ `model_not_found` mới được đổi model ngay.
6. `500`/`503` retry cùng model có giới hạn rồi mới fallback; `504` chỉ retry khi request có thể phát lại an toàn và cấu hình deadline phù hợp.
7. Streaming đã phát chunk hoặc tool đã gây side effect thì không tự phát lại.
8. Danh sách model phải lấy theo provider và lọc theo capability; không dùng một mảng chung cho text, ảnh, video, Live, TTS và embedding.

---

## II. KIẾN TRÚC PROVIDER

### Tên và trạng thái

```ts
export type GoogleAiProvider =
  | 'gemini-developer'
  | 'agent-platform-express';

export interface GoogleAiSettings {
  provider: GoogleAiProvider;
  credentialRef: string; // ID server-side, không phải secret
  modelId: string;
}
```

- Không suy đoán provider từ key.
- Không tự chuyển provider khi lỗi.
- Không sao chép key giữa hai provider.
- Nếu app cũ lưu `gemini`/`agent-platform`, migrate có kiểm soát và giữ lựa chọn đã xác nhận của người dùng.
- Agent Platform đầy đủ dùng ADC/service account là một chế độ khác; không trộn với express-mode API key.

### Client factory dùng chung — chỉ server-side

```ts
import { GoogleGenAI } from '@google/genai';

export function createGoogleAiClient(
  provider: GoogleAiProvider,
  apiKey: string,
): GoogleGenAI {
  return provider === 'agent-platform-express'
    ? new GoogleGenAI({ vertexai: true, apiKey })
    : new GoogleGenAI({ apiKey });
}
```

Mọi call site—streaming, non-streaming, JSON, file analysis, chat, lập dàn ý, viết/sửa giáo án—phải đi qua client factory và AI gateway chung. Không `new GoogleGenAI(...)` trong component.

---

## III. BẢO MẬT VÀ QUẢN LÝ API KEY

### Ranh giới production

```text
Trình duyệt/ứng dụng di động -> backend/serverless có kiểm soát -> Google AI API
```

Không đưa secret vào:

- source code, Git hoặc file xuất;
- `VITE_*`, `NEXT_PUBLIC_*`, `PUBLIC_*`, `REACT_APP_*`;
- `localStorage`, `sessionStorage`, IndexedDB;
- URL/query string, prompt, log, analytics, crash report;
- phản hồi API trả về client, kể cả dạng đã che.

Với Vercel, dùng biến môi trường server-only và API Route/Route Handler/Server Function. App thuần static không thể bảo vệ key production dùng chung; phải thêm backend hoặc giới hạn rõ là local/self-hosted.

### Kiểm tra cú pháp cục bộ

Không dùng regex prefix. Chỉ kiểm tra chất lượng input:

```ts
export function normalizeOpaqueKey(raw: string): string {
  const key = raw.trim();
  if (!key) throw new Error('KEY_EMPTY');
  if (/\s|[\u0000-\u001F\u007F]/u.test(key)) throw new Error('KEY_WHITESPACE_OR_CONTROL');
  if (key.length > 4096) throw new Error('KEY_TOO_LONG');
  return key;
}
```

Kết quả này chỉ là “định dạng đầu vào chấp nhận được”, không phải “key hợp lệ”.

### Nút “Kiểm tra API key”

- Chạy server-side, nhận provider đã chọn rõ ràng.
- Ưu tiên `models.list()`/`models.get()` hoặc probe không sinh nội dung nếu provider hỗ trợ.
- Nếu buộc phải generate tối thiểu, chỉ chạy khi người dùng bấm và phải báo có thể tiêu thụ quota.
- Trả về `ok`, provider, thời điểm, fingerprint/credential record ID và metadata model an toàn; không trả secret/raw upstream error.
- Verification gắn với `(user, provider, credential fingerprint)` và TTL; đổi key/provider phải xóa trạng thái cũ.

### Chuyển đổi key tháng 09/2026

Google AI Studio hiện tạo authorization key mặc định. Tài liệu chính thức thông báo Gemini API chuyển khỏi standard key trong tháng 09/2026. Phải hiển thị nhắc migrate ngay cho standard key, nhưng xác định loại key bằng metadata/tài khoản chính thức, không nhìn tiền tố.

---

## IV. MODEL HIỆN HÀNH VÀ ROUTING

### Snapshot model text/multimodal-input

| Model ID | Trạng thái | Vai trò đề xuất |
| --- | --- | --- |
| `gemini-3.8-flash` | Stable/GA, 02/09/2026 | Mặc định chất lượng cho giáo án, phân tích dài, code và tác vụ đa bước |
| `gemini-3.7-flash` | Stable/GA, 13/08/2026 | Fallback chất lượng 1 |
| `gemini-3.6-flash` | Stable/GA, 21/07/2026 | Fallback chất lượng 2 |
| `gemini-3.5-flash` | Stable/GA | Fallback cũ; kiểm tra cost |
| `gemini-3.5-flash-lite` | Stable/GA | Mặc định kinh tế cho trích xuất, phân loại, tóm tắt |
| `gemini-3.1-flash-lite` | Stable; shutdown 07/05/2027 | Tương thích tạm thời, cần kế hoạch thay bằng 3.5 Flash-Lite |
| `gemini-2.5-flash-lite` | Stable | Legacy economy fallback khi provider còn cấp |
| `gemini-2.5-flash` | Stable | Legacy balanced fallback |
| `gemini-2.5-pro` | Stable | Chỉ chọn rõ cho reasoning cao; không tự động đưa vào fallback chung |
| `gemini-3.1-pro-preview` | Preview | Opt-in, có cảnh báo preview |

Các model Gemini 3.8/3.7/3.6/3.5 Flash và 3.5 Flash-Lite được tài liệu hiện tại ghi nhận input 1,048,576 token, output 65,536 token. Vẫn phải đọc metadata hiện hành và đặt budget theo tính năng.

### Profile khởi tạo

```ts
export const BOOTSTRAP_PROFILES = {
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

Đây chỉ là bootstrap. Khi chạy:

1. gọi danh sách model của provider;
2. lọc theo endpoint/capability/modality;
3. lọc stable/preview policy;
4. lọc context/output limit và cost ceiling;
5. đưa model người dùng chọn lên đầu nếu còn tương thích;
6. cache last-known-good có TTL và cờ `stale`.

### Route chuyên biệt

- Ảnh: `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, `gemini-3-pro-image`.
- Video: `veo-3.1-generate-preview`, `veo-3.1-lite-generate-preview` hoặc model video provider xác nhận.
- Live, TTS, transcription, embedding, Deep Research, computer use: pool và schema riêng.

Không fallback chéo modality chỉ vì tên model có chữ `flash`.

### Giá tham khảo 04/09/2026 — Gemini Developer API Standard

| Model | Free tier | Paid input / 1M | Paid output / 1M |
| --- | --- | ---: | ---: |
| Gemini 3.8/3.7/3.6 Flash | Có | $0.75 đến 31/12/2026; $1.50 từ 01/01/2027 | $3.75 đến 31/12/2026; $7.50 từ 01/01/2027 |
| Gemini 3.5 Flash | Có | $1.50 | $9.00 |
| Gemini 3.5 Flash-Lite | Có | $0.30 | $2.50 |

Không nhúng giá vào logic nghiệp vụ. Luôn dẫn người vận hành tới trang Pricing khi release.

---

## V. RETRY, FALLBACK VÀ PHÂN LOẠI LỖI

### Quyết định bắt buộc

| Lỗi | Retry cùng model | Đổi model | Trạng thái key |
| --- | --- | --- | --- |
| `400` / invalid request | Không | Không | Giữ nguyên; sửa payload |
| `401` / authentication | Không | Không | Mất verified; yêu cầu kiểm tra/thay key |
| `403` / permission | Không | Không | Không gọi là key sai; kiểm tra provider/IAM/restriction/billing |
| `model_not_found` | Không | Có, cùng provider/capability | Giữ nguyên; refresh catalog |
| generic `404` | Không | Không | Sửa resource/endpoint |
| `429 rate_limit_exceeded` / `too_many_requests` | Có, bounded + `Retry-After` | Chỉ khi policy chứng minh quota theo model và cost phù hợp | Giữ valid |
| `429 quota_exceeded` | Không auto-retry | Thường không | Giữ valid; báo reset/tăng quota |
| `408`, `500`, `502`, `503` | Có, exponential backoff + jitter | Có sau khi hết retry | Giữ valid |
| `504` | Tối đa 1 lần nếu replay-safe | Chỉ sau khi kiểm tra deadline | Giữ valid |
| safety/content block | Không blind retry | Không | Giữ valid |
| cancel/unknown | Không | Không | Giữ valid |

### Giới hạn đề xuất cho UI tương tác

- Tối đa 2 lần retry thêm trên một model.
- Tối đa 3 model trong một request logic.
- Tổng thời gian 30–45 giây, tùy tính năng; tác vụ nền có cấu hình riêng.
- Tôn trọng `Retry-After`.
- Chỉ một lớp sở hữu retry; tính cả retry tự động của SDK.
- Circuit breaker theo `(provider, model, error category)` để tránh bão request.

### Streaming và tool

- Chưa phát chunk: có thể retry/fallback trong budget.
- Đã phát chunk: giữ/đánh dấu nội dung chưa hoàn tất, yêu cầu người dùng retry; không nối output model khác.
- Tool đã tạo side effect: chỉ replay nếu có idempotency key và bản ghi thực thi xác nhận không trùng.
- Chỉ commit chat history khi response kết thúc thành công.

### Thông báo tiếng Việt

| Nhóm | Thông báo |
| --- | --- |
| 401 | `Không thể xác thực API key. Hãy kiểm tra hoặc thay key trong Cài đặt.` |
| 403 | `Google đã nhận thông tin xác thực nhưng dự án/tài khoản chưa có quyền dùng dịch vụ hoặc model này.` |
| 429 rate | `Hệ thống đang nhận quá nhiều yêu cầu; ứng dụng sẽ thử lại sau một khoảng chờ ngắn.` |
| 429 quota | `Quota hiện tại đã hết. Hãy chờ kỳ quota mới hoặc tăng hạn mức.` |
| 5xx | `Dịch vụ/model đang tạm thời quá tải; ứng dụng đang thử lại hoặc dùng model tương thích.` |
| model not found | `Model đã chọn không còn khả dụng cho dịch vụ này; danh sách model đang được làm mới.` |
| stream partial | `Phản hồi bị gián đoạn sau khi đã hiển thị một phần; nội dung chưa hoàn tất.` |

---

## VI. CẤU HÌNH GEMINI 3

- SDK ưu tiên: `@google/genai` / `google-genai` phiên bản hiện hành của dự án.
- Với Gemini 3.8 và 3.7: dùng `thinkingLevel`/`thinking_level` trong `LOW`, `MEDIUM`, `HIGH`; `MINIMAL` không được hỗ trợ.
- Khi migrate sang Gemini 3.8, bỏ `temperature`, `topP/top_p`, `topK/top_k`, `candidateCount/candidate_count`; thay `thinkingBudget` bằng `thinkingLevel`.
- Không dùng prefilled model turn ở cuối hội thoại.
- Structured output: dùng schema và MIME type/API tương ứng, đồng thời validate JSON ở server; model trả JSON không đồng nghĩa JSON đúng nghiệp vụ.
- `maxOutputTokens` là budget theo tác vụ và không vượt metadata model; không cố định một con số cho mọi tính năng.
- Mọi file/tài liệu đầu vào phải có giới hạn dung lượng, loại MIME và kiểm tra lỗi trích xuất.

---

## VII. QUY TRÌNH TẠO GIÁO ÁN/ĐỀ/PHIẾU HỌC TẬP

Mỗi tác vụ dài cần checkpoint để lỗi ở bước sau không làm mất kết quả trước:

1. Chuẩn hóa yêu cầu: môn, lớp, thời lượng, mục tiêu, chuẩn đầu ra, định dạng.
2. Phân tích nguồn và trích dẫn; đánh dấu phần không đọc được.
3. Lập bản đồ nội dung/mục tiêu/hoạt động/sản phẩm/đánh giá.
4. Tạo dàn ý có ngân sách token cho từng phần.
5. Sinh nội dung theo phần; lưu checkpoint server-side.
6. Kiểm định logic, độ bám nguồn, tính sư phạm, thời lượng, mức độ khó và cấu trúc.
7. Sửa có mục tiêu; không sinh lại toàn bộ nếu chỉ một phần lỗi.
8. Xuất DOCX/PDF và kiểm tra hiển thị; công thức Toán trong DOCX dùng OMML khi yêu cầu Word Equation.

Nếu fallback giữa các bước, ghi model thực tế cho từng checkpoint trong diagnostics nội bộ; không làm mất phần đã hoàn tất.

---

## VIII. QUAN SÁT, CHI PHÍ VÀ RIÊNG TƯ

Log an toàn:

- provider, model, task type, attempt, latency, token usage/cost estimate, error category, request/correlation ID;
- không log key, full prompt, tài liệu học sinh, dữ liệu cá nhân hoặc raw error có header;
- tách metrics retry/fallback khỏi lỗi người dùng;
- cảnh báo khi catalog model stale, tỷ lệ fallback tăng, hoặc cost vượt ngưỡng.

Ứng dụng giáo dục phải giảm dữ liệu gửi đi, có chính sách giữ/xóa phù hợp, và tránh đưa thông tin định danh học sinh vào prompt khi không cần thiết.

---

## IX. KIỂM THỬ VÀ RELEASE GATE

### Test tự động tối thiểu

- Opaque key: `AIzaSy...`, `AQ...` và định dạng tương lai đều không bị chặn bởi prefix.
- Đổi provider/key làm mất verification cũ.
- Client bundle/browser storage không chứa secret.
- 400/401/403/generic 404/unknown không retry hoặc fallback.
- rate-limit 429 backoff; quota 429 dừng.
- 503 retry rồi fallback; key không bị invalid.
- stream trước chunk được replay, sau chunk không replay.
- tool side effect không chạy hai lần.
- model filter loại sai provider/modality/capability/preview/cost.
- `models.list()` thất bại thì dùng last-known-good có cờ stale.
- typecheck, lint, unit/integration test và production build.

### Checklist bàn giao

- [ ] Một server-side client factory và một AI gateway chung.
- [ ] Provider do người dùng/chủ hệ thống chọn rõ ràng.
- [ ] Không còn prefix-only key validator.
- [ ] Không secret ở public env, bundle, browser storage, Git hoặc log.
- [ ] Standard-key migration đã được xử lý cho 09/2026.
- [ ] Model mặc định/pool lấy theo live provider; snapshot chỉ là fallback có ngày.
- [ ] Gemini 3.8 là quality default khi provider cho phép; economy profile riêng.
- [ ] Route riêng cho ảnh/video/Live/TTS/embedding.
- [ ] Error parser ưu tiên structured fields.
- [ ] Retry/fallback có attempt/time/cost/capability bounds.
- [ ] Partial stream/tool side effect có replay guard.
- [ ] 401/403/429/5xx có thông báo riêng.
- [ ] Không dùng key rotation để né quota.
- [ ] Build và test pass; lỗi tồn tại từ trước được ghi rõ.

---

## X. NGUỒN CHÍNH THỨC

- Models: https://ai.google.dev/gemini-api/docs/models
- Latest model / Gemini 3.8 migration: https://ai.google.dev/gemini-api/docs/latest-model
- Deprecations: https://ai.google.dev/gemini-api/docs/deprecations
- Pricing: https://ai.google.dev/gemini-api/docs/pricing
- API errors: https://ai.google.dev/gemini-api/docs/api-errors
- Retry/troubleshooting: https://ai.google.dev/gemini-api/docs/troubleshooting
- API keys/security: https://ai.google.dev/gemini-api/docs/api-key
- JavaScript Models API: https://googleapis.github.io/js-genai/release_docs/classes/models.Models.html
- Agent Platform API keys: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys
- Agent Platform express-mode tutorial: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/express-mode/vertex-ai-express-mode-api-quickstart
- Agent Platform Google models: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/google-models
- Google Gen AI SDK: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/sdks/overview

