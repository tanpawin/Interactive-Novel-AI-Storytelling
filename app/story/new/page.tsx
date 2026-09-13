'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CreateStoryData {
  title: string;
  corePremise: string;
  genre: string;
  tone: string;
  length: string;
  protagonist: string;
  worldSetting: string;
  coverImageUrl?: string;
}

function NewStoryContent() {
  const router = useRouter();

  const [storyData, setStoryData] =
    useState<CreateStoryData | null>(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [error, setError] = useState('');

  // ป้องกัน useEffect ยิง Generate ซ้ำ
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;

    const savedData =
      sessionStorage.getItem(
        'cozytales_create_story'
      );

    if (!savedData) {
      setError(
        'ไม่พบข้อมูลนิยาย กรุณากลับไปกรอกข้อมูลใหม่'
      );
      return;
    }

    try {
      const parsedData: CreateStoryData =
        JSON.parse(savedData);

      setStoryData(parsedData);

      hasStarted.current = true;

      generateStory(parsedData);
    } catch (err) {
      console.error(
        'อ่านข้อมูลสร้างนิยายไม่สำเร็จ:',
        err
      );

      setError(
        'ข้อมูลนิยายไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'
      );
    }
  }, []);

  const generateStory = async (
    data: CreateStoryData
  ) => {
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch(
        '/api/generate-story',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actionType: 'create_story',
            formData: data,
          }),
        }
      );

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result.error ||
            'ไม่สามารถสร้างนิยายได้'
        );
      }

      // API คืน Story ID จริงจาก Supabase
      const storyId = result.storyId;

      if (!storyId) {
        throw new Error(
          'ไม่พบ Story ID จากระบบ'
        );
      }

      // เก็บผลสำเร็จไว้ชั่วคราว
      sessionStorage.setItem(
        'cozytales_generated_story',
        JSON.stringify({
          storyId,
          title: data.title,
          coverImageUrl:
            data.coverImageUrl || '',
        })
      );

      // ข้อมูลสร้างนิยายไม่จำเป็นต้องเก็บต่อแล้ว
      sessionStorage.removeItem(
        'cozytales_create_story'
      );

      // ไปหน้าดูนิยายจริง
      router.replace(
        `/story/${storyId}`
      );
    } catch (err) {
      console.error(
        'Generate Story Error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'ไม่สามารถเชื่อมต่อกับระบบได้'
      );

      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    if (!storyData) return;

    hasStarted.current = true;

    generateStory(storyData);
  };

  const handleBack = () => {
    router.back();
  };

  if (!storyData && !error) {
    return (
      <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-sm p-6 text-center">
          <div className="text-4xl mb-4">
            ✨
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            กำลังเตรียมข้อมูล...
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            กรุณารอสักครู่
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-100 mb-4">
            <span className="text-3xl sm:text-4xl">
              ✨
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isGenerating
              ? 'กำลังสร้างนิยาย'
              : 'สร้างนิยายเสร็จแล้ว'}
          </h1>

          <p className="mt-2 text-sm sm:text-base text-gray-500">
            {isGenerating
              ? 'Gemini AI กำลังสร้างบทที่ 1 ให้คุณ'
              : 'กำลังพาคุณไปยังนิยาย'}
          </p>
        </div>

        {/* Story Information */}
        {storyData && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Cover */}
            {storyData.coverImageUrl && (
              <div className="w-full aspect-[16/7] sm:aspect-[16/6] bg-gray-100 overflow-hidden">
                <img
                  src={storyData.coverImageUrl}
                  alt={
                    storyData.title ||
                    'หน้าปกนิยาย'
                  }
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-5 sm:p-7">
              <div className="mb-6">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                  STORY BLUEPRINT
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {storyData.title ||
                    'รอให้ AI ตั้งชื่อ'}
                </h2>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs sm:text-sm font-medium">
                  {storyData.genre}
                </span>

                <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium">
                  {storyData.tone}
                </span>

                {storyData.length && (
                  <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium">
                    {storyData.length}
                  </span>
                )}
              </div>

              {/* Premise */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs font-semibold text-gray-400 mb-2">
                  พล็อตเรื่อง
                </p>

                <p className="text-sm sm:text-base text-gray-700 leading-7 break-words">
                  {storyData.corePremise}
                </p>
              </div>

              {/* Generation Status */}
              {isGenerating && (
                <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <span className="inline-block animate-spin text-xl">
                        ✨
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-amber-900 text-sm sm:text-base">
                        AI กำลังแต่งบทที่ 1
                      </p>

                      <p className="mt-1 text-xs sm:text-sm text-amber-700 leading-6">
                        ระบบกำลังสร้างเนื้อเรื่องและบันทึกลงฐานข้อมูล
                        กรุณารอสักครู่...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-6 rounded-xl bg-red-50 border border-red-100 p-4 sm:p-5">
                  <p className="font-semibold text-red-800 text-sm sm:text-base">
                    เกิดข้อผิดพลาด
                  </p>

                  <p className="mt-1 text-xs sm:text-sm text-red-700 leading-6 break-words">
                    {error}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {storyData && (
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={isGenerating}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        ลองใหม่อีกครั้ง
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleBack}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                    >
                      กลับไปแก้ไข
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Note */}
        {isGenerating && (
          <p className="text-center text-xs sm:text-sm text-gray-400 mt-5 px-4 leading-6">
            อย่าปิดหน้านี้ระหว่างที่ระบบกำลังสร้างนิยาย
          </p>
        )}
      </div>
    </main>
  );
}

export default function NewStoryPage() {
  return <NewStoryContent />;
}