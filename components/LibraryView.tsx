'use client';

import React from 'react';
import { Story } from '../types/story';
import { StoryCard } from './StoryCard';
import LibrarySkeleton from './LibrarySkeleton';

interface LibraryViewProps {
  stories: Story[];

  isLoading?: boolean;

  // true = ยังไม่ได้ Login
  isGuest?: boolean;

  onSelectStory: (id: string) => void;

  onOpenCreateModal: () => void;

  onGoToDiscover: () => void;

  onFavoriteChange: (
    storyId: string,
    isFavorite: boolean
  ) => void;
}


/*
 * =========================================
 * Skeleton Card
 * =========================================
 */

const SkeletonCard = () => {
  return (
    <div className="story-card skeleton-story-card">

      <div className="card-cover-wrapper">

        <div className="card-cover-skeleton">
          <div className="card-cover-shimmer" />
        </div>

      </div>

      <div className="card-info">

        <div className="skeleton-line skeleton-title" />

        <div className="skeleton-line skeleton-author" />

        <div className="skeleton-line skeleton-stats" />

      </div>

    </div>
  );
};


/*
 * =========================================
 * Skeleton Grid
 * =========================================
 */

const SkeletonGrid = ({
  count = 6,
}: {
  count?: number;
}) => {
  return (
    <div className="story-grid">

      {Array.from(
        { length: count },
        (_, index) => (
          <SkeletonCard key={index} />
        )
      )}

    </div>
  );
};


/*
 * =========================================
 * Empty State
 * =========================================
 */

const EmptyStories = ({
  isGuest,
  onGoToDiscover,
}: {
  isGuest: boolean;
  onGoToDiscover: () => void;
}) => {
  return (
    <section className="story-section">

      <div
        style={{
          textAlign: 'center',
          padding: '70px 20px',
          background: '#fffdf9',
          border: '1px solid #eadfd3',
          borderRadius: '22px',
        }}
      >

        <div
          style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}
        >
          📚
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: 'Georgia, serif',
            color: '#4b3429',
          }}
        >
          {isGuest
            ? 'ยังไม่มีนิยายในระบบ'
            : 'ยังไม่มีเรื่องราวของคุณ'}
        </h2>

        <p
          style={{
            marginTop: '10px',
            color: '#8c776b',
          }}
        >
          {isGuest
            ? 'ลองกลับมาใหม่อีกครั้งเพื่อค้นพบเรื่องราวใหม่ ๆ'
            : 'เริ่มสร้างนิยายเรื่องแรกของคุณได้เลย'}
        </p>

        {isGuest && (
          <button
            type="button"
            className="btn-hero-secondary"
            onClick={onGoToDiscover}
            style={{
              marginTop: '20px',
            }}
          >
            🔍 สำรวจนิยาย
          </button>
        )}

      </div>

    </section>
  );
};


/*
 * =========================================
 * Library View
 * =========================================
 */

export const LibraryView: React.FC<
  LibraryViewProps
