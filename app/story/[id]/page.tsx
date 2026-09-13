'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

import { supabase } from '@/lib/supabaseClient';
import { ReaderView } from '@/components/ReaderView';

import {
  Story,
  Chapter,
  Genre,
  NarrativeTone,
} from '@/types/story';

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const rawId = params?.id;

  const storyId = Array.isArray(rawId)
    ? rawId[0]
    : rawId;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!storyId) {
      console.error('Story ID is missing');
      setIsLoading(false);
      return;
    }

    const loadStory = async () => {
      try {
        // ==================================================
        // 1. โหลด Story
        // ==================================================

        const {
          data: storyData,
          error: storyError,
        } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
          .maybeSingle();

        if (storyError) {
          console.error(
            'Error loading story:',
            storyError
          );
          return;
        }

        if (!storyData) {
          console.error('Story not found');
          return;
        }

        // ==================================================
        // 2. โหลด Shared Chapters
        // ==================================================

        const {
          data: chapterData,
          error: chapterError,
        } = await supabase
          .from('chapters')
          .select(
            'id, story_id, chapter_number, title, content, created_at'
          )
          .eq('story_id', storyId)
          .order('chapter_number', {
            ascending: true,
          });

        if (chapterError) {
          console.error(
            'Error loading chapters:',
            chapterError
          );
          return;
        }

        const sharedChapters: Chapter[] = (
          chapterData || []
        ).map((chapter) => ({
          id: chapter.id,
          chapterNumber: chapter.chapter_number,
          title:
            chapter.title ||
            `บทที่ ${chapter.chapter_number}`,
          content: chapter.content,
          createdAt: chapter.created_at,
        }));

        // ==================================================
        // 3. หาบท Shared ล่าสุด
        // ==================================================

        const latestSharedChapter =
          sharedChapters.length > 0
            ? Math.max(
              ...sharedChapters.map(
                (chapter) => chapter.chapterNumber
              )
            )
            : 1;

        // ==================================================
        // 4. โหลด Game Session เดิม
        //
        // ห้ามใช้ upsert เพราะจะเขียน current_chapter
        // ทับค่าความคืบหน้าของ User เดิม
        // ==================================================

        const {
          data: existingSession,
          error: sessionError,
        } = await supabase
          .from('game_sessions')
          .select(
            'id, user_id, story_id, current_chapter, status, current_inventory'
          )
          .eq('user_id', user.id)
          .eq('story_id', storyId)
          .maybeSingle();

        if (sessionError) {
          console.error(
            'Error loading game session:',
            sessionError
          );
          return;
        }

        // ==================================================
        // 5. ถ้ายังไม่มี Session ค่อยสร้างใหม่
        //
        // ถ้ามีการเรียก loadStory ซ้อนกัน
        // INSERT อาจเจอ duplicate key (23505)
        // ในกรณีนั้นให้โหลด Session เดิมกลับมาใช้
        // ==================================================

        let currentSession = existingSession;

        if (!currentSession) {
          const {
            data: newSession,
            error: createSessionError,
          } = await supabase
            .from('game_sessions')
            .insert({
              user_id: user.id,
              story_id: storyId,
              current_chapter: latestSharedChapter,
              status: 'in_progress',
              current_inventory: [],
            })
            .select(
              'id, user_id, story_id, current_chapter, status, current_inventory'
            )
            .single();

          if (createSessionError) {
            // ================================================
            // ถ้า Session ถูกสร้างโดย request อื่นไปแล้ว
            // ให้โหลด Session เดิมกลับมาใช้
            // ================================================

            if (createSessionError.code === '23505') {
              console.log(
                'Session already exists, loading existing session...'
              );

              const {
                data: existingSessionAfterConflict,
                error: reloadSessionError,
              } = await supabase
                .from('game_sessions')
                .select(
                  'id, user_id, story_id, current_chapter, status, current_inventory'
                )
                .eq('user_id', user.id)
                .eq('story_id', storyId)
                .maybeSingle();

              if (reloadSessionError) {
                console.error(
                  'Error reloading existing game session:',
                  reloadSessionError
                );
                return;
              }

              if (!existingSessionAfterConflict) {
                console.error(
                  'Game session conflict occurred but existing session was not found'
                );
                return;
              }

              currentSession =
                existingSessionAfterConflict;

              console.log(
                'Using existing game session after conflict:',
                currentSession.id
              );
            } else {
              console.error(
                'Error creating game session:',
                createSessionError
              );
              return;
            }
          } else {
            if (!newSession) {
              console.error(
                'Game session was not created'
              );
              return;
            }

            currentSession = newSession;

            console.log(
              'Game session created:',
              newSession.id
            );
          }
        }

        console.log(
          'Using game session:',
          currentSession.id
        );

        console.log(
          'Session current chapter:',
          currentSession.current_chapter
        );

        // ==================================================
        // 6. โหลด Session Chapters
        //
        // เฉพาะ Branch ของ User คนปัจจุบัน
        // ==================================================

        const {
          data: sessionChapterData,
          error: sessionChapterError,
        } = await supabase
          .from('session_chapters')
          .select(
            'id, session_id, chapter_number, title, content, user_choice, created_at'
          )
          .eq(
            'session_id',
            currentSession.id
          )
          .order('chapter_number', {
            ascending: true,
          });

        if (sessionChapterError) {
          console.error(
            'Error loading session chapters:',
            sessionChapterError
          );
          return;
        }

        // ==================================================
        // 7. แปลง Session Chapters
        // ==================================================

        const sessionChapters: Chapter[] = (
          sessionChapterData || []
        ).map((chapter) => ({
          id: chapter.id,
          chapterNumber: chapter.chapter_number,
          title:
            chapter.title ||
            `บทที่ ${chapter.chapter_number}`,
          content: chapter.content,
          userPromptChoice:
            chapter.user_choice || undefined,
          createdAt: chapter.created_at,
        }));

        // ==================================================
        // 8. รวม Shared + Session Chapters
        //
        // ถ้าเลขบทซ้ำกัน:
        // Session Chapter จะทับ Shared Chapter
        //
        // ทำให้ A/B/C มีเนื้อหาสาขาของตัวเอง
        // ==================================================

        const chapterMap = new Map<number, Chapter>();

        for (const chapter of sharedChapters) {
          chapterMap.set(
            chapter.chapterNumber,
            chapter
          );
        }

        for (const chapter of sessionChapters) {
          chapterMap.set(
            chapter.chapterNumber,
            chapter
          );
        }

        const chapters = Array.from(
          chapterMap.values()
        ).sort(
          (a, b) =>
            a.chapterNumber -
            b.chapterNumber
        );

        // ==================================================
        // 9. หาบทล่าสุดของ Branch นี้
        // ==================================================

        const latestLoadedChapter =
          chapters.length > 0
            ? chapters[
              chapters.length - 1
            ].chapterNumber
            : 1;

        // ==================================================
        // 10. Current Chapter
        //
        // ใช้ค่าจาก Game Session เป็นหลัก
        // และป้องกันกรณี Session Chapter มีบทที่ใหม่กว่า
        // ==================================================

        const sessionCurrentChapter =
          Number(
            currentSession.current_chapter || 1
          );

        const currentChapter = Math.max(
          sessionCurrentChapter,
          latestLoadedChapter
        );

        console.log(
          'Session current chapter:',
          sessionCurrentChapter
        );

        console.log(
          'Latest loaded chapter:',
          latestLoadedChapter
        );

        console.log(
          'Final current chapter:',
          currentChapter
        );

        // ==================================================
        // 11. Sync Session เฉพาะกรณีข้อมูลบทใหม่กว่า Session
        // ==================================================

        if (
          currentChapter >
          sessionCurrentChapter
        ) {
          const {
            error: updateSessionError,
          } = await supabase
            .from('game_sessions')
            .update({
              current_chapter:
                currentChapter,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              currentSession.id
            );

          if (updateSessionError) {
            console.error(
              'Error syncing game session:',
              updateSessionError
            );
          }
        }

        // ==================================================
        // 12. จำนวนบททั้งหมด
        // ==================================================

        const totalChapters =
          storyData.total_chapters || 5;

        // ==================================================
        // 13. สร้าง Story Object
        // ==================================================

        const loadedStory: Story = {
          id: storyData.id,

          title:
            storyData.title ||
            'นิยายไม่มีชื่อ',

          author:
            'ผู้เขียนร่วมกับ AI',

          genre: (
            storyData.genre ||
            'แฟนตาซี'
          ) as Genre,

          tone: (
            storyData.tone ||
            'สดใสและจินตนาการ'
          ) as NarrativeTone,

          length:
            totalChapters <= 5
              ? 'เรื่องสั้น'
              : totalChapters <= 15
                ? 'นวนิยายขนาดกลาง'
                : 'นวนิยายยาว',

          corePremise:
            storyData.synopsis || '',

          protagonist: '',

          worldSetting: '',

          coverUrl:
            storyData.cover_image_url || '',

          totalChapters,

          currentChapter,

          wordCount:
            chapters.reduce(
              (total, chapter) =>
                total +
                chapter.content.length,
              0
            ),

          isFavorite:
            storyData.is_favorite || false,

          chapters,
        };

        // ==================================================
        // 14. Debug
        // ==================================================

        console.log(
          '========================================'
        );

        console.log(
          'STORY LOADED'
        );

        console.log(
          'Story ID:',
          storyId
        );

        console.log(
          'Current User ID:',
          user.id
        );

        console.log(
          'Story Owner ID:',
          storyData.user_id
        );

        console.log(
          'Session ID:',
          currentSession.id
        );

        console.log(
          'Session Current Chapter:',
          sessionCurrentChapter
        );

        console.log(
          'Latest Loaded Chapter:',
          latestLoadedChapter
        );

        console.log(
          'Final Current Chapter:',
          currentChapter
        );

        console.log(
          'Shared Chapters:',
          sharedChapters.length
        );

        console.log(
          'Session Chapters:',
          sessionChapters.length
        );

        console.log(
          'Total Loaded Chapters:',
          chapters.length
        );

        console.log(
          '========================================'
        );

        setStory(loadedStory);
      } catch (error) {
        console.error(
          'Unexpected error loading story:',
          error
        );

        console.error(
          'Story ID:',
          storyId
        );

        console.error(
          'Clerk User ID:',
          user.id
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, user, isLoaded]);

  // ==================================================
  // อัปเดต Story
  // ==================================================

  const handleUpdateStory = async (
    updatedStory: Story
  ) => {
    setStory(updatedStory);

    if (!user || !storyId) {
      return;
    }

    const {
      error,
    } = await supabase
      .from('game_sessions')
      .update({
        current_chapter:
          updatedStory.currentChapter,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'user_id',
        user.id
      )
      .eq(
        'story_id',
        storyId
      );

    if (error) {
      console.error(
        'Error updating game session:',
        error
      );
    }
  };

  // ==================================================
  // Loading
  // ==================================================

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">
          กำลังโหลดเนื้อหา...
        </p>
      </div>
    );
  }

  // ==================================================
  // ยังไม่ได้ Login
  // ==================================================

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-bold">
          กรุณาเข้าสู่ระบบ
        </h2>

        <button
          type="button"
          className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800"
          onClick={() => router.push('/')}
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  // ==================================================
  // ไม่พบ Story
  // ==================================================

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
        <h2 className="text-xl font-bold">
          ไม่พบเนื้อเรื่องที่คุณต้องการ
        </h2>

        <p className="text-sm text-gray-500">
          Story ID: {storyId}
        </p>

        <button
          type="button"
          className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800"
          onClick={() => router.push('/')}
        >
          ย้อนกลับหน้าหลัก
        </button>
      </div>
    );
  }

  // ==================================================
  // Reader
  // ==================================================

  return (
    <ReaderView
      story={story}
      onBack={() => router.push('/')}
      onUpdateStory={handleUpdateStory}
    />
  );
}