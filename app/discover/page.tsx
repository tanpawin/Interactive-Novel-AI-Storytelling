'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import { DiscoverView } from '@/components/DiscoverView';
import { supabase } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

export default function DiscoverPage() {
  const router = useRouter();

  // ==========================================
  // CLERK
  // ==========================================

  const { isLoaded } = useUser();

  // ==========================================
  // STATE
  // ==========================================

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // LOAD STORIES
  // ==========================================

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);

      try {
        // ==========================================
        // LOAD FAVORITES
        // ==========================================

        let favoriteStoryIds: string[] = [];

        try {
          const favoriteResponse =
            await fetch('/api/favorites');

          const favoriteData =
            await favoriteResponse.json();

          if (favoriteData.success) {
            favoriteStoryIds =
              favoriteData.favoriteStoryIds || [];
          }
        } catch (error) {
          /*
           * ถ้ายังไม่ได้ Login
           * หรือ API Favorites ใช้งานไม่ได้
           * ก็ไม่ทำให้หน้า Discover พัง
           */
          console.error(
            'Load Favorites Error:',
            error
          );
        }

        // ==========================================
        // LOAD ALL STORIES
        // ==========================================

        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .order('created_at', {
            ascending: false,
          });

        if (storyError) {
          console.error(
            'Discover Stories Error:',
            storyError
          );

          return;
        }

        // ==========================================
        // NO STORIES
        // ==========================================

        if (
          !storyData ||
          storyData.length === 0
        ) {
          setStories([]);
          return;
        }

        // ==========================================
        // GET STORY IDS
        // ==========================================

        const storyIds = storyData.map(
          (story) => story.id
        );

        // ==========================================
        // LOAD CHAPTERS
        // ==========================================

        const {
          data: chapterData,
          error: chapterError,
        } = await supabase
          .from('chapters')
          .select('*')
          .in('story_id', storyIds)
          .order('chapter_number', {
            ascending: true,
          });

        if (chapterError) {
          console.error(
            'Discover Chapters Error:',
            chapterError
          );

          return;
        }

        const chapters = chapterData || [];

        // ==========================================
        // MAP DATABASE → STORY TYPE
        // ==========================================

        const mappedStories: Story[] =
          storyData.map((story) => {
            // --------------------------------------
            // Chapters ของ Story นี้
            // --------------------------------------

            const storyChapters: Chapter[] =
              chapters
                .filter(
                  (chapter) =>
                    chapter.story_id === story.id
                )
                .map((chapter) => ({
                  id: chapter.id,

                  chapterNumber:
                    chapter.chapter_number,

                  title:
                    chapter.title ||
                    `บทที่ ${chapter.chapter_number}`,

                  content:
                    chapter.content || '',

                  createdAt:
                    chapter.created_at,
                }));

            // --------------------------------------
            // Current Chapter
            // --------------------------------------

            const currentChapter =
              storyChapters.length > 0
                ? storyChapters[
                    storyChapters.length - 1
                  ].chapterNumber
                : 0;

            // --------------------------------------
            // Word Count
            // --------------------------------------

            const wordCount =
              storyChapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.content.length,
                0
              );

            // --------------------------------------
            // Fresh Story
            // --------------------------------------

            const isFresh =
              Date.now() -
                new Date(
                  story.created_at
                ).getTime() <
              7 * 24 * 60 * 60 * 1000;

            // --------------------------------------
            // Return Story
            // --------------------------------------

            return {
              id: story.id,

              title:
                story.title ||
                'นิยายไม่มีชื่อ',

              corePremise:
                story.synopsis || '',

              genre:
                (story.genre ||
                  'แฟนตาซี') as Genre,

              tone:
                (story.tone ||
                  'มืดมนและสมจริง') as NarrativeTone,

              length:
                story.total_chapters <= 5
                  ? 'เรื่องสั้น'
                  : story.total_chapters <= 15
                    ? 'นวนิยายขนาดกลาง'
                    : 'นวนิยายยาว',

              protagonist: '',

              worldSetting: '',

              // ------------------------------------
              // Cover
              // ------------------------------------

              coverUrl:
                story.cover_image_url || '',

              // ------------------------------------
              // Author
              // ------------------------------------

              author: 'นักเขียน',

              // ------------------------------------
              // Chapters
              // ------------------------------------

              totalChapters:
                story.total_chapters || 0,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              // ------------------------------------
              // Favorite
              // ------------------------------------

              isFavorite:
                favoriteStoryIds.includes(
                  story.id
                ),

              // ------------------------------------
              // Status
              // ------------------------------------

              isFresh,

              isTrending: false,
            };
          });

        // ==========================================
        // SET STORIES
        // ==========================================

        setStories(mappedStories);
      } catch (error) {
        console.error(
          'Discover Load Error:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <DiscoverView
      stories={stories}

      /*
       * สำคัญมาก
       *
       * ถ้า Clerk ยังไม่พร้อม
       * หรือ Supabase ยังโหลดข้อมูลอยู่
       * ให้ DiscoverView แสดง Skeleton
       *
       * Navbar จะยังแสดงตามปกติ
       */
      isLoading={!isLoaded || isLoading}

      onSelectStory={(id) =>
        router.push(`/story/${id}`)
      }
    />
  );
}