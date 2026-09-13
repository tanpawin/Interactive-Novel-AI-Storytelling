'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from '@clerk/nextjs';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const handleCreateStory = () => {
    /*
     * ล้าง Draft ของนิยายเรื่องเก่า
     * เพื่อให้หน้า Create Story เริ่มเรื่องใหม่แบบสะอาด
     */
    sessionStorage.removeItem(
      'cozytales_create_story_draft'
    );

    router.push('/story/create');
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">

        {/* ==========================================
            โลโก้
        ========================================== */}
        <Link href="/" className="navbar-brand">
          <span className="logo-icon">📖</span>
          <span className="logo-text">CozyTales</span>
        </Link>


        {/* ==========================================
            เมนูเปลี่ยนหน้า
        ========================================== */}
        <nav className="navbar-links">

          <Link
            href="/"
            className={`nav-link ${
              pathname === '/' ? 'active' : ''
            }`}
          >
            หน้าหลัก (Library)
          </Link>

          <Link
            href="/discover"
            className={`nav-link ${
              pathname === '/discover' ? 'active' : ''
            }`}
          >
            สำรวจ (Discover)
          </Link>

          <Link
            href="/my-stories"
            className={`nav-link ${
              pathname === '/my-stories' ? 'active' : ''
            }`}
          >
            นิยายของฉัน (My Stories)
          </Link>

        </nav>


        {/* ==========================================
            ACTIONS
        ========================================== */}
        <div
          className="navbar-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >

          {/* ========================================
              สร้างนิยาย
          ======================================== */}
          <button
            type="button"
            className="btn-create-story"
            onClick={handleCreateStory}
          >
            + เรื่องใหม่
          </button>


          {/* ========================================
              Clerk Authentication
          ======================================== */}
          {isLoaded && (
            <>
              {!isSignedIn ? (

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                  }}
                >

                  {/* สมัครสมาชิก */}
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story"
                      style={{
                        background: '#4b5563',
                      }}
                    >
                      สมัครสมาชิก
                    </button>
                  </SignUpButton>


                  {/* เข้าสู่ระบบ */}
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story"
                      style={{
                        background: '#d97706',
                      }}
                    >
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>

                </div>

              ) : (

                <>
                  {/* โปรไฟล์ */}
                  <Link
                    href="/profile"
                    className={`nav-link ${
                      pathname === '/profile'
                        ? 'active'
                        : ''
                    }`}
                  >
                    โปรไฟล์
                  </Link>

                  {/* รูปโปรไฟล์ */}
                  <UserButton />
                </>

              )}
            </>
          )}

        </div>

      </div>
    </header>
  );
};