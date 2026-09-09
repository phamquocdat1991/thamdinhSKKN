'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet
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

  useEffect(() => { setTitleAnalysis(null); }, [formData.title]);
  useEffect(() => { if (formData.content && !formData.fileName) setActiveTab('manual'); }, [formData.content, formData.fileName]);

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
    if (!['docx', 'pdf', 'txt'].includes(ext || '')) {
      alert('Hỗ trợ DOCX, PDF và TXT. Với file .doc cũ, vui lòng lưu lại thành .docx.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { alert('Vui lòng chọn tài liệu tối đa 10 MB.'); return; }
    if (readingFile || isLoading) return;

    setReadingFile(true);
    try {
      let text = '';
      if (ext === 'docx') {
        const res = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = res.value;
      } else if (ext === 'pdf') {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        try {
          const pages: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pages.push(content.items.map(item => 'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '').join(''));
          }
          text = pages.join('\n\n');
        } finally { await pdf.destroy(); }
      } else { text = await file.text(); }
      if (!text.trim()) { alert('Không tìm thấy văn bản. PDF scan cần OCR trước, hoặc thầy cô có thể dán nội dung.'); return; }
      setFormData(prev => ({ ...prev, content: text, fileName: file.name }));

    } catch {
      alert('Lỗi đọc nội dung file. Vui lòng thử lại hoặc dán văn bản trực tiếp.');
    } finally {
      setReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className="form-card" style={{ margin: 0 }}>
      {/* Header Bar */}
      <div className="form-header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '14px 18px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem' }}>Tải Lên Sáng Kiến Kinh Nghiệm</h2>
          <p style={{ fontSize: '0.8rem' }}>AI phân tích chuyên sâu & thẩm định đa chỉ số</p>
        </div>
        <button
          type="button"
          className="btn-inline-action"
          onClick={handleUseSampleData}
          style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}
          title="Tự động điền dữ liệu sáng kiến môn Toán lớp 5 để thẩm định ngay"
        >
          <FileSpreadsheet size={14} />
          <span>Dùng dữ liệu mẫu</span>
        </button>
      </div>

      <fieldset disabled={isLoading || readingFile} style={{ border: 0, minWidth: 0 }}>
      <div className="form-body" style={{ padding: '18px' }}>
        {/* Document Input Section */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <div className="content-tabs" style={{ marginBottom: '10px' }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={15} />
              <span>Tải tài liệu</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <FileText size={15} />
              <span>Dán văn bản SKKN</span>
            </button>
          </div>

          {activeTab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt"
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
                role="button" tabIndex={0} aria-label="Tải tài liệu SKKN"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: '20px 14px' }}
              >
                {readingFile ? (
                  <div style={{ padding: '8px' }}>
                    <Loader2 size={32} className="spin" style={{ margin: '0 auto 6px', color: 'var(--primary)' }} />
                    <div className="dropzone-title">Đang đọc dữ liệu tài liệu...</div>
                  </div>
                ) : (
                  <>
                    <Upload className="dropzone-icon" style={{ width: '36px', height: '36px', marginBottom: '6px' }} />
                    <div className="dropzone-title" style={{ fontSize: '0.9rem' }}>
                      Kéo & thả file hoặc click để tải lên
                    </div>
                    <div className="dropzone-subtitle" style={{ fontSize: '0.78rem', marginBottom: '8px' }}>
                      DOCX, PDF có văn bản, TXT · Tối đa 10 MB
                    </div>
                    <div className="dropzone-tags">
                      <span>📄 Word (.docx)</span>
                      <span>📑 PDF</span>
                    </div>
                  </>
                )}
              </div>

              {formData.fileName && (
                <div className="file-loaded-banner" style={{ marginTop: '8px', padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                    <FileCheck size={16} />
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
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Dán hoặc nhập nội dung bài viết sáng kiến kinh nghiệm vào đây..."
                aria-label="Nội dung SKKN"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                style={{ fontSize: '0.86rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                Độ dài: {formData.content.length} ký tự (~{formData.content.trim().split(/\s+/).filter(Boolean).length} từ)
              </div>
            </div>
          )}
        </div>

        {/* Form Fields: Row 2 cols for Grade & Subject */}
        <div className="form-row-2col form-group" style={{ marginBottom: '14px' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              <span>Cấp học</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="form-select"
              aria-label="Cấp học"
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              style={{ padding: '8px 10px', fontSize: '0.88rem' }}
            >
              <option value="Tiểu học">Tiểu học</option>
              <option value="Mầm non">Mầm non</option>
              <option value="THCS">Trung học cơ sở (THCS)</option>
              <option value="THPT">Trung học phổ thông (THPT)</option>
              <option value="Giáo dục thường xuyên">Giáo dục thường xuyên</option>
              <option value="Cao đẳng / Đại học">Cao đẳng / Đại học</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              <span>Môn học / Lĩnh vực</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Toán, Ngữ Văn, Quản lý..."
              aria-label="Môn học / Lĩnh vực"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={{ padding: '8px 10px', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* Field: Tên đề tài SKKN */}
        <div className="form-group" style={{ marginBottom: '14px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>
            <span>Tên đề tài SKKN</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="input-with-action">
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Một số biện pháp nâng cao chất lượng dạy học môn Toán cho học sinh lớp 5..."
              aria-label="Tên đề tài SKKN"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ fontSize: '0.88rem' }}
            />
            <button
              type="button"
              className="btn-inline-action"
              onClick={handleAnalyzeTitleClick}
              disabled={analyzingTitle}
              style={{ padding: '0 10px', fontSize: '0.82rem' }}
            >
              {analyzingTitle ? <Loader2 size={14} className="spin" /> : <Search size={14} />}
              <span>Phân tích</span>
            </button>
          </div>

          {/* Card kết quả phân tích tên đề tài */}
          {titleAnalysis && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px 12px',
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
                  top: '6px',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.86rem' }}>Cấu trúc tên:</span>
                <span
                  style={{
                    background: titleAnalysis.overallScore >= 8 ? '#dcfce7' : '#fef3c7',
                    color: titleAnalysis.overallScore >= 8 ? '#15803d' : '#b45309',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {titleAnalysis.verdict} ({titleAnalysis.overallScore}/10 đ)
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.4 }}>
                {titleAnalysis.critique}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '0.75rem', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {titleAnalysis.structure.hasAction ? <CheckCircle2 size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#d97706" />}
                  <span>Biện pháp rõ ràng</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {titleAnalysis.structure.hasTarget ? <CheckCircle2 size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#d97706" />}
                  <span>Đối tượng học sinh</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {titleAnalysis.structure.hasScope ? <CheckCircle2 size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#d97706" />}
                  <span>Phạm vi nghiên cứu</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {titleAnalysis.structure.hasObjective ? <CheckCircle2 size={12} color="#16a34a" /> : <AlertTriangle size={12} color="#d97706" />}
                  <span>Mục tiêu nâng cao</span>
                </div>
              </div>

              {titleAnalysis.suggestedTitles?.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '4px', fontSize: '0.76rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Gợi ý tên chuẩn hơn:</div>
                  {titleAnalysis.suggestedTitles.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setFormData({ ...formData, title: t })}
                      style={{
                        padding: '2px 4px',
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

        {/* Field: Mục tiêu thi đạt giải */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label className="form-label" style={{ fontSize: '0.85rem' }}>
            <span>Mục tiêu thi đạt giải</span>
            <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select
            className="form-select"
            aria-label="Mục tiêu thi đạt giải"
            value={formData.targetAward}
            onChange={(e) => setFormData({ ...formData, targetAward: e.target.value })}
            style={{ padding: '8px 10px', fontSize: '0.88rem' }}
          >
            <option value="Cấp Trường">Cấp Trường</option>
            <option value="Cấp Huyện/Thị xã/Quận">Cấp Huyện / Thị xã / Quận</option>
            <option value="Cấp Tỉnh/Thành phố">Cấp Tỉnh / Thành phố</option>
            <option value="Cấp Bộ/Quốc gia">Cấp Bộ / Toàn quốc</option>
          </select>
        </div>

        {formData.content.length > 30000 && <p className="demo-notice">Tài liệu dài hơn 30.000 ký tự. Phiên bản hiện tại chỉ gửi 30.000 ký tự đầu cho AI; thầy cô nên chia nội dung để thẩm định đầy đủ.</p>}
        {/* Action Button */}
        <button
          className="btn-primary-large"
          type="button"
          onClick={onSubmit}
          disabled={isLoading || readingFile || !formData.title.trim() || !formData.content.trim()}
          style={{ padding: '12px 16px', fontSize: '1rem' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>ĐANG THẨM ĐỊNH SKKN...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>BẮT ĐẦU ĐÁNH GIÁ</span>
            </>
          )}
        </button>
      </div>
      </fieldset>
    </div>
  );
};

