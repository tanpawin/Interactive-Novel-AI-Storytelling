'use client';

import React from 'react';
import Link from 'next/link';
import '../styles/navbar.css';

interface NavbarProps {
  activeTab: 'library' | 'discover' | 'my-stories';
  onTabChange: (tab: 'library' | 'discover' | 'my-stories') => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenCreateModal,
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand Logo */}
        <div className="navbar-brand" onClick={() => onTabChange('library')}>
          <div className="logo-icon">📖</div>
          <span className="logo-text">CozyTales</span>
        </div>

        {/* Navigation Links */}
        <nav className="navbar-links">
          <button
            className={`nav-link ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => onTabChange('library')}
          >
            หน้าหลัก (Library)
          </button>
          <button
            className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => onTabChange('discover')}
          >
            สำรวจ (Discover)
          </button>
          <button
            className={`nav-link ${activeTab === 'my-stories' ? 'active' : ''}`}
            onClick={() => onTabChange('my-stories')}
          >
            นิยายของฉัน (My Stories)
          </button>
        </nav>

        {/* Actions (Search, New Story Button, Profile) */}
        <div className="navbar-actions">
          <button className="icon-button" title="ค้นหา">
            🔍
          </button>
          
          <button className="btn-create-story" onClick={onOpenCreateModal}>
            <span>+</span> เรื่องใหม่
          </button>

          <div className="user-avatar" title="โปรไฟล์ของคุณ">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" 
              alt="User Avatar" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};