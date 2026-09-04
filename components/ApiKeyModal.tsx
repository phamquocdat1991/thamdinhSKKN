'use client';

import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleAiProvider, AVAILABLE_MODELS } from '@/lib/types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: GoogleAiProvider;
  setProvider: (p: GoogleAiProvider) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  onSave: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  provider,
  setProvider,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel,
  onSave,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempProvider, setTempProvider] = useState<GoogleAiProvider>(provider);
  const [tempModel, setTempModel] = useState(selectedModel);

  // Trạng thái kiểm tra key trực tiếp
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    ok?: boolean;
    message?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!tempKey.trim()) {
      setVerifyStatus({ ok: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }
    setVerifying(true);
    setVerifyStatus(null);
    try {
      const res = await fetch('/api/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: tempProvider, apiKey: tempKey.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setVerifyStatus({
          ok: true,
          message: 'Kết nối Google AI thành công! API Key hoàn toàn hợp lệ.'
        });
      } else {
        setVerifyStatus({
          ok: false,
          message: data.message || 'Không thể xác thực API Key.'
        });
      }
    } catch {
      setVerifyStatus({
        ok: false,
        message: 'Lỗi kết nối tới máy chủ kiểm tra.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = () => {
    setProvider(tempProvider);
    setApiKey(tempKey.trim());
    setSelectedModel(tempModel);
    onSave();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Cài đặt API Key</h3>
            <p>Nhập API Key để sử dụng app</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Blue Info Banner */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              lineHeight: 1.45,
              marginBottom: '18px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <ShieldCheck size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Thông tin an toàn:</strong> Đây là công cụ giáo dục hỗ trợ giáo viên kiểm tra SKKN. API Key là mã miễn phí bạn tự tạo tại Google AI Studio — không phải mật khẩu. Key được lưu trên trình duyệt của bạn, không gửi cho bên thứ ba.
            </div>
          </div>

          {/* Service Selection */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '8px' }}>
              Chọn dịch vụ AI
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                className={`radio-card ${tempProvider === 'gemini-developer' ? 'selected' : ''}`}
                onClick={() => setTempProvider('gemini-developer')}
                style={{ padding: '10px' }}
              >
                <div className="radio-circle">
                  {tempProvider === 'gemini-developer' && <div className="radio-dot" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🌐 Gemini API</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Miễn phí, key từ AI Studio
                  </div>
                </div>
              </div>

              <div
                className={`radio-card ${tempProvider === 'agent-platform-express' ? 'selected' : ''}`}
                onClick={() => setTempProvider('agent-platform-express')}
                style={{ padding: '10px' }}
              >
                <div className="radio-circle">
                  {tempProvider === 'agent-platform-express' && <div className="radio-dot" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🏢 Agent Platform</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Google Cloud, doanh nghiệp
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="form-group">
            <div className="form-label-row">
              <label className="form-label">Google Gemini API Key</label>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>✏️ Nhập Key riêng</span>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="form-input"
                placeholder="AIzaSy... hoặc AQ..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                style={{ paddingRight: '80px', fontFamily: 'var(--font-mono, monospace)' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                <span>{showKey ? 'Ẩn' : 'Hiện'}</span>
              </button>
            </div>

            {/* Test Connection Button */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-inline-action"
                onClick={handleTestKey}
                disabled={verifying}
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                {verifying ? (
                  <>
                    <Loader2 size={14} className="spin" />
                    <span>Đang kiểm tra...</span>
                  </>
                ) : (
                  <span>Kiểm tra kết nối Key</span>
                )}
              </button>

              {verifyStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    color: verifyStatus.ok ? '#16a34a' : '#dc2626',
                  }}
                >
                  {verifyStatus.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{verifyStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Model AI Selection */}
          <div className="form-group">
            <label className="form-label">Chọn Model AI</label>
            <div className="radio-card-list">
              {AVAILABLE_MODELS.map((model) => {
                const isSelected = tempModel === model.id;
                return (
                  <div
                    key={model.id}
                    className={`radio-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setTempModel(model.id)}
                  >
                    <div className="radio-circle">
                      {isSelected && <div className="radio-dot" />}
                    </div>
                    <div className="radio-card-content">
                      <div className="radio-card-title">
                        <span>{model.name}</span>
                        {model.badge && (
                          <span className={`model-badge ${model.isPaid ? 'paid' : ''}`}>
                            {model.badge}
                          </span>
                        )}
                      </div>
                      <div className="radio-card-desc">{model.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tutorial Links */}
          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '14px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '0.86rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              Hướng dẫn lấy API Key:
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} />
              <span>Lấy API Key miễn phí tại Google AI Studio</span>
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} />
              <span>Xem hướng dẫn chi tiết (Video)</span>
            </a>
          </div>

          {/* Save Button */}
          <button
            className="btn-primary-large"
            style={{ marginTop: 0 }}
            onClick={handleSave}
          >
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};
