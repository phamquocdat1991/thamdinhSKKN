'use client';

import React, { useState } from 'react';
import {
  Award,
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
  Sparkles
} from 'lucide-react';
import { SkknAnalysisResult } from '@/lib/types';
import confetti from 'canvas-confetti';

interface AnalysisReportProps {
  result: SkknAnalysisResult;
  onRecheck: () => void;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ result, onRecheck }) => {
  const [copied, setCopied] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<{ [key: string]: boolean }>({
    novelty: true,
    scientific: true,
    effectiveness: true,
    applicability: true,
  });

  const toggleCriteria = (key: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hiệu ứng pháo hoa chúc mừng nếu đạt điểm cao
  React.useEffect(() => {
    if (result.totalScore >= 80) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.totalScore]);

  const handleCopy = () => {
    const summaryText = `BÁO CÁO THẨM ĐỊNH SKKN
Đề tài: ${result.title}
Cấp học: ${result.gradeLevel} | Môn: ${result.subject} | Mục tiêu: ${result.targetAward}
Tổng điểm: ${result.totalScore}/100 đ
Dự báo giải: ${result.awardPrediction.likelihood} (${result.awardPrediction.level})
Tỷ lệ trùng lặp: ${result.plagiarismReport.percentage}%
Số lỗi chính tả phát hiện: ${result.spellingErrors.length}
--
Đánh giá 4 Tiêu chí:
1. Tính mới: ${result.criteria.novelty.score}/30 đ
2. Tính khoa học: ${result.criteria.scientific.score}/30 đ
3. Tính hiệu quả: ${result.criteria.effectiveness.score}/25 đ
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
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Báo cáo thẩm định SKKN</title></head>
      <body style="font-family: 'Times New Roman', serif; line-height: 1.5; padding: 20px;">
        <h2 style="text-align: center; color: #1e3a8a;">BÁO CÁO THẨM ĐỊNH SÁNG KIẾN KINH NGHIỆM</h2>
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
        <p><em>Hệ thống thẩm định Trợ Lý SKKN - Phát triển bởi Thầy Trần Hoài Thanh</em></p>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_cao_tham_dinh_${result.title.slice(0, 30)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        marginTop: '28px',
        animation: 'fadeIn 0.3s ease-in',
      }}
    >
      {/* Top Banner Result */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #6366f1 100%)',
          color: '#ffffff',
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.2)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px' }}>
          <Sparkles size={14} /> KẾT QUẢ THẨM ĐỊNH SƯ PHẠM
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px', lineHeight: 1.3 }}>
          {result.title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#dbeafe' }}>
          {result.gradeLevel} • {result.subject} • Mục tiêu: {result.targetAward} • Ngày: {result.createdAt}
        </p>

        {/* Big Score Gauge */}
        <div
          style={{
            margin: '20px auto 10px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '4px solid #ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          <span style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{result.totalScore}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>/ 100 ĐIỂM</span>
        </div>

        {/* Prediction Pill */}
        <div style={{ display: 'inline-block', background: '#dcfce7', color: '#15803d', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.9rem', marginTop: '6px' }}>
          Dự báo đạt giải: {result.awardPrediction.likelihood} ({result.awardPrediction.level})
        </div>
      </div>

      {/* Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-inline-action" onClick={handlePrint} title="In báo cáo thẩm định">
            <Printer size={15} /> <span>In báo cáo</span>
          </button>
          <button className="btn-inline-action" onClick={handleDownloadWord} title="Tải file Word">
            <Download size={15} /> <span>Tải Word (.doc)</span>
          </button>
          <button className="btn-inline-action" onClick={handleCopy} title="Sao chép tóm tắt">
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép kết quả'}</span>
          </button>
        </div>

        <button
          className="btn-inline-action"
          style={{ color: 'var(--primary)', fontWeight: 700 }}
          onClick={onRecheck}
        >
          <span>Sửa bài & Kiểm tra lại</span>
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>
        {/* Award Summary Card */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={18} color="#2563eb" /> Nhận định tổng quan từ Hội đồng thẩm định:
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {result.awardPrediction.summary}
          </p>
        </div>

        {/* Section 1: Đạo văn & Trùng lặp */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertOctagon size={18} color="#e11d48" /> Rà soát tính độc bản & Trùng lặp (Đạo văn)
            </h3>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: result.plagiarismReport.percentage < 15 ? '#dcfce7' : '#fee2e2',
                color: result.plagiarismReport.percentage < 15 ? '#15803d' : '#b91c1c',
              }}
            >
              Mức nguy cơ: {result.plagiarismReport.riskLevel} ({result.plagiarismReport.percentage}%)
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, result.plagiarismReport.percentage * 2.5)}%`,
                background: result.plagiarismReport.percentage < 15 ? '#16a34a' : '#e11d48',
                borderRadius: '4px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            {result.plagiarismReport.details}
          </p>
        </div>

        {/* Section 2: Lỗi chính tả & Diễn đạt */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileCheck size={18} color="#d97706" /> Soát lỗi chính tả, diễn đạt & quy chuẩn ({result.spellingErrors.length} phát hiện)
          </h3>
          {result.spellingErrors.length === 0 ? (
            <div style={{ fontSize: '0.86rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Không phát hiện lỗi chính tả nghiêm trọng nào.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {result.spellingErrors.map((err, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ color: '#dc2626', textDecoration: 'line-through', fontWeight: 600 }}>{err.original}</span>
                    <span>→</span>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>{err.suggestion}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <em>Ngữ cảnh: &quot;{err.context}&quot;</em> — {err.reason}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Đánh giá 4 Tiêu chí vàng của SKKN */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '12px' }}>
            Đánh giá 4 Tiêu chí Vàng của Sáng kiến Kinh nghiệm
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Tiêu chí 1: Tính mới */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div
                onClick={() => toggleCriteria('novelty')}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  1. {result.criteria.novelty.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {result.criteria.novelty.score} / {result.criteria.novelty.maxScore} đ
                  </span>
                  {expandedCriteria.novelty ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedCriteria.novelty && (
                <div style={{ padding: '12px 14px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ color: '#16a34a', marginBottom: '4px' }}>
                    <strong>Ưu điểm:</strong> {result.criteria.novelty.strengths.join(' ')}
                  </div>
                  <div style={{ color: '#ea580c', marginBottom: '4px' }}>
                    <strong>Hạn chế:</strong> {result.criteria.novelty.weaknesses.join(' ')}
                  </div>
                  <div style={{ color: 'var(--primary)' }}>
                    <strong>Khuyến nghị:</strong> {result.criteria.novelty.recommendations.join(' ')}
                  </div>
                </div>
              )}
            </div>

            {/* Tiêu chí 2: Tính khoa học */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div
                onClick={() => toggleCriteria('scientific')}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  2. {result.criteria.scientific.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {result.criteria.scientific.score} / {result.criteria.scientific.maxScore} đ
                  </span>
                  {expandedCriteria.scientific ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedCriteria.scientific && (
                <div style={{ padding: '12px 14px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ color: '#16a34a', marginBottom: '4px' }}>
                    <strong>Ưu điểm:</strong> {result.criteria.scientific.strengths.join(' ')}
                  </div>
                  <div style={{ color: '#ea580c', marginBottom: '4px' }}>
                    <strong>Hạn chế:</strong> {result.criteria.scientific.weaknesses.join(' ')}
                  </div>
                  <div style={{ color: 'var(--primary)' }}>
                    <strong>Khuyến nghị:</strong> {result.criteria.scientific.recommendations.join(' ')}
                  </div>
                </div>
              )}
            </div>

            {/* Tiêu chí 3: Tính hiệu quả */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div
                onClick={() => toggleCriteria('effectiveness')}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  3. {result.criteria.effectiveness.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {result.criteria.effectiveness.score} / {result.criteria.effectiveness.maxScore} đ
                  </span>
                  {expandedCriteria.effectiveness ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedCriteria.effectiveness && (
                <div style={{ padding: '12px 14px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ color: '#16a34a', marginBottom: '4px' }}>
                    <strong>Ưu điểm:</strong> {result.criteria.effectiveness.strengths.join(' ')}
                  </div>
                  <div style={{ color: '#ea580c', marginBottom: '4px' }}>
                    <strong>Hạn chế:</strong> {result.criteria.effectiveness.weaknesses.join(' ')}
                  </div>
                  <div style={{ color: 'var(--primary)' }}>
                    <strong>Khuyến nghị:</strong> {result.criteria.effectiveness.recommendations.join(' ')}
                  </div>
                </div>
              )}
            </div>

            {/* Tiêu chí 4: Khả năng nhân rộng */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div
                onClick={() => toggleCriteria('applicability')}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  4. {result.criteria.applicability.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {result.criteria.applicability.score} / {result.criteria.applicability.maxScore} đ
                  </span>
                  {expandedCriteria.applicability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              {expandedCriteria.applicability && (
                <div style={{ padding: '12px 14px', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  <div style={{ color: '#16a34a', marginBottom: '4px' }}>
                    <strong>Ưu điểm:</strong> {result.criteria.applicability.strengths.join(' ')}
                  </div>
                  <div style={{ color: '#ea580c', marginBottom: '4px' }}>
                    <strong>Hạn chế:</strong> {result.criteria.applicability.weaknesses.join(' ')}
                  </div>
                  <div style={{ color: 'var(--primary)' }}>
                    <strong>Khuyến nghị:</strong> {result.criteria.applicability.recommendations.join(' ')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Tư vấn chiến lược nâng cấp SKKN */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(124, 58, 237, 0.06) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.98rem', color: 'var(--primary)', marginBottom: '8px' }}>
            <Lightbulb size={18} /> Kế hoạch hành động để đạt giải {result.targetAward}:
          </div>
          <ul style={{ paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {result.strategicAdvice.actionPlan?.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
