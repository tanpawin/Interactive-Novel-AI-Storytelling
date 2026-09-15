'use client';

import React from 'react';
import { Story } from '../types/story';
import { StoryCard } from './StoryCard';

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (id: string) => void;
  onOpenCreateModal: () => void;
  onGoToDiscover: () => void;
  onFavoriteChange: (
    storyId: string,
    isFavorite: boolean
  ) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  stories,
  onSelectStory,
  onOpenCreateModal,
  onGoToDiscover,
  onFavoriteChange,
}) => {
  // =========================
  // กำลังอ่านต่อ
  // =========================

  const continueReadingList = stories.filter(
    (story) =>
      story.currentChapter > 0 &&
      story.currentChapter < story.totalChapters
  );

  // =========================
  // นิยายโปรด
  // =========================

  const favoriteList = stories.filter(
    (story) => story.isFavorite
  );

  // =========================
  // นิยายล่าสุด
  //
  // stories ถูกเรียงจาก created_at
  // ใหม่ → เก่า มาจาก HomePage
  // =========================

  const discoverList = stories.slice(0, 6);

  return (
    <div className="view-container">

      {/* =========================
          Hero Header
      ========================= */}

      <section className="nook-header">
        <div className="nook-title-area">

          <span className="nook-subtitle">
            ต้อนรับกลับสู่มุมโปรด
          </span>

          <h1 className="nook-title">
            Your Reading Nook
          </h1>

          <p className="nook-desc">
            พักผ่อนกับเรื่องราวที่คุณชื่นชอบ
            หรือสร้างสรรค์โลกใบใหม่ไปพร้อมกับ AI
          </p>

          <div className="nook-actions">

            <button
              className="btn-hero-primary"
              onClick={onOpenCreateModal}
            >
              ✨ เริ่มสร้างเรื่องใหม่
            </button>

            <button
              className="btn-hero-secondary"
              onClick={onGoToDiscover}
            >
              🔍 สำรวจคลังนิยาย
            </button>

          </div>

        </div>
      </section>

      {/* =========================
          Section 1: Continue Reading
      ========================= */}

      {continueReadingList.length > 0 && (
        <section className="story-section">

          <div className="section-header">
            <h2>
              📖 อ่านต่อจากที่ค้างไว้
            </h2>
          </div>

          <div className="story-grid">
            {continueReadingList.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={onSelectStory}
                onFavoriteChange={onFavoriteChange}
                showProgress
                branchFrom="home"
              />
            ))}
          </div>

        </section>
      )}

      {/* =========================
          Section 2: Your Favourites
      ========================= */}

      {favoriteList.length > 0 && (
        <section className="story-section">

          <div className="section-header">
            <h2>
              ⭐ เรื่องโปรดของคุณ
            </h2>
          </div>

          <div className="story-grid">
            {favoriteList.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={onSelectStory}
                onFavoriteChange={onFavoriteChange}
                branchFrom="home"
              />
            ))}
          </div>

        </section>
      )}

      {/* =========================
          Section 3: Discover
      ========================= */}

      {discoverList.length > 0 && (
        <section className="story-section">

          <div className="section-header discover-section-header">

            <h2>
              ค้นพบเรื่องราวเพิ่มเติม
            </h2>

            <button
              type="button"
              className="section-link"
              onClick={onGoToDiscover}
            >
              ดูทั้งหมด →
            </button>

          </div>

          <div className="story-grid">
            {discoverList.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={onSelectStory}
                onFavoriteChange={onFavoriteChange}
                branchFrom="home"
              />
            ))}
          </div>

        </section>
      )}

      {/* =========================
          Quote Banner
      ========================= */}

      <div className="quote-banner">

        <p className="quote-text">
          "A reader lives a thousand lives before he dies.
          The man who never reads lives only one."
        </p>

        <span className="quote-author">
          — George R.R. Martin
        </span>

      </div>

    </div>
  );
};