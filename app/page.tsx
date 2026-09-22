'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import '@/styles/story-login.css';

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


  /*
   * ========================================
   * Load Stories
   * ========================================
   */

  useEffect(() => {
    if (!isLoaded) return;

    const loadStories = async () => {
      setIsLoading(true);

      try {

        /*
         * ========================================
         * 1. โหลดนิยายทั้งหมด
         *
         * สำคัญ:
         * Guest ก็สามารถโหลด stories ได้
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
          })
          .limit(user ? 100 : 8);

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
         *
         * Guest ก็โหลดได้
         * เพื่อคำนวณจำนวนคำ / ข้อมูลการ์ด
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
        }

        const chapters = chapterData || [];


        /*
         * ========================================
         * 4. ค่าเริ่มต้นสำหรับ Guest
         * ========================================
         */

        let sessions: {
          story_id: string;
          current_chapter: number;
          status: string;
        }[] = [];

        let favoriteStoryIds: string[] = [];

        let creatorMap: Record<
          string,
          string
        > = {};


        /*
         * ========================================
         * 5. ถ้า Login แล้ว
         *
         * โหลดข้อมูลเฉพาะของ User
         * ========================================
         */

        if (user) {

          /*
           * ------------------------------
           * Game Sessions
           * ------------------------------
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

          sessions = sessionData || [];


          /*
           * ------------------------------
           * Favorites
           * ------------------------------
           */

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
           * ------------------------------
           * Creators
           * ------------------------------
           */

          try {
            const creatorResponse =
              await fetch(
                '/api/stories/creators'
              );

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
        }


        /*
         * ========================================
         * 6. Map Supabase → Story
         * ========================================
         */

        const mappedStories: Story[] =
          storyData.map((story) => {

            /*
             * ------------------------------
             * Chapters ของเรื่องนี้
             * ------------------------------
             */

            const storyChapters: Chapter[] =
              chapters
                .filter(
                  (chapter) =>
                    chapter.story_id ===
                    story.id
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


            /*
             * ------------------------------
             * Session ของ User
             *
             * Guest = ไม่มี Session
             * ------------------------------
             */

            const userSession =
              user
                ? sessions.find(
                    (session) =>
                      session.story_id ===
                      story.id
                  )
                : undefined;


            /*
             * ------------------------------
             * Progress
             * ------------------------------
             */

            const currentChapter =
              userSession?.current_chapter ||
              0;


            /*
             * ------------------------------
             * จำนวนคำ
             * ------------------------------
             */

            const wordCount =
              storyChapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.content.length,
                0
              );


            /*
             * ------------------------------
             * นิยายใหม่ภายใน 7 วัน
             * ------------------------------
             */

            const isFresh =
              Date.now() -
                new Date(
                  story.created_at
                ).getTime() <
              7 * 24 * 60 * 60 * 1000;


            /*
             * ------------------------------
             * Story Object
             * ------------------------------
             */

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

              /*
               * หน้าปก
               */

              coverUrl:
                story.cover_image_url || '',

              /*
               * ชื่อผู้เขียน
               *
               * Guest:
               * ถ้าไม่มี creatorMap จะใช้
               * "นักเขียน"
               */

              author:
                creatorMap[story.id] ||
                'นักเขียน',

              totalChapters:
                story.total_chapters || 0,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              /*
               * Favorite
               *
               * Guest = false
               */

              isFavorite:
                user
                  ? favoriteStoryIds.includes(
                      story.id
                    )
                  : false,

              /*
               * เรื่องใหม่
               */

              isFresh,

              /*
               * ยังไม่มี Trending จริง
               */

              isTrending: false,
            };
          });


        /*
         * ========================================
         * 7. บันทึก Stories
         * ========================================
         */

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
   * Render Library
   * ========================================
   */

  return (
    <LibraryView
      stories={stories}

      isLoading={isLoading}

      /*
       * สำคัญมาก
       *
       * Guest = true
       * Login = false
       */

      isGuest={!user}

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