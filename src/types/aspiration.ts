export type PageRoute = 'home' | 'explore' | 'write' | 'admin';

export type AspirationCategory =
  | 'Lingkungan dan Kebersihan'
  | 'Pembelajaran'
  | 'Fasilitas Sekolah'
  | 'Keamanan dan Anti-Bullying'
  | 'Kegiatan dan Ekstrakurikuler'
  | 'OSIS dan Organisasi'
  | 'Lainnya';

export type CategoryFilter = 'Semua Aspirasi' | AspirationCategory;

export interface Aspiration {
  id: string;
  category: AspirationCategory;
  message: string;
  author: string;
  createdAt: string;
  isHidden?: boolean;
  isSample?: boolean;
  adminReply?: string;
  adminRepliedAt?: string;
}

export interface CreateAspirationInput {
  category: AspirationCategory;
  message: string;
  author?: string;
}

export interface MediaAssets {
  schoolLogoUrl: string | null;
  exploreGalleryUrls: string[];
  writeGalleryUrls: string[];
}
