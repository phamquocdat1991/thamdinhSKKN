'use client';

import React, { useState } from 'react';
import { X, History, Trash2, Eye, Award } from 'lucide-react';
import { SkknAnalysisResult } from '@/lib/types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SkknAnalysisResult[];
  onSelect: (item: SkknAnalysisResult) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  const [query, setQuery] = useState('');
  const filtered = history.filter(item => `${item.isDemo ? "[Minh họa] " : ""}{item.title} ${item.subject} ${item.gradeLevel}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Lịch sử kiểm tra</h3>
            <p>{history.length} bản ghi đã lưu</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <input className="form-input history-search" aria-label="Tìm kiếm lịch sử" placeholder="Tìm theo đề tài, môn học, cấp học…" value={query} onChange={e => setQuery(e.target.value)} />
          {history.length > 0 && filtered.length === 0 && <p role="status">Không tìm thấy bản ghi phù hợp.</p>}
          {history.length === 0 ? (
            <div className="empty-state">
              <History className="empty-state-icon" />
              <div className="empty-state-title">Chưa có lịch sử kiểm tra</div>
              <div className="empty-state-desc">
                Kết quả kiểm tra sẽ được lưu tại đây để thầy cô tiện theo dõi và đối chiếu tiến trình hoàn thiện SKKN.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <button
                  onClick={onClearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Xóa tất cả lịch sử</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                        {item.isDemo ? "[Minh họa] " : ""}{item.title}
                      </div>
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                          color: '#fff',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Award size={13} />
                        <span>{item.totalScore} đ</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {item.gradeLevel} • {item.subject} • {item.targetAward} • {item.createdAt}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                      <button
                        className="btn-inline-action"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => {
                          onSelect(item);
                          onClose();
                        }}
                      >
                        <Eye size={13} />
                        <span>Xem kết quả</span>
                      </button>
                      <button
                        className="btn-inline-action"
                        style={{ padding: '4px 8px', color: '#ef4444' }}
                        onClick={() => onDelete(item.id)}
                        title="Xóa bản ghi này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

