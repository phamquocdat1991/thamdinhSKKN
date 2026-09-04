import React from 'react';
import { Key, Settings } from 'lucide-react';

interface ApiKeyWarningProps {
  onOpenSettings: () => void;
}

export const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ onOpenSettings }) => {
  return (
    <div className="api-warning-card">
      <div className="api-warning-title">
        <Key size={18} />
        <span>Cần API Key để bắt đầu</span>
      </div>
      <p className="api-warning-desc">
        API Key là mã miễn phí bạn tự tạo tại{' '}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', fontWeight: 600 }}
        >
          Google AI Studio
        </a>{' '}
        — không phải mật khẩu hay thông tin cá nhân. Key chỉ lưu trên trình duyệt của bạn.
      </p>
      <button className="btn-warning-action" onClick={onOpenSettings}>
        <Settings size={16} />
        <span>Cài đặt API Key</span>
      </button>
    </div>
  );
};
