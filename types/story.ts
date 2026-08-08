export type Genre = 
  | 'แฟนตาซี' 
  | 'โรแมนติก' 
  | 'สืบสวนสอบสวน' 
  | 'ไซไฟ' 
  | 'ประวัติศาสตร์' 
  | 'สยองขวัญ' 
  | 'ผจญภัย' 
  | 'วรรณกรรม';

export type NarrativeTone = 
  | 'มืดมนและสมจริง' 
  | 'สดใสและจินตนาการ' 
  | 'โรแมนติก' 
  | 'ปรัชญา' 
  | 'ตลกขบขัน' 
  | 'ระทึกขวัญ';

export type StoryLength = 'เรื่องสั้น' | 'นวนิยายขนาดกลาง' | 'นวนิยายยาว';

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  userPromptChoice?: string;
  createdAt: string;
}

export interface Story {
  id: string;
  title: string;
  corePremise: string;
  genre: Genre;
  tone: NarrativeTone;
  length: StoryLength;
  protagonist?: string;
  worldSetting?: string;
  coverUrl: string;
  author: string;
  totalChapters: number;
  currentChapter: number;
  wordCount: number;
  isFavorite?: boolean;
  isTrending?: boolean;
  isFresh?: boolean;
  chapters: Chapter[];
}

export interface CreateStoryFormData {
  title: string;
  corePremise: string;
  genre: Genre;
  tone: NarrativeTone;
  length: StoryLength;
  protagonist: string;
  worldSetting: string;
}