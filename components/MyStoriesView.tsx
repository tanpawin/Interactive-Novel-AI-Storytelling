'use client';

import React, { useState } from 'react';

import { Story } from '../types/story';

interface MyStoriesViewProps {
  myStories: Story[];

  onSelectStory: (id: string) => void;

  onCreateStory: () => void;

  onEditStory: (story: Story) => void;

  onDeleteStory: (id: string) => void;
}


export const MyStoriesView: React.FC<
  MyStoriesViewProps
> = ({
  myStories,
  onSelectStory,
  onCreateStory,
  onEditStory,
  onDeleteStory,
}) => {

  /*
   * ==========================================
   * TOTAL WORDS
   * ==========================================
   */

  const totalWords = myStories.reduce(
    (acc, curr) =>
      acc + curr.wordCount,
    0
  );


  /*
   * ==========================================
   * CREATE
   * ==========================================
   */

  const handleCreateClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onCreateStory();
  };


  /*
   * ==========================================
   * EDIT
   * ==========================================
   */

  const handleEditClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onEditStory(story);
  };


  /*
   * ==========================================
   * DELETE
   * ==========================================
   */

  const handleDeleteClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onDeleteStory(story.id);
  };


  /*
   * ==========================================
   * CONTINUE
   * ==========================================
   */

  const handleContinueClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onSelectStory(story.id);
  };


  return (
    <div className="view-container">

      {/* ======================================
          HEADER
      ======================================= */}

      <div className="mystories-header">

        <div>

          <span className="nook-subtitle">
            ผลงานของคุณ
          </span>

          <h1 className="nook-title">
            My Stories
          </h1>

          <p className="mystories-description">
            จัดการนิยายที่คุณสร้าง
            และกลับมาแต่งต่อได้ทุกเมื่อ
          </p>

        </div>


        <button
          type="button"
          className="btn-hero-primary"
          onClick={handleCreateClick}
        >
          ✨ สร้างเรื่องใหม่
        </button>

      </div>


      {/* ======================================
          AUTHOR DASHBOARD STATS
      ======================================= */}

      <div className="author-stats-banner font-serif">

        {/* Total Words */}

        <div className="stat-box">

          <span className="stat-icon">
            ✍️
          </span>

          <span className="stat-val">
            {totalWords.toLocaleString()}
          </span>

          <span className="stat-lbl">
            คำที่แต่งทั้งหมด
          </span>

        </div>


        {/* Total Stories */}

        <div className="stat-box">

          <span className="stat-icon">
            📚
          </span>

          <span className="stat-val">
            {myStories.length}
          </span>

          <span className="stat-lbl">
            เรื่องราวที่สร้าง
          </span>

        </div>


        {/* Completed Stories */}

        <div className="stat-box">

          <span className="stat-icon">
            🏆
          </span>

          <span className="stat-val">
            {
              myStories.filter(
                (story) =>
                  story.totalChapters > 0 &&
                  story.currentChapter >=
                    story.totalChapters
              ).length
            }
          </span>

          <span className="stat-lbl">
            เรื่องที่แต่งจบแล้ว
          </span>

        </div>

      </div>


      {/* ======================================
          STORY LIST
      ======================================= */}

      <div className="my-stories-list">

        {myStories.length === 0 ? (

          /* ==================================
             EMPTY STATE
          ================================== */

          <div className="my-stories-empty">

            <div className="my-stories-empty-icon">
              📖
            </div>

            <h2>
              ยังไม่มีนิยายของคุณ
            </h2>

            <p>
              เริ่มต้นสร้างเรื่องราวแรก
              ของคุณได้เลย
            </p>

            <button
              type="button"
              className="btn-hero-primary"
              onClick={handleCreateClick}
            >
              ✨ สร้างนิยายเรื่องแรก
            </button>

          </div>

        ) : (

          myStories.map((story) => (
            <MyStoryItem
              key={story.id}
              story={story}
              onContinue={
                handleContinueClick
              }
              onEdit={
                handleEditClick
              }
              onDelete={
                handleDeleteClick
              }
            />
          ))

        )}

      </div>

    </div>
  );
};


/*
 * ==========================================
 * STORY ITEM
 * ==========================================
 */

interface MyStoryItemProps {
  story: Story;

  onContinue: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;

  onEdit: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;

  onDelete: (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => void;
}


const MyStoryItem: React.FC<
  MyStoryItemProps
> = ({
  story,
  onContinue,
  onEdit,
  onDelete,
}) => {

  const [isCoverLoaded, setIsCoverLoaded] =
    useState(false);

  const [coverError, setCoverError] =
    useState(false);


  return (
    <div className="my-story-item">

      {/* ==================================
          COVER
      ================================== */}

      <div className="my-story-cover-wrapper">

        {/* Skeleton */}

        {story.coverUrl &&
          !isCoverLoaded &&
          !coverError && (
            <div className="my-story-cover-skeleton">

              <div className="my-story-cover-shimmer" />

            </div>
          )}


        {/* Image */}

        {story.coverUrl &&
        !coverError ? (

          <img
            src={story.coverUrl}
            alt={story.title}
            className={`my-story-cover ${
              isCoverLoaded
                ? 'my-story-cover-loaded'
                : 'my-story-cover-loading'
            }`}
            onLoad={() => {
              setIsCoverLoaded(true);
            }}
            onError={() => {
              setCoverError(true);
            }}
          />

        ) : (

          /* Placeholder */

          <div className="my-story-cover my-story-cover-placeholder">

            <span>
              📖
            </span>

          </div>

        )}

      </div>


      {/* ==================================
          STORY DETAILS
      ================================== */}

      <div className="my-story-details">

        <div className="my-story-top">

          <h3>
            {story.title}
          </h3>

          <span className="genre-tag">
            {story.genre}
          </span>

        </div>


        <p className="my-story-premise">
          {story.corePremise ||
            'ยังไม่มีคำโปรยสำหรับนิยายเรื่องนี้'}
        </p>


        <div className="my-story-meta">

          <span>
            {story.totalChapters} บท
          </span>

          <span>
            •
          </span>

          <span>
            {story.wordCount.toLocaleString()} คำ
          </span>

          <span>
            •
          </span>

          <span>
            แต่งเมื่อ{' '}

            {story.chapters[0]?.createdAt
              ? new Date(
                  story.chapters[0]
                    .createdAt
                ).toLocaleDateString(
                  'th-TH',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                )
              : 'ไม่นานมานี้'}
          </span>

        </div>


        {/* Progress */}

        {story.totalChapters > 0 && (
          <div className="my-story-progress">

            <div className="my-story-progress-top">

              <span>
                ความคืบหน้า
              </span>

              <span>
                {Math.min(
                  Math.round(
                    (story.currentChapter /
                      story.totalChapters) *
                      100
                  ),
                  100
                )}
                %
              </span>

            </div>

            <div className="my-story-progress-bg">

              <div
                className="my-story-progress-fill"
                style={{
                  width: `${
                    Math.min(
                      (story.currentChapter /
                        story.totalChapters) *
                        100,
                      100
                    )
                  }%`,
                }}
              />

            </div>

          </div>
        )}

      </div>


      {/* ==================================
          ACTIONS
      ================================== */}

      <div
        className="my-story-action"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="story-card-actions">

          {/* Continue */}

          <button
            type="button"
            className="story-action-btn story-action-continue"
            onClick={(e) =>
              onContinue(e, story)
            }
          >
            <span>
              ▶
            </span>

            แต่งต่อ
          </button>


          {/* Edit */}

          <button
            type="button"
            className="story-action-btn story-action-edit"
            onClick={(e) =>
              onEdit(e, story)
            }
          >
            <span>
              ✎
            </span>

            แก้ไข
          </button>


          {/* Delete */}

          <button
            type="button"
            className="story-action-btn story-action-delete"
            onClick={(e) =>
              onDelete(e, story)
            }
          >
            <span>
              ⌫
            </span>

            ลบ
          </button>

        </div>

      </div>

    </div>
  );
};