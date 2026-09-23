'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useSession } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

import { DiscoverView } from '@/components/DiscoverView';
import { createSupabaseClient } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

export default function DiscoverPage() {
  const router = useRouter();

  const { session } =
    useSession();

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

  // ==========================================
  // LOAD STORIES
  // ==========================================
  useEffect(() => {
    if (!session) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    const loadStories =
      async () => {
        setIsLoading(true);

        try {
          // ==========================================
          // LOAD FAVORITES
          // ==========================================
          let favoriteStoryIds: string[] =
            [];

          try {
            const favoriteResponse =
              await fetch(
                '/api/favorites',
                {
                  cache: 'no-store',
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
            /*
             * Favorites โหลดไม่ได้
             * ไม่ควรทำให้ Discover พัง
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
            .order(
              'created_at',
              {
                ascending: false,
              }
            );

          if (storyError) {
            console.error(
              'Discover Stories Error:',
              storyError
            );

            setStories([]);
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
          const storyIds =
            storyData.map(
              (story) =>
                story.id
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
              'Discover Chapters Error:',
              chapterError
            );

            setStories([]);
            return;
          }

          const chapters =
            chapterData || [];

          // ==========================================
          // MAP DATABASE → STORY TYPE
          // ==========================================
          const mappedStories: Story[] =
            storyData.map(
              (story) => {
                // ==========================================
                // CHAPTERS
                // ==========================================
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

                // ==========================================
                // CURRENT CHAPTER
                // ==========================================
                const currentChapter =
                  storyChapters.length >
                  0
                    ? storyChapters[
                        storyChapters.length -
                          1
                      ]
                        .chapterNumber
                    : 0;

                // ==========================================
                // WORD COUNT
                // ==========================================
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

                // ==========================================
                // FRESH STORY
                // ==========================================
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

                // ==========================================
                // RETURN STORY
                // ==========================================
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
                    'นักเขียน',

                  totalChapters:
                    story.total_chapters ||
                    0,

                  currentChapter,

                  wordCount,

                  chapters:
                    storyChapters,

                  // ==========================================
                  // FAVORITE
                  // ==========================================
                  isFavorite:
                    favoriteStoryIds.includes(
                      story.id
                    ),

                  // ==========================================
                  // STATUS
                  // ==========================================
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
            'Discover Load Error:',
            error
          );

          setStories([]);
        } finally {
          setIsLoading(false);
        }
      };

    loadStories();
  }, [
    session,
    supabase,
  ]);

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <DiscoverView
      stories={stories}
      isLoading={isLoading}
      onSelectStory={(id) =>
        router.push(
          `/story/${id}`
        )
      }
    />
  );
}