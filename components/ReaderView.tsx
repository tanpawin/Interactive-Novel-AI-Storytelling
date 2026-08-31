'use client';

import React, { useState } from 'react';
import { Story, Chapter } from '@/types/story';
import '@/styles/reader.css';

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

  const handleGenerateNextChapter = async () => {
    if (!userPrompt.trim() || isGeneratingNext) return;

    setIsGeneratingNext(true);

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'next_chapter',
          storyTitle: story.title,
          genre: story.genre,
          tone: story.tone,
          previousChapters: story.chapters,
          userChoice: userPrompt,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const nextChapterNum = story.chapters.length + 1;
        const newChapter: Chapter = {
          id: `c_${Date.now()}`,
          chapterNumber: nextChapterNum,
          title: `บทที่ ${nextChapterNum}`,
          content: data.content,
          userPromptChoice: userPrompt,
          createdAt: new Date().toISOString().split('T')[0],
        };

        const updatedStory: Story = {
          ...story,
          currentChapter: nextChapterNum,
          totalChapters: Math.max(story.totalChapters, nextChapterNum),
          wordCount: story.wordCount + (data.content?.length || 0),
          chapters: [...story.chapters, newChapter],
        };

        onUpdateStory(updatedStory);
        setUserPrompt('');

        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      } else {
        alert('เกิดข้อผิดพลาดจาก AI: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อกับระบบ AI ได้');
    } finally {
      setIsGeneratingNext(false);
    }
  };

  return (
    <div className={`reader-wrapper font-size-${fontSize}`}>
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

        {isGeneratingNext && (
          <div className="ai-generating-card">
            <div className="pulse-icon">✨</div>
            <p>Gemini AI กำลังเขียนเนื้อเรื่องบทต่อไปตามการตัดสินใจของคุณ...</p>
          </div>
        )}
      </main>

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