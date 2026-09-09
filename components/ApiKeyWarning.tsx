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
        <span>Kết nối AI để thẩm định nội dung của thầy cô</span>
      </div>
      <p className="api-warning-desc">
        Thầy cô có thể tạo API key tại{' '}
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline', fontWeight: 600 }}
        >
          Google AI Studio
        </a>{' '}
        để sử dụng AI (hạn mức và chi phí tùy tài khoản). Khi chưa kết nối, ứng dụng chỉ hiển thị báo cáo minh họa.
      </p>
      <button className="btn-warning-action" onClick={onOpenSettings}>
        <Settings size={16} />
        <span>Cài đặt API Key</span>
      </button>
    </div>
  );
};

