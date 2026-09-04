import React from 'react';

export const CoursePromoBanner: React.FC = () => {
  return (
    <div className="promo-banner-card">
      <h2 className="promo-title">
        ĐĂNG KÝ KHOÁ HỌC THỰC CHIẾN VIẾT SKKN, TẠO APP DẠY HỌC, TẠO MÔ PHỎNG TRỰC QUAN{' '}
        <span>CHỈ VỚI 1 CÂU LỆNH</span>
      </h2>

      <a
        href="https://zalo.me/0348296773"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-register-now"
      >
        ĐĂNG KÝ NGAY
      </a>

      <div className="promo-footer">
        <div>Mọi thông tin vui lòng liên hệ:</div>
        <div className="promo-contact-row">
          <div className="promo-contact-item">
            <strong>Facebook:</strong>{' '}
            <a
              href="https://www.facebook.com/tranhoaithanhvicko"
              target="_blank"
              rel="noopener noreferrer"
            >
              tranhoaithanhvicko
            </a>
          </div>
          <div className="promo-contact-item">
            <strong>Zalo:</strong>{' '}
            <a href="https://zalo.me/0348296773" target="_blank" rel="noopener noreferrer">
              0348296773
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
