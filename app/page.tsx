'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useClerk,
  useSession,
  useUser,
} from '@clerk/nextjs';

import { useRouter } from 'next/navigation';

import '@/styles/story-login.css';

import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import { LibraryView } from '@/components/LibraryView';

export default function HomePage() {
  const { user, isLoaded } =
    useUser();

  const { session } =
    useSession();

  const { openSignIn } =
    useClerk();

  const router =
    useRouter();

  const supabase = useMemo(
    () =>
      createSupabaseClient(
        () =>
          session?.getToken() ??
          Promise.resolve(null)
      ),
    [session]
  );

  const [stories, setStories] =
    useState<Story[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * ========================================
   * Load Stories
   * ========================================
   */

  useEffect(() => {
    if (!isLoaded) return;

    /*
     * ถ้า Login แล้ว แต่ Session
     * ยังไม่พร้อม ให้รอก่อน
     */
    if (user && !session) {
      return;
    }

    const loadStories =
      async () => {
        setIsLoading(true);

        try {
          /*
           * ========================================
           * 1. โหลดนิยายทั้งหมด
           *
           * Guest = 8 เรื่อง
           * Login = 100 เรื่อง
           * ========================================
           */

          const {
            data: storyData,
            error: storyError,
          } =
            await supabase
              .from('stories')
              .select('*')
              .order(
                'created_at',
                {
                  ascending: false,
                }
              )
              .limit(
                user
                  ? 100
                  : 8
              );

          if (storyError) {
            console.error(
              'Supabase Story Error:',
              storyError
            );

            setStories([]);
            return;
          }

          if (
            !storyData ||
            storyData.length === 0
          ) {
            setStories([]);
            return;
          }

          /*
           * ========================================
           * 2. เตรียม Story IDs
           * ========================================
           */

          const storyIds =
            storyData.map(
              (story) =>
                story.id
            );

          /*
           * ========================================
           * 3. โหลด Chapters
           * ========================================
           */

          const {
            data: chapterData,
            error: chapterError,
          } =
            await supabase
              .from('chapters')
              .select('*')
              .in(
                'story_id',
                storyIds
              )
              .order(
                'chapter_number',
                {
                  ascending: true,
                }
              );

          if (chapterError) {
            console.error(
              'Supabase Chapter Error:',
              chapterError
            );

            setStories([]);
            return;
          }

          const chapters =
            chapterData || [];

          /*
           * ========================================
           * 4. ค่าเริ่มต้น
           * ========================================
           */

          let sessions: {
            story_id: string;
            current_chapter: number;
            status: string;
          }[] = [];

          let favoriteStoryIds: string[] =
            [];

          let creatorMap: Record<
            string,
            string
          > = {};

          /*
           * ========================================
           * 5. โหลดข้อมูลของ User
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
            } =
              await supabase
                .from(
                  'game_sessions'
                )
                .select(
                  'story_id, current_chapter, status'
                )
                .eq(
                  'user_id',
                  user.id
                );

            if (sessionError) {
              console.error(
                'Supabase Session Error:',
                sessionError
              );
            }

            sessions =
              sessionData || [];

            /*
             * ------------------------------
             * Favorites
             * ------------------------------
             */

            try {
              const favoriteResponse =
                await fetch(
                  '/api/favorites',
                  {
                    cache:
                      'no-store',
                  }
                );

              const favoriteData =
                await favoriteResponse.json();

              if (
                favoriteResponse.ok &&
                favoriteData.success
              ) {
                favoriteStoryIds =
                  favoriteData.favoriteStoryIds ||
                  [];
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
                  '/api/stories/creators',
                  {
                    cache:
                      'no-store',
                  }
                );

              const creatorData =
                await creatorResponse.json();

              if (
                creatorResponse.ok &&
                creatorData.success
              ) {
                creatorMap =
                  creatorData.creators ||
                  {};
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
            storyData.map(
              (story) => {
                /*
                 * Chapters ของเรื่องนี้
                 */

                const storyChapters: Chapter[] =
                  chapters
                    .filter(
                      (chapter) =>
                        chapter.story_id ===
                        story.id
                    )
                    .map(
                      (chapter) => ({
                        id:
                          chapter.id,

                        chapterNumber:
                          chapter.chapter_number,

                        title:
                          chapter.title ||
                          `บทที่ ${chapter.chapter_number}`,

                        content:
                          chapter.content ||
                          '',

                        createdAt:
                          chapter.created_at,
                      })
                    );

                /*
                 * Session ของ User
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
                 * Progress
                 */

                const currentChapter =
                  userSession?.current_chapter ||
                  0;

                /*
                 * จำนวนตัวอักษร
                 */

                const wordCount =
                  storyChapters.reduce(
                    (
                      total,
                      chapter
                    ) =>
                      total +
                      chapter.content
                        .length,
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
                  7 *
                    24 *
                    60 *
                    60 *
                    1000;

                return {
                  id:
                    story.id,

                  title:
                    story.title ||
                    'นิยายไม่มีชื่อ',

                  corePremise:
                    story.synopsis ||
                    '',

                  genre:
                    (story.genre ||
                      'แฟนตาซี') as Genre,

                  tone:
                    (story.tone ||
                      'มืดมนและสมจริง') as NarrativeTone,

                  length:
                    story.total_chapters <=
                    5
                      ? 'เรื่องสั้น'
                      : story.total_chapters <=
                          15
                        ? 'นวนิยายขนาดกลาง'
                        : 'นวนิยายยาว',

                  protagonist:
                    '',

                  worldSetting:
                    '',

                  coverUrl:
                    story.cover_image_url ||
                    '',

                  author:
                    creatorMap[
                      story.id
                    ] ||
                    'ไม่ระบุชื่อ',

                  totalChapters:
                    story.total_chapters ||
                    0,

                  currentChapter,

                  wordCount,

                  chapters:
                    storyChapters,

                  isFavorite:
                    user
                      ? favoriteStoryIds.includes(
                          story.id
                        )
                      : false,

                  isFresh,

                  isTrending:
                    false,
                };
              }
            );

          setStories(
            mappedStories
          );
        } catch (error) {
          console.error(
            'Load stories error:',
            error
          );

          setStories([]);
        } finally {
          setIsLoading(
            false
          );
        }
      };

    loadStories();
  }, [
    user,
    isLoaded,
    session,
    supabase,
  ]);

  /*
   * ========================================
   * Favorite
   * ========================================
   */

  const handleFavoriteChange = (
    storyId: string,
    isFavorite: boolean
  ) => {
    setStories(
      (prevStories) =>
        prevStories.map(
          (story) =>
            story.id ===
            storyId
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
   * Select Story
   *
   * Guest → Clerk Sign In
   * Login → Story
   * ========================================
   */

  const handleSelectStory = (
    storyId: string
  ) => {
    if (!user) {
      openSignIn({
        fallbackRedirectUrl:
          `/story/${storyId}`,
      });

      return;
    }

    router.push(
      `/story/${storyId}`
    );
  };

  /*
   * ========================================
   * Create Story
   *
   * Guest → Clerk Sign In
   * Login → Create Story
   * ========================================
   */

  const handleCreateStory =
    () => {
      if (!user) {
        openSignIn({
          fallbackRedirectUrl:
            '/story/create',
        });

        return;
      }

      sessionStorage.removeItem(
        'cozytales_create_story_draft'
      );

      router.push(
        '/story/create'
      );
    };

  /*
   * ========================================
   * Render
   * ========================================
   */

  return (
    <LibraryView
      stories={stories}

      isLoading={
        !isLoaded ||
        isLoading
      }

      isGuest={
        !user
      }

      onSelectStory={
        handleSelectStory
      }

      onOpenCreateModal={
        handleCreateStory
      }

      onGoToDiscover={() => {
        router.push(
          '/discover'
        );
      }}

      onFavoriteChange={
        handleFavoriteChange
      }
    />
  );
}