'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);

      try {
        // โหลดนิยายที่เผยแพร่แล้ว
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

        if (!storyData || storyData.length === 0) {
          setStories([]);
          return;
        }

        // เอา ID ของนิยายทั้งหมด
        const storyIds = storyData.map(
          (story) => story.id
        );

        // โหลด chapters ของนิยายทั้งหมด
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

        // แปลงข้อมูลจาก Database ให้ตรงกับ Story type
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

            const currentChapter =
              storyChapters.length > 0
                ? storyChapters[
                  storyChapters.length - 1
                ].chapterNumber
                : 0;

            const wordCount =
              storyChapters.reduce(
                (total, chapter) =>
                  total +
                  chapter.content.length,
                0
              );

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

              author:
                'นักเขียน',

              totalChapters:
                story.total_chapters,

              currentChapter,

              wordCount,

              isFavorite: false,

              isFresh,

              isTrending: false,

              chapters:
                storyChapters,
            };
          });

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลดนิยาย...</p>
      </div>
    );
  }

  return (
    <DiscoverView
      stories={stories}
      onSelectStory={(id) =>
        router.push(`/story/${id}`)
      }
    />
  );
}