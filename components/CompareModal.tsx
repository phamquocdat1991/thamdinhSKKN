'use client';

import React, { useState } from 'react';
import { X, GitCompare, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SkknAnalysisResult } from '@/lib/types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SkknAnalysisResult[];
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length < 2) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // Thay thế cái thứ 2
        setSelectedIds([selectedIds[0], id]);
      }
    }
  };

  const itemA = history.find((h) => h.id === selectedIds[0]);
  const itemB = history.find((h) => h.id === selectedIds[1]);

  const scoreDiff = itemA && itemB ? Number((itemB.totalScore - itemA.totalScore).toFixed(1)) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: selectedIds.length === 2 ? '680px' : '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>So sánh phiên bản</h3>
            <p>Chọn 2 kết quả để so sánh sự tiến bộ</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {history.length < 2 ? (
            <div className="empty-state">
              <GitCompare className="empty-state-icon" />
              <div className="empty-state-title">Cần ít nhất 2 kết quả kiểm tra</div>
              <div className="empty-state-desc">
                Hãy kiểm tra thêm SKKN để có thể so sánh giữa các lần chỉnh sửa hoặc giữa các đề tài khác nhau.
              </div>
            </div>
          ) : (
            <div>
              {/* Chọn 2 phiên bản */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Chọn 2 phiên bản ({selectedIds.length}/2):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {history.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const index = selectedIds.indexOf(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleSelect(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--primary-light)' : 'var(--bg-subtle)',
                          cursor: 'pointer',
                          fontSize: '0.86rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: isSelected ? 'var(--primary)' : 'transparent',
                              border: isSelected ? 'none' : '1.5px solid var(--border-color)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {isSelected ? (index === 0 ? 'A' : 'B') : ''}
                          </span>
                          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {item.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {item.totalScore} đ ({item.createdAt.split(' ')[0]})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bảng so sánh khi đã chọn đủ 2 phiên bản */}
              {itemA && itemB && (
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bản A vs Bản B</span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: scoreDiff > 0 ? '#16a34a' : scoreDiff < 0 ? '#dc2626' : 'var(--text-muted)',
                      }}
                    >
                      {scoreDiff > 0 ? (
                        <>
                          <TrendingUp size={16} /> Tăng +{scoreDiff} điểm
                        </>
                      ) : scoreDiff < 0 ? (
                        <>
                          <TrendingDown size={16} /> Giảm {scoreDiff} điểm
                        </>
                      ) : (
                        <>
                          <Minus size={16} /> Điểm số bằng nhau
                        </>
                      )}
                    </span>
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
                    {/* Điểm tổng */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{itemA.totalScore} / 100</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tổng điểm</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{itemB.totalScore} / 100</div>
                    </div>

                    {/* Tỷ lệ trùng lặp */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, color: '#e11d48' }}>{itemA.plagiarismReport.percentage}%</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Trùng lặp đạo văn</div>
                      <div style={{ fontWeight: 600, color: '#e11d48' }}>{itemB.plagiarismReport.percentage}%</div>
                    </div>

                    {/* Số lỗi chính tả */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{itemA.spellingErrors.length} lỗi</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Lỗi chính tả/diễn đạt</div>
                      <div style={{ fontWeight: 600 }}>{itemB.spellingErrors.length} lỗi</div>
                    </div>

                    {/* Tính mới */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div>{itemA.criteria.novelty.score}/30</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tính mới & sáng tạo</div>
                      <div>{itemB.criteria.novelty.score}/30</div>
                    </div>

                    {/* Tính khoa học */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div>{itemA.criteria.scientific.score}/30</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tính khoa học sư phạm</div>
                      <div>{itemB.criteria.scientific.score}/30</div>
                    </div>

                    {/* Tính hiệu quả */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div>{itemA.criteria.effectiveness.score}/25</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tính hiệu quả thực nghiệm</div>
                      <div>{itemB.criteria.effectiveness.score}/25</div>
                    </div>

                    {/* Khả năng nhân rộng */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', textAlign: 'center' }}>
                      <div>{itemA.criteria.applicability.score}/15</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Khả năng nhân rộng</div>
                      <div>{itemB.criteria.applicability.score}/15</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
