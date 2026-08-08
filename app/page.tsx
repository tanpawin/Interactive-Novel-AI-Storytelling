'use client';

import React, { useState } from 'react';
import { INITIAL_STORIES } from '../data/mockStories';
import { Story, CreateStoryFormData } from '../types/story';
import { Navbar } from '../components/Navbar';
import { LibraryView } from '../components/LibraryView';
import { DiscoverView } from '../components/DiscoverView';
import { MyStoriesView } from '../components/MyStoriesView';
import { CreateStoryModal } from '../components/CreateStoryModal';
import { ReaderView } from '../components/ReaderView';

import '../styles/views.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'library' | 'discover' | 'my-stories'>('library');
  const [stories, setStories] = useState<Story[]>(INITIAL_STORIES);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ฟังก์ชันสร้างนิยายเรื่องใหม่จาก Form Modal
  const handleCreateStory = (formData: CreateStoryFormData) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      title: formData.title || 'การผจญภัยครั้งใหม่',
      corePremise: formData.corePremise,
      genre: formData.genre,
      tone: formData.tone,
      length: formData.length,
      protagonist: formData.protagonist,
      worldSetting: formData.worldSetting,
      coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600',
      author: 'โดย คุณ',
      totalChapters: 1,
      currentChapter: 1,
      wordCount: 850,
      chapters: [
        {
          id: `c_init_${Date.now()}`,
          chapterNumber: 1,
          title: 'บทที่ 1: จุดเริ่มต้นการเดินทาง',
          content: `ยินดีต้อนรับสู่เรื่องราวของ "${formData.title || 'การผจญภัยครั้งใหม่'}" โลกใบนี้จัดอยู่ในหมวด ${formData.genre} มีบรรยากาศ ${formData.tone} \n\n${formData.protagonist ? `ตัวละครหลักคือ ${formData.protagonist} ` : ''}${formData.worldSetting ? `ฉากหลังตั้งอยู่ใน ${formData.worldSetting} ` : ''}\n\nเรื่องราวเริ่มต้นขึ้นอย่างเงียบสงบ จนกระทั่งความขัดแย้งหลักตามพล็อตของคุณได้ปะทุขึ้น...`,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ],
    };

    setStories([newStory, ...stories]);
    setIsCreateModalOpen(false);
    setSelectedStoryId(newStory.id); // พาเข้าสู่หน้าอ่านทันทีตาม Flow
  };

  const handleUpdateStory = (updatedStory: Story) => {
    setStories(stories.map((s) => (s.id === updatedStory.id ? updatedStory : s)));
  };

  const currentSelectedStory = stories.find((s) => s.id === selectedStoryId);

  // หากผู้ใช้อยู่ในโหมดอ่านนิยาย ให้แสดง ReaderView
  if (selectedStoryId && currentSelectedStory) {
    return (
      <ReaderView
        story={currentSelectedStory}
        onBack={() => setSelectedStoryId(null)}
        onUpdateStory={handleUpdateStory}
      />
    );
  }

  // แสดงหน้าหลักเว็บแอป (Header + Tab Active View + Create Modal)
  return (
    <div>
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      <main>
        {activeTab === 'library' && (
          <LibraryView
            stories={stories}
            onSelectStory={(id) => setSelectedStoryId(id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverView
            stories={stories}
            onSelectStory={(id) => setSelectedStoryId(id)}
          />
        )}

        {activeTab === 'my-stories' && (
          <MyStoriesView
            myStories={stories.filter((s) => s.author === 'โดย คุณ')}
            onSelectStory={(id) => setSelectedStoryId(id)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}
      </main>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStory}
      />
    </div>
  );
}