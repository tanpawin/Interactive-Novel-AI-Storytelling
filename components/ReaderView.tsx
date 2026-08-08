'use client';

import React, { useState } from 'react';
import { Story, Chapter } from '../types/story';
import '../styles/reader.css';

interface ReaderViewProps {
  story: Story;
  onBack: () => void;
  onUpdateStory: (updatedStory: Story) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  story,
  onBack,
  onUpdateStory,
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // ฟังก์ชันจำลองการส่งการกระทำของตัวละครให้ AI แต่งบทต่อไป
  const handleGenerateNextChapter = () => {
    if (!userPrompt.trim() || isGeneratingNext) return;

    setIsGeneratingNext(true);

    setTimeout(() => {
      const nextChapterNum = story.chapters.length + 1;
      const newChapter: Chapter = {
        id: `c_${Date.now()}`,
        chapterNumber: nextChapterNum,
        title: `บทที่ ${nextChapterNum}: จุดเปลี่ยนของโชคชะตา`,
        content: `หลังจากที่คุณตัดสินใจ "${userPrompt}" บรรยากาศรอบตัวก็เริ่มเปลี่ยนแปลงไป เสียงลมก้องกังวานลึกลับลอยมาตามสายลม เงาร่างปริศนาที่ซ่อนอยู่ในเงามืดค่อยๆ ก้าวออกมา เส้นทางที่คุณเลือกได้เปิดประตูสู่เหตุการณ์ที่ไม่คาดคิด...`,
        userPromptChoice: userPrompt,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const updatedStory: Story = {
        ...story,
        currentChapter: nextChapterNum,
        totalChapters: Math.max(story.totalChapters, nextChapterNum),
        wordCount: story.wordCount + 450,
        chapters: [...story.chapters, newChapter],
      };

      onUpdateStory(updatedStory);
      setUserPrompt('');
      setIsGeneratingNext(false);

      // เลื่อนหน้าจอลงไปยังบทใหม่
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 2500);
  };

  return (
    <div className={`reader-wrapper font-size-${fontSize}`}>
      {/* Reader Top Bar */}
      <header className="reader-header">
        <button className="btn-back" onClick={onBack}>
          ‹ กลับสู่หน้าหลัก
        </button>
        <div className="reader-header-title">
          <h2>{story.title}</h2>
          <span>{story.author}</span>
        </div>
        <div className="font-size-controls">
          <button onClick={() => setFontSize('sm')} className={fontSize === 'sm' ? 'active' : ''}>A-</button>
          <button onClick={() => setFontSize('md')} className={fontSize === 'md' ? 'active' : ''}>A</button>
          <button onClick={() => setFontSize('lg')} className={fontSize === 'lg' ? 'active' : ''}>A+</button>
        </div>
      </header>

      {/* Chapter Content Area */}
      <main className="reader-content">
        <div className="story-meta-banner">
          <span className="badge">{story.genre}</span>
          <span className="badge">{story.tone}</span>
          <p className="premise font-serif">"{story.corePremise}"</p>
        </div>

        {story.chapters.length === 0 ? (
          <div className="chapter-block">
            <h3>เริ่มต้นการเดินทาง</h3>
            <p className="chapter-text font-serif">
              เรื่องราวกำลังจะเริ่มต้นขึ้น พิมพ์การกระทำแรกของตัวละครเพื่อเปิดฉากเรื่องนี้...
            </p>
          </div>
        ) : (
          story.chapters.map((chap) => (
            <article key={chap.id} className="chapter-block">
              {chap.userPromptChoice && (
                <div className="user-choice-badge">
                  🎯 การตัดสินใจของคุณ: <span>"{chap.userPromptChoice}"</span>
                </div>
              )}
              <h3 className="chapter-title">{chap.title}</h3>
              <div className="chapter-text font-serif">
                {chap.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))
        )}

        {/* AI Loading State */}
        {isGeneratingNext && (
          <div className="ai-generating-card">
            <div className="pulse-icon">✨</div>
            <p>AI กำลังเขียนเนื้อเรื่องบทต่อไปตามการตัดสินใจของคุณ...</p>
          </div>
        )}
      </main>

      {/* Bottom Sticky Interactive Prompt Box (Core Reading Loop) */}
      <div className="reader-interactive-bar">
        <div className="interactive-container">
          <label htmlFor="user-action">คุณต้องการให้ตัวละครทำอย่างไรต่อไป?</label>
          <div className="input-group">
            <input
              id="user-action"
              type="text"
              placeholder="เช่น เดินเข้าไปสำรวจประตูไม้เก่า, เดินหนีไปทางทิศตะวันตก..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateNextChapter()}
              disabled={isGeneratingNext}
            />
            <button
              className="btn-next-chapter"
              onClick={handleGenerateNextChapter}
              disabled={!userPrompt.trim() || isGeneratingNext}
            >
              {isGeneratingNext ? 'กำลังแต่ง...' : 'ส่งการตัดสินใจ (Next Chapter) ›'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};