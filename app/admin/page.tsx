'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type DashboardStats = {
  storyCount: number;
  publishedStoryCount: number;
  privateStoryCount: number;

  userCount: number;

  sharedChapterCount: number;
  sessionChapterCount: number;
  totalChapterCount: number;

  sessionCount: number;
  publicSessionCount: number;
  privateSessionCount: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch('/api/admin/dashboard');

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
          );
        }

        setStats(data.stats);
      } catch (error) {
        console.error('Dashboard Error:', error);

        setError(
          error instanceof Error
            ? error.message
            : 'ไม่สามารถโหลดข้อมูล Dashboard ได้'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-page-header">
          <div>
            <p className="admin-label">COZYTALES ADMIN</p>

            <h1>แดชบอร์ดผู้ดูแลระบบ</h1>

            <p className="admin-description">
              จัดการและตรวจสอบข้อมูลภายในระบบ CozyTales
            </p>
          </div>
        </header>

        {error ? (
          <div className="admin-error">
            <h2>ไม่สามารถโหลดข้อมูลได้</h2>

            <p>{error}</p>

            <button
              type="button"
              className="admin-button"
              onClick={() => window.location.reload()}
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <section className="admin-dashboard-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
                    <path d="M4 5.5V18" />
                    <path d="M8 7h8" />
                    <path d="M8 11h8" />
                  </svg>
                </div>

                <div className="admin-stat-content">
                  <span>นิยายทั้งหมด</span>
                  <strong>
                    {loading ? '—' : stats?.storyCount ?? 0}
                  </strong>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 11a3 3 0 1 0 0-6" />
                    <path d="M16 14a5 5 0 0 1 4.5 6" />
                  </svg>
                </div>

                <div className="admin-stat-content">
                  <span>ผู้ใช้ทั้งหมด</span>
                  <strong>
                    {loading ? '—' : stats?.userCount ?? 0}
                  </strong>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 4h14v16H5z" />
                    <path d="M8 8h8" />
                    <path d="M8 12h8" />
                    <path d="M8 16h5" />
                  </svg>
                </div>

                <div className="admin-stat-content">
                  <span>ตอนทั้งหมด</span>
                  <strong>
                    {loading
                      ? '—'
                      : stats?.totalChapterCount ?? 0}
                  </strong>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>

                <div className="admin-stat-content">
                  <span>นิยายเผยแพร่</span>
                  <strong>
                    {loading
                      ? '—'
                      : stats?.publishedStoryCount ?? 0}
                  </strong>
                </div>
              </div>
            </section>

            {/* Management */}
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <h2>การจัดการระบบ</h2>

                  <p>
                    จัดการข้อมูลนิยาย ผู้ใช้
                    และตรวจสอบการใช้งานระบบ
                  </p>
                </div>
              </div>

              <div className="admin-menu-grid">
                <Link
                  href="/admin/stories"
                  className="admin-menu-card"
                >
                  <div className="admin-menu-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z" />
                      <path d="M4 5.5V18" />
                      <path d="M8 7h8" />
                      <path d="M8 11h8" />
                    </svg>
                  </div>

                  <div className="admin-menu-content">
                    <h3>จัดการนิยาย</h3>

                    <p>
                      ดู ตรวจสอบ และจัดการนิยายทั้งหมดในระบบ
                    </p>

                    <span className="admin-menu-link">
                      ดูนิยายทั้งหมด
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/users"
                  className="admin-menu-card"
                >
                  <div className="admin-menu-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="9" cy="8" r="3" />
                      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
                      <path d="M16 11a3 3 0 1 0 0-6" />
                      <path d="M16 14a5 5 0 0 1 4.5 6" />
                    </svg>
                  </div>

                  <div className="admin-menu-content">
                    <h3>จัดการผู้ใช้</h3>

                    <p>
                      ตรวจสอบข้อมูลผู้ใช้ นิยาย และ Game Sessions
                    </p>

                    <span className="admin-menu-link">
                      ดูผู้ใช้ทั้งหมด
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </div>
            </section>

            {/* Overview */}
            <section className="admin-dashboard-overview">
              <div className="admin-dashboard-overview-card">
                <div>
                  <span>Game Sessions</span>

                  <strong>
                    {loading ? '—' : stats?.sessionCount ?? 0}
                  </strong>
                </div>

                <p>
                  จำนวนเส้นเรื่องที่ผู้ใช้สร้างไว้
                </p>
              </div>

              <div className="admin-dashboard-overview-card">
                <div>
                  <span>Public Sessions</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.publicSessionCount ?? 0}
                  </strong>
                </div>

                <p>
                  เส้นเรื่องที่เปิดให้ผู้ใช้อื่นเข้าชม
                </p>
              </div>

              <div className="admin-dashboard-overview-card">
                <div>
                  <span>Private Sessions</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.privateSessionCount ?? 0}
                  </strong>
                </div>

                <p>
                  เส้นเรื่องที่เก็บไว้เป็นส่วนตัว
                </p>
              </div>
            </section>

            {/* Breakdown */}
            <section className="admin-dashboard-breakdown">
              <div className="admin-dashboard-breakdown-header">
                <div>
                  <h2>สถานะนิยาย</h2>

                  <p>
                    สรุปสถานะการเผยแพร่นิยายภายในระบบ
                  </p>
                </div>
              </div>

              <div className="admin-dashboard-breakdown-grid">
                <div className="admin-dashboard-breakdown-item">
                  <span>เผยแพร่แล้ว</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.publishedStoryCount ?? 0}
                  </strong>
                </div>

                <div className="admin-dashboard-breakdown-item">
                  <span>ส่วนตัว</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.privateStoryCount ?? 0}
                  </strong>
                </div>

                <div className="admin-dashboard-breakdown-item">
                  <span>Shared Chapters</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.sharedChapterCount ?? 0}
                  </strong>
                </div>

                <div className="admin-dashboard-breakdown-item">
                  <span>Session Chapters</span>

                  <strong>
                    {loading
                      ? '—'
                      : stats?.sessionChapterCount ?? 0}
                  </strong>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}