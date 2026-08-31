'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LibraryView } from '@/components/LibraryView';
import { CreateStoryModal } from '@/components/CreateStoryModal';
import { INITIAL_STORIES } from '@/data/mockStories';
import { CreateStoryFormData, Story } from '@/types/story';

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // ฟังก์ชันสร้างนิยายเรื่องใหม่เมื่อกด Submit จาก Modal
  const handleCreateStory = (formData: CreateStoryFormData, initialContent: string) => {
    const newId = `story_${Date.now()}`;
    const newStory: Story = {
      id: newId,
      title: formData.title || 'นิยายเรื่องใหม่',
      author: 'คุณ (ผู้เขียนร่วมกับ AI)',
      genre: formData.genre,
      tone: formData.tone,
      corePremise: formData.corePremise,
      currentChapter: 1,
      totalChapters: 1,
      wordCount: initialContent.length,
      chapters: [
        {
          id: `c_${Date.now()}`,
          chapterNumber: 1,
          title: 'บทที่ 1: จุดเริ่มต้น',
          content: initialContent,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ],
    };

    // 1. เพิ่มนิยายใหม่ลงใน State
    setStories((prev) => [newStory, ...prev]);
    setIsModalOpen(false);

    // 2. นำทางไปยังหน้ารายละเอียดนิยายบทแรกที่สร้างขึ้น
    router.push(`/story/${newId}`);
  };

  return (
    <>
      <LibraryView
        stories={stories}
        onSelectStory={(id) => router.push(`/story/${id}`)}
        onOpenCreateModal={() => setIsModalOpen(true)}
        onGoToDiscover={() => router.push('/discover')}
      />

      <CreateStoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateStory}
      />
    </>
  );
}