'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ReaderView } from '@/components/ReaderView';
import { INITIAL_STORIES } from '@/data/mockStories';
import { Story } from '@/types/story';

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);

  useEffect(() => {
    const found = INITIAL_STORIES.find((s) => s.id === resolvedParams.id);
    if (found) setStory(found);
  }, [resolvedParams.id]);

  if (!story) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลดเนื้อเรื่อง...</div>;
  }

  return (
    <ReaderView
      story={story}
      onBack={() => router.back()}
      onUpdateStory={(updated) => setStory(updated)}
    />
  );
}