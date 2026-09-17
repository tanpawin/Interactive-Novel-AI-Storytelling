import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  try {
    // ==========================================
    // CHECK LOGIN
    // ==========================================
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาเข้าสู่ระบบก่อน',
        },
        { status: 401 }
      );
    }

    // ==========================================
    // GET SESSION ID
    // ==========================================
    const { sessionId } = await context.params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบรหัส Session',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // READ REQUEST BODY
    // ==========================================
    const body = await req.json();

    const { is_public } = body;

    if (typeof is_public !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error:
            'ค่า is_public ต้องเป็น true หรือ false',
        },
        { status: 400 }
      );
    }

    // ==========================================
    // CHECK SESSION OWNER
    // ==========================================
    const {
      data: session,
      error: sessionError,
    } = await supabaseAdmin
      .from('game_sessions')
      .select(
        'id, user_id, story_id, is_public'
      )
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sessionError) {
      console.error(
        'Get Game Session Error:',
        JSON.stringify(
          sessionError,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถตรวจสอบ Session ได้',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบ Session หรือคุณไม่มีสิทธิ์แก้ไขเส้นเรื่องนี้',
        },
        { status: 404 }
      );
    }

    // ==========================================
    // UPDATE PUBLIC / PRIVATE
    // ==========================================
    const {
      data: updatedSession,
      error: updateError,
    } = await supabaseAdmin
      .from('game_sessions')
      .update({
        is_public,
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select(
        'id, user_id, story_id, current_chapter, status, current_inventory, is_public'
      )
      .single();

    if (updateError) {
      console.error(
        'Update Game Session Error:',
        JSON.stringify(
          updateError,
          null,
          2
        )
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถเปลี่ยนสถานะ Public / Private ได้',
        },
        { status: 500 }
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================
    return NextResponse.json({
      success: true,
      message: is_public
        ? 'เปลี่ยนเป็น Public เรียบร้อยแล้ว'
        : 'เปลี่ยนเป็น Private เรียบร้อยแล้ว',
      session: updatedSession,
    });
  } catch (error) {
    console.error(
      'Update Game Session API Error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'เกิดข้อผิดพลาดภายในระบบ',
      },
      { status: 500 }
    );
  }
}