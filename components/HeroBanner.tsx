import React from 'react';

export const HeroBanner: React.FC = () => {
  return (
    <section className="hero-section">
      {/* Main Title */}
      <h1 className="hero-title">
        TRỢ LÝ SKKN<br />
        NÂNG TẦM SÁNG KIẾN KINH NGHIỆM CỦA BẠN
      </h1>

      {/* Subtitle */}
      <p className="hero-subtitle">
        Công cụ AI hỗ trợ <strong>kiểm tra đạo văn, soát lỗi chính tả và tư vấn chiến lược.</strong>
      </p>

      {/* Author Tag */}
      <p className="hero-author">
        Phát triển bởi: <strong>Anh giáo PHẠM QUỐC ĐẠT</strong>
      </p>

      {/* Security & Advisory Notice */}
      <div className="security-notice">
        <div className="edge-recommend">
          KHUYẾN NGHỊ SỬ DỤNG TRÌNH DUYỆT MICROSOFT EDGE ĐỂ TRÁNH CÁC THÔNG BÁO SAI VỀ BẢO MẬT
        </div>
        <div className="privacy-commit">
          APP ĐẢM BẢO BẢO MẬT NỘI DUNG SKKN CỦA THẦY CÔ, CHỈ LƯU CỤC BỘ TRÊN MÁY THẦY CÔ, KHÔNG CÓ HỆ THỐNG LƯU TRỮ NÀO KHÁC, THẦY CÔ HOÀN TOÀN YÊN TÂM!
        </div>
      </div>
    </section>
  );
};
