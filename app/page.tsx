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

  useEffect(() => {
    if (!isLoaded) return;

    const loadStories = async () => {
      setIsLoading(true);

      try {
        /*
         * ถ้ายังไม่ได้ Login
         */
        if (!user) {
          setStories([]);
          return;
        }

        /*
         * ========================================
         * 1. โหลดนิยายทั้งหมด
         * ========================================
         */

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
            'Supabase Story Error:',
            storyError
          );

          setStories([]);
          return;
        }

        if (!storyData || storyData.length === 0) {
          setStories([]);
          return;
        }

        /*
         * ========================================
         * 2. เตรียม Story IDs
         * ========================================
         */

        const storyIds = storyData.map(
          (story) => story.id
        );

        /*
         * ========================================
         * 3. โหลด Chapters
         * ========================================
         */

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

          setStories([]);
          return;
        }

        const chapters = chapterData || [];

        /*
         * ========================================
         * 4. โหลด Game Sessions
         *
         * ใช้สำหรับดูว่า User คนนี้
         * อ่านเรื่องไหนไปถึงบทไหนแล้ว
         * ========================================
         */

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase
          .from('game_sessions')
          .select(
            'story_id, current_chapter, status'
          )
          .eq('user_id', user.id);

        if (sessionError) {
          console.error(
            'Supabase Session Error:',
            sessionError
          );
        }

        const sessions = sessionData || [];

        /*
         * ========================================
         * 5. โหลด Favorite ของ User
         * ========================================
         */

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
          console.error(
            'Load Favorites Error:',
            error
          );
        }

        /*
         * ========================================
         * 6. โหลดชื่อผู้เขียนทุกเรื่อง
         * ========================================
         */

        let creatorMap: Record<
          string,
          string
        > = {};

        try {
          const creatorResponse =
            await fetch('/api/stories/creators');

          const creatorData =
            await creatorResponse.json();

          if (creatorData.success) {
            creatorMap =
              creatorData.creators || {};
          }
        } catch (error) {
          console.error(
            'Load Creators Error:',
            error
          );
        }

        /*
         * ========================================
         * 7. Map Supabase → Story
         * ========================================
         */

        const mappedStories: Story[] =
          storyData.map((story) => {
            /*
             * Chapters ของเรื่องนี้
             */
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

            /*
             * Session ของ User คนปัจจุบัน
             */
            const userSession =
              sessions.find(
                (session) =>
                  session.story_id === story.id
              );

            /*
             * Progress ของ User
             *
             * ถ้ายังไม่เคยเล่น = 0
             */
            const currentChapter =
              userSession?.current_chapter || 0;

            /*
             * จำนวนตัวอักษร
             */
            const wordCount =
              storyChapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.content.length,
                0
              );

            /*
             * นิยายใหม่ภายใน 7 วัน
             */
            const isFresh =
              Date.now() -
                new Date(
                  story.created_at
                ).getTime() <
              7 * 24 * 60 * 60 * 1000;

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

              /*
               * ชื่อผู้เขียนจริงจาก profiles
               */
              author:
                creatorMap[story.id] ||
                'ไม่ระบุชื่อ',

              totalChapters:
                story.total_chapters,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              /*
               * Favorite ของ User คนปัจจุบัน
               */
              isFavorite:
                favoriteStoryIds.includes(
                  story.id
                ),

              /*
               * เรื่องใหม่
               */
              isFresh,

              /*
               * ยังไม่มีระบบ Trending จริง
               */
              isTrending: false,
            };
          });

        setStories(mappedStories);
      } catch (error) {
        console.error(
          'Load stories error:',
          error
        );

        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [user, isLoaded]);

  /*
   * ========================================
   * Favorite
   * ========================================
   */

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

  /*
   * ========================================
   * Loading
   * ========================================
   */

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลดนิยาย...</p>
      </div>
    );
  }

  /*
   * ========================================
   * Render
   * ========================================
   */

  return (
    <LibraryView
      stories={stories}

      onSelectStory={(storyId) =>
        router.push(
          `/story/${storyId}`
        )
      }

      onOpenCreateModal={() => {
        sessionStorage.removeItem(
          'cozytales_create_story_draft'
        );

        router.push('/story/create');
      }}

      onGoToDiscover={() => {
        router.push('/discover');
      }}

      onFavoriteChange={
        handleFavoriteChange
      }
    />
  );
}