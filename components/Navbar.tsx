'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';

interface NavbarProps {
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

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

        {/* ปุ่มกดเปิด Modal และระบบ Login / Profile */}
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            className="btn-create-story" 
            onClick={onOpenCreateModal}
          >
            + เรื่องใหม่
          </button>

          {/* รอให้ระบบ Clerk โหลดสถานะเสร็จก่อนแสดงผล */}
          {isLoaded && (
            <>
              {!isSignedIn ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* ปุ่มสมัครสมาชิก สำหรับผู้ใช้ใหม่ที่ยังไม่มีบัญชี */}
                  <SignUpButton mode="modal">
                    <button type="button" className="btn-create-story" style={{ background: '#4b5563' }}>
                      สมัครสมาชิก
                    </button>
                  </SignUpButton>

                  {/* ปุ่มเข้าสู่ระบบ สำหรับคนที่มีบัญชีอยู่แล้ว */}
                  <SignInButton mode="modal">
                    <button type="button" className="btn-create-story" style={{ background: '#d97706' }}>
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>
                </div>
              ) : (
                /* Login แล้ว -> แสดงปุ่มโปรไฟล์ และ รูปประจำตัว */
                <>
                  <Link 
                    href="/profile" 
                    className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}
                  >
                    โปรไฟล์
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};