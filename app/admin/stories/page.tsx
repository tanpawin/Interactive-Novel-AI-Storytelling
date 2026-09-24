'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Story = {
    id: string;
    title: string;
    synopsis: string | null;
    genre: string | null;
    tone: string | null;
    total_chapters: number;
    is_published: boolean;
    created_at: string | null;
    updated_at: string | null;
    user_id: string | null;
};

export default function AdminStoriesPage() {
    const [stories, setStories] = useState<Story[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function loadStories() {
            try {
                setLoading(true);
                setError(false);

                const response = await fetch('/api/admin/stories');

                if (!response.ok) {
                    throw new Error('Failed to load stories');
                }

                const data = await response.json();

                setStories(data.stories ?? []);
            } catch (error) {
                console.error('Admin Stories Error:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        loadStories();
    }, []);

    const filteredStories = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
            return stories;
        }

        return stories.filter((story) =>
            story.title.toLowerCase().includes(keyword)
        );
    }, [stories, search]);

    const clearSearch = () => {
        setSearch('');
    };

    if (loading) {
        return (
            <main className="admin-page">
                <div className="admin-container">
                    <div className="admin-page-header">
                        <div>
                            <Link
                                href="/admin"
                                className="admin-back-link"
                            >
                                ‹ กลับไปแดชบอร์ด
                            </Link>

                            <p className="admin-label">
                                COZYTALES ADMIN
                            </p>

                            <h1>จัดการนิยาย</h1>

                            <p className="admin-description">
                                ตรวจสอบและจัดการนิยายทั้งหมดในระบบ
                            </p>
                        </div>
                    </div>

                    <div className="admin-table-card">
                        <div className="admin-empty">
                            <h2>กำลังโหลดข้อมูล</h2>

                            <p>
                                กำลังโหลดรายการนิยาย...
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="admin-page">
                <div className="admin-container">
                    <div className="admin-error">
                        <h1>ไม่สามารถโหลดข้อมูลนิยายได้</h1>

                        <p>
                            เกิดข้อผิดพลาดในการเชื่อมต่อข้อมูล
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <div className="admin-container">
                {/* Header */}
                <div className="admin-page-header">
                    <div>
                        <Link
                            href="/admin"
                            className="admin-back-link"
                        >
                            ‹ กลับไปแดชบอร์ด
                        </Link>

                        <p className="admin-label">
                            COZYTALES ADMIN
                        </p>

                        <h1>จัดการนิยาย</h1>

                        <p className="admin-description">
                            ตรวจสอบและจัดการนิยายทั้งหมดในระบบ
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="admin-search-form">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ค้นหาชื่อเรื่อง..."
                        className="admin-search-input"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="admin-clear-button"
                        >
                            ล้าง
                        </button>
                    )}
                </div>

                {/* Result */}
                <div className="admin-story-result">
                    <span>
                        {search.trim()
                            ? `พบ ${filteredStories.length} เรื่องจาก "${search.trim()}"`
                            : `พบทั้งหมด ${filteredStories.length} เรื่อง`}
                    </span>
                </div>

                {/* Stories */}
                <section className="admin-table-card">
                    {filteredStories.length > 0 ? (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>นิยาย</th>
                                        <th>ประเภท</th>
                                        <th>ตอน</th>
                                        <th>สถานะ</th>
                                        <th>วันที่สร้าง</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredStories.map((story) => (
                                        <tr key={story.id}>
                                            <td>
                                                <div className="admin-story-title">
                                                    <strong>
                                                        {story.title}
                                                    </strong>

                                                    <span>
                                                        {story.synopsis
                                                            ? story.synopsis.length > 90
                                                                ? `${story.synopsis.slice(
                                                                    0,
                                                                    90
                                                                )}...`
                                                                : story.synopsis
                                                            : 'ไม่มีเรื่องย่อ'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                {story.genre || '-'}
                                            </td>

                                            <td>
                                                {story.total_chapters}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        story.is_published
                                                            ? 'admin-status published'
                                                            : 'admin-status draft'
                                                    }
                                                >
                                                    {story.is_published
                                                        ? 'เผยแพร่'
                                                        : 'ร่าง'}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(
                                                    story.created_at
                                                )}
                                            </td>

                                            <td>
                                                <Link
                                                    href={`/admin/stories/${story.id}`}
                                                    className="admin-view-button"
                                                >
                                                    ดูรายละเอียด
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="admin-empty">
                            <h2>ไม่พบรายการนิยาย</h2>

                            <p>
                                {search.trim()
                                    ? `ไม่พบเรื่องที่ตรงกับ "${search.trim()}"`
                                    : 'ยังไม่มีนิยายในระบบ'}
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function formatDate(date: string | null) {
    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
}