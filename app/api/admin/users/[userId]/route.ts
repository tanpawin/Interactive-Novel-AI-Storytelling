import { NextResponse } from 'next/server';

import { isAdmin } from '@/lib/auth/admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่มีสิทธิ์เข้าถึง',
        },
        { status: 403 }
      );
    }

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ User ID',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Profile
    // --------------------------------------------------

    const { data: profile, error: profileError } =
      await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .maybeSingle();

    if (profileError) {
      console.error('Admin User Profile Error:', profileError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบผู้ใช้',
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. Stories
    // --------------------------------------------------

    const { data: stories, error: storiesError } =
      await supabaseAdmin
        .from('stories')
        .select(`
          id,
          title,
          synopsis,
          genre,
          tone,
          total_chapters,
          is_published,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', {
          ascending: false,
        });

    if (storiesError) {
      console.error('Admin User Stories Error:', storiesError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลดนิยายของผู้ใช้ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. Game Sessions
    // --------------------------------------------------

    const { data: sessions, error: sessionsError } =
      await supabaseAdmin
        .from('game_sessions')
        .select(`
          id,
          story_id,
          current_chapter,
          is_public,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('updated_at', {
          ascending: false,
        });

    if (sessionsError) {
      console.error('Admin User Sessions Error:', sessionsError);

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถโหลด Game Sessions ได้',
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. Map story title into sessions
    // --------------------------------------------------

    const storyMap = new Map(
      (stories ?? []).map((story) => [
        story.id,
        {
          title: story.title,
          genre: story.genre,
        },
      ])
    );

    const formattedSessions = (sessions ?? []).map((session) => {
      const story = storyMap.get(session.story_id);

      return {
        id: session.id,
        storyId: session.story_id,
        storyTitle: story?.title ?? 'ไม่พบชื่อเรื่อง',
        storyGenre: story?.genre ?? null,
        currentChapter: session.current_chapter ?? 1,
        isPublic: session.is_public ?? false,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      };
    });

    // --------------------------------------------------
    // 5. Stats
    // --------------------------------------------------

    const storyCount = stories?.length ?? 0;
    const sessionCount = sessions?.length ?? 0;

    const publishedStoryCount =
      stories?.filter(
        (story) => story.is_published === true
      ).length ?? 0;

    const privateStoryCount =
      storyCount - publishedStoryCount;

    const publicSessionCount =
      sessions?.filter(
        (session) => session.is_public === true
      ).length ?? 0;

    const privateSessionCount =
      sessionCount - publicSessionCount;

    return NextResponse.json({
      success: true,

      user: {
        id: profile.id,
        userId: profile.user_id,
        displayName: profile.display_name,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },

      stats: {
        storyCount,
        publishedStoryCount,
        privateStoryCount,
        sessionCount,
        publicSessionCount,
        privateSessionCount,
      },

      stories: stories ?? [],

      sessions: formattedSessions,
    });
  } catch (error) {
    console.error('Admin User Detail API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}