'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyStoriesView } from '@/components/MyStoriesView';
import { INITIAL_STORIES } from '@/data/mockStories';

export default function MyStoriesPage() {
  const [stories] = useState(INITIAL_STORIES);
  const router = useRouter();

  return (
    <MyStoriesView
      myStories={stories.filter((s) => s.author === 'โดย คุณ')}
      onSelectStory={(id) => router.push(`/story/${id}`)}
      onOpenCreateModal={() => {}}
    />
  );
}