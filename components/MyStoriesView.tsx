'use client';

import React from 'react';
import { Story } from '../types/story';

interface MyStoriesViewProps {
  myStories: Story[];
  onSelectStory: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const MyStoriesView: React.FC<MyStoriesViewProps> = ({
  myStories,
  onSelectStory,
  onOpenCreateModal,
}) => {
  const totalWords = myStories.reduce((acc, curr) => acc + curr.wordCount, 0);

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  return (
    <div className="view-container">
      <div className="mystories-header">
        <div>
          <span className="nook-subtitle">ผลงานของคุณ</span>
          <h1 className="nook-title">My Stories</h1>
        </div>

        {/* ปุ่มสร้างเรื่องใหม่ตัวบน */}
        <button 
          type="button" 
          className="btn-hero-primary" 
          onClick={handleCreateClick}
          style={{ cursor: 'pointer', zIndex: 10, position: 'relative' }}
        >
          + สร้างเรื่องใหม่
        </button>
      </div>

      {/* Author Dashboard Stats */}
      <div className="author-stats-banner font-serif">
        <div className="stat-box">
          <span className="stat-val">{totalWords.toLocaleString()}</span>
          <span className="stat-lbl">คำที่แต่งทั้งหมด</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">{myStories.length}</span>
          <span className="stat-lbl">เรื่องราวที่สร้าง</span>
        </div>
        <div className="stat-box">
          <span className="stat-val">3</span>
          <span className="stat-lbl">เรื่องที่แต่งจบแล้ว</span>
        </div>
      </div>

      {/* List of Created Stories */}
      <div className="my-stories-list">
        {myStories.map((story) => (
          <div key={story.id} className="my-story-item" onClick={() => onSelectStory(story.id)}>
            <img src={story.coverUrl} alt={story.title} className="my-story-cover" />
            <div className="my-story-details">
              <div className="my-story-top">
                <h3>{story.title}</h3>
                <span className="genre-tag">{story.genre}</span>
              </div>
              <p className="my-story-premise">{story.corePremise}</p>
              <div className="my-story-meta">
                <span>{story.totalChapters} บท</span>
                <span>•</span>
                <span>แต่งเมื่อ {story.chapters[0]?.createdAt || 'ไม่นานมานี้'}</span>
              </div>
            </div>
            <div className="my-story-action">
              <button type="button" className="btn-continue">แต่งต่อ ›</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};