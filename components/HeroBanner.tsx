import React from 'react';
import { Sunrise, Sparkles, FileCheck2, ArrowUpRight, BookOpenCheck } from 'lucide-react';

export const HeroBanner: React.FC = () => (
  <section className="hero-section">
    <div className="hero-copy">
      <span className="hero-eyebrow"><Sunrise size={17} /> KHÔNG GIAN SÁNG KIẾN CỦA THẦY CÔ</span>
      <h1 className="hero-title">Mỗi sáng kiến nhỏ,<br /><span>một bước tiến lớn.</span></h1>
      <p className="hero-subtitle">Cùng thầy cô đọc lại, hoàn thiện và nâng tầm sáng kiến kinh nghiệm với sự hỗ trợ của AI.</p>
      <div className="hero-chips"><span><FileCheck2 size={15} /> Thẩm định 4 tiêu chí</span><span><Sparkles size={15} /> Gợi ý cải thiện</span></div>
      <p className="hero-author">Phát triển bởi <strong>Anh giáo PHẠM QUỐC ĐẠT</strong></p>
    </div>
    <div className="sunrise-art" aria-hidden="true">
      <div className="sunrise-orbit" /><div className="sunrise-sun" />
      <div className="art-paper"><div className="art-paper-icon"><BookOpenCheck size={30} /></div><span>Ý tưởng của thầy cô</span><strong>Sẵn sàng tỏa sáng</strong><i /><i /><i /><div className="art-paper-footer"><span>Nuôi dưỡng sáng tạo</span><ArrowUpRight size={18} /></div></div>
      <div className="art-note"><Sparkles size={18} /> Thêm một góc nhìn mới</div>
    </div>
  </section>
);
