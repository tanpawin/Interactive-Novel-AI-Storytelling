'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { StoryCard } from '@/components/StoryCard';
import { supabase } from '@/lib/supabaseClient';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

import '@/styles/favorites.css';

export default function FavoritesPage() {
  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      setIsLoading(true);

      try {
        const favoriteResponse =
          await fetch('/api/favorites');

        const favoriteData =
          await favoriteResponse.json();

        if (!favoriteData.success) {
          setStories([]);
          return;
        }

        const favoriteStoryIds: string[] =
          favoriteData.favoriteStoryIds || [];

        if (favoriteStoryIds.length === 0) {
          setStories([]);
          return;
        }

        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .in('id', favoriteStoryIds)
          .order('created_at', {
            ascending: false,
          });

        if (storyError) {
          console.error(
            'Favorite Stories Error:',
            storyError
          );
          return;
        }

        if (!storyData || storyData.length === 0) {
          setStories([]);
          return;
        }

        const storyIds = storyData.map(
          (story) => story.id
        );

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
            'Favorite Chapters Error:',
            chapterError
          );
          return;
        }

        const chapters = chapterData || [];

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

              isFavorite: true,

              isTrending: false,
              isFresh: false,

              chapters:
                storyChapters,
            };
          });

        setStories(mappedStories);
      } catch (error) {
        console.error(
          'Favorites Load Error:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  const handleFavoriteChange = (
    storyId: string,
    isFavorite: boolean
  ) => {
    if (!isFavorite) {
      setStories((currentStories) =>
        currentStories.filter(
          (story) => story.id !== storyId
        )
      );
    }
  };

  if (isLoading) {
    return (
      <main className="favorites-page">
        <div className="favorites-container">
          <div className="favorites-loading">
            กำลังโหลดเรื่องโปรด...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="favorites-page">
      <div className="favorites-container">

        {/* Back to Profile */}
        <button
          type="button"
          className="profile-branches-back"
          onClick={() =>
            router.push('/profile')
          }
        >
          ‹ กลับสู่โปรไฟล์
        </button>

        {/* Header */}
        <header className="favorites-header">
          <div className="favorites-heading">
            <span className="favorites-eyebrow">
              เรื่องราวที่คุณเลือกเก็บไว้
            </span>

            <h1>เรื่องโปรด</h1>

            <p>
              รวมเรื่องที่คุณบันทึกไว้
              สำหรับกลับมาอ่านต่อเมื่อไหร่ก็ได้
            </p>
          </div>

          <div className="favorites-count">
            <strong>{stories.length}</strong>
            <span>เรื่องที่บันทึกไว้</span>
          </div>
        </header>

        {/* Divider */}
        <div className="favorites-divider" />

        {stories.length === 0 ? (
          <section className="favorites-empty">
            <div className="favorites-empty-line" />

            <span className="favorites-empty-label">
              YOUR LIBRARY
            </span>

            <h2>
              ยังไม่มีเรื่องโปรด
            </h2>

            <p>
              เมื่อคุณพบเรื่องที่ชอบ
              กดดาวเพื่อบันทึกไว้ที่นี่
            </p>

            <button
              type="button"
              onClick={() =>
                router.push('/discover')
              }
            >
              ไปสำรวจนิยาย
            </button>
          </section>
        ) : (
          <section className="favorites-list-section">
            <div className="favorites-list-header">
              <div>
                <h2>เรื่องโปรดของคุณ</h2>

                <p>
                  เรื่องที่คุณเลือกเก็บไว้สำหรับอ่าน
                </p>
              </div>

              <button
                type="button"
                className="favorites-discover-button"
                onClick={() =>
                  router.push('/discover')
                }
              >
                ค้นหาเรื่องอื่น
              </button>
            </div>

            <div className="favorites-story-grid">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onClick={(id) =>
                    router.push(`/story/${id}`)
                  }
                  onFavoriteChange={
                    handleFavoriteChange
                  }
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}