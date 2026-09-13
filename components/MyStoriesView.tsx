'use client';

import React from 'react';
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
  const totalWords = myStories.reduce(
    (acc, curr) => acc + curr.wordCount,
    0
  );

  // ==========================================
  // CREATE
  // ไปหน้า /story/create
  // ==========================================
  const handleCreateClick = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onCreateStory();
  };

  // ==========================================
  // EDIT
  // เปิด Edit Modal
  // ==========================================
  const handleEditClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onEditStory(story);
  };

  // ==========================================
  // DELETE
  // เปิด Delete Modal
  // ==========================================
  const handleDeleteClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    story: Story
  ) => {
    e.preventDefault();
    e.stopPropagation();

    onDeleteStory(story.id);
  };

  // ==========================================
  // CONTINUE
  // เข้าอ่านนิยายเฉพาะปุ่มนี้
  // ==========================================
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
        </div>

        <button
          type="button"
          className="btn-hero-primary"
          onClick={handleCreateClick}
          style={{
            cursor: 'pointer',
            zIndex: 10,
            position: 'relative',
          }}
        >
          + สร้างเรื่องใหม่
        </button>
      </div>


      {/* ======================================
          AUTHOR DASHBOARD STATS
      ======================================= */}
      <div className="author-stats-banner font-serif">

        <div className="stat-box">
          <span className="stat-val">
            {totalWords.toLocaleString()}
          </span>

          <span className="stat-lbl">
            คำที่แต่งทั้งหมด
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-val">
            {myStories.length}
          </span>

          <span className="stat-lbl">
            เรื่องราวที่สร้าง
          </span>
        </div>

        <div className="stat-box">
          <span className="stat-val">
            {
              myStories.filter(
                (story) =>
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

        {myStories.map((story) => (
          <div
            key={story.id}
            className="my-story-item"
          >

            {/* ==================================
                COVER
            ================================== */}
            {story.coverUrl ? (
              <img
                src={story.coverUrl}
                alt={story.title}
                className="my-story-cover"
              />
            ) : (
              <div className="my-story-cover" />
            )}


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
                {story.corePremise}
              </p>


              <div className="my-story-meta">

                <span>
                  {story.totalChapters} บท
                </span>

                <span>
                  •
                </span>

                <span>
                  แต่งเมื่อ{' '}

                  {story.chapters[0]?.createdAt
                    ? new Date(
                        story.chapters[0].createdAt
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

                {/* ==================================
                    แต่งต่อ
                    เป็นปุ่มเดียวที่เข้าอ่านนิยาย
                ================================== */}
                <button
                  type="button"
                  className="story-action-btn story-action-continue"
                  onClick={(e) =>
                    handleContinueClick(
                      e,
                      story
                    )
                  }
                >
                  <span>▶</span>
                  แต่งต่อ
                </button>


                {/* ==================================
                    แก้ไข
                ================================== */}
                <button
                  type="button"
                  className="story-action-btn story-action-edit"
                  onClick={(e) =>
                    handleEditClick(
                      e,
                      story
                    )
                  }
                >
                  <span>✎</span>
                  แก้ไข
                </button>


                {/* ==================================
                    ลบ
                ================================== */}
                <button
                  type="button"
                  className="story-action-btn story-action-delete"
                  onClick={(e) =>
                    handleDeleteClick(
                      e,
                      story
                    )
                  }
                >
                  <span>⌫</span>
                  ลบ
                </button>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};