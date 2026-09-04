import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        marginTop: '48px',
        paddingTop: '24px',
        paddingBottom: '24px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        <GraduationCap size={18} color="var(--primary)" />
        <span>TRỢ LÝ THẨM ĐỊNH SKKN</span>
      </div>
      <div style={{ marginBottom: '6px' }}>
        Phát triển bởi: <strong style={{ color: 'var(--primary)' }}>Anh giáo PHẠM QUỐC ĐẠT</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.78rem' }}>
        <ShieldCheck size={14} color="#16a34a" />
        <span>Bảo mật dữ liệu cục bộ • Chuẩn quy định thẩm định sáng kiến ngành Giáo dục</span>
      </div>
    </footer>
  );
};
