'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NewStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get('title') || 'ไม่มีชื่อเรื่อง';
  const genre = searchParams.get('genre') || 'ทั่วไป';
  const tone = searchParams.get('tone') || 'ทั่วไป';
  const premise = searchParams.get('premise') || '';

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'create_story',
          formData: {
            title,
            genre,
            tone,
            corePremise: premise,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newId = `story_${Date.now()}`;
        
        const newStory = {
          id: newId,
          title,
          genre,
          tone,
          corePremise: premise,
          currentChapter: 1,
          totalChapters: 1,
          wordCount: data.content.length,
          chapters: [
            {
              id: `c_${Date.now()}`,
              chapterNumber: 1,
              title: 'บทที่ 1: จุดเริ่มต้น',
              content: data.content,
              createdAt: new Date().toISOString().split('T')[0],
            },
          ],
        };

        // บันทึกลง localStorage
        const existingStories = JSON.parse(localStorage.getItem('cozy_stories') || '[]');
        localStorage.setItem('cozy_stories', JSON.stringify([newStory, ...existingStories]));

        // นำทางไปยังหน้ารายละเอียดนิยายเพื่ออ่านบทแรก
        router.push(`/story/${newId}`);
      } else {
        setError(data.error || 'ไม่สามารถสร้างเนื้อหาได้');
      }
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถเชื่อมต่อกับระบบ AI ได้');
    } finally {
      setIsGenerating(false);
    }
  };

  // สั่งให้สร้างบทที่ 1 อัตโนมัติทันทีที่เปิดหน้านี้
  useEffect(() => {
    handleGenerate();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        {isGenerating ? 'กำลังสร้างบทที่ 1...' : 'สร้างนิยายเรื่องใหม่'}
      </h1>

      <div className="space-y-3 text-lg border-l-4 border-amber-600 pl-4 py-2 bg-amber-50/50">
        <p><strong>ชื่อเรื่อง:</strong> {title}</p>
        <p><strong>หมวดหมู่:</strong> {genre}</p>
        <p><strong>โทนเรื่อง:</strong> {tone}</p>
        <p><strong>พล็อตเรื่อง:</strong> {premise}</p>
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg text-amber-800 font-medium">
          <span className="animate-spin text-2xl">✨</span>
          <span>Gemini AI กำลังแต่งบทที่ 1 ให้คุณ รอสักครู่นะครับ...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg space-y-3">
          <p><strong>เกิดข้อผิดพลาด:</strong> {error}</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            onClick={handleGenerate}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewStoryPage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลดข้อมูล...</div>}>
      <NewStoryContent />
    </Suspense>
  );
}