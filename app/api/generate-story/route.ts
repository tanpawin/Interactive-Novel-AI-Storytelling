import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // ตรวจสอบว่ามี API Key หรือไม่
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในไฟล์ .env.local' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const body = await req.json();
    const {
      actionType,
      formData = {},
      previousChapters = [],
      userChoice,
      storyTitle,
      genre,
      tone
    } = body;

    let systemPrompt = '';

    if (actionType === 'create_story') {
      systemPrompt = `
คุณคือนักเขียนนิยายมืออาชีพภาษาไทย
จงแต่ง "บทที่ 1" ของนิยายโดยใช้ข้อมูลต่อไปนี้:
- ชื่อเรื่อง: ${formData.title || 'ไม่มีชื่อเรื่อง'}
- พล็อตหลัก: ${formData.corePremise || 'ไม่ระบุ'}
- หมวดหมู่: ${formData.genre || 'ทั่วไป'}
- โทนเรื่อง: ${formData.tone || 'ทั่วไป'}
- ตัวละครเอก: ${formData.protagonist || 'ไม่ระบุ'}
- ฉากหลัง/โลก: ${formData.worldSetting || 'ไม่ระบุ'}

ข้อกำหนด:
1. เขียนเป็นภาษาไทย ความยาว 3-4 ย่อหน้า
2. จบย่อหน้าสุดท้ายด้วยเหตุการณ์วิกฤต/ทางเลือก เพื่อให้ผู้อ่านพิมพ์ตัดสินใจต่อ
3. เริ่มเนื้อเรื่องทันที ไม่ต้องใส่คำนำ
`;
    } else if (actionType === 'next_chapter') {
      const lastChapter = previousChapters[previousChapters.length - 1];
      systemPrompt = `
คุณคือนักเขียนนิยายมืออาชีพภาษาไทย แต่งเรื่อง "${storyTitle || 'นิยาย'}" (หมวดหมู่: ${genre || 'ทั่วไป'}, โทน: ${tone || 'ทั่วไป'})

เนื้อเรื่องบทก่อนหน้า:
"${lastChapter?.content?.substring(0, 300) || 'ไม่มีเนื้อเรื่องก่อนหน้า'}..."

ผู้อ่านตัดสินใจเลือก: 
"${userChoice || 'ดำเนินเรื่องต่อไป'}"

จงแต่ง "บทถัดไป" ความยาว 3-4 ย่อหน้า โดยให้ดำเนินเรื่องต่อจากการตัดสินใจของผู้ใช้อย่างสมเหตุสมผล และจบด้วยเหตุการณ์ใหม่ที่เปิดโอกาสให้ตัดสินใจต่อ เริ่มเขียนเนื้อเรื่องทันที
`;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid actionType' }, { status: 400 });
    }

    // ปรับเป็นโมเดลมาตรฐานที่มีในระบบและรองรับโควต้าฟรี
    const modelsToTry = ['gemini-3.6-flash', 'gemini-2.5-flash'];
    let responseText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt,
          });

          if (response?.text) {
            responseText = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.error(`[AI Error] Model: ${modelName}, Attempt: ${attempt}`, err?.message || err);

          const isRateLimitOrServerBusy =
            err?.status === 503 ||
            err?.status === 429 ||
            err?.message?.includes('503') ||
            err?.message?.includes('429');

          if (isRateLimitOrServerBusy && attempt === 1) {
            await sleep(1500);
          } else {
            break;
          }
        }
      }

      if (responseText) break;
    }

    if (!responseText) {
      throw lastError || new Error('ไม่สามารถสร้างเนื้อหาจาก AI ได้');
    }

    return NextResponse.json({
      success: true,
      content: responseText,
    });
  } catch (error: any) {
    console.error('Gemini API Handler Error:', error);

    // ส่งข้อความ Error ที่แท้จริงกลับไปที่ Frontend เพื่อให้ทราบสาเหตุ
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI'
      },
      { status: 500 }
    );
  }
}