'use client';

import React, { useState, useRef } from 'react';
import {
  Search,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { SkknFormData, TitleAnalysisResult } from '@/lib/types';
import { SAMPLE_SKKN_DATA } from '@/lib/sample-data';
import mammoth from 'mammoth';

interface SkknFormProps {
  formData: SkknFormData;
  setFormData: React.Dispatch<React.SetStateAction<SkknFormData>>;
  onSubmit: () => void;
  isLoading: boolean;
  onAnalyzeTitle: (title: string) => Promise<TitleAnalysisResult | null>;
}

export const SkknForm: React.FC<SkknFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
  onAnalyzeTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [analyzingTitle, setAnalyzingTitle] = useState(false);
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Điền dữ liệu mẫu
  const handleUseSampleData = () => {
    setFormData({ ...SAMPLE_SKKN_DATA });
    setActiveTab('manual');
  };

  // Phân tích tên đề tài
  const handleAnalyzeTitleClick = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên đề tài trước khi phân tích.');
      return;
    }
    setAnalyzingTitle(true);
    const result = await onAnalyzeTitle(formData.title);
    setTitleAnalysis(result);
    setAnalyzingTitle(false);
  };

  // Đọc file .docx hoặc .pdf
  const handleFileProcess = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'docx' && ext !== 'pdf' && ext !== 'doc') {
      alert('Chỉ hỗ trợ file Word (.docx) và PDF (.pdf)');
      return;
    }

    setReadingFile(true);
    try {
      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        setFormData((prev) => ({
          ...prev,
          content: res.value || '',
          fileName: file.name,
        }));
      } else {
        // Đọc text thô với FileReader
        const text = await file.text();
        setFormData((prev) => ({
          ...prev,
          content: text.slice(0, 50000) || `Tài liệu: ${file.name}`,
          fileName: file.name,
        }));
      }
    } catch (e) {
      alert('Lỗi đọc nội dung file. Vui lòng thử lại hoặc dán văn bản trực tiếp.');
    } finally {
      setReadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="form-card">
      {/* Blue Header Bar */}
      <div className="form-header-bar">
        <h2>Nhập thông tin SKKN</h2>
        <p>Hệ thống sẽ phân tích và đưa ra báo cáo chi tiết trong vài giây</p>
      </div>

      <div className="form-body">
        {/* Field 1: Tên đề tài SKKN */}
        <div className="form-group">
          <label className="form-label">
            <span>Tên đề tài SKKN</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="input-with-action">
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Một số biện pháp nâng cao chất lượng dạy học môn Toán cho học sinh lớp 5..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <button
              type="button"
              className="btn-inline-action"
              onClick={handleAnalyzeTitleClick}
              disabled={analyzingTitle}
            >
              {analyzingTitle ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              <span>Phân tích đề tài</span>
            </button>
          </div>

          {/* Modal / Card kết quả phân tích tên đề tài */}
          {titleAnalysis && (
            <div
              style={{
                marginTop: '10px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setTitleAnalysis(null)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Đánh giá tên đề tài:</span>
                <span
                  style={{
                    background: titleAnalysis.overallScore >= 8 ? '#dcfce7' : '#fef3c7',
                    color: titleAnalysis.overallScore >= 8 ? '#15803d' : '#b45309',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {titleAnalysis.verdict} ({titleAnalysis.overallScore}/10 đ)
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {titleAnalysis.critique}
              </p>

              {/* Checklist 4 thành tố */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', fontSize: '0.8rem', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {titleAnalysis.structure.hasAction ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
                  <span>Biện pháp rõ ràng</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {titleAnalysis.structure.hasTarget ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
                  <span>Đối tượng học sinh</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {titleAnalysis.structure.hasScope ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
                  <span>Phạm vi nghiên cứu</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {titleAnalysis.structure.hasObjective ? <CheckCircle2 size={14} color="#16a34a" /> : <AlertTriangle size={14} color="#d97706" />}
                  <span>Mục tiêu nâng cao</span>
                </div>
              </div>

              {/* Gợi ý tên hay */}
              {titleAnalysis.suggestedTitles?.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '6px', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Gợi ý tên chuẩn sư phạm hơn:</div>
                  {titleAnalysis.suggestedTitles.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, title: t })}
                      style={{
                        padding: '4px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                      }}
                      title="Bấm để dùng tên này"
                    >
                      • {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Field 2: Cấp học */}
        <div className="form-group">
          <label className="form-label">
            <span>Cấp học</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="form-select"
            value={formData.gradeLevel}
            onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
          >
            <option value="Tiểu học">Tiểu học</option>
            <option value="Mầm non">Mầm non</option>
            <option value="THCS">Trung học cơ sở (THCS)</option>
            <option value="THPT">Trung học phổ thông (THPT)</option>
            <option value="Giáo dục thường xuyên">Giáo dục thường xuyên (GDTX)</option>
            <option value="Cao đẳng / Đại học">Cao đẳng / Đại học</option>
          </select>
        </div>

        {/* Field 3: Môn học / Lĩnh vực */}
        <div className="form-group">
          <label className="form-label">
            <span>Môn học / Lĩnh vực</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="VD: Toán, Ngữ Văn, Quản lý, Chủ nhiệm..."
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>

        {/* Field 4: Mục tiêu thi đạt giải */}
        <div className="form-group">
          <label className="form-label">
            <span>Mục tiêu thi đạt giải</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="form-select"
            value={formData.targetAward}
            onChange={(e) => setFormData({ ...formData, targetAward: e.target.value })}
          >
            <option value="Cấp Trường">Cấp Trường</option>
            <option value="Cấp Huyện/Thị xã/Quận">Cấp Huyện / Thị xã / Quận</option>
            <option value="Cấp Tỉnh/Thành phố">Cấp Tỉnh / Thành phố</option>
            <option value="Cấp Bộ/Quốc gia">Cấp Bộ / Toàn quốc</option>
          </select>
        </div>

        {/* Field 5: Nội dung SKKN */}
        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label">
              <span>Nội dung SKKN</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <button
              type="button"
              className="form-link-btn"
              onClick={handleUseSampleData}
            >
              Dùng dữ liệu mẫu
            </button>
          </div>

          {/* Tabs */}
          <div className="content-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} />
              <span>Tải file lên</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <FileText size={16} />
              <span>Nhập văn bản</span>
            </button>
          </div>

          {/* Tab 1: Upload */}
          {activeTab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.doc"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div
                className={`dropzone-box ${isDragOver ? 'dragover' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {readingFile ? (
                  <div style={{ padding: '12px' }}>
                    <Loader2 size={36} className="spin" style={{ margin: '0 auto 8px', color: 'var(--primary)' }} />
                    <div className="dropzone-title">Đang đọc dữ liệu tài liệu...</div>
                  </div>
                ) : (
                  <>
                    <Upload className="dropzone-icon" />
                    <div className="dropzone-title">Kéo thả file hoặc click để chọn</div>
                    <div className="dropzone-subtitle">Hỗ trợ file .pdf và .docx</div>
                    <div className="dropzone-tags">
                      <span>📄 Word (.docx)</span>
                      <span>📑 PDF</span>
                    </div>
                  </>
                )}
              </div>

              {formData.fileName && (
                <div className="file-loaded-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={18} />
                    <span>
                      Đã nạp: <strong>{formData.fileName}</strong> ({formData.content.length} ký tự)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((prev) => ({ ...prev, content: '', fileName: undefined }));
                    }}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    title="Hủy file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Manual Textarea */
            <div>
              <textarea
                className="form-textarea"
                rows={8}
                placeholder="Dán hoặc nhập nội dung bài viết sáng kiến kinh nghiệm (gồm Đặt vấn đề, Giải pháp, Hiệu quả thực nghiệm, Kết luận)..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Độ dài: {formData.content.length} ký tự (~{formData.content.trim().split(/\s+/).filter(Boolean).length} từ)
              </div>
            </div>
          )}
        </div>

        {/* Big Action Button */}
        <button
          className="btn-primary-large"
          type="button"
          onClick={onSubmit}
          disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 size={22} className="spin" />
              <span>ĐANG THẨM ĐỊNH SKKN...</span>
            </>
          ) : (
            <>
              <Sparkles size={22} />
              <span>KIỂM TRA NGAY</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
