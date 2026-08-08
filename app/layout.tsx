import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CozyTales - มุมอ่านและแต่งนิยาย AI',
  description: 'แพลตฟอร์มแต่งและอ่านนิยายโต้ตอบด้วย AI ภาษาไทย',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <main className="main-wrapper">{children}</main>
      </body>
    </html>
  );
}