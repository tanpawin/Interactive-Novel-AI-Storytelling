import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { supabase } from '@/lib/supabaseClient';

export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);

    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบ Story ID',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า Story เป็นของ User คนนี้
    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .select('id')
        .eq('id', storyId)
        .eq('user_id', userId)
        .maybeSingle();

    if (storyError) {
      console.error(
        'Relationship Story Check Error:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบนิยายได้',
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบเรื่องนี้หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      data: relationships,
      error: relationshipError,
    } = await supabase
      .from('character_relationships')
      .select(`
        id,
        story_id,
        from_character_id,
        to_character_id,
        relationship_type,
        description,
        created_at
      `)
      .eq('story_id', storyId)
      .order('created_at', {
        ascending: true,
      });

    if (relationshipError) {
      console.error(
        'Get Relationships Error:',
        relationshipError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถโหลดความสัมพันธ์ได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      relationships: relationships || [],
    });
  } catch (error) {
    console.error(
      'Relationships GET Error:',
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

export async function POST(req: Request) {
  try {
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

    const body = await req.json();

    const {
      storyId,
      fromCharacterId,
      toCharacterId,
      relationshipType,
      description,
    } = body;

    if (
      !storyId ||
      !fromCharacterId ||
      !toCharacterId ||
      !relationshipType
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ข้อมูลความสัมพันธ์ไม่ครบถ้วน',
        },
        { status: 400 }
      );
    }

    if (
      fromCharacterId === toCharacterId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ตัวละครไม่สามารถมีความสัมพันธ์กับตัวเองได้',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า Story เป็นของ User
    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .select('id')
        .eq('id', storyId)
        .eq('user_id', userId)
        .maybeSingle();

    if (storyError) {
      console.error(
        'Relationship Story Check Error:',
        storyError
      );

      return NextResponse.json(
        {
          success: false,
          error: 'ไม่สามารถตรวจสอบนิยายได้',
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบเรื่องนี้หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าตัวละครทั้งสองอยู่ใน Story เดียวกัน
    const {
      data: characters,
      error: characterError,
    } = await supabase
      .from('characters')
      .select('id, story_id')
      .eq('story_id', storyId)
      .in('id', [
        fromCharacterId,
        toCharacterId,
      ]);

    if (characterError) {
      console.error(
        'Relationship Character Check Error:',
        characterError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถตรวจสอบตัวละครได้',
        },
        { status: 500 }
      );
    }

    if (
      !characters ||
      characters.length !== 2
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบตัวละครหรือ ตัวละครไม่ได้อยู่ในเรื่องนี้',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่ามีความสัมพันธ์นี้อยู่แล้วหรือไม่
    const {
      data: existingRelationship,
    } = await supabase
      .from('character_relationships')
      .select('id')
      .eq('story_id', storyId)
      .eq(
        'from_character_id',
        fromCharacterId
      )
      .eq(
        'to_character_id',
        toCharacterId
      )
      .maybeSingle();

    if (existingRelationship) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ความสัมพันธ์นี้มีอยู่แล้ว',
        },
        { status: 409 }
      );
    }

    const {
      data: relationship,
      error: insertError,
    } = await supabase
      .from('character_relationships')
      .insert({
        story_id: storyId,
        from_character_id:
          fromCharacterId,
        to_character_id:
          toCharacterId,
        relationship_type:
          relationshipType,
        description:
          description || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error(
        'Insert Relationship Error:',
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถบันทึกความสัมพันธ์ได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      relationship,
    });
  } catch (error) {
    console.error(
      'Relationships POST Error:',
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

export async function DELETE(req: Request) {
  try {
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

    const body = await req.json();

    const {
      storyId,
      relationshipId,
    } = body;

    if (
      !storyId ||
      !relationshipId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ข้อมูลสำหรับลบไม่ครบถ้วน',
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า Story เป็นของ User
    const { data: story } =
      await supabase
        .from('stories')
        .select('id')
        .eq('id', storyId)
        .eq('user_id', userId)
        .maybeSingle();

    if (!story) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบเรื่องนี้หรือไม่มีสิทธิ์เข้าถึง',
        },
        { status: 404 }
      );
    }

    const {
      error: deleteError,
    } = await supabase
      .from('character_relationships')
      .delete()
      .eq('id', relationshipId)
      .eq('story_id', storyId);

    if (deleteError) {
      console.error(
        'Delete Relationship Error:',
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่สามารถลบความสัมพันธ์ได้',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      'Relationships DELETE Error:',
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