'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import { LibraryView } from '@/components/LibraryView';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // =========================
  // Load stories from Supabase
  // =========================

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const loadStories = async () => {
      setIsLoading(true);

      try {
        // =========================
        // 1. ดึงนิยายของ User
        // =========================

        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          });

        if (storyError) {
          console.error(
            'Supabase Story Error:',
            storyError
          );
          return;
        }

        if (!storyData || storyData.length === 0) {
          setStories([]);
          return;
        }

        // =========================
        // 2. เตรียม Story IDs
        // =========================

        const storyIds = storyData.map(
          (story) => story.id
        );

        // =========================
        // 3. ดึง Chapters
        // =========================

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
            'Supabase Chapter Error:',
            chapterError
          );
          return;
        }

        const chapters = chapterData || [];

        // =========================
        // 4. Map Supabase → Story
        // =========================

        const mappedStories: Story[] =
          storyData.map((story) => {
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

                  content: chapter.content,

                  createdAt:
                    chapter.created_at,
                }));

            // =========================
            // บทล่าสุด
            // =========================

            const currentChapter =
              storyChapters.length > 0
                ? storyChapters[
                    storyChapters.length - 1
                  ].chapterNumber
                : 0;

            // =========================
            // จำนวนตัวอักษร
            // =========================

            const wordCount =
              storyChapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.content.length,
                0
              );

            // =========================
            // Story Object
            // =========================

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

              coverUrl:
                story.cover_image_url || '',

              author:
                user.fullName ||
                'ไม่ระบุชื่อ',

              totalChapters:
                story.total_chapters,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              // =========================
              // Favorite
              // =========================

              isFavorite:
                story.is_favorite ?? false,

              // =========================
              // Fresh
              // =========================

              isFresh:
                Date.now() -
                  new Date(
                    story.created_at
                  ).getTime() <
                7 * 24 * 60 * 60 * 1000,

              // =========================
              // Trending
              // =========================

              isTrending: false,
            };
          });

        setStories(mappedStories);
      } catch (error) {
        console.error(
          'Load stories error:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [user, isLoaded]);

  // =========================
  // Favorite
  // =========================

  const handleFavoriteChange = (
    storyId: string,
    isFavorite: boolean
  ) => {
    setStories((prevStories) =>
      prevStories.map((story) =>
        story.id === storyId
          ? {
              ...story,
              isFavorite,
            }
          : story
      )
    );
  };

  // =========================
  // Loading
  // =========================

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลดนิยาย...</p>
      </div>
    );
  }

  // =========================
  // Render
  // =========================

  return (
    <>
      <LibraryView
        stories={stories}

        onSelectStory={(storyId) =>
          router.push(
            `/story/${storyId}`
          )
        }

        // =========================
        // สร้างนิยาย
        // ล้าง Draft เก่าก่อน
        // ไปหน้า /story/create
        // =========================
        onOpenCreateModal={() => {
          sessionStorage.removeItem(
            'cozytales_create_story_draft'
          );

          router.push('/story/create');
        }}

        onGoToDiscover={() => {
          // Discover ยังไม่ได้ทำ
        }}

        onFavoriteChange={
          handleFavoriteChange
        }
      />
    </>
  );
}