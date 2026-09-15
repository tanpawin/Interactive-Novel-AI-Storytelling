'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Story } from '../types/story';
import '../styles/story-card.css';

interface StoryCardProps {
  story: Story;
  onClick: (storyId: string) => void;
  onFavoriteChange?: (
    storyId: string,
    isFavorite: boolean
  ) => void;
  showProgress?: boolean;
  branchFrom?: 'home' | 'discover';
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  onFavoriteChange,
  showProgress = false,
  branchFrom = 'home',
}) => {
  const router = useRouter();

  const [isFavorite, setIsFavorite] =
    useState(Boolean(story.isFavorite));

  const [isSavingFavorite, setIsSavingFavorite] =
    useState(false);

  const handleFavorite = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (isSavingFavorite) return;

    const newFavoriteState = !isFavorite;

    setIsFavorite(newFavoriteState);

    onFavoriteChange?.(
      story.id,
      newFavoriteState
    );

    setIsSavingFavorite(true);

    try {
      const response = await fetch(
        newFavoriteState
          ? '/api/favorites'
          : `/api/favorites?storyId=${encodeURIComponent(
              story.id
            )}`,
        {
          method: newFavoriteState
            ? 'POST'
            : 'DELETE',

          ...(newFavoriteState
            ? {
                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  storyId: story.id,
                }),
              }
            : {}),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'Favorite request failed'
        );
      }
    } catch (error) {
      console.error(
        'Favorite Error:',
        error
      );

      setIsFavorite(!newFavoriteState);

      onFavoriteChange?.(
        story.id,
        !newFavoriteState
      );

      alert(
        'ไม่สามารถบันทึกเรื่องโปรดได้'
      );
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleViewBranches = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    router.push(
      `/story/${story.id}/branches?from=${branchFrom}`
    );
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

        <button
          type="button"
          className={`favorite-button ${
            isFavorite
              ? 'favorite-active'
              : ''
          }`}
          onClick={handleFavorite}
          disabled={isSavingFavorite}
          aria-label={
            isFavorite
              ? 'นำออกจากเรื่องโปรด'
              : 'เพิ่มในเรื่องโปรด'
          }
        >
          {isFavorite ? '★' : '☆'}
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
                  width: `${
                    (story.currentChapter /
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

        <button
          type="button"
          className="view-branches-button"
          onClick={handleViewBranches}
        >
          <span>ดูเส้นเรื่อง</span>
          <span className="view-branches-arrow">
            →
          </span>
        </button>
      </div>
    </div>
  );
};