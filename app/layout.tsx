import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'TRỢ LÝ SKKN - Nâng Tầm Sáng Kiến Kinh Nghiệm Của Bạn',
  description: 'Công cụ AI hỗ trợ giáo viên kiểm tra đạo văn, soát lỗi chính tả, đánh giá 4 tiêu chí vàng và tư vấn chiến lược nâng cao chất lượng Sáng Kiến Kinh Nghiệm.',
  keywords: ['SKKN', 'sáng kiến kinh nghiệm', 'giáo dục', 'giáo viên', 'thẩm định SKKN', 'đạo văn', 'chính tả'],
  authors: [{ name: 'Thầy Trần Hoài Thanh' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
