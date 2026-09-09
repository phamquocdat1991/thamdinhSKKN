'use client';

import React, { useState } from 'react';
import {
  Award,
  Loader2,
  AlertOctagon,
  CheckCircle2,
  FileCheck,
  Printer,
  Copy,
  Download,
  Lightbulb,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FlaskConical,
  TrendingUp,
  Share2,
  FileSpreadsheet
} from 'lucide-react';
import { SkknAnalysisResult } from '@/lib/types';
import confetti from 'canvas-confetti';

interface AnalysisReportProps {
  result: SkknAnalysisResult | null;
  onUseSampleData?: () => void;
  isLoading?: boolean;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({
  result,
  onUseSampleData,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<{ [key: string]: boolean }>({
    details: false,
    spelling: true,
    advice: true,
  });

  const toggleSection = (key: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  React.useEffect(() => {
    if (result && result.totalScore >= 80) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
      });
    }
  }, [result]);

  const handleCopy = () => {
    if (!result) return;
    const summaryText = `BÁO CÁO THẨM ĐỊNH SKKN
${result.isDemo ? '[BÁO CÁO MINH HỌA — KHÔNG PHẢI THẨM ĐỊNH THẬT]' : ''}
Đề tài: ${result.title}
Cấp học: ${result.gradeLevel} | Môn: ${result.subject} | Mục tiêu: ${result.targetAward}
Tổng điểm: ${result.totalScore}/100 đ
Dự báo giải: ${result.awardPrediction.likelihood} (${result.awardPrediction.level})
Tỷ lệ trùng lặp: ${result.plagiarismReport.percentage}%
Số lỗi chính tả phát hiện: ${result.spellingErrors.length}
--
Đánh giá 4 Tiêu chí:
1. Tính mới & sáng tạo: ${result.criteria.novelty.score}/30 đ
2. Tính khoa học & sư phạm: ${result.criteria.scientific.score}/30 đ
3. Tính hiệu quả & thực nghiệm: ${result.criteria.effectiveness.score}/25 đ
4. Khả năng nhân rộng: ${result.criteria.applicability.score}/15 đ
`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    if (!result) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Báo cáo thẩm định SKKN</title></head>
      <body style="font-family: 'Times New Roman', serif; line-height: 1.5; padding: 20px;">
        <h2 style="text-align: center; color: #1e3a8a;">BÁO CÁO THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM</h2>
        ${result.isDemo ? '<p><strong>BÁO CÁO MINH HỌA — KHÔNG PHẢI THẨM ĐỊNH THẬT</strong></p>' : ''}
        <p><strong>Tên đề tài:</strong> ${result.title}</p>
        <p><strong>Cấp học:</strong> ${result.gradeLevel} | <strong>Môn:</strong> ${result.subject}</p>
        <p><strong>Mục tiêu đạt giải:</strong> ${result.targetAward}</p>
        <hr/>
        <h3>I. KẾT QUẢ TỔNG QUAN</h3>
        <p><strong>Tổng điểm đánh giá:</strong> ${result.totalScore} / 100 điểm</p>
        <p><strong>Dự báo khả năng đạt giải:</strong> ${result.awardPrediction.likelihood} - ${result.awardPrediction.summary}</p>
        <p><strong>Tỷ lệ trùng lặp văn bản:</strong> ${result.plagiarismReport.percentage}% (${result.plagiarismReport.riskLevel})</p>
        <hr/>
        <h3>II. ĐÁNH GIÁ CHI TIẾT 4 TIÊU CHÍ VÀNG</h3>
        <p><strong>1. Tính mới & sáng tạo:</strong> ${result.criteria.novelty.score}/30 điểm</p>
        <p><strong>2. Tính khoa học & sư phạm:</strong> ${result.criteria.scientific.score}/30 điểm</p>
        <p><strong>3. Tính hiệu quả & thực nghiệm:</strong> ${result.criteria.effectiveness.score}/25 điểm</p>
        <p><strong>4. Khả năng nhân rộng:</strong> ${result.criteria.applicability.score}/15 điểm</p>
        <hr/>
        <h3>III. TƯ VẤN NÂNG CẤP CHIẾN LƯỢC</h3>
        <p>${result.strategicAdvice.titleReview}</p>
        <p><em>Hệ thống thẩm định Trợ Lý SKKN - Phát triển bởi: Anh giáo PHẠM QUỐC ĐẠT</em></p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_tham_dinh_${result.title.slice(0, 30)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="dashboard-empty-card" role="status"><div className="dashboard-empty-icon"><Loader2 size={32} className="spin" /></div><h3 className="dashboard-empty-title">Đang đọc và thẩm định sáng kiến…</h3><p className="dashboard-empty-desc">Thầy cô vui lòng chờ. Báo cáo sẽ xuất hiện tại đây khi hoàn tất.</p></div>;

  // Trạng thái trống / Chờ thẩm định
  if (!result) {
    return (
      <div className="dashboard-empty-card">
        <div className="dashboard-empty-icon">
          <Sparkles size={32} />
        </div>
        <h3 className="dashboard-empty-title">Một góc nhìn mới cho sáng kiến</h3>
        <p className="dashboard-empty-desc">
          Tải file Word (.docx), PDF hoặc dán nội dung ở cột bên trái để AI tiến hành chấm điểm 4 tiêu chí vàng, rà soát đạo văn và soát lỗi chính tả.
        </p>

        {onUseSampleData && (
          <button
            type="button"
            className="btn-inline-action"
            onClick={onUseSampleData}
            style={{
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1.5px solid var(--primary)',
              marginBottom: '24px',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Thử ngay với dữ liệu mẫu (Toán lớp 5)</span>
          </button>
        )}

        <div className="dashboard-preview-pills">
          <span className="preview-pill">✨ Điểm số tổng quan 100đ</span>
          <span className="preview-pill">🔍 Quét đạo văn & Trùng lặp</span>
          <span className="preview-pill">✍️ Soát lỗi chính tả sư phạm</span>
          <span className="preview-pill">🏆 Dự báo khả năng đạt giải</span>
          <span className="preview-pill">📄 Xuất file Word & In báo cáo</span>
        </div>
      </div>
    );
  }

  // Tính toán vòng cung SVG điểm tổng quan (chu vi bán kính 45: 2 * PI * 45 ≈ 283)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(100, Math.max(0, result.totalScore));
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Tính toán vòng cung bán nguyệt đo đạo văn (chu vi nửa vòng bán kính 50: PI * 50 ≈ 157)
  const semiRadius = 50;
  const semiCircumference = Math.PI * semiRadius;
  const plagPercent = Math.min(100, Math.max(0, result.plagiarismReport.percentage));
  const semiDashoffset = semiCircumference - (plagPercent / 100) * semiCircumference;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
      {result.isDemo && <div className="demo-notice" role="status"><strong>Báo cáo minh họa</strong> · Điểm số và nhận xét bên dưới là dữ liệu mẫu, không phải kết quả phân tích nội dung của thầy cô. Kết nối API key để thẩm định thật.</div>}
      {/* Top Title & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <Sparkles size={14} /> Báo cáo thẩm định trực quan
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
            {result.title}
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {result.gradeLevel} • {result.subject} • Mục tiêu: {result.targetAward}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-inline-action" onClick={handlePrint} title="In báo cáo">
            <Printer size={15} /> <span>In</span>
          </button>
          <button className="btn-inline-action" onClick={handleDownloadWord} title="Tải file Word">
            <Download size={15} /> <span>Tải Word</span>
          </button>
          <button className="btn-inline-action" onClick={handleCopy} title="Sao chép tóm tắt">
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      {/* TOP ROW: 3 Key Metrics Cards (Novelty, Overall Gauge, Scientific) */}
      <div className="dashboard-metrics-grid">
        {/* KPI 1: Tính mới & Sáng tạo */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box">
              <Lightbulb size={18} />
            </div>
            <div className="kpi-title">Tính Mới & Sáng Tạo</div>
          </div>
          <div className="kpi-score-row">
            <div className="kpi-score">
              {result.criteria.novelty.score} <span>/ {result.criteria.novelty.maxScore}</span>
            </div>
            <span className="kpi-badge">
              {result.criteria.novelty.score >= 25 ? 'Tốt' : 'Cần hoàn thiện'}
            </span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${(result.criteria.novelty.score / result.criteria.novelty.maxScore) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />
          </div>
        </div>

        {/* Center: Overall Score Gauge */}
        <div className="overview-gauge-card">
          <div className="overview-gauge-title">ĐIỂM TỔNG QUAN</div>
          <div className="gauge-circle-outer">
            <svg className="gauge-circle-svg" viewBox="0 0 110 110">
              <circle className="gauge-circle-bg" cx="55" cy="55" r={radius} />
              <circle
                className="gauge-circle-val"
                cx="55"
                cy="55"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="gauge-circle-inner">
              <div className="gauge-score-number">{result.totalScore}</div>
              <div className="gauge-score-max">/ 100</div>
            </div>
          </div>
          <div className="overview-award-pill">
            {result.awardPrediction.likelihood}
          </div>
        </div>

        {/* KPI 2: Tính Khoa học & Sư phạm */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#9333ea' }}>
              <FlaskConical size={18} />
            </div>
            <div className="kpi-title">Tính Khoa Học Sư Phạm</div>
          </div>
          <div className="kpi-score-row">
            <div className="kpi-score">
              {result.criteria.scientific.score} <span>/ {result.criteria.scientific.maxScore}</span>
            </div>
            <span className="kpi-badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
              {result.criteria.scientific.score >= 25 ? 'Tốt' : 'Cần hoàn thiện'}
            </span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${(result.criteria.scientific.score / result.criteria.scientific.maxScore) * 100}%`,
                background: 'linear-gradient(90deg, #9333ea, #c084fc)',
              }}
            />
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: 2 KPI Cards (Effectiveness & Replicability) */}
      <div className="dashboard-row-2col">
        {/* KPI 3: Tính Thực tiễn / Hiệu quả */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box" style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}>
              <TrendingUp size={18} />
            </div>
            <div className="kpi-title">Tính Thực Tiễn & Hiệu Quả</div>
          </div>
          <div className="kpi-score-row">
            <div className="kpi-score">
              {result.criteria.effectiveness.score} <span>/ {result.criteria.effectiveness.maxScore}</span>
            </div>
            <span className="kpi-badge">Tham khảo</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${(result.criteria.effectiveness.score / result.criteria.effectiveness.maxScore) * 100}%`,
                background: 'linear-gradient(90deg, #16a34a, #4ade80)',
              }}
            />
          </div>
        </div>

        {/* KPI 4: Khả năng Nhân rộng */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-box" style={{ background: 'rgba(79, 70, 229, 0.15)', color: '#4f46e5' }}>
              <Share2 size={18} />
            </div>
            <div className="kpi-title">Khả Năng Nhân Rộng</div>
          </div>
          <div className="kpi-score-row">
            <div className="kpi-score">
              {result.criteria.applicability.score} <span>/ {result.criteria.applicability.maxScore}</span>
            </div>
            <span className="kpi-badge">Tham khảo</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{
                width: `${(result.criteria.applicability.score / result.criteria.applicability.maxScore) * 100}%`,
                background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
              }}
            />
          </div>
        </div>
      </div>

      {/* PLAGIARISM RADIAL METER CARD */}
      <div className="plagiarism-card">
        <div className="plagiarism-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem' }}>
            <AlertOctagon size={18} color="#e11d48" />
            <span>KIỂM TRA ĐẠO VĂN (TÍNH ĐỘC BẢN)</span>
          </div>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: result.plagiarismReport.percentage < 15 ? '#dcfce7' : '#fee2e2',
              color: result.plagiarismReport.percentage < 15 ? '#15803d' : '#b91c1c',
            }}
          >
            Nguy cơ: {result.plagiarismReport.riskLevel}
          </span>
        </div>

        <div className="plagiarism-body">
          {/* Semi-circular meter */}
          <div className="semi-meter-box">
            <svg className="semi-meter-svg" viewBox="0 0 120 60">
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="var(--bg-subtle)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke={result.plagiarismReport.percentage < 15 ? '#16a34a' : '#e11d48'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={semiCircumference}
                strokeDashoffset={semiDashoffset}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="semi-meter-val">{result.plagiarismReport.percentage}%</div>
          </div>

          {/* Stats Breakdown */}
          <div className="plagiarism-stats-list">
            <div className="plagiarism-stat-item">
              <span className="stat-dot" style={{ background: '#ef4444' }} />
              <span>
                <strong>{result.plagiarismReport.percentage}%</strong> Trùng lặp phát hiện
              </span>
            </div>
            <div className="plagiarism-stat-item">
              <span className="stat-dot" style={{ background: '#3b82f6' }} />
              <span>
                <strong>{(100 - result.plagiarismReport.percentage).toFixed(1)}%</strong> Nguyên bản độc lập
              </span>
            </div>
            <div className="plagiarism-stat-item" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span className="stat-dot" style={{ background: '#94a3b8' }} />
              <span>{result.plagiarismReport.details}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPELLING ERRORS SECTION */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div
          onClick={() => toggleSection('spelling')}
          style={{
            padding: '14px 18px',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem' }}>
            <FileCheck size={18} color="#d97706" />
            <span>Soát lỗi chính tả & Thể thức văn bản ({result.spellingErrors.length} phát hiện)</span>
          </div>
          {expandedCriteria.spelling ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expandedCriteria.spelling && (
          <div style={{ padding: '16px 18px' }}>
            {result.spellingErrors.length === 0 ? (
              <div style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem' }}>
                <CheckCircle2 size={16} /> Không phát hiện lỗi chính tả nghiêm trọng nào.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.spellingErrors.map((err, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#dc2626', textDecoration: 'line-through', fontWeight: 600 }}>
                        {err.original}
                      </span>
                      <span>→</span>
                      <span style={{ color: '#16a34a', fontWeight: 700 }}>{err.suggestion}</span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      <em>&quot;{err.context}&quot;</em> — {err.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* STRATEGIC UPGRADE RECOMMENDATIONS */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <div
          onClick={() => toggleSection('advice')}
          style={{
            padding: '14px 18px',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem' }}>
            <Award size={18} color="#2563eb" />
            <span>Kế hoạch nâng cấp để đạt giải {result.targetAward}</span>
          </div>
          {expandedCriteria.advice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {expandedCriteria.advice && (
          <div style={{ padding: '16px 18px', fontSize: '0.86rem', lineHeight: 1.6 }}>
            <div style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
              <strong>Nhận xét từ Hội đồng:</strong> {result.awardPrediction.summary}
            </div>
            <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              {result.strategicAdvice.actionPlan?.map((step, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