> = ({
  stories,
  isLoading = false,
  isGuest = false,

  onSelectStory,
  onOpenCreateModal,
  onGoToDiscover,
  onFavoriteChange,
}) => {

  /*
   * =========================================
   * กำลังอ่านต่อ
   * =========================================
   */

  const continueReadingList =
    stories.filter(
      (story) =>
        story.currentChapter > 0 &&
        story.currentChapter <
          story.totalChapters
    );


  /*
   * =========================================
   * นิยายโปรด
   * =========================================
   */

  const favoriteList =
    stories.filter(
      (story) => story.isFavorite
    );


  /*
   * =========================================
   * นิยายล่าสุด
   * =========================================
   */

  const discoverList =
    stories.slice(0, 6);


  /*
   * =========================================
   * Guest Stories
   *
   * ถ้ายังไม่ได้ Login
   * ให้แสดงนิยายที่มีอยู่ในระบบ
   * =========================================
   */

  const guestStoryList =
    stories.slice(0, 8);

if (isLoading) {
  return <LibrarySkeleton />;
}
  return (
    <div className="view-container">


      {/* =================================
          Hero Header
      ================================= */}

      <section className="nook-header">

        <div className="nook-title-area">

          <span className="nook-subtitle">
            {isGuest
              ? 'ยินดีต้อนรับสู่ GonnaTales'
              : 'ต้อนรับกลับสู่มุมโปรด'}
          </span>


          <h1 className="nook-title">
            {isGuest
              ? 'Discover Your Next Story'
              : 'Your Reading Nook'}
          </h1>


          <p className="nook-desc">
            {isGuest
              ? 'ค้นพบเรื่องราวจากนักเขียนใน GonnaTales และเริ่มต้นการเดินทางของคุณ'
              : 'พักผ่อนกับเรื่องราวที่คุณชื่นชอบ หรือสร้างสรรค์โลกใบใหม่ไปพร้อมกับ AI'}
          </p>


          <div className="nook-actions">

            {isGuest ? (

              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={onGoToDiscover}
                >
                  🔍 สำรวจนิยาย
                </button>

                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={onOpenCreateModal}
                >
                  ✨ เริ่มสร้างเรื่อง
                </button>
              </>

            ) : (

              <>
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={onOpenCreateModal}
                >
                  ✨ เริ่มสร้างเรื่องใหม่
                </button>


                <button
                  type="button"
                  className="btn-hero-secondary"
                  onClick={onGoToDiscover}
                >
                  🔍 สำรวจคลังนิยาย
                </button>
              </>

            )}

          </div>

        </div>

      </section>


      {/* =================================
          LOADING
      ================================= */}

      {isLoading ? (

        <>

          <section className="story-section">

            <div className="section-header">

              <h2>
                📚 กำลังโหลดนิยาย
              </h2>

            </div>

            <SkeletonGrid count={8} />

          </section>

        </>

      ) : isGuest ? (

        /*
         * =================================
         * GUEST
         * =================================
         */

        <>

          {guestStoryList.length > 0 ? (

            <section className="story-section">

              <div className="section-header">

                <div>

                  <span className="nook-subtitle">
                    Discover new worlds
                  </span>

                  <h2>
                    📚 นิยายจากนักเขียนใน GonnaTales
                  </h2>

                </div>


                <button
                  type="button"
                  className="section-link"
                  onClick={onGoToDiscover}
                >
                  ดูทั้งหมด →
                </button>

              </div>


              <div className="story-grid">

                {guestStoryList.map(
                  (story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={onSelectStory}
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />
                  )
                )}

              </div>

            </section>

          ) : (

            <EmptyStories
              isGuest={true}
              onGoToDiscover={
                onGoToDiscover
              }
            />

          )}

        </>

      ) : (

        /*
         * =================================
         * LOGGED IN
         * =================================
         */

        <>

          {/* =================================
              Continue Reading
          ================================= */}

          {continueReadingList.length > 0 && (

            <section className="story-section">

              <div className="section-header">

                <h2>
                  📖 อ่านต่อจากที่ค้างไว้
                </h2>

              </div>


              <div className="story-grid">

                {continueReadingList.map(
                  (story) => (

                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={
                        onSelectStory
                      }
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      showProgress
                      branchFrom="home"
                    />

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================
              Favorites
          ================================= */}

          {favoriteList.length > 0 && (

            <section className="story-section">

              <div className="section-header">

                <h2>
                  ⭐ เรื่องโปรดของคุณ
                </h2>

              </div>


              <div className="story-grid">

                {favoriteList.map(
                  (story) => (

                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={
                        onSelectStory
                      }
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================
              Discover
          ================================= */}

          {discoverList.length > 0 && (

            <section className="story-section">

              <div className="section-header discover-section-header">

                <h2>
                  ค้นพบเรื่องราวเพิ่มเติม
                </h2>


                <button
                  type="button"
                  className="section-link"
                  onClick={
                    onGoToDiscover
                  }
                >
                  ดูทั้งหมด →
                </button>

              </div>


              <div className="story-grid">

                {discoverList.map(
                  (story) => (

                    <StoryCard
                      key={story.id}
                      story={story}
                      onClick={
                        onSelectStory
                      }
                      onFavoriteChange={
                        onFavoriteChange
                      }
                      branchFrom="home"
                    />

                  )
                )}

              </div>

            </section>

          )}


          {/* =================================
              No Stories
          ================================= */}

          {stories.length === 0 && (

            <EmptyStories
              isGuest={false}
              onGoToDiscover={
                onGoToDiscover
              }
            />

          )}

        </>

      )}


      {/* =================================
          Quote
      ================================= */}

      {!isLoading && (
        <div className="quote-banner">

          <p className="quote-text">
            "A reader lives a thousand lives
            before he dies. The man who never
            reads lives only one."
          </p>

          <span className="quote-author">
            — George R.R. Martin
          </span>

        </div>
      )}

    </div>
  );
};