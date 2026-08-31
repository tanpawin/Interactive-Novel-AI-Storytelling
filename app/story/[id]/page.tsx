'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { INITIAL_STORIES } from '@/data/mockStories';
import { ReaderView } from '@/components/ReaderView';
import { Story } from '@/types/story';

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const rawId = params?.id;
  const storyId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!storyId) return;

    try {
      const savedStoriesStr = localStorage.getItem('cozy_stories');
      const savedStories: Story[] = savedStoriesStr ? JSON.parse(savedStoriesStr) : [];
      const allStories = [...savedStories, ...INITIAL_STORIES];

      const foundStory = allStories.find((s) => String(s.id) === String(storyId));

      if (foundStory) {
        setStory((prev) => (prev && String(prev.id) === String(foundStory.id) ? prev : foundStory));
      }
    } catch (err) {
      console.error('Error loading story:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storyId]);

  const handleUpdateStory = (updatedStory: Story) => {
    setStory(updatedStory);
    try {
      const savedStoriesStr = localStorage.getItem('cozy_stories');
      let savedStories: Story[] = savedStoriesStr ? JSON.parse(savedStoriesStr) : [];
      
      const index = savedStories.findIndex((s) => String(s.id) === String(updatedStory.id));
      if (index !== -1) {
        savedStories[index] = updatedStory;
      } else {
        savedStories.unshift(updatedStory);
      }

      localStorage.setItem('cozy_stories', JSON.stringify(savedStories));
    } catch (err) {
      console.error('Error saving story:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">กำลังโหลดเนื้อหา...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold">ไม่พบเนื้อเรื่องที่คุณต้องการ</h2>
        <button
          className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800"
          onClick={() => router.push('/')}
        >
          ย้อนกลับหน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <ReaderView
      story={story}
      onBack={() => router.push('/')}
      onUpdateStory={handleUpdateStory}
    />
  );
}