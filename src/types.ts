
export interface Material {
  id: string;
  title: string;
  source: string;
  url: string;
  type: 'video' | 'article' | 'image' | 'file';
  thumbnail?: string;
}

export interface HeritageLocation {
  id: string;
  name: string;
  type: string; // e.g., "Di tích", "Bảo tàng"
  image: string;
  description?: string;
  address?: string;
  mapUrl?: string; // New: Link Google Maps
  websiteUrl?: string; // New: Link Website
}

export interface PromotionItem {
  id: string;
  type: 'location' | 'product';
  title: string;
  image: string;
  subtitle?: string;
  price?: string; // For products
  link?: string;
}

export interface HistoricalEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  image?: string;
  materials?: Material[]; 
  relatedLocations?: HeritageLocation[]; // For Discovery Modal
  promotions?: PromotionItem[]; // For Smart Carousel
}

export interface HistoryStage {
  id: string;
  title: string;
  period: string;
  vietnam: HistoricalEvent[];
  world: HistoricalEvent[];
  summaryVideoUrl?: string; 
  image?: string;
  isCustom?: boolean; // New: Flag for custom stages
}

export interface HistoricalFigure {
  id: string;
  name: string;
  years: string;
  role: string;
  description: string;
  image: string;
  nationality: 'vietnam' | 'world';
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  content?: string;
}

export type QuizMode = 'mcq' | 'tf_group' | 'mix';

export interface TFSubQuestion {
  text: string;
  answer: boolean;
}

export interface QuizQuestion {
  type: 'mcq' | 'tf_group';
  question?: string;
  options?: string[];
  correctIndex?: number;
  context?: string;
  subQuestions?: TFSubQuestion[];
  explanation?: string;
}

export interface UserAnswer {
  selection: number | boolean[] | null;
  isCorrect: boolean;
}

export interface QuizState {
  screen: 'config' | 'playing' | 'result';
  topic: string;
  count: number;
  mode: QuizMode;
  questions: QuizQuestion[];
  currentIdx: number;
  userAnswers: (UserAnswer | null)[]; // Cho phép null
  score: number;
  timer: number;
  isActive: boolean;
  isExamMode?: boolean; 
  examStatus?: 'idle' | 'countdown' | 'in_progress' | 'submitted';
  markedQuestions: number[];
}

export interface AdminUser {
    uid: string;
    email?: string;
    role: 'admin' | 'advisor';
    name?: string;
    displayName?: string;
}
