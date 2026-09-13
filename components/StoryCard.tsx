'use client';

import React from 'react';
import { Story } from '../types/story';
import { supabase } from '../lib/supabaseClient';
import '../styles/story-card.css';

interface StoryCardProps {
  story: Story;
  onClick: (storyId: string) => void;
  onFavoriteChange?: (
    storyId: string,
    isFavorite: boolean
  ) => void;
  showProgress?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  onFavoriteChange,
  showProgress = false,
}) => {
  const handleFavorite = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    const newFavoriteState = !story.isFavorite;

    // เปลี่ยนหน้าเว็บทันที
    onFavoriteChange?.(
      story.id,
      newFavoriteState
    );

    const { error } = await supabase
      .from('stories')
      .update({
        is_favorite: newFavoriteState,
      })
      .eq('id', story.id);

    // ถ้าบันทึกไม่สำเร็จ ให้ย้อนกลับ
    if (error) {
      console.error(
        'Favorite Error:',
        error
      );

      onFavoriteChange?.(
        story.id,
        !newFavoriteState
      );

      alert('ไม่สามารถบันทึกเรื่องโปรดได้');
    }
};

return (
  <div
    className="story-card"
    onClick={() => onClick(story.id)}
  >
    <div className="card-cover-wrapper">
      {story.coverUrl ? (
        <img
          src={story.coverUrl}
          alt={story.title}
          className="card-cover-img"
        />
      ) : (
        <div className="card-cover-img card-cover-placeholder">
          <span>📖</span>
        </div>
      )}

      <span className="genre-badge">
        {story.genre}
      </span>

      {/* Favorite */}
      <button
        type="button"
        className={`favorite-button ${story.isFavorite
            ? 'favorite-active'
            : ''
          }`}
        onClick={handleFavorite}
        aria-label={
          story.isFavorite
            ? 'นำออกจากเรื่องโปรด'
            : 'เพิ่มในเรื่องโปรด'
        }
      >
        {story.isFavorite ? '★' : '☆'}
      </button>
    </div>

    <div className="card-info">
      <h3 className="card-title">
        {story.title}
      </h3>

      <p className="card-author">
        {story.author}
      </p>

      {showProgress ? (
        <div className="card-progress">
          <div className="progress-text">
            <span>
              บทที่ {story.currentChapter} จาก{' '}
              {story.totalChapters}
            </span>
          </div>

          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${(story.currentChapter /
                    story.totalChapters) *
                  100
                  }%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card-stats">
          <span>
            {story.totalChapters} บท
          </span>

          <span>•</span>

          <span>
            {story.wordCount.toLocaleString()} คำ
          </span>
        </div>
      )}
    </div>
  </div>
);
};