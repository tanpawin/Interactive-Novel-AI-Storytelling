'use client';

import React, { useState } from 'react';
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

  const {
    isLoaded,
    isSignedIn,
    sessionClaims,
  } = useAuth();

  const metadata = sessionClaims?.metadata as
    | {
        role?: string;
      }
    | undefined;

  const isAdmin = metadata?.role === 'admin';

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const handleCreateStory = () => {
    sessionStorage.removeItem(
      'cozytales_create_story_draft'
    );

    setIsMobileMenuOpen(false);

    router.push('/story/create');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">

        {/* ==========================================
            LOGO
        ========================================== */}

        <Link
          href="/"
          className="navbar-brand"
          onClick={closeMobileMenu}
        >
          <span className="logo-icon">📖</span>

          <span className="logo-text">
            GonnaTales
          </span>
        </Link>


        {/* ==========================================
            DESKTOP NAVIGATION
        ========================================== */}

        <nav className="navbar-links">

          <Link
            href="/"
            className={`nav-link ${isActive('/') ? 'active' : ''
              }`}
          >
            หน้าหลัก (Library)
          </Link>

          <Link
            href="/discover"
            className={`nav-link ${isActive('/discover') ? 'active' : ''
              }`}
          >
            สำรวจ (Discover)
          </Link>

          <Link
            href="/my-stories"
            className={`nav-link ${isActive('/my-stories') ? 'active' : ''
              }`}
          >
            นิยายของฉัน (My Stories)
          </Link>

          {/* Admin */}
          {isSignedIn && isAdmin && (
            <Link
              href="/admin"
              className={`nav-link ${isActive('/admin') ? 'active' : ''
                }`}
            >
              🛠️ Admin
            </Link>
          )}

        </nav>


        {/* ==========================================
            ACTIONS
        ========================================== */}

        <div className="navbar-actions">

          {/* สร้างนิยาย */}

          <button
            type="button"
            className="btn-create-story"
            onClick={handleCreateStory}
          >
            + เรื่องใหม่
          </button>


          {/* ========================================
              AUTHENTICATION
          ======================================== */}

          {isLoaded && (
            <>
              {!isSignedIn ? (

                <div className="navbar-auth-buttons">

                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story btn-signup"
                    >
                      สมัครสมาชิก
                    </button>
                  </SignUpButton>

                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="btn-create-story btn-login"
                    >
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>

                </div>

              ) : (

                <>
                  {/* โปรไฟล์ Desktop */}

                  <Link
                    href="/profile"
                    className={`nav-link navbar-profile-link ${isActive('/profile')
                        ? 'active'
                        : ''
                      }`}
                  >
                    โปรไฟล์
                  </Link>

                  {/* รูปโปรไฟล์ */}

                  <div className="navbar-user-button">
                    <UserButton />
                  </div>
                </>

              )}
            </>
          )}


          {/* ========================================
              MOBILE MENU BUTTON
          ======================================== */}

          <button
            type="button"
            className={`mobile-menu-button ${isMobileMenuOpen ? 'open' : ''
              }`}
            onClick={() =>
              setIsMobileMenuOpen(
                (prev) => !prev
              )
            }
            aria-label={
              isMobileMenuOpen
                ? 'ปิดเมนู'
                : 'เปิดเมนู'
            }
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        </div>

      </div>


      {/* ==========================================
          MOBILE MENU
      ========================================== */}

      <div
        className={`mobile-menu ${isMobileMenuOpen
            ? 'mobile-menu-open'
            : ''
          }`}
      >

        <nav className="mobile-menu-links">

          <Link
            href="/"
            className={`mobile-nav-link ${isActive('/')
                ? 'active'
                : ''
              }`}
            onClick={closeMobileMenu}
          >
            <span>หน้าหลัก</span>
            <small>Library</small>
          </Link>

          <Link
            href="/discover"
            className={`mobile-nav-link ${isActive('/discover')
                ? 'active'
                : ''
              }`}
            onClick={closeMobileMenu}
          >
            <span>สำรวจ</span>
            <small>Discover</small>
          </Link>

          <Link
            href="/my-stories"
            className={`mobile-nav-link ${isActive('/my-stories')
                ? 'active'
                : ''
              }`}
            onClick={closeMobileMenu}
          >
            <span>นิยายของฉัน</span>
            <small>My Stories</small>
          </Link>

          {/* Admin Mobile */}
          {isSignedIn && isAdmin && (
            <Link
              href="/admin"
              className={`mobile-nav-link ${isActive('/admin')
                  ? 'active'
                  : ''
                }`}
              onClick={closeMobileMenu}
            >
              <span>🛠️ Admin</span>
              <small>Admin Panel</small>
            </Link>
          )}

          {isSignedIn && (
            <Link
              href="/profile"
              className={`mobile-nav-link ${isActive('/profile')
                  ? 'active'
                  : ''
                }`}
              onClick={closeMobileMenu}
            >
              <span>โปรไฟล์</span>
              <small>Profile</small>
            </Link>
          )}

        </nav>


        {/* ========================================
            MOBILE AUTH
        ======================================== */}

        {!isSignedIn && isLoaded && (
          <div className="mobile-auth-buttons">

            <SignUpButton mode="modal">
              <button
                type="button"
                className="mobile-auth-button mobile-signup"
                onClick={closeMobileMenu}
              >
                สมัครสมาชิก
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button
                type="button"
                className="mobile-auth-button mobile-login"
                onClick={closeMobileMenu}
              >
                เข้าสู่ระบบ
              </button>
            </SignInButton>

          </div>
        )}

      </div>

    </header>
  );
};