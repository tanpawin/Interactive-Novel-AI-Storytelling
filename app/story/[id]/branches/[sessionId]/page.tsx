'use client';

import React, {
  useEffect,
  useState,
} from 'react';

import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import '@/styles/reader.css';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  userPromptChoice?: string;
  createdAt: string;
}

interface Branch {
  sessionId: string;
  userId: string;
  userName?: string;
  currentChapter: number;
  status: string;
}

interface BranchResponse {
  success: boolean;

  story?: {
    id: string;
    title: string;
    totalChapters: number;
    genre?: string;
    tone?: string;
    synopsis?: string;
    creatorName?: string;
  };

  branch?: Branch;

  chapters?: Chapter[];

  error?: string;
}

export default function BranchReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyId =
    params.id as string;

  const sessionId =
    params.sessionId as string;

  const from =
    searchParams.get('from');

  // แก้ตรงนี้:
  // Branch Reader → กลับไปหน้า Branches ของเรื่องนี้ก่อนเสมอ
  const handleBack = () => {
    router.push(
      `/story/${storyId}/branches${
        from ? `?from=${from}` : ''
      }`
    );
  };

  const [storyTitle, setStoryTitle] =
    useState('');

  const [
    totalChapters,
    setTotalChapters,
  ] = useState(0);

  const [genre, setGenre] =
    useState('');

  const [tone, setTone] =
    useState('');

  const [synopsis, setSynopsis] =
    useState('');

  const [
    creatorName,
    setCreatorName,
  ] = useState('');

  const [
    playerName,
    setPlayerName,
  ] = useState('');

  const [chapters, setChapters] =
    useState<Chapter[]>([]);

  const [fontSize, setFontSize] =
    useState<
      'sm' | 'md' | 'lg'
    >('md');

  const [
    selectedChapter,
    setSelectedChapter,
  ] = useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (
      !storyId ||
      !sessionId
    ) {
      return;
    }

    async function loadBranch() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(
          `/api/stories/${storyId}/branches/${sessionId}`
        );

        const data: BranchResponse =
          await res.json();

        if (
          !res.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              'ไม่สามารถโหลดเส้นเรื่องได้'
          );
        }

        setStoryTitle(
          data.story?.title ?? ''
        );

        setTotalChapters(
          data.story
            ?.totalChapters ?? 0
        );

        setGenre(
          data.story?.genre ?? ''
        );

        setTone(
          data.story?.tone ?? ''
        );

        setSynopsis(
          data.story?.synopsis ?? ''
        );

        setCreatorName(
          data.story
            ?.creatorName ??
            'ไม่ระบุชื่อ'
        );

        setPlayerName(
          data.branch?.userName ??
            'ผู้เล่น'
        );

        const loadedChapters =
          data.chapters ?? [];

        setChapters(
          loadedChapters
        );

        const latestChapter =
          loadedChapters.length >
          0
            ? Math.max(
                ...loadedChapters.map(
                  (chapter) =>
                    chapter.chapterNumber
                )
              )
            : 1;

        setSelectedChapter(
          latestChapter
        );
      } catch (err) {
        console.error(
          'Error loading branch:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'เกิดข้อผิดพลาดในการโหลดเส้นเรื่อง'
        );
      } finally {
        setLoading(false);
      }
    }

    loadBranch();
  }, [
    storyId,
    sessionId,
  ]);

  const currentChapter =
    chapters.find(
      (chapter) =>
        chapter.chapterNumber ===
        selectedChapter
    ) ||
    chapters[
      chapters.length - 1
    ];

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================
     Loading
  ========================= */

  if (loading) {
    return (
      <div className="reader-wrapper">
        <header className="reader-header">
          <button
            className="btn-back"
            onClick={handleBack}
          >
            ‹ ย้อนกลับ
          </button>

          <div className="font-size-controls">
            <button
              onClick={() =>
                setFontSize('sm')
              }
              className={
                fontSize === 'sm'
                  ? 'active'
                  : ''
              }
            >
              A-
            </button>

            <button
              onClick={() =>
                setFontSize('md')
              }
              className={
                fontSize === 'md'
                  ? 'active'
                  : ''
              }
            >
              A
            </button>

            <button
              onClick={() =>
                setFontSize('lg')
              }
              className={
                fontSize === 'lg'
                  ? 'active'
                  : ''
              }
            >
              A+
            </button>
          </div>
        </header>

        <main className="reader-empty">
          <div>
            <span>📖</span>

            <h2>
              กำลังโหลดเส้นเรื่อง...
            </h2>

            <p>
              กำลังเปิดเรื่องราวของผู้เล่น
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* =========================
     Error
  ========================= */

  if (error) {
    return (
      <div className="reader-wrapper">
        <header className="reader-header">
          <button
            className="btn-back"
            onClick={handleBack}
          >
            ‹ ย้อนกลับ
          </button>

          <div className="font-size-controls">
            <button
              onClick={() =>
                setFontSize('sm')
              }
              className={
                fontSize === 'sm'
                  ? 'active'
                  : ''
              }
            >
              A-
            </button>

            <button
              onClick={() =>
                setFontSize('md')
              }
              className={
                fontSize === 'md'
                  ? 'active'
                  : ''
              }
            >
              A
            </button>

            <button
              onClick={() =>
                setFontSize('lg')
              }
              className={
                fontSize === 'lg'
                  ? 'active'
                  : ''
              }
            >
              A+
            </button>
          </div>
        </header>

        <main className="reader-empty">
          <div>
            <span>⚠️</span>

            <h2>
              ไม่สามารถโหลดเส้นเรื่องได้
            </h2>

            <p>{error}</p>

            <button
              className="chapter-nav-button"
              onClick={() =>
                window.location.reload()
              }
              style={{
                marginTop: '1rem',
              }}
            >
              ลองอีกครั้ง
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* =========================
     Empty Branch
  ========================= */

  if (!currentChapter) {
    return (
      <div className="reader-wrapper">
        <header className="reader-header">
          <button
            className="btn-back"
            onClick={handleBack}
          >
            ‹ ย้อนกลับ
          </button>

          <div className="font-size-controls">
            <button
              onClick={() =>
                setFontSize('sm')
              }
              className={
                fontSize === 'sm'
                  ? 'active'
                  : ''
              }
            >
              A-
            </button>

            <button
              onClick={() =>
                setFontSize('md')
              }
              className={
                fontSize === 'md'
                  ? 'active'
                  : ''
              }
            >
              A
            </button>

            <button
              onClick={() =>
                setFontSize('lg')
              }
              className={
                fontSize === 'lg'
                  ? 'active'
                  : ''
              }
            >
              A+
            </button>
          </div>
        </header>

        <main className="reader-content">
          <div className="story-meta-banner">
            <h1 className="story-main-title">
              {storyTitle}
            </h1>

            <div className="story-badges">
              {genre && (
                <span className="badge">
                  {genre}
                </span>
              )}

              {tone && (
                <span className="badge">
                  {tone}
                </span>
              )}
            </div>

            {synopsis && (
              <p className="premise font-serif">
                "{synopsis}"
              </p>
            )}

            <div className="chapter-counter">
              สร้างโดย{' '}
              <strong>
                "{creatorName}"
              </strong>
            </div>

            <div className="chapter-counter">
              เส้นเรื่องของ{' '}
              <strong>
                "{playerName}"
              </strong>
            </div>
          </div>

          <main className="reader-empty">
            <div>
              <span>📖</span>

              <h2>
                ยังไม่มีเนื้อเรื่อง
              </h2>

              <p>
                ไม่พบเนื้อหาในเส้นเรื่องนี้
              </p>
            </div>
          </main>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`reader-wrapper font-size-${fontSize}`}
    >
      {/* =========================
          Header
      ========================= */}

      <header className="reader-header">
        <button
          className="btn-back"
          onClick={handleBack}
        >
          ‹ ย้อนกลับ
        </button>

        <div className="font-size-controls">
          <button
            onClick={() =>
              setFontSize('sm')
            }
            className={
              fontSize === 'sm'
                ? 'active'
                : ''
            }
          >
            A-
          </button>

          <button
            onClick={() =>
              setFontSize('md')
            }
            className={
              fontSize === 'md'
                ? 'active'
                : ''
            }
          >
            A
          </button>

          <button
            onClick={() =>
              setFontSize('lg')
            }
            className={
              fontSize === 'lg'
                ? 'active'
                : ''
            }
          >
            A+
          </button>
        </div>
      </header>

      {/* =========================
          Main Reader
      ========================= */}

      <main className="reader-content">

        {/* =========================
            Story Info
        ========================= */}

        <div className="story-meta-banner">

          <h1 className="story-main-title">
            {storyTitle}
          </h1>

          <div className="story-badges">
            {genre && (
              <span className="badge">
                {genre}
              </span>
            )}

            {tone && (
              <span className="badge">
                {tone}
              </span>
            )}
          </div>

          {synopsis && (
            <p className="premise font-serif">
              "{synopsis}"
            </p>
          )}

          {/* เจ้าของเรื่อง */}

          <div className="chapter-counter">
            ผู้เขียน{' '}
            <strong>
              {creatorName}
            </strong>{' '}
            ร่วมกับ AI
          </div>

          {/* ผู้เล่น Branch */}

          <div className="chapter-counter">
            เส้นเรื่องของ{' '}
            <strong>
              "{playerName}"
            </strong>
          </div>

          {/* Chapter */}

          <div className="chapter-counter">
            บทที่{' '}
            {currentChapter.chapterNumber}
            {' / '}
            {totalChapters}
          </div>
        </div>

        {/* =========================
            Current Chapter
        ========================= */}

        <article
          className="chapter-block"
          key={currentChapter.id}
        >
          {currentChapter.userPromptChoice && (
            <div className="user-choice-badge">
              🎯 การตัดสินใจของคุณ:{' '}
              <span>
                "
                {
                  currentChapter.userPromptChoice
                }
                "
              </span>
            </div>
          )}

          <div className="chapter-heading">
            <span>
              บทที่{' '}
              {currentChapter.chapterNumber}
            </span>

            <h1 className="chapter-title">
              {currentChapter.title}
            </h1>
          </div>

          <div className="chapter-text font-serif">
            {currentChapter.content
              .split('\n')
              .map(
                (
                  paragraph,
                  idx
                ) =>
                  paragraph.trim() ? (
                    <p key={idx}>
                      {paragraph}
                    </p>
                  ) : null
              )}
          </div>
        </article>

        {/* =========================
            Navigation
        ========================= */}

        <div className="chapter-navigation">
          <button
            className="chapter-nav-button"
            disabled={
              selectedChapter <= 1
            }
            onClick={() => {
              setSelectedChapter(
                selectedChapter - 1
              );

              scrollToTop();
            }}
          >
            ‹ บทก่อนหน้า
          </button>

          <span>
            {selectedChapter} /{' '}
            {totalChapters}
          </span>

          <button
            className="chapter-nav-button"
            disabled={
              selectedChapter >=
              chapters.length
            }
            onClick={() => {
              setSelectedChapter(
                selectedChapter + 1
              );

              scrollToTop();
            }}
          >
            บทถัดไป ›
          </button>
        </div>
      </main>
    </div>
  );
}