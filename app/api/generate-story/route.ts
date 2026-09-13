import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

const modelsToTry = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

type ExistingCharacter = {
  id: string;
  name: string;
  role: 'player' | 'npc';
  appearance: string | null;
  personality: string;
  initial_items: string[];
};

type ExtractedCharacter = {
  name: string;
  appearance: string | null;
  personality: string;
  initial_items: string[];
};

type ExtractedRelationship = {
  from: string;
  to: string;
  relationship_type: string;
  description: string;
};

/* =========================================================
   Helper: Get / Create Game Session
========================================================= */

async function getOrCreateGameSession(
  userId: string,
  storyId: string,
  currentChapter: number
) {
  const { data: existingSession, error: findError } =
    await supabaseAdmin
      .from('game_sessions')
      .select(
        'id, user_id, story_id, current_chapter, status, current_inventory'
      )
      .eq('user_id', userId)
      .eq('story_id', storyId)
      .maybeSingle();

  if (findError) {
    console.error(
      'Find Game Session Error:',
      JSON.stringify(findError, null, 2)
    );
  }

  if (existingSession) {
    return existingSession;
  }

  const { data: newSession, error: createError } =
    await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: userId,
        story_id: storyId,
        current_chapter: currentChapter,
        status: 'in_progress',
        current_inventory: [],
      })
      .select()
      .single();

  if (createError) {
    /* =====================================================
       Duplicate Session
       
       เกิดจาก Request สองตัวสร้าง Session พร้อมกัน
       ให้โหลด Session เดิมกลับมาใช้
    ===================================================== */

    if (createError.code === '23505') {
      console.log(
        '⚠️ Session already exists, loading existing session...'
      );

      const {
        data: existingSessionAfterConflict,
        error: reloadError,
      } = await supabaseAdmin
        .from('game_sessions')
        .select(
          'id, user_id, story_id, current_chapter, status, current_inventory'
        )
        .eq('user_id', userId)
        .eq('story_id', storyId)
        .maybeSingle();

      if (reloadError) {
        console.error(
          'Reload Game Session Error:',
          JSON.stringify(reloadError, null, 2)
        );

        return null;
      }

      if (existingSessionAfterConflict) {
        console.log(
          '✅ Using existing game session after conflict:',
          existingSessionAfterConflict.id
        );

        return existingSessionAfterConflict;
      }
    }

    console.error(
      'Create Game Session Error:',
      JSON.stringify(createError, null, 2)
    );

    return null;
  }

  if (!newSession) {
    console.error(
      'Game session was not created'
    );

    return null;
  }

  console.log(
    '✅ New game session created:',
    newSession.id
  );

  return newSession;
}

/* =========================================================
   Helper: Save Chat Log
========================================================= */

async function saveChatLog(
  sessionId: string,
  chapter: number,
  role: 'user' | 'assistant',
  content: string
) {
  if (!content || !content.trim()) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('chat_logs')
    .insert({
      session_id: sessionId,
      chapter,
      role,
      content: content.trim(),
    });

  if (error) {
    console.error(
      'Chat Log Error:',
      JSON.stringify(error, null, 2)
    );
  } else {
    console.log(
      `✅ Chat log saved: ${role} / chapter ${chapter}`
    );
  }
}

/* =========================================================
   Helper: Extract Characters / Relationships
========================================================= */

/* =========================================================
   Helper: Initialize Session Characters
========================================================= */

async function initializeSessionCharacters(
  sessionId: string,
  storyId: string
) {
  try {
    /* =====================================================
       Load Base Characters
    ===================================================== */

    const {
      data: baseCharacters,
      error: baseCharacterError,
    } = await supabaseAdmin
      .from('characters')
      .select(
        'id, name, role, appearance, personality, initial_items'
      )
      .eq('story_id', storyId);

    if (baseCharacterError) {
      console.error(
        '❌ Load Base Characters Error:',
        JSON.stringify(baseCharacterError, null, 2)
      );

      return;
    }

    if (!baseCharacters || baseCharacters.length === 0) {
      console.log(
        'ℹ️ No base characters to initialize'
      );

      return;
    }

    /* =====================================================
       Check Existing Session Characters
    ===================================================== */

    const {
      data: existingSessionCharacters,
      error: existingSessionCharacterError,
    } = await supabaseAdmin
      .from('session_characters')
      .select('id, name')
      .eq('session_id', sessionId);

    if (existingSessionCharacterError) {
      console.error(
        '❌ Load Session Characters Error:',
        JSON.stringify(
          existingSessionCharacterError,
          null,
          2
        )
      );

      return;
    }

    const existingNames = new Set(
      (existingSessionCharacters || []).map(
        (character) =>
          character.name.trim().toLowerCase()
      )
    );

    /* =====================================================
       Copy Base Characters Into Session
    ===================================================== */

    const charactersToInsert =
      baseCharacters
        .filter(
          (character) =>
            !existingNames.has(
              character.name.trim().toLowerCase()
            )
        )
        .map((character) => ({
          session_id: sessionId,
          base_character_id: character.id,
          name: character.name,
          role: character.role,
          appearance: character.appearance,
          personality: character.personality,
          initial_items:
            Array.isArray(character.initial_items)
              ? character.initial_items
              : [],
        }));

    if (charactersToInsert.length === 0) {
      console.log(
        'ℹ️ Session characters already initialized'
      );

      return;
    }

    const {
      error: insertError,
    } = await supabaseAdmin
      .from('session_characters')
      .insert(charactersToInsert);

    if (insertError) {
      console.error(
        '❌ Initialize Session Characters Error:',
        JSON.stringify(insertError, null, 2)
      );

      return;
    }

    console.log(
      `✅ Initialized ${charactersToInsert.length} session character(s)`
    );
  } catch (error) {
    console.error(
      '❌ Initialize Session Characters Exception:',
      error
    );
  }
}

/* =========================================================
   Helper: Extract Characters / Relationships
========================================================= */

async function syncCharactersFromChapter({
  ai,
  storyId,
  sessionId,
  chapterNumber,
  chapterContent,
}: {
  ai: GoogleGenAI;
  storyId: string;
  sessionId: string;
  chapterNumber: number;
  chapterContent: string;
}) {
  try {
    console.log(
      `========================================`
    );

    console.log(
      `CHARACTER SYNC START - CHAPTER ${chapterNumber}`
    );

    console.log(
      'Story ID:',
      storyId
    );

    console.log(
      'Session ID:',
      sessionId
    );

    /* =====================================================
       1. Initialize Session Characters
       
       Base characters จาก Story
       จะถูก copy เข้า Session ก่อน
    ===================================================== */

    await initializeSessionCharacters(
      sessionId,
      storyId
    );

    /* =====================================================
       2. Load Existing Session Characters
    ===================================================== */

    const {
      data: existingCharacters,
      error: existingCharacterError,
    } = await supabaseAdmin
      .from('session_characters')
      .select(
        'id, base_character_id, name, role, appearance, personality, initial_items'
      )
      .eq('session_id', sessionId);

    if (existingCharacterError) {
      console.error(
        '❌ Load Session Characters Error:',
        JSON.stringify(
          existingCharacterError,
          null,
          2
        )
      );

      return;
    }

    const characters =
      existingCharacters || [];

    console.log(
      'Session Characters:',
      characters.map(
        (character) =>
          `${character.name} (${character.role})`
      )
    );

    /* =====================================================
       3. Find Protagonist
    ===================================================== */

    const protagonist =
      characters.find(
        (character) =>
          character.role === 'player'
      );

    const protagonistName =
      protagonist?.name || '';

    console.log(
      'Protagonist:',
      protagonistName || 'ไม่พบตัวเอก'
    );

    /* =====================================================
       4. Create Character List For AI
    ===================================================== */

    const characterList =
      characters.length > 0
        ? characters
          .map(
            (character) =>
              `- ${character.name} [${character.role}]`
          )
          .join('\n')
        : 'ยังไม่มีตัวละคร';

    /* =====================================================
       5. Character Extraction Prompt
       
       AI PROMPT เดิม
       ไม่เปลี่ยน logic
    ===================================================== */

    const extractionPrompt = `
คุณคือระบบวิเคราะห์ข้อมูลตัวละครของเกม Interactive Novel

หน้าที่ของคุณคืออ่านข้อความบทที่ ${chapterNumber}
แล้วค้นหาข้อมูลเกี่ยวกับ "ตัวละคร" และ "ความสัมพันธ์ระหว่างตัวละคร"

ตัวละครที่มีอยู่ใน Database แล้ว:

${characterList}

ตัวละครเอกของเรื่องคือ:

${protagonistName || 'ไม่ทราบ'}

==================================================
กฎการตรวจจับตัวละคร
==================================================

1. ถ้าตัวละครมีอยู่ใน Database แล้ว
   ห้ามสร้างซ้ำใน newCharacters

2. ตัวละครใหม่ต้องเป็นบุคคลที่มีตัวตนจริงในเนื้อเรื่อง

3. ห้ามสร้างตัวละครจากคำทั่วไป เช่น
   - ผู้คน
   - ชาวบ้าน
   - ฝูงชน
   - คนทั่วไป
   เว้นแต่บุคคลนั้นมีตัวตนชัดเจนและมีบทบาทเฉพาะ

4. ถ้าตัวละครใหม่ไม่มีชื่อจริง
   แต่เนื้อเรื่องระบุว่าเป็นบุคคลเฉพาะ
   สามารถใช้ชื่อเรียกที่ปรากฏในเรื่องได้

5. ตัวละครใหม่ทั้งหมดใช้ role = npc

==================================================
กฎการตรวจจับความสัมพันธ์
==================================================

ต้องตรวจจับความสัมพันธ์ที่เนื้อเรื่องระบุหรือสื่ออย่างชัดเจน

ตัวอย่าง:

"เธอเป็นแฟนของอาร์เธอร์"
→ relationship_type = "แฟน"

"เขาเป็นเพื่อนสนิทของอาร์เธอร์"
→ relationship_type = "เพื่อน"

"หญิงสาวคนนั้นคือพี่สาวของอาร์เธอร์"
→ relationship_type = "พี่น้อง"

"ทั้งสองคนรักกัน"
→ relationship_type = "คนรัก"

"เขาเป็นศัตรูกับอาร์เธอร์"
→ relationship_type = "ศัตรู"

สำคัญมาก:

ถ้าเนื้อเรื่องใช้คำว่า

"ตัวเอก"
"พระเอก"
"นางเอก"
"ผู้เล่น"

ให้ตีความว่าเป็นตัวละครเอก:

${protagonistName || 'ไม่ทราบ'}

ถ้าเนื้อเรื่องใช้ชื่อเล่นหรือชื่อบางส่วน
ให้จับคู่กับชื่อเต็มใน Database ที่มีอยู่

เช่น Database:

"อาร์เธอร์ เพนเดิลตัน"

ในเนื้อเรื่อง:

"อาร์เธอร์"

ให้ใช้:

"อาร์เธอร์ เพนเดิลตัน"

ใน relationships

==================================================
กฎสำคัญมากเกี่ยวกับ relationships
==================================================

from และ to ต้องใช้ชื่อเต็มของตัวละครจาก Database
หรือชื่อของตัวละครใหม่ที่คุณกำลังสร้าง

ห้ามใช้คำว่า:

"ตัวเอก"

"พระเอก"

"นางเอก"

"ผู้เล่น"

ถ้ามีตัวละครเอกอยู่ใน Database แล้ว

ให้เปลี่ยนเป็นชื่อจริงของตัวละครเอก:

${protagonistName || 'ไม่ทราบ'}

ตัวอย่าง:

ผิด:

{
  "from": "แฟนสาว",
  "to": "ตัวเอก"
}

ถูก:

{
  "from": "จูเลียน แวนซ์",
  "to": "${protagonistName || 'ชื่อตัวเอก'}"
}

==================================================
กรณี "แฟนของตัวเอก"
==================================================

ถ้าเนื้อเรื่องระบุว่าตัวละครใหม่เป็นแฟนของตัวเอก
ต้องสร้าง relationship อย่างแน่นอน

เช่น:

ตัวละคร:
"มีนา"

ตัวเอก:
"อาร์เธอร์"

ผลลัพธ์:

{
  "from": "มีนา",
  "to": "อาร์เธอร์",
  "relationship_type": "แฟน",
  "description": "มีนาเป็นแฟนของอาร์เธอร์"
}

ห้ามปล่อย relationships เป็น [] หากในเนื้อเรื่องระบุความสัมพันธ์อย่างชัดเจน

==================================================
รูปแบบ JSON
==================================================

ตอบ JSON เท่านั้น

{
  "newCharacters": [
    {
      "name": "ชื่อเต็ม",
      "appearance": "รูปลักษณ์",
      "personality": "บุคลิก",
      "initial_items": []
    }
  ],
  "relationships": [
    {
      "from": "ชื่อตัวละคร",
      "to": "ชื่อตัวละคร",
      "relationship_type": "ประเภทความสัมพันธ์",
      "description": "รายละเอียด"
    }
  ]
}

ถ้าไม่มีตัวละครใหม่:

"newCharacters": []

ถ้าไม่มีความสัมพันธ์ใหม่:

"relationships": []

==================================================
บทนิยาย
==================================================

${chapterContent}
`;

    /* =====================================================
       6. Call Gemini
    ===================================================== */

    let extractionText = '';

    for (
      let i = 0;
      i < modelsToTry.length;
      i++
    ) {
      try {
        const response =
          await ai.models.generateContent({
            model:
              modelsToTry[i],

            contents:
              extractionPrompt,

            config: {
              responseMimeType:
                'application/json',
            },
          });

        extractionText =
          response.text || '';

        if (
          extractionText.trim()
        ) {
          break;
        }
      } catch (error) {
        console.error(
          `Character extraction error (${modelsToTry[i]}):`,
          error
        );

        if (
          i <
          modelsToTry.length - 1
        ) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1000
              )
          );
        }
      }
    }

    if (
      !extractionText.trim()
    ) {
      console.error(
        '❌ Character extraction returned empty result'
      );

      return;
    }

    console.log(
      'RAW CHARACTER EXTRACTION:',
      extractionText
    );

    /* =====================================================
       7. Parse JSON
    ===================================================== */

    let extracted: {
      newCharacters?: ExtractedCharacter[];
      relationships?: ExtractedRelationship[];
    };

    try {
      extracted =
        JSON.parse(
          extractionText
        );
    } catch (error) {
      console.error(
        '❌ Character JSON Parse Error:',
        error
      );

      return;
    }

    const newCharacters =
      Array.isArray(
        extracted.newCharacters
      )
        ? extracted.newCharacters
        : [];

    const relationships =
      Array.isArray(
        extracted.relationships
      )
        ? extracted.relationships
        : [];

    console.log(
      'New Characters:',
      newCharacters
    );

    console.log(
      'Detected Relationships:',
      relationships
    );

    /* =====================================================
       8. Insert New Characters Into Session
       
       สำคัญ:
       ห้าม insert ลง characters
    ===================================================== */

    for (
      const character of
      newCharacters
    ) {
      if (
        !character ||
        !character.name ||
        !character.name.trim()
      ) {
        continue;
      }

      const characterName =
        character.name.trim();

      /* -----------------------------------------------
         Check duplicate inside THIS SESSION
      ------------------------------------------------ */

      const alreadyExists =
        characters.some(
          (existing) =>
            existing.name
              .trim()
              .toLowerCase() ===
            characterName.toLowerCase()
        );

      if (alreadyExists) {
        console.log(
          'Character already exists in session:',
          characterName
        );

        continue;
      }

      /* -----------------------------------------------
         Insert Session Character
      ------------------------------------------------ */

      const {
        error:
        insertCharacterError,
      } = await supabaseAdmin
        .from('session_characters')
        .insert({
          session_id:
            sessionId,

          base_character_id:
            null,

          name:
            characterName,

          role: 'npc',

          appearance:
            character.appearance
              ?.trim() || null,

          personality:
            character.personality
              ?.trim() ||
            'ยังไม่มีข้อมูลบุคลิก',

          initial_items:
            Array.isArray(
              character.initial_items
            )
              ? character.initial_items
              : [],
        });

      if (
        insertCharacterError
      ) {
        console.error(
          `❌ Session Character Insert Error (${characterName}):`,
          JSON.stringify(
            insertCharacterError,
            null,
            2
          )
        );
      } else {
        console.log(
          `✅ New Session Character Created: ${characterName}`
        );
      }
    }

    /* =====================================================
       9. Reload Session Characters
       
       เพื่อให้ได้ UUID ของ NPC ที่เพิ่งสร้าง
    ===================================================== */

    const {
      data: allCharacters,
      error:
      reloadCharacterError,
    } = await supabaseAdmin
      .from('session_characters')
      .select(
        'id, base_character_id, name, role, appearance, personality, initial_items'
      )
      .eq(
        'session_id',
        sessionId
      );

    if (
      reloadCharacterError
    ) {
      console.error(
        '❌ Reload Session Characters Error:',
        JSON.stringify(
          reloadCharacterError,
          null,
          2
        )
      );

      return;
    }

    /* =====================================================
       10. Build Character Resolver
    ===================================================== */

    const currentCharacters =
      allCharacters || [];

    const currentProtagonist =
      currentCharacters.find(
        (character) =>
          character.role === 'player'
      );

    function normalizeName(
      value: string
    ) {
      return value
        .trim()
        .toLowerCase()
        .replace(
          /\s+/g,
          ' '
        );
    }

    function resolveCharacter(
      value: string
    ) {
      if (!value) {
        return null;
      }

      const normalized =
        normalizeName(value);

      /* -----------------------------------------------
         Protagonist aliases
      ------------------------------------------------ */

      if (
        normalized === 'ตัวเอก' ||
        normalized === 'พระเอก' ||
        normalized === 'นางเอก' ||
        normalized === 'ผู้เล่น' ||
        normalized === 'protagonist' ||
        normalized === 'player'
      ) {
        return (
          currentProtagonist ||
          null
        );
      }

      /* -----------------------------------------------
         Exact match
      ------------------------------------------------ */

      const exact =
        currentCharacters.find(
          (character) =>
            normalizeName(
              character.name
            ) === normalized
        );

      if (exact) {
        return exact;
      }

      /* -----------------------------------------------
         Partial match
      ------------------------------------------------ */

      const partial =
        currentCharacters.find(
          (character) => {
            const name =
              normalizeName(
                character.name
              );

            return (
              name.includes(
                normalized
              ) ||
              normalized.includes(
                name
              )
            );
          }
        );

      if (partial) {
        return partial;
      }

      return null;
    }

    /* =====================================================
       11. Save Relationships
       
       สำคัญ:
       ใช้ session_character_relationships
       ไม่ใช่ character_relationships
    ===================================================== */

    for (
      const relationship of
      relationships
    ) {
      if (
        !relationship ||
        !relationship.from ||
        !relationship.to ||
        !relationship.relationship_type
      ) {
        continue;
      }

      const fromCharacter =
        resolveCharacter(
          relationship.from
        );

      const toCharacter =
        resolveCharacter(
          relationship.to
        );

      console.log(
        'Resolving session relationship:',
        {
          from:
            relationship.from,

          to:
            relationship.to,

          type:
            relationship.relationship_type,

          resolvedFrom:
            fromCharacter?.name ||
            null,

          resolvedTo:
            toCharacter?.name ||
            null,
        }
      );

      if (
        !fromCharacter ||
        !toCharacter
      ) {
        console.warn(
          '⚠️ Session relationship skipped - character not found:',
          {
            from:
              relationship.from,

            to:
              relationship.to,
          }
        );

        continue;
      }

      /* -----------------------------------------------
         Prevent self relationship
      ------------------------------------------------ */

      if (
        fromCharacter.id ===
        toCharacter.id
      ) {
        continue;
      }

      /* -----------------------------------------------
         Check existing relationship
      ------------------------------------------------ */

      const {
        data:
        existingRelationship,
      } = await supabaseAdmin
        .from(
          'session_character_relationships'
        )
        .select('id')
        .eq(
          'session_id',
          sessionId
        )
        .eq(
          'from_character_id',
          fromCharacter.id
        )
        .eq(
          'to_character_id',
          toCharacter.id
        )
        .maybeSingle();

      if (
        existingRelationship
      ) {
        console.log(
          'Session relationship already exists:',
          fromCharacter.name,
          '→',
          toCharacter.name
        );

        continue;
      }

      /* -----------------------------------------------
         Insert Session Relationship
      ------------------------------------------------ */

      const {
        error:
        relationshipError,
      } = await supabaseAdmin
        .from(
          'session_character_relationships'
        )
        .insert({
          session_id:
            sessionId,

          from_character_id:
            fromCharacter.id,

          to_character_id:
            toCharacter.id,

          relationship_type:
            relationship.relationship_type
              .trim(),

          description:
            relationship.description
              ?.trim() ||
            null,
        });

      if (
        relationshipError
      ) {
        console.error(
          '❌ Session Relationship Insert Error:',
          JSON.stringify(
            relationshipError,
            null,
            2
          )
        );
      } else {
        console.log(
          `✅ Session Relationship Created: ${fromCharacter.name} → ${toCharacter.name} (${relationship.relationship_type})`
        );
      }
    }

    console.log(
      `✅ CHARACTER SYNC COMPLETE - CHAPTER ${chapterNumber}`
    );

    console.log(
      '========================================'
    );
  } catch (error) {
    console.error(
      '❌ Character Sync Error:',
      error
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(req: Request) {
  try {
    /* =====================================================
       Authentication
    ===================================================== */

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'กรุณาเข้าสู่ระบบก่อนสร้างนิยาย',
        },
        { status: 401 }
      );
    }

    /* =====================================================
       Gemini API Key
    ===================================================== */

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ไม่พบ GEMINI_API_KEY',
        },
        { status: 500 }
      );
    }

    /* =====================================================
       Request Data
    ===================================================== */

    const body =
      await req.json();

    const {
      actionType,
      formData,
      previousChapters = [],
      userChoice,
      storyTitle,
      genre,
      tone,
      storyId,
    } = body;

    /* =====================================================
       Validate Action
    ===================================================== */

    if (
      actionType !==
      'create_story' &&
      actionType !==
      'next_chapter'
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'actionType ไม่ถูกต้อง',
        },
        { status: 400 }
      );
    }

    /* =========================================================
       CREATE STORY
    ========================================================= */

    if (
      actionType ===
      'create_story'
    ) {
      if (!formData) {
        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่พบข้อมูลสำหรับสร้างนิยาย',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         Story ID
      ===================================================== */

      const finalStoryId =
        storyId ||
        crypto.randomUUID();

      console.log(
        '========================================'
      );

      console.log(
        'CREATE STORY START'
      );

      console.log(
        'Story ID:',
        finalStoryId
      );

      console.log(
        'User ID:',
        userId
      );

      /* =====================================================
         Check Existing Story
      ===================================================== */

      const {
        data: existingStory,
        error:
        existingStoryError,
      } = await supabaseAdmin
        .from('stories')
        .select('id')
        .eq(
          'id',
          finalStoryId
        )
        .eq(
          'user_id',
          userId
        )
        .maybeSingle();

      if (
        existingStoryError
      ) {
        console.error(
          'Existing Story Check Error:',
          JSON.stringify(
            existingStoryError,
            null,
            2
          )
        );
      }

      if (existingStory) {
        return NextResponse.json({
          success: true,
          storyId:
            existingStory.id,
          alreadyCreated: true,
        });
      }

      /* =====================================================
         Gemini
      ===================================================== */

      const ai =
        new GoogleGenAI({
          apiKey,
        });

      /*
       * AI prompt เดิม
       * ไม่เปลี่ยน logic การเขียนเรื่อง
       */

      const systemPrompt = `
คุณคือ AI นักเขียนนิยายสำหรับแอป CozyTales

หน้าที่ของคุณคือเขียนนิยายภาษาไทยที่อ่านเป็นธรรมชาติ
มีบรรยากาศ มีรายละเอียด และมีความต่อเนื่องของเรื่อง

ข้อมูลนิยาย:

ชื่อเรื่อง:
${formData.title || 'นิยายไม่มีชื่อ'}

แนว:
${formData.genre || 'แฟนตาซี'}

โทน:
${formData.tone || 'มืดมนและสมจริง'}

เรื่องย่อ / แก่นเรื่อง:
${formData.corePremise || ''}

ตัวละครเอก:
${formData.protagonist || 'ไม่ระบุ'}

โลกหรือสถานที่:
${formData.worldSetting || 'ไม่ระบุ'}

เขียนบทที่ 1 ของนิยาย

ข้อกำหนด:
- เขียนเป็นภาษาไทย
- อย่าอธิบายว่าคุณเป็น AI
- อย่าใส่คำว่า "บทที่ 1" ซ้ำในเนื้อหา
- เนื้อหาต้องเป็นนิยายจริง
- มีการเปิดเรื่องที่น่าสนใจ
- ตัวละครต้องมีบุคลิกชัดเจน
- สร้างบรรยากาศตามแนวและโทนที่กำหนด
- จบบทด้วยเหตุการณ์ใหม่หรือสถานการณ์ที่เปิดโอกาสให้ผู้เล่นตัดสินใจว่าจะทำอะไรต่อ
- ผู้เล่นสามารถพิมพ์การตัดสินใจของตัวเองเพื่อดำเนินเรื่องต่อได้
- ความยาวเหมาะสมสำหรับบทแรก
`;

      let generatedText = '';
      let lastGeminiError = '';

      for (
        let i = 0;
        i < modelsToTry.length;
        i++
      ) {
        try {
          console.log(
            `🤖 Trying Gemini model: ${modelsToTry[i]}`
          );

          const response =
            await ai.models.generateContent({
              model: modelsToTry[i],
              contents: systemPrompt,
            });

          generatedText =
            response.text || '';

          console.log(
            `✅ Gemini response received from ${modelsToTry[i]}`
          );

          if (generatedText.trim()) {
            break;
          }

          lastGeminiError =
            `${modelsToTry[i]} returned empty response`;
        } catch (error) {
          console.error(
            `❌ Gemini error (${modelsToTry[i]}):`,
            error
          );

          lastGeminiError =
            error instanceof Error
              ? error.message
              : String(error);

          if (
            i <
            modelsToTry.length - 1
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(resolve, 1500)
            );
          }
        }
      }

      if (!generatedText.trim()) {
        console.error(
          '❌ ALL GEMINI MODELS FAILED:',
          lastGeminiError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              `AI ไม่สามารถสร้างเนื้อหาได้: ${lastGeminiError}`,
          },
          { status: 500 }
        );
      }

      /* =====================================================
         Story Settings
      ===================================================== */

      const totalChapters =
        formData.length ===
          'เรื่องสั้น'
          ? 5
          : formData.length ===
            'นวนิยายขนาดกลาง'
            ? 15
            : 30;

      /* =====================================================
         Create Story
      ===================================================== */

      const {
        data: story,
        error: storyError,
      } = await supabaseAdmin
        .from('stories')
        .insert({
          id: finalStoryId,

          user_id: userId,

          title:
            formData.title ||
            'นิยายไม่มีชื่อ',

          synopsis:
            formData.corePremise ||
            '',

          plot_structure:
            formData.corePremise ||
            '',

          genre:
            formData.genre ||
            'แฟนตาซี',

          tone:
            formData.tone ||
            'ทั่วไป',

          total_chapters:
            totalChapters,

          cover_image_url:
            formData.coverImageUrl ||
            null,
        })
        .select()
        .single();

      if (storyError) {
        console.error(
          '❌ SUPABASE STORY ERROR:',
          JSON.stringify(
            storyError,
            null,
            2
          )
        );

        if (
          storyError.code ===
          '23505'
        ) {
          const {
            data:
            duplicateStory,
          } = await supabaseAdmin
            .from('stories')
            .select('id')
            .eq(
              'id',
              finalStoryId
            )
            .eq(
              'user_id',
              userId
            )
            .maybeSingle();

          if (duplicateStory) {
            return NextResponse.json({
              success: true,
              storyId:
                duplicateStory.id,
              alreadyCreated:
                true,
            });
          }
        }

        return NextResponse.json(
          {
            success: false,
            error:
              storyError.message ||
              'ไม่สามารถบันทึกนิยายได้',
            code:
              storyError.code ||
              null,
            details:
              storyError.details ||
              null,
            hint:
              storyError.hint ||
              null,
          },
          { status: 500 }
        );
      }

      if (!story) {
        return NextResponse.json(
          {
            success: false,
            error:
              'สร้าง Story สำเร็จแต่ไม่พบข้อมูลที่บันทึก',
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Story created:',
        story.id
      );

      /* =====================================================
         Create Protagonist
      ===================================================== */

      if (
        formData.protagonist &&
        formData.protagonist.trim()
      ) {
        const {
          error:
          characterError,
        } = await supabaseAdmin
          .from('characters')
          .insert({
            story_id:
              story.id,

            name:
              formData.protagonist.trim(),

            role: 'player',

            appearance: null,

            personality:
              'ตัวละครเอกของเรื่อง',

            initial_items: [],
          });

        if (
          characterError
        ) {
          console.error(
            '❌ Protagonist Error:',
            JSON.stringify(
              characterError,
              null,
              2
            )
          );
        } else {
          console.log(
            '✅ Protagonist created'
          );
        }
      }

      /* =====================================================
         Create Chapter 1
      ===================================================== */

      const {
        data: chapter,
        error:
        chapterError,
      } = await supabaseAdmin
        .from('chapters')
        .insert({
          story_id:
            story.id,

          chapter_number: 1,

          title: 'บทที่ 1',

          content:
            generatedText.trim(),
        })
        .select()
        .single();

      if (
        chapterError
      ) {
        console.error(
          '❌ CHAPTER 1 INSERT ERROR:',
          JSON.stringify(
            chapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              chapterError.message ||
              'ไม่สามารถบันทึกบทที่ 1 ได้',
            code:
              chapterError.code ||
              null,
            details:
              chapterError.details ||
              null,
            hint:
              chapterError.hint ||
              null,
            storyId:
              story.id,
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Chapter 1 created:',
        chapter?.id
      );

      /* =====================================================
         Create Game Session
      ===================================================== */

      const session =
        await getOrCreateGameSession(
          userId,
          story.id,
          1
        );

      if (session) {
        const {
          error:
          sessionUpdateError,
        } = await supabaseAdmin
          .from('game_sessions')
          .update({
            current_chapter: 1,
            status:
              'in_progress',
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            session.id
          );

        if (
          sessionUpdateError
        ) {
          console.error(
            'Game Session Update Error:',
            JSON.stringify(
              sessionUpdateError,
              null,
              2
            )
          );
        }

        /* ===============================================
           Save AI Chapter 1 to Chat Logs
        =============================================== */

        await saveChatLog(
          session.id,
          1,
          'assistant',
          generatedText.trim()
        );
      }

      /* =====================================================
         Sync Characters From Chapter 1
      ===================================================== */

      if (session) {
        await syncCharactersFromChapter({
          ai,
          storyId: story.id,
          sessionId: session.id,
          chapterNumber: 1,
          chapterContent:
            generatedText.trim(),
        });
      }
      /* =====================================================
         Success
      ===================================================== */

      console.log(
        '========================================'
      );

      console.log(
        '✅ CREATE STORY SUCCESS'
      );

      console.log(
        'Story ID:',
        story.id
      );

      console.log(
        '========================================'
      );

      return NextResponse.json({
        success: true,
        storyId: story.id,
        alreadyCreated: false,
      });
    }

    /* =========================================================
   NEXT CHAPTER
========================================================= */

    if (
      actionType ===
      'next_chapter'
    ) {
      if (!storyId) {
        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่พบ Story ID',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         Get Story
         
         เจ้าของเล่นได้เสมอ
         ผู้ใช้อื่นเล่นได้ถ้า Story ถูก publish
      ===================================================== */

      const {
        data: story,
        error: storyError,
      } = await supabaseAdmin
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .maybeSingle();

      if (
        storyError ||
        !story
      ) {
        console.error(
          'Next chapter story error:',
          JSON.stringify(
            storyError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่พบเรื่องนี้',
          },
          { status: 404 }
        );
      }

      /* =====================================================
         Check Story Access
      ===================================================== */

      const isOwner =
        story.user_id === userId;

      const isPublished =
        story.is_published === true;

      /* =====================================================
         Get / Create Game Session
         
         สำคัญ:
         Session เป็นของ user + story
         ทำให้ผู้เล่นแต่ละคนมีเส้นเรื่องของตัวเอง
      ===================================================== */

      const {
        data: existingSession,
        error: existingSessionError,
      } = await supabaseAdmin
        .from('game_sessions')
        .select(
          'id, user_id, story_id, current_chapter, status, current_inventory'
        )
        .eq(
          'user_id',
          userId
        )
        .eq(
          'story_id',
          story.id
        )
        .maybeSingle();

      if (
        existingSessionError
      ) {
        console.error(
          'Get Game Session Error:',
          JSON.stringify(
            existingSessionError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่สามารถโหลด Session ของผู้เล่นได้',
          },
          { status: 500 }
        );
      }

      let session =
        existingSession;

      /* =====================================================
         Get Shared Chapters
         
         chapters = เนื้อเรื่องต้นฉบับ / shared content
      ===================================================== */

      const {
        data: databaseChapters,
        error: databaseChapterError,
      } = await supabaseAdmin
        .from('chapters')
        .select(
          'id, chapter_number, title, content, created_at'
        )
        .eq(
          'story_id',
          story.id
        )
        .order(
          'chapter_number',
          {
            ascending: true,
          }
        );

      if (
        databaseChapterError
      ) {
        console.error(
          'Database Chapters Error:',
          JSON.stringify(
            databaseChapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่สามารถตรวจสอบบทของนิยายได้',
          },
          { status: 500 }
        );
      }

      const sharedChapters =
        databaseChapters || [];

      /* =====================================================
         If Session Does Not Exist
         
         เริ่มต้นจากบทล่าสุดของเนื้อเรื่องต้นฉบับ
         
         สำหรับ Story ใหม่:
         shared chapter = 1
         → session current chapter = 1
         
         สำหรับ Story เก่า:
         ถ้ามี shared chapter ถึง 4
         → session current chapter = 4
      ===================================================== */

      const latestSharedChapter =
        sharedChapters.length > 0
          ? Math.max(
            ...sharedChapters.map(
              (chapter) =>
                chapter.chapter_number
            )
          )
          : 0;

      if (!session) {
        session =
          await getOrCreateGameSession(
            userId,
            story.id,
            latestSharedChapter || 1
          );

        if (!session) {
          return NextResponse.json(
            {
              success: false,
              error:
                'ไม่สามารถสร้าง Session สำหรับการเล่นได้',
            },
            { status: 500 }
          );
        }
      }

      /* =====================================================
         Get Session Chapters
         
         session_chapters = บทเฉพาะของผู้เล่นคนนี้
      ===================================================== */

      const {
        data: sessionChapterData,
        error: sessionChapterError,
      } = await supabaseAdmin
        .from('session_chapters')
        .select(
          'id, session_id, chapter_number, title, content, user_choice, created_at'
        )
        .eq(
          'session_id',
          session.id
        )
        .order(
          'chapter_number',
          {
            ascending: true,
          }
        );

      if (
        sessionChapterError
      ) {
        console.error(
          'Session Chapters Error:',
          JSON.stringify(
            sessionChapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,
            error:
              'ไม่สามารถโหลดบทของ Session ได้',
          },
          { status: 500 }
        );
      }

      const sessionChapters =
        sessionChapterData || [];

      /* =====================================================
         Calculate Latest Chapter
         
         ใช้ค่าที่มากที่สุดจาก:
         - shared chapters
         - session chapters
         - game session
      ===================================================== */

      const latestSessionChapter =
        sessionChapters.length > 0
          ? Math.max(
            ...sessionChapters.map(
              (chapter) =>
                chapter.chapter_number
            )
          )
          : 0;

      const latestChapterNumber =
        Math.max(
          latestSharedChapter,
          latestSessionChapter,
          session.current_chapter || 0
        );

      console.log(
        '========================================'
      );

      console.log(
        'NEXT CHAPTER REQUEST'
      );

      console.log(
        'Story ID:',
        story.id
      );

      console.log(
        'User ID:',
        userId
      );

      console.log(
        'Is Owner:',
        isOwner
      );

      console.log(
        'Is Published:',
        isPublished
      );

      console.log(
        'Session ID:',
        session.id
      );

      console.log(
        'Latest Shared Chapter:',
        latestSharedChapter
      );

      console.log(
        'Latest Session Chapter:',
        latestSessionChapter
      );

      console.log(
        'Session Current Chapter:',
        session.current_chapter
      );

      console.log(
        'Latest Chapter:',
        latestChapterNumber
      );

      /* =====================================================
         Check Completed
      ===================================================== */

      if (
        latestChapterNumber >=
        story.total_chapters
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'นิยายเรื่องนี้ครบจำนวนบทแล้ว',
          },
          { status: 400 }
        );
      }

      /* =====================================================
         Next Chapter Number
      ===================================================== */

      const nextChapterNumber =
        latestChapterNumber + 1;

      /* =====================================================
         Check Existing Session Chapter
         
         สำคัญมาก:
         ตรวจใน session_chapters
         ไม่ใช่ chapters
      ===================================================== */

      const {
        data: existingNextChapter,
        error: existingNextChapterError,
      } = await supabaseAdmin
        .from('session_chapters')
        .select(
          'id, session_id, chapter_number, title, content, user_choice, created_at'
        )
        .eq(
          'session_id',
          session.id
        )
        .eq(
          'chapter_number',
          nextChapterNumber
        )
        .maybeSingle();

      if (
        existingNextChapterError
      ) {
        console.error(
          'Existing Session Chapter Check Error:',
          JSON.stringify(
            existingNextChapterError,
            null,
            2
          )
        );
      }

      if (
        existingNextChapter
      ) {
        console.log(
          'Existing session chapter found:',
          existingNextChapter.id
        );

        const isCompleted =
          existingNextChapter.chapter_number >=
          story.total_chapters;

        const {
          error:
          existingSessionUpdateError,
        } = await supabaseAdmin
          .from('game_sessions')
          .update({
            current_chapter:
              existingNextChapter.chapter_number,

            status:
              isCompleted
                ? 'completed'
                : 'in_progress',

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            session.id
          );

        if (
          existingSessionUpdateError
        ) {
          console.error(
            'Existing Session Update Error:',
            JSON.stringify(
              existingSessionUpdateError,
              null,
              2
            )
          );
        }

        return NextResponse.json({
          success: true,

          storyId:
            story.id,

          alreadyCreated:
            true,

          chapter: {
            id:
              existingNextChapter.id,

            chapterNumber:
              existingNextChapter.chapter_number,

            title:
              existingNextChapter.title,

            content:
              existingNextChapter.content,

            userChoice:
              existingNextChapter.user_choice,

            createdAt:
              existingNextChapter.created_at,
          },
        });
      }

      /* =====================================================
         Prepare Previous Chapters
         
         ใช้ previousChapters จาก ReaderView
         ซึ่งภายหลังเราจะทำให้ประกอบด้วย:
         
         shared chapters
         +
         session chapters ของผู้เล่นคนนี้
      ===================================================== */

      const chapterContext =
        previousChapters
          .map(
            (
              chapter: {
                chapterNumber?: number;
                title?: string;
                content?: string;
              }
            ) =>
              `
บทที่ ${chapter.chapterNumber || ''}

ชื่อบท:
${chapter.title || ''}

เนื้อหา:
${chapter.content || ''}
`
          )
          .join('\n');

      /* =====================================================
         Gemini
         
         ไม่เปลี่ยน logic หลักของ AI
      ===================================================== */

      const ai =
        new GoogleGenAI({
          apiKey,
        });

      /* =====================================================
         Final Chapter Detection
      ===================================================== */

      const isFinalChapter =
        nextChapterNumber >=
        story.total_chapters;

      const finalChapterInstruction =
        isFinalChapter
          ? `
นี่คือบทสุดท้ายของนิยาย

ข้อกำหนดเพิ่มเติมสำหรับบทสุดท้าย:
- ต้องจบเรื่องอย่างสมบูรณ์ภายในบทนี้
- ดำเนินเรื่องต่อจากการตัดสินใจล่าสุดของผู้เล่นอย่างสมเหตุสมผล
- คลี่คลายปมหลักและเหตุการณ์สำคัญของเรื่อง
- สรุปผลลัพธ์ของตัวละครและเหตุการณ์สำคัญ
- ห้ามเปิดปมใหม่ที่ต้องไปต่อในบทถัดไป
- ห้ามจบแบบค้างคา
- ห้ามเขียนเหมือนกำลังจะมีบทถัดไป
- ตอนจบต้องให้ความรู้สึกว่าเรื่องราวสิ้นสุดลงแล้ว
- ปิดเรื่องอย่างเป็นธรรมชาติและเหมาะสมกับเรื่อง
- ไม่ต้องเสนอทางเลือกหรือคำถามสำหรับบทถัดไป
`
          : `
นี่ไม่ใช่บทสุดท้ายของนิยาย

ข้อกำหนด:
- เขียนบทถัดไปโดยต่อเนื่องจากบทก่อนหน้า
- การตัดสินใจของผู้เล่นต้องมีผลต่อเหตุการณ์ในบทนี้
- ดำเนินเรื่องต่ออย่างสมเหตุสมผล
- จบบทด้วยเหตุการณ์ใหม่หรือสถานการณ์ใหม่ที่เปิดโอกาสให้ผู้เล่นตัดสินใจต่อ
- เริ่มเขียนเนื้อเรื่องทันที
`;

      const prompt = `
คุณคือ AI นักเขียนนิยายของ CozyTales

ชื่อเรื่อง:
${story.title}

แนว:
${genre || story.genre || ''}

โทน:
${tone || story.tone || ''}

เรื่องย่อ:
${story.synopsis || ''}

บทก่อนหน้า:
${chapterContext}

การตัดสินใจล่าสุดของผู้เล่น:
${userChoice || 'ไม่มี'}

เขียนบทที่ ${nextChapterNumber}

ข้อกำหนด:
- ภาษาไทย
- ต่อเนื่องจากบทก่อนหน้า
- เคารพการตัดสินใจของผู้เล่น
- ตัวละครและเหตุการณ์ต้องต่อเนื่อง
- อย่าอธิบายว่าเป็น AI
- เขียนเป็นนิยายจริง
- ไม่ต้องใส่คำว่า "บทที่ ${nextChapterNumber}" ซ้ำในเนื้อหา

${finalChapterInstruction}
`;

      let generatedText = '';
      let lastGeminiError = '';

      for (
        let i = 0;
        i < modelsToTry.length;
        i++
      ) {
        try {
          console.log(
            `🤖 Trying Gemini model: ${modelsToTry[i]}`
          );

          const response =
            await ai.models.generateContent({
              model:
                modelsToTry[i],

              contents:
                prompt,
            });

          generatedText =
            response.text || '';

          console.log(
            `✅ Gemini response received from ${modelsToTry[i]}`
          );

          if (
            generatedText.trim()
          ) {
            break;
          }

          lastGeminiError =
            `${modelsToTry[i]} returned empty response`;
        } catch (error) {
          console.error(
            `❌ Gemini error (${modelsToTry[i]}):`,
            error
          );

          lastGeminiError =
            error instanceof Error
              ? error.message
              : String(error);

          if (
            i <
            modelsToTry.length - 1
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  1500
                )
            );
          }
        }
      }

      if (
        !generatedText.trim()
      ) {
        console.error(
          '❌ ALL GEMINI MODELS FAILED:',
          lastGeminiError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              `AI ไม่สามารถสร้างบทต่อไปได้: ${lastGeminiError}`,
          },
          { status: 500 }
        );
      }

      /* =====================================================
         Save Next Chapter
         
         สำคัญ:
         ใช้ session_chapters
         ไม่ใช้ chapters
      ===================================================== */

      const {
        data: chapter,
        error:
        chapterError,
      } = await supabaseAdmin
        .from('session_chapters')
        .insert({
          session_id:
            session.id,

          chapter_number:
            nextChapterNumber,

          title:
            `บทที่ ${nextChapterNumber}`,

          content:
            generatedText.trim(),

          user_choice:
            userChoice &&
              String(userChoice).trim()
              ? String(userChoice).trim()
              : null,
        })
        .select()
        .single();

      /* =====================================================
         Duplicate Protection
      ===================================================== */

      if (
        chapterError
      ) {
        if (
          chapterError.code ===
          '23505'
        ) {
          const {
            data:
            duplicateChapter,
          } = await supabaseAdmin
            .from(
              'session_chapters'
            )
            .select(
              'id, session_id, chapter_number, title, content, user_choice, created_at'
            )
            .eq(
              'session_id',
              session.id
            )
            .eq(
              'chapter_number',
              nextChapterNumber
            )
            .maybeSingle();

          if (
            duplicateChapter
          ) {
            return NextResponse.json({
              success: true,

              storyId:
                story.id,

              alreadyCreated:
                true,

              chapter: {
                id:
                  duplicateChapter.id,

                chapterNumber:
                  duplicateChapter.chapter_number,

                title:
                  duplicateChapter.title,

                content:
                  duplicateChapter.content,

                userChoice:
                  duplicateChapter.user_choice,

                createdAt:
                  duplicateChapter.created_at,
              },
            });
          }
        }

        console.error(
          'Next Session Chapter Error:',
          JSON.stringify(
            chapterError,
            null,
            2
          )
        );

        return NextResponse.json(
          {
            success: false,

            error:
              chapterError.message ||
              'ไม่สามารถบันทึกบทใหม่ได้',

            code:
              chapterError.code ||
              null,

            details:
              chapterError.details ||
              null,

            hint:
              chapterError.hint ||
              null,
          },
          { status: 500 }
        );
      }

      if (!chapter) {
        return NextResponse.json(
          {
            success: false,
            error:
              'สร้างบทสำเร็จแต่ไม่พบข้อมูลบท',
          },
          { status: 500 }
        );
      }

      console.log(
        '✅ Session Chapter created:',
        chapter.id
      );

      /* =====================================================
         Save User Choice to Chat Logs
      ===================================================== */

      if (
        userChoice &&
        String(userChoice).trim()
      ) {
        await saveChatLog(
          session.id,
          nextChapterNumber,
          'user',
          String(userChoice)
        );
      }

      /* =====================================================
         Save AI Response to Chat Logs
      ===================================================== */

      await saveChatLog(
        session.id,
        nextChapterNumber,
        'assistant',
        generatedText.trim()
      );

      /* =====================================================
         Update Game Session
      ===================================================== */

      const isCompleted =
        nextChapterNumber >=
        story.total_chapters;

      const {
        error:
        sessionError,
      } = await supabaseAdmin
        .from('game_sessions')
        .update({
          current_chapter:
            nextChapterNumber,

          status:
            isCompleted
              ? 'completed'
              : 'in_progress',

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          session.id
        );

      if (
        sessionError
      ) {
        console.error(
          'Game Session Update Error:',
          JSON.stringify(
            sessionError,
            null,
            2
          )
        );
      }

      /* =====================================================
         Sync New Characters
         
         ส่วนนี้ยังใช้ logic เดิม
      ===================================================== */

      await syncCharactersFromChapter({
        ai,
        storyId:
          story.id,
        sessionId:
          session.id,
        chapterNumber:
          nextChapterNumber,
        chapterContent:
          generatedText.trim(),
      });

      /* =====================================================
         Success
      ===================================================== */

      console.log(
        '========================================'
      );

      console.log(
        `✅ CHAPTER ${nextChapterNumber} SUCCESS`
      );

      console.log(
        'Story ID:',
        story.id
      );

      console.log(
        'Session ID:',
        session.id
      );

      console.log(
        'User ID:',
        userId
      );

      console.log(
        'Saved To: session_chapters'
      );

      console.log(
        '========================================'
      );

      return NextResponse.json({
        success: true,

        storyId:
          story.id,

        alreadyCreated:
          false,

        chapter: {
          id:
            chapter.id,

          chapterNumber:
            chapter.chapter_number,

          title:
            chapter.title,

          content:
            chapter.content,

          userChoice:
            chapter.user_choice,

          createdAt:
            chapter.created_at,
        },
      });
    }

    /* =========================================================
       Fallback
    ========================================================= */

    return NextResponse.json(
      {
        success: false,
        error:
          'ไม่พบ action ที่รองรับ',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      '========================================'
    );

    console.error(
      '❌ GENERATE STORY API ERROR'
    );

    console.error(error);

    console.error(
      '========================================'
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