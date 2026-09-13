'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import { supabase } from '@/lib/supabaseClient';

import { MyStoriesView } from '@/components/MyStoriesView';
import { EditStoryModal } from '@/components/EditStoryModal';
import { DeleteStoryModal } from '@/components/DeleteStoryModal';

import type {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

export default function MyStoriesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Modal
  const [editingStory, setEditingStory] =
    useState<Story | null>(null);

  // Delete Modal
  const [deletingStory, setDeletingStory] =
    useState<Story | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // ==========================================
  // LOAD MY STORIES
  // ==========================================
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
        // โหลดเฉพาะนิยายของ User ที่ Login อยู่
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
            'My Stories Error:',
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

        // โหลด Chapter ของนิยายเหล่านั้น
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
            'My Stories Chapter Error:',
            chapterError
          );
          return;
        }

        const chapters = chapterData || [];

        // แปลงข้อมูล Supabase → Story type
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
                user.fullName ||
                'ไม่ระบุชื่อ',

              totalChapters:
                story.total_chapters,

              currentChapter,

              wordCount,

              chapters:
                storyChapters,

              isFavorite:
                story.is_favorite ?? false,

              isFresh:
                Date.now() -
                  new Date(
                    story.created_at
                  ).getTime() <
                7 * 24 * 60 * 60 * 1000,

              isTrending: false,
            };
          });

        setStories(mappedStories);
      } catch (error) {
        console.error(
          'Load My Stories Error:',
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [user, isLoaded]);

  // ==========================================
  // CREATE NEW STORY
  // ==========================================
  const handleCreateStory = () => {
    /*
     * ล้าง Draft ของนิยายเรื่องเก่า
     * เพื่อให้หน้า Create Story เริ่มเรื่องใหม่
     * โดยไม่มีชื่อเรื่อง / ข้อมูล / รูปปกเก่าค้างอยู่
     */
    sessionStorage.removeItem(
      'cozytales_create_story_draft'
    );

    router.push('/story/create');
  };

  // ==========================================
  // EDIT STORY
  // ==========================================
  const handleEditStory = (story: Story) => {
    setEditingStory(story);
  };

  // ==========================================
  // EDIT SAVED
  // ==========================================
  const handleStorySaved = (
    updatedStory: Story
  ) => {
    setStories((prevStories) =>
      prevStories.map((story) =>
        story.id === updatedStory.id
          ? {
              ...story,
              title:
                updatedStory.title,
              corePremise:
                updatedStory.corePremise,
              genre:
                updatedStory.genre,
              tone:
                updatedStory.tone,
              coverUrl:
                updatedStory.coverUrl,
            }
          : story
      )
    );

    setEditingStory(null);
  };

  // ==========================================
  // DELETE STORY
  // ==========================================
  const handleDeleteStory = (id: string) => {
    const story = stories.find(
      (item) => item.id === id
    );

    if (!story) return;

    setDeletingStory(story);
  };

  // ==========================================
  // CONFIRM DELETE
  // ==========================================
  const handleConfirmDelete = async () => {
    if (!deletingStory) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/stories/${deletingStory.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            'ไม่สามารถลบนิยายได้'
        );
      }

      // เอานิยายที่ถูกลบออกจากหน้าจอทันที
      setStories((prevStories) =>
        prevStories.filter(
          (story) =>
            story.id !== deletingStory.id
        )
      );

      setDeletingStory(null);
    } catch (error) {
      console.error(
        'Delete Story Error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถลบนิยายได้'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>กำลังโหลดนิยาย...</p>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <MyStoriesView
        myStories={stories}
        onSelectStory={(id) =>
          router.push(`/story/${id}`)
        }
        onCreateStory={handleCreateStory}
        onEditStory={handleEditStory}
        onDeleteStory={handleDeleteStory}
      />

      {/* EDIT */}
      <EditStoryModal
        isOpen={editingStory !== null}
        story={editingStory}
        onClose={() =>
          setEditingStory(null)
        }
        onSaved={handleStorySaved}
      />

      {/* DELETE */}
      <DeleteStoryModal
        isOpen={deletingStory !== null}
        story={deletingStory}
        isDeleting={isDeleting}
        onClose={() =>
          setDeletingStory(null)
        }
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}