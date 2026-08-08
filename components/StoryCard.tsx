'use client';

import React from 'react';
import { Story } from '../types/story';
import '../styles/story-card.css';

interface StoryCardProps {
  story: Story;
  onClick: (storyId: string) => void;
  showProgress?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  showProgress = false,
}) => {
  return (
    <div className="story-card" onClick={() => onClick(story.id)}>
      <div className="card-cover-wrapper">
        <img src={story.coverUrl} alt={story.title} className="card-cover-img" />
        <span className="genre-badge">{story.genre}</span>
      </div>

      <div className="card-info">
        <h3 className="card-title">{story.title}</h3>
        <p className="card-author">{story.author}</p>
        
        {showProgress ? (
          <div className="card-progress">
            <div className="progress-text">
              <span>บทที่ {story.currentChapter} จาก {story.totalChapters}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className="progress-bar-fill"
                style={{ width: `${(story.currentChapter / story.totalChapters) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="card-stats">
            <span>{story.totalChapters} บท</span>
            <span>•</span>
            <span>{story.wordCount.toLocaleString()} คำ</span>
          </div>
        )}
      </div>
    </div>
  );
};