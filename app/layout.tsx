'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter, Sarabun } from 'next/font/google';

import '@/styles/globals.css';
import '@/styles/navbar.css';
import '@/styles/library.css';
import '@/styles/discover.css';
import '@/styles/mystories.css';
import '@/styles/profile.css';
import '@/styles/reader.css';
import '@/styles/story-create.css';
import '@/styles/story-modal.css';
import '@/styles/admin.css';
import '@/styles/admin-dashboard.css';
import '@/styles/admin-stories.css';
import '@/styles/admin-users.css';
import '@/styles/admin-stories-loading.css';
import '@/styles/admin-user-detail.css';

import { Navbar } from '@/components/Navbar';

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  variable: '--font-sarabun',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="th">
        <body className={`${sarabun.variable} ${inter.variable}`}>
          <Navbar />

          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}