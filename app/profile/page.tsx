'use client';

import { UserProfile, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#888' }}>
        <p>กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push('/');
    return null;
  }

  return (
    <div className="view-container" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* ปุ่มย้อนกลับ */}
      <div style={{ width: '100%', maxWidth: '900px', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        >
          ‹ ย้อนกลับ
        </button>
      </div>
      
      {/* Component แสดงโปรไฟล์ของ Clerk */}
      <UserProfile routing="hash" />
    </div>
  );
}