'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyStoriesView } from '@/components/MyStoriesView';
import { INITIAL_STORIES } from '@/data/mockStories';
import { CreateStoryModal } from '@/components/CreateStoryModal'; 
import { Story } from '@/types/story';

export default function MyStoriesPage() {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const handleCreateStorySubmit = (formData: any, initialContent: string) => {
    const newStoryId = `story-${Date.now()}`;

    const newStory: Story = {
      id: newStoryId,
      title: formData.title || 'นิยายไร้ชื่อ',
      author: 'โดย คุณ',
      genre: formData.genre,
      corePremise: formData.corePremise,
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      totalChapters: 1,
      wordCount: initialContent.length,
      chapters: [
        {
          id: `ch-1-${Date.now()}`,
          chapterNumber: 1, // เพิ่ม chapterNumber
          title: 'บทที่ 1',
          content: initialContent,
          wordCount: initialContent.length, // เพิ่ม wordCount สำหรับบทนี้
          createdAt: 'เมื่อสักครู่นี้',
        },
      ],
    };

    setStories((prevStories) => [newStory, ...prevStories]);
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <MyStoriesView
        myStories={stories.filter((s) => s.author === 'โดย คุณ')}
        onSelectStory={(id) => router.push(`/story/${id}`)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {isCreateModalOpen && (
        <CreateStoryModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSubmit={handleCreateStorySubmit}
        />
      )}
    </>
  );
}