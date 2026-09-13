import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      storyId: string;
      sessionId: string;
    }>;
  }
) {
  try {
    const { storyId, sessionId } = await params;

    if (!storyId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing storyId or sessionId',
        },
        { status: 400 }
      );
    }

    // 1. ตรวจสอบ Story
    const { data: story, error: storyError } =
      await supabaseAdmin
        .from('stories')
        .select(
          `
          id,
          title,
          total_chapters,
          cover_image_url,
          genre,
          tone,
          synopsis
          `
        )
        .eq('id', storyId)
        .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          success: false,
          error: 'Story not found',
        },
        { status: 404 }
      );
    }

    // 2. โหลด Branch
    // ต้องตรวจสอบทั้ง sessionId และ storyId
    // เพื่อป้องกันการเอา session ของ Story อื่นมาอ่าน
    const { data: session, error: sessionError } =
      await supabaseAdmin
        .from('game_sessions')
        .select(
          `
          id,
          user_id,
          story_id,
          current_chapter,
          status,
          created_at,
          updated_at
          `
        )
        .eq('id', sessionId)
        .eq('story_id', storyId)
        .single();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Branch not found',
        },
        { status: 404 }
      );
    }

    // 3. โหลดชื่อผู้เล่นจาก Clerk
    let userName = 'ผู้เล่น';

    if (session.user_id) {
      try {
        const clerk = await clerkClient();
        const user = await clerk.users.getUser(
          session.user_id
        );

        userName =
          user.fullName ||
          user.username ||
          user.firstName ||
          'ผู้เล่น';
      } catch (error) {
        console.error(
          'Error loading Clerk user:',
          error
        );
      }
    }

    // 4. โหลด Chapter กลางของ Story
    const {
      data: sharedChapters,
      error: sharedError,
    } = await supabaseAdmin
      .from('chapters')
      .select(
        `
        id,
        chapter_number,
        title,
        content,
        created_at
        `
      )
      .eq('story_id', storyId)
      .order('chapter_number', {
        ascending: true,
      });

    if (sharedError) {
      console.error(
        'Error loading shared chapters:',
        sharedError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load story chapters',
        },
        { status: 500 }
      );
    }

    // 5. โหลด Chapter เฉพาะของ Branch นี้
    const {
      data: sessionChapters,
      error: sessionChapterError,
    } = await supabaseAdmin
      .from('session_chapters')
      .select(
        `
        id,
        session_id,
        chapter_number,
        title,
        content,
        user_choice,
        created_at
        `
      )
      .eq('session_id', sessionId)
      .order('chapter_number', {
        ascending: true,
      });

    if (sessionChapterError) {
      console.error(
        'Error loading session chapters:',
        sessionChapterError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to load branch chapters',
        },
        { status: 500 }
      );
    }

    // 6. รวม Chapter กลาง + Chapter ของ Branch
    const chapterMap = new Map<
      number,
      {
        id: string;
        chapterNumber: number;
        title: string;
        content: string;
        userPromptChoice?: string;
        createdAt: string;
      }
    >();

    // Chapter กลาง
    for (const chapter of sharedChapters ?? []) {
      chapterMap.set(
        chapter.chapter_number,
        {
          id: chapter.id,
          chapterNumber:
            chapter.chapter_number,
          title:
            chapter.title ??
            `Chapter ${chapter.chapter_number}`,
          content: chapter.content,
          createdAt: chapter.created_at,
        }
      );
    }

    // Chapter ของ Branch จะทับ Chapter กลาง
    // ถ้ามีเลข chapter เดียวกัน
    for (const chapter of sessionChapters ?? []) {
      chapterMap.set(
        chapter.chapter_number,
        {
          id: chapter.id,
          chapterNumber:
            chapter.chapter_number,
          title:
            chapter.title ??
            `Chapter ${chapter.chapter_number}`,
          content: chapter.content,
          userPromptChoice:
            chapter.user_choice ??
            undefined,
          createdAt: chapter.created_at,
        }
      );
    }

    const chapters = Array.from(
      chapterMap.values()
    ).sort(
      (a, b) =>
        a.chapterNumber -
        b.chapterNumber
    );

    return NextResponse.json({
      success: true,

      story: {
        id: story.id,
        title: story.title,
        totalChapters:
          story.total_chapters,
        coverImageUrl:
          story.cover_image_url ?? '',
        genre: story.genre ?? '',
        tone: story.tone ?? '',
        synopsis: story.synopsis ?? '',
      },

      branch: {
        sessionId: session.id,
        userId: session.user_id,
        userName,
        currentChapter:
          session.current_chapter ?? 1,
        status: session.status,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      },

      chapters,
    });
  } catch (error) {
    console.error(
      'Unexpected error loading branch:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}