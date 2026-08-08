import { Story } from '../types/story';

export const INITIAL_STORIES: Story[] = [
  {
    id: '1',
    title: 'ผู้เขียนแผนที่แห่งรัตติกาล',
    corePremise: 'นักวาดแผนที่หนุ่มค้นพบว่าแผนที่ที่เขาวาดสามารถเปลี่ยนแปลงความจริงได้',
    genre: 'แฟนตาซี',
    tone: 'มืดมนและสมจริง',
    length: 'นวนิยายขนาดกลาง',
    protagonist: 'อลัน นักวาดแผนที่ผู้มีพรสวรรค์ชวนสงสัย',
    worldSetting: 'เมืองลอนดอนยุควิกตอเรียนที่ซ่อนเร้นเวทมนตร์',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600',
    author: 'โดย อลัน ไรท์',
    totalChapters: 12,
    currentChapter: 3,
    wordCount: 24500,
    isFavorite: true,
    isTrending: true,
    chapters: [
      {
        id: 'c1',
        chapterNumber: 1,
        title: 'บทที่ 1: เส้นหมึกที่ไม่เคยแห้ง',
        content: 'ในห้องทำงานมืดมิดที่ส่งกลิ่นหอมของกระดาษเก่าและหมึกจีน อลัน จรดปลายปากกาลงบนแผนที่ผืนเก่า เสียงฝนกระทบกระจกหน้าต่างดังเป็นจังหวะสม่ำเสมอ แต่แล้วบางอย่างก็เกิดขึ้นเมื่อเส้นหมึกที่เขาวาดเริ่มเรืองแสงสีทองอ่อนๆ...',
        createdAt: '2026-08-01'
      }
    ]
  },
  {
    id: '2',
    title: 'เสียงกระซิบจากดวงดาว',
    corePremise: 'หอดูดาวโบราณรับสัญญาณปริศนาที่ส่งมาจากอดีตเมื่อพันปีที่แล้ว',
    genre: 'ไซไฟ',
    tone: 'ปรัชญา',
    length: 'นวนิยายยาว',
    protagonist: 'ดร. เอลีเนอร์ นักดาราศาสตร์',
    worldSetting: 'ยอดเขาสูงในประเทศชิลี',
    coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600',
    author: 'โดย เอลีเนอร์',
    totalChapters: 28,
    currentChapter: 1,
    wordCount: 52000,
    isTrending: true,
    chapters: []
  },
  {
    id: '3',
    title: 'สวนแห่งความทรงจำ',
    corePremise: 'หญิงสาวผู้เปิดร้านดอกไม้ที่สามารถคืนความทรงจำที่หายไปให้ผู้คนได้',
    genre: 'โรแมนติก',
    tone: 'สดใสและจินตนาการ',
    length: 'เรื่องสั้น',
    protagonist: 'มีนา เจ้าของร้านดอกไม้',
    worldSetting: 'เมืองเล็กๆ ชายฝั่งทะเล',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
    author: 'โดย มีนา',
    totalChapters: 5,
    currentChapter: 5,
    wordCount: 12000,
    isFavorite: true,
    chapters: []
  }
];