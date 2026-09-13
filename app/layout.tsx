'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

// 🎨 Import สไตล์ CSS ทั้งหมดของแอปพลิเคชัน
import '@/styles/globals.css';
import '@/styles/navbar.css';
import '@/styles/views.css';
import '@/styles/reader.css';
import '@/styles/story-create.css';
import '@/styles/story-modal.css';

import { Navbar } from '@/components/Navbar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="th">
        <body>
          <Navbar />

          {/* Render เนื้อหาของแต่ละ Route ตาม URL */}
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}