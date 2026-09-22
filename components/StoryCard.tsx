'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

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

  /*
   * ========================================
   * Favorite
   * ========================================
   */

  const [isFavorite, setIsFavorite] =
    useState(Boolean(story.isFavorite));

  const [isSavingFavorite, setIsSavingFavorite] =
    useState(false);


  /*
   * ========================================
   * Cover Loading
   * ========================================
   */

  const [isCoverLoaded, setIsCoverLoaded] =
    useState(false);

  const [coverError, setCoverError] =
    useState(false);

  /*
   * เก็บ reference ของ <img>
   *
   * ใช้ตรวจว่ารูปถูก Browser Cache
   * และโหลดเสร็จไปแล้วหรือยัง
   */
  const coverImageRef =
    useRef<HTMLImageElement | null>(null);


  /*
   * ========================================
   * Reset / Check Cover
   * ========================================
   *
   * เมื่อเปลี่ยน Story หรือเปลี่ยนรูปปก
   *
   * เราจะ:
   * 1. reset loading state
   * 2. ตรวจว่ารูปโหลดอยู่ใน cache แล้วหรือยัง
   *
   * ป้องกันปัญหา:
   *
   * ไปหน้าอื่น
   * ↓
   * กลับมา
   * ↓
   * รูปค้างเบลอ
   */

  useEffect(() => {
    setIsCoverLoaded(false);
    setCoverError(false);

    const checkImageLoaded = () => {
      const image =
        coverImageRef.current;

      /*
       * complete = Browser โหลดรูปเสร็จแล้ว
       *
       * naturalWidth > 0
       * = รูปโหลดสำเร็จจริง
       */
      if (
        image &&
        image.complete &&
        image.naturalWidth > 0
      ) {
        setIsCoverLoaded(true);
      }
    };

    /*
     * รอให้ <img> ถูกสร้างใน DOM ก่อน
     */
    const frame =
      requestAnimationFrame(
        checkImageLoaded
      );

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [story.coverUrl]);


  /*
   * ========================================
   * Favorite
   * ========================================
   */

  const handleFavorite = async (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    if (isSavingFavorite) return;

    const newFavoriteState =
      !isFavorite;

    /*
     * Optimistic UI
     */

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

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
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

      /*
       * Rollback
       */

      setIsFavorite(
        !newFavoriteState
      );

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


  /*
   * ========================================
   * Branch
   * ========================================
   */

  const handleViewBranches = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();

    router.push(
      `/story/${story.id}/branches?from=${branchFrom}`
    );
  };


  /*
   * ========================================
   * Render
   * ========================================
   */

  return (
    <div
      className="story-card"
      onClick={() =>
        onClick(story.id)
      }
    >

      {/* =================================
          Cover
      ================================= */}

      <div className="card-cover-wrapper">

        {/* =================================
            Cover Image
        ================================= */}

        {story.coverUrl &&
        !coverError ? (

          <img
            ref={coverImageRef}
            src={story.coverUrl}
            alt={story.title}

            className={`card-cover-img ${
              isCoverLoaded
                ? 'card-cover-loaded'
                : 'card-cover-loading'
            }`}

            /*
             * กรณีรูปโหลดใหม่จริง ๆ
             */
            onLoad={() => {
              setIsCoverLoaded(true);
            }}

            /*
             * กรณีรูปเสีย / URL ใช้ไม่ได้
             */
            onError={() => {
              setCoverError(true);
            }}
          />

        ) : (

          /* =================================
             Cover Placeholder
          ================================= */

          <div
            className="
              card-cover-img
              card-cover-placeholder
            "
          >
            <span>📖</span>
          </div>

        )}


        {/* =================================
            Genre Badge
        ================================= */}

        <span className="genre-badge">
          {story.genre}
        </span>


        {/* =================================
            Favorite Button
        ================================= */}

        <button
          type="button"
          className={`favorite-button ${
            isFavorite
              ? 'favorite-active'
              : ''
          }`}
          onClick={
            handleFavorite
          }
          disabled={
            isSavingFavorite
          }
          aria-label={
            isFavorite
              ? 'นำออกจากเรื่องโปรด'
              : 'เพิ่มในเรื่องโปรด'
          }
        >
          {isFavorite
            ? '★'
            : '☆'}
        </button>

      </div>


      {/* =================================
          Story Info
      ================================= */}

      <div className="card-info">

        {/* Title */}

        <h3 className="card-title">
          {story.title}
        </h3>


        {/* Author */}

        <p className="card-author">
          {story.author}
        </p>


        {/* =================================
            Progress / Stats
        ================================= */}

        {showProgress ? (

          <div className="card-progress">

            <div className="progress-text">

              <span>
                บทที่{' '}
                {story.currentChapter}{' '}
                จาก{' '}
                {story.totalChapters}
              </span>

            </div>


            <div className="progress-bar-bg">

              <div
                className="progress-bar-fill"
                style={{
                  width: `${
                    story.totalChapters > 0
                      ? Math.min(
                          100,
                          (
                            story.currentChapter /
                            story.totalChapters
                          ) * 100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

        ) : (

          <div className="card-stats">

            <span>
              {story.totalChapters}{' '}
              บท
            </span>

            <span>
              •
            </span>

            <span>
              {story.wordCount.toLocaleString()}{' '}
              คำ
            </span>

          </div>

        )}


        {/* =================================
            Branch Button
        ================================= */}

        <button
          type="button"
          className="view-branches-button"
          onClick={
            handleViewBranches
          }
        >

          <span>
            ดูเส้นเรื่อง
          </span>

          <span className="view-branches-arrow">
            →
          </span>

        </button>

      </div>

    </div>
  );
};