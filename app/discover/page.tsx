'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DiscoverView } from '@/components/DiscoverView';
import { INITIAL_STORIES } from '@/data/mockStories';

export default function DiscoverPage() {
  const [stories] = useState(INITIAL_STORIES);
  const router = useRouter();

  return (
    <DiscoverView
      stories={stories}
      onSelectStory={(id) => router.push(`/story/${id}`)}
    />
  );
}