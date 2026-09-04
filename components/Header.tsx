'use client';

import React from 'react';
import {
  GraduationCap,
  Sun,
  Moon,
  History,
  GitCompare,
  RotateCcw,
  Settings,
  Users
} from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onReset: () => void;
  hasApiKey: boolean;
  historyCount: number;
  visitCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  onOpenSettings,
  onOpenHistory,
  onOpenCompare,
  onReset,
  hasApiKey,
  historyCount,
  visitCount,
}) => {
  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Logo & Title */}
        <div className="logo-group">
          <div className="logo-icon-box" title="Trợ lý Thẩm định SKKN">
            <GraduationCap size={24} />
          </div>
          <div className="logo-texts">
            <h1>TRỢ LÝ SKKN</h1>
            <p>TRỢ LÝ THẨM ĐỊNH SKKN</p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="header-actions">
          {/* Theme Toggle */}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            aria-label="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Compare Button */}
          <button
            className="icon-btn"
            onClick={onOpenCompare}
            title="So sánh phiên bản"
            aria-label="So sánh phiên bản"
          >
            <GitCompare size={17} />
          </button>

          {/* History Button */}
          <button
            className="icon-btn"
            onClick={onOpenHistory}
            title={`Lịch sử kiểm tra (${historyCount} bản ghi)`}
            aria-label="Lịch sử kiểm tra"
          >
            <History size={17} />
          </button>

          {/* Reset Button */}
          <button
            className="icon-btn"
            onClick={onReset}
            title="Đặt lại dữ liệu form"
            aria-label="Đặt lại form"
          >
            <RotateCcw size={17} />
          </button>

          {/* Settings Button */}
          <button
            className="icon-btn"
            onClick={onOpenSettings}
            title="Cài đặt API Key & Model AI"
            aria-label="Cài đặt"
          >
            <Settings size={17} />
            {!hasApiKey && <span className="badge-dot" title="Chưa cài đặt API Key" />}
          </button>

          {/* Visitor Count Badge */}
          <div className="header-badge" title="Lượt truy cập hệ thống">
            <Users size={13} />
            <span>{visitCount} lượt</span>
          </div>

          {/* Version Pill */}
          <div className="version-pill" title="Phiên bản ứng dụng">
            v1.4
          </div>
        </div>
      </div>
    </header>
  );
};
