'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type User = {
  userId: string;
  displayName: string;
  createdAt: string | null;
  updatedAt: string | null;
  storyCount: number;
  sessionCount: number;
};

function formatDate(date: string | null) {
  if (!date) {
    return '-';
  }

  return new Date(date).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitial(name: string) {
  const value = name.trim();

  if (!value) {
    return 'ผ';
  }

  return value.charAt(0).toUpperCase();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch('/api/admin/users');

        if (!response.ok) {
          throw new Error('Failed to load users');
        }

        const data = await response.json();

        setUsers(data.users ?? []);
      } catch (error) {
        console.error('Admin Users Error:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.displayName.toLowerCase().includes(keyword) ||
        user.userId.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const totalStories = useMemo(() => {
    return users.reduce((total, user) => total + user.storyCount, 0);
  }, [users]);

  const totalSessions = useMemo(() => {
    return users.reduce((total, user) => total + user.sessionCount, 0);
  }, [users]);

  const clearSearch = () => {
    setSearch('');
  };

  return (
    <main className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-page-header admin-users-header">
          <div>
            <Link href="/admin" className="admin-back-link">
              ‹ กลับหน้า Admin
            </Link>

            <div className="admin-users-title">
              <div>
                <h1>ผู้ใช้</h1>

                <p>
                  จัดการและตรวจสอบข้อมูลผู้ใช้งานภายใน CozyTales
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Overview */}
        {!loading && !error && (
          <section className="admin-users-overview">
            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                ผู้ใช้ทั้งหมด
              </div>

              <div className="admin-users-overview-value">
                {users.length}
              </div>

              <div className="admin-users-overview-description">
                บัญชีที่มีข้อมูลในระบบ
              </div>
            </div>

            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                นิยายทั้งหมด
              </div>

              <div className="admin-users-overview-value">
                {totalStories}
              </div>

              <div className="admin-users-overview-description">
                นิยายที่ผู้ใช้สร้าง
              </div>
            </div>

            <div className="admin-users-overview-card">
              <div className="admin-users-overview-label">
                Game Sessions
              </div>

              <div className="admin-users-overview-value">
                {totalSessions}
              </div>

              <div className="admin-users-overview-description">
                เส้นเรื่องที่ถูกสร้าง
              </div>
            </div>
          </section>
        )}

        {/* Main */}
        <section className="admin-management-card admin-users-card">
          <div className="admin-users-toolbar">
            <div className="admin-users-section-title">
              <div>
                <h2>รายชื่อผู้ใช้</h2>

                <p>
                  {loading
                    ? 'กำลังโหลดข้อมูล...'
                    : search
                      ? `พบ ${filteredUsers.length} จาก ${users.length} ผู้ใช้`
                      : `${users.length} ผู้ใช้ในระบบ`}
                </p>
              </div>
            </div>

            <div className="admin-search-wrapper admin-users-search">
              <svg
                className="admin-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาผู้ใช้..."
                className="admin-search-input"
              />

              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="admin-search-clear"
                  aria-label="ล้างการค้นหา"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="admin-users-loading">
              <div className="admin-loading-spinner" />

              <div>
                <strong>กำลังโหลดผู้ใช้</strong>
                <p>กำลังเตรียมข้อมูลจากระบบ</p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="admin-users-message">
              <div className="admin-users-message-icon">
                !
              </div>

              <div>
                <h3>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</h3>

                <p>
                  เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ
                </p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="admin-users-retry"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredUsers.length === 0 && (
            <div className="admin-users-message">
              <div className="admin-users-empty-mark">
                {search ? '0' : '—'}
              </div>

              <div>
                <h3>
                  {search ? 'ไม่พบผู้ใช้' : 'ยังไม่มีผู้ใช้'}
                </h3>

                <p>
                  {search
                    ? 'ลองค้นหาด้วยชื่อหรือ User ID อื่น'
                    : 'ยังไม่มีข้อมูลผู้ใช้ในระบบ'}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="admin-users-retry"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Desktop Table */}
          {!loading && !error && filteredUsers.length > 0 && (
            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th className="admin-users-col-user">
                      ผู้ใช้
                    </th>

                    <th>
                      นิยาย
                    </th>

                    <th>
                      Sessions
                    </th>

                    <th>
                      วันที่สมัคร
                    </th>

                    <th className="admin-users-col-action">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {getInitial(user.displayName)}
                          </div>

                          <div className="admin-user-info">
                            <strong>
                              {user.displayName}
                            </strong>

                            <span title={user.userId}>
                              {user.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="admin-user-stat">
                          {user.storyCount}
                        </span>
                      </td>

                      <td>
                        <span className="admin-user-stat">
                          {user.sessionCount}
                        </span>
                      </td>

                      <td>
                        <span className="admin-user-date">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td>
                        <Link
                          href={`/admin/users/${user.userId}`}
                          className="admin-user-view"
                        >
                          <span>ดูรายละเอียด</span>

                          <span
                            className="admin-user-view-arrow"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {!loading && !error && filteredUsers.length > 0 && (
            <div className="admin-users-mobile-list">
              {filteredUsers.map((user) => (
                <article
                  key={user.userId}
                  className="admin-user-mobile-card"
                >
                  <div className="admin-user-mobile-top">
                    <div className="admin-user-cell">
                      <div className="admin-user-avatar">
                        {getInitial(user.displayName)}
                      </div>

                      <div className="admin-user-info">
                        <strong>
                          {user.displayName}
                        </strong>

                        <span title={user.userId}>
                          {user.userId}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/admin/users/${user.userId}`}
                      className="admin-user-mobile-link"
                      aria-label={`ดูรายละเอียด ${user.displayName}`}
                    >
                      →
                    </Link>
                  </div>

                  <div className="admin-user-mobile-stats">
                    <div>
                      <span>นิยาย</span>
                      <strong>{user.storyCount}</strong>
                    </div>

                    <div>
                      <span>Sessions</span>
                      <strong>{user.sessionCount}</strong>
                    </div>

                    <div>
                      <span>สมัครเมื่อ</span>
                      <strong>
                        {formatDate(user.createdAt)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}