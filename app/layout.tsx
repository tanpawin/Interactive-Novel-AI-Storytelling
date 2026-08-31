'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClerkProvider } from '@clerk/nextjs';

// 🎨 Import สไตล์ CSS ทั้งหมดของแอปพลิเคชัน
import '@/styles/globals.css';
import '@/styles/navbar.css';
import '@/styles/views.css';
import '@/styles/reader.css';

import { Navbar } from '@/components/Navbar';
import { CreateStoryModal } from '@/components/CreateStoryModal';
import { CreateStoryFormData } from '@/types/story';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleCreateStory = async (formData: CreateStoryFormData) => {
    setIsModalOpen(false);
    router.push(
      `/story/new?title=${encodeURIComponent(formData.title)}&genre=${encodeURIComponent(
        formData.genre
      )}&tone=${encodeURIComponent(formData.tone)}&premise=${encodeURIComponent(
        formData.corePremise
      )}`
    );
  };

  return (
    <ClerkProvider>
      <html lang="th">
        <body>
          <Navbar onOpenCreateModal={() => setIsModalOpen(true)} />
          
          {/* Render เนื้อหาของแต่ละ Route ตาม URL */}
          <main>{children}</main>

          <CreateStoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleCreateStory}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}