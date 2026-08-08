'use client';

import React, { useState } from 'react';
import { Story, Genre } from '../types/story';
import { StoryCard } from './StoryCard';

interface DiscoverViewProps {
  stories: Story[];
  onSelectStory: (id: string) => void;
}

const CATEGORIES: ('ทั้งหมด' | Genre)[] = [
  'ทั้งหมด',
  'แฟนตาซี',
  'โรแมนติก',
  'สืบสวนสอบสวน',
  'ไซไฟ',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'ผจญภัย',
  'วรรณกรรม',
];

export const DiscoverView: React.FC<DiscoverViewProps> = ({ stories, onSelectStory }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStories = stories.filter((story) => {
    const matchesCategory =
      selectedCategory === 'ทั้งหมด' || story.genre === selectedCategory;
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.corePremise.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="view-container">
      {/* Title & Search Bar */}
      <div className="discover-header">
        <div>
          <span className="nook-subtitle">ค้นพบโลกใบใหม่</span>
          <h1 className="nook-title">Discover Stories</h1>
        </div>

        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="ค้นหาชื่อเรื่อง, พล็อตเรื่อง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-scroll">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Highlight Banners */}
      <div className="highlight-grid">
        <div className="highlight-card trending">
          <h3>🔥 Trending This Week</h3>
          <p>เรื่องยอดนิยมที่มีผู้อ่านสูงสุดในสัปดาห์นี้</p>
        </div>
        <div className="highlight-card editors">
          <h3>💡 Editor's Picks</h3>
          <p>คัดสรรโดยทีมงานและนักเขียนบท AI</p>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="story-grid" style={{ marginTop: '2rem' }}>
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} onClick={onSelectStory} />
        ))}
      </div>
    </div>
  );
};