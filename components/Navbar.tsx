'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const pathname = usePathname();

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* โลโก้ */}
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">📖</span>
          <span className="logo-text">CozyTales</span>
        </Link>

        {/* เมนูเปลี่ยนหน้า */}
        <nav className="navbar-links">
          <Link 
            href="/" 
            className={`nav-link ${pathname === '/' ? 'active' : ''}`}
          >
            หน้าหลัก (Library)
          </Link>
          <Link 
            href="/discover" 
            className={`nav-link ${pathname === '/discover' ? 'active' : ''}`}
          >
            สำรวจ (Discover)
          </Link>
          <Link 
            href="/my-stories" 
            className={`nav-link ${pathname === '/my-stories' ? 'active' : ''}`}
          >
            นิยายของฉัน (My Stories)
          </Link>
        </nav>

        {/* ปุ่มกดเปิด Modal */}
        <div className="navbar-actions">
          <button 
            type="button" 
            className="btn-create-story" 
            onClick={onOpenCreateModal}
          >
            + เรื่องใหม่
          </button>
        </div>
      </div>
    </header>
  );
};