'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { ApiKeyWarning } from '@/components/ApiKeyWarning';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { HistoryModal } from '@/components/HistoryModal';
import { CompareModal } from '@/components/CompareModal';
import { SkknForm } from '@/components/SkknForm';
import { AnalysisReport } from '@/components/AnalysisReport';
import { Footer } from '@/components/Footer';
import {
  GoogleAiProvider,
  SkknFormData,
  SkknAnalysisResult,
  TitleAnalysisResult
} from '@/lib/types';
import { SAMPLE_SKKN_DATA } from '@/lib/sample-data';

export default function HomePage() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // API Key & Model Settings
  const [provider, setProvider] = useState<GoogleAiProvider>('gemini-developer');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // History & Visitor counter
  const [history, setHistory] = useState<SkknAnalysisResult[]>([]);
  const [visitCount, setVisitCount] = useState<number>(0);

  // Form & Result state
  const [formData, setFormData] = useState<SkknFormData>({
    title: '',
    gradeLevel: 'Tiểu học',
    subject: '',
    targetAward: 'Cấp Trường',
    content: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<SkknAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial settings & history from local storage on mount
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('skkn_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Provider & Key
    const savedProvider = localStorage.getItem('skkn_provider') as GoogleAiProvider | null;
    if (savedProvider) setProvider(savedProvider);

    const savedModel = localStorage.getItem('skkn_model');
    if (savedModel) setSelectedModel(savedModel);

    const savedKey = localStorage.getItem('skkn_api_key');
    if (savedKey) setApiKey(savedKey);

    // History
    try {
      const savedHistory = localStorage.getItem('skkn_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch {
      // Bỏ qua lỗi JSON
    }

    // Visitor counter
    const currentVisits = Number(localStorage.getItem('skkn_visits') || '0') + 1;
    localStorage.setItem('skkn_visits', String(currentVisits));
    setVisitCount(currentVisits);
  }, []);

  // Theme toggle handler
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('skkn_theme', nextTheme);
  };

  // Save Settings
  const handleSaveSettings = () => {
    localStorage.setItem('skkn_provider', provider);
    localStorage.setItem('skkn_model', selectedModel);
    if (apiKey) {
      localStorage.setItem('skkn_api_key', apiKey);
    } else {
      localStorage.removeItem('skkn_api_key');
    }
  };

  // Reset form
  const handleReset = () => {
    if (confirm('Thầy/Cô có chắc chắn muốn đặt lại toàn bộ thông tin form không?')) {
      setFormData({
        title: '',
        gradeLevel: 'Tiểu học',
        subject: '',
        targetAward: 'Cấp Trường',
        content: '',
      });
      setCurrentResult(null);
      setErrorMessage(null);
    }
  };

  // Analyze Title
  const handleAnalyzeTitle = async (title: string): Promise<TitleAnalysisResult | null> => {
    try {
      const res = await fetch('/api/analyze-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          provider,
          apiKey: apiKey.trim() || undefined,
          modelId: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        return data.data as TitleAnalysisResult;
      } else {
        alert(data.message || 'Không thể phân tích tên đề tài.');
        return null;
      }
    } catch {
      alert('Lỗi kết nối khi phân tích tên đề tài.');
      return null;
    }
  };

  // Submit Main Analysis
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Vui lòng nhập Tên đề tài SKKN.');
      return;
    }
    if (!formData.content.trim()) {
      alert('Vui lòng cung cấp Nội dung SKKN (tải file lên hoặc dán văn bản).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          provider,
          apiKey: apiKey.trim() || undefined,
          modelId: selectedModel,
        }),
      });

      const data = await res.json();
      if (data.ok && data.data) {
        const newResult = data.data as SkknAnalysisResult;
        setCurrentResult(newResult);

        // Lưu vào lịch sử
        const updatedHistory = [newResult, ...history.filter((h) => h.id !== newResult.id)].slice(0, 30);
        setHistory(updatedHistory);
        localStorage.setItem('skkn_history', JSON.stringify(updatedHistory));

        // Cuộn xuống báo cáo kết quả trên màn hình di động/tablet
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setTimeout(() => {
            window.scrollTo({
              top: 650,
              behavior: 'smooth',
            });
          }, 100);
        }
      } else {
        setErrorMessage(data.message || 'Đã xảy ra lỗi trong quá trình thẩm định SKKN.');
      }
    } catch {
      setErrorMessage('Lỗi kết nối máy chủ thẩm định. Vui lòng kiểm tra lại mạng hoặc thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // History Actions
  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('skkn_history', JSON.stringify(updated));
  };

  const handleClearAllHistory = () => {
    if (confirm('Thầy/Cô có chắc chắn muốn xóa toàn bộ lịch sử thẩm định không?')) {
      setHistory([]);
      localStorage.removeItem('skkn_history');
    }
  };

  return (
    <div className="min-h-screen">
      {/* 1. Header Toolbar */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onReset={handleReset}
        hasApiKey={Boolean(apiKey.trim())}
        historyCount={history.length}
        visitCount={visitCount}
      />

      {/* Main Container */}
      <main className="app-container">
        {/* 2. Hero Section */}
        <HeroBanner />

        {/* 3. API Key Warning Box (khi chưa cấu hình key) */}
        {!apiKey.trim() && (
          <ApiKeyWarning onOpenSettings={() => setIsSettingsOpen(true)} />
        )}

        {/* Error Alert nếu có */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#fee2e2',
              border: '1px solid #f87171',
              color: '#b91c1c',
              fontSize: '0.88rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 4. Split-Screen Studio (Concept 1: 2 Cột Trực Quan Studio) */}
        <div className="studio-layout">
          {/* Cột trái: Hồ sơ đề tài & Tải file/Nhập liệu */}
          <div className="studio-left-panel">
            <SkknForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onAnalyzeTitle={handleAnalyzeTitle}
            />
          </div>

          {/* Cột phải: Bảng số liệu thẩm định trực quan & Dashboard */}
          <div className="studio-right-panel">
            <AnalysisReport
              result={currentResult}
              onUseSampleData={() => setFormData({ ...SAMPLE_SKKN_DATA })}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* 6. Footer thanh lịch chuyên nghiệp - Phát triển bởi: Anh giáo PHẠM QUỐC ĐẠT */}
        <Footer />
      </main>

      {/* Modal Cài đặt API Key */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        provider={provider}
        setProvider={setProvider}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onSave={handleSaveSettings}
      />

      {/* Modal Lịch sử Kiểm tra */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={(item) => {
          setCurrentResult(item);
          window.scrollTo({ top: 750, behavior: 'smooth' });
        }}
        onDelete={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
      />

      {/* Modal So sánh Phiên bản */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        history={history}
      />
    </div>
  );
}
