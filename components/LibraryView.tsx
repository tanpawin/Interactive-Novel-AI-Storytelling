'use client';

import React from 'react';
import { Story } from '../types/story';
import { StoryCard } from './StoryCard';

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (id: string) => void;
  onOpenCreateModal: () => void;
  onGoToDiscover: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  stories,
  onSelectStory,
  onOpenCreateModal,
  onGoToDiscover,
}) => {
  const continueReadingList = stories.filter((s) => s.currentChapter > 0);
  const trendingList = stories.filter((s) => s.isTrending);
  const favoriteList = stories.filter((s) => s.isFavorite);

  return (
    <div className="view-container">
      {/* Hero Header: Your Reading Nook */}
      <section className="nook-header">
        <div className="nook-title-area">
          <span className="nook-subtitle">ต้อนรับกลับสู่มุมโปรด</span>
          <h1 className="nook-title">Your Reading Nook</h1>
          <p className="nook-desc">
            พักผ่อนกับเรื่องราวที่คุณชื่นชอบ หรือสร้างสรรค์โลกใบใหม่ไปพร้อมกับ AI
          </p>
          <div className="nook-actions">
            <button className="btn-hero-primary" onClick={onOpenCreateModal}>
              ✨ เริ่มสร้างเรื่องใหม่
            </button>
            <button className="btn-hero-secondary" onClick={onGoToDiscover}>
              🔍 สำรวจคลังนิยาย
            </button>
          </div>
        </div>

        {/* User Stats Counter */}
        <div className="nook-stats font-serif">
          <div className="stat-item">
            <span className="stat-number">24</span>
            <span className="stat-label">เรื่องที่อ่านแล้ว</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">7</span>
            <span className="stat-label">กำลังอ่านค้าง</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">3</span>
            <span className="stat-label">แต่งสำเร็จ</span>
          </div>
        </div>
      </section>

      {/* Section 1: Continue Reading */}
      {continueReadingList.length > 0 && (
        <section className="story-section">
          <div className="section-header">
            <h2>📖 อ่านต่อจากที่ค้างไว้ (Continue Reading)</h2>
          </div>
          <div className="story-grid">
            {continueReadingList.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onClick={onSelectStory}
                showProgress
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Trending on CozyTales */}
      <section className="story-section">
        <div className="section-header">
          <h2>🔥 กำลังเป็นที่นิยม (Trending on CozyTales)</h2>
        </div>
        <div className="story-grid">
          {trendingList.map((story) => (
            <StoryCard key={story.id} story={story} onClick={onSelectStory} />
          ))}
        </div>
      </section>

      {/* Section 3: Your Favourites */}
      {favoriteList.length > 0 && (
        <section className="story-section">
          <div className="section-header">
            <h2>⭐ เรื่องโปรดของคุณ (Your Favourites)</h2>
          </div>
          <div className="story-grid">
            {favoriteList.map((story) => (
              <StoryCard key={story.id} story={story} onClick={onSelectStory} />
            ))}
          </div>
        </section>
      )}

      {/* Quote Banner */}
      <div className="quote-banner">
        <p className="quote-text">
          "A reader lives a thousand lives before he dies. The man who never reads lives only one."
        </p>
        <span className="quote-author">— George R.R. Martin</span>
      </div>
    </div>
  );
};