import type {
  Aspiration,
  AspirationCategory,
  CategoryFilter,
  MediaAssets,
} from '../types/aspiration.ts';

export const SCHOOL_INFO = {
  name: 'SMP Negeri 1 Ungaran',
  shortCode: 'SMP 1',
  alias: 'SPENSANGAR',
  footerHandle: '@OSIS_SPENSANGAR',
};

export const ASPIRATION_CATEGORIES: AspirationCategory[] = [
  'Lingkungan dan Kebersihan',
  'Pembelajaran',
  'Fasilitas Sekolah',
  'Keamanan dan Anti-Bullying',
  'Kegiatan dan Ekstrakurikuler',
  'OSIS dan Organisasi',
  'Lainnya',
];

export const EXPLORE_FILTERS: CategoryFilter[] = [
  'Semua Aspirasi',
  ...ASPIRATION_CATEGORIES,
];

export const FORM_LIMITS = {
  minMessageLength: 10,
  maxMessageLength: 500,
  maxAuthorLength: 40,
};

export const PRIMARY_ADMIN_EMAIL = 'kls8a2026@gmail.com';
export const ADMIN_AUTH_DOMAIN = 'spensangar.sch.id';

export function resolveAdminLoginEmail(usernameOrEmail: string): string {
  const clean = usernameOrEmail.trim().toLowerCase();
  if (!clean) return '';
  return clean.includes('@') ? clean : `${clean}@${ADMIN_AUTH_DOMAIN}`;
}

export const DEFAULT_MEDIA_ASSETS: MediaAssets = {
  schoolLogoUrl: null,
  exploreGalleryUrls: [
    '/src/assets/images/poster_stop_bullying_1794848600284.jpg',
    '/src/assets/images/poster_be_a_friend_1794848600875.jpg',
    '/src/assets/images/hero_aspirasi_ilustrasi_1794848601330.jpg',
  ],
  writeGalleryUrls: [
    '/src/assets/images/poster_be_a_friend_1794848600875.jpg',
    '/src/assets/images/poster_stop_bullying_1794848600284.jpg',
  ],
};

export const SAMPLE_ASPIRATIONS: Aspiration[] = [
  {
    id: 'sample-1',
    category: 'Lingkungan dan Kebersihan',
    message:
      'Semoga di depan setiap kelas dan dekat kantin ditambah tempat sampah terpilah (organik dan anorganik) supaya siswa makin terbiasa memilah sampah sejak dini.',
    author: 'Raka Pratama - 8B',
    createdAt: '2026-11-15T08:30:00.000Z',
    isHidden: false,
    isSample: true,
  },
  {
    id: 'sample-2',
    category: 'Keamanan dan Anti-Bullying',
    message:
      'Saya sangat setuju sekolah kita punya gerakan saling dukung antarangkatan. Semoga ada kegiatan kelas inspirasi atau peer counselor supaya teman yang merasa sendirian punya tempat cerita yang aman.',
    author: 'Anonim',
    createdAt: '2026-11-14T13:15:00.000Z',
    isHidden: false,
    isSample: true,
  },
  {
    id: 'sample-3',
    category: 'Fasilitas Sekolah',
    message:
      'Kran air di area cuci tangan lapangan basket bagian timur alirannya agak kecil. Mohon bisa dicek agar nyaman dipakai setelah jam olahraga.',
    author: 'Nadia Putri - 9A',
    createdAt: '2026-11-13T10:45:00.000Z',
    isHidden: false,
    isSample: true,
  },
  {
    id: 'sample-4',
    category: 'Pembelajaran',
    message:
      'Belajar IPA dengan praktik langsung di laboratorium sangat seru! Semoga frekuensi praktikum sederhana bisa lebih rutin untuk kelas 7 dan 8.',
    author: 'Anonim',
    createdAt: '2026-11-12T09:20:00.000Z',
    isHidden: false,
    isSample: true,
  },
  {
    id: 'sample-5',
    category: 'Kegiatan dan Ekstrakurikuler',
    message:
      'Boleh dong diadakan festival karya dan pentas seni antarkelas di akhir semester agar bakat musik, tari, dan desain teman-teman bisa tampil.',
    author: 'Dimas Aji - 8E',
    createdAt: '2026-11-11T14:05:00.000Z',
    isHidden: false,
    isSample: true,
  },
  {
    id: 'sample-6',
    category: 'OSIS dan Organisasi',
    message:
      'Terima kasih OSIS yang sudah rutin membuat mading digital. Kalau bisa jadwal lomba classmeeting diumumkan seminggu lebih awal supaya tiap kelas bisa persiapan lebih matang.',
    author: 'Salsa Kirana - 7C',
    createdAt: '2026-11-10T11:10:00.000Z',
    isHidden: false,
    isSample: true,
    adminReply:
      'Terima kasih atas sarannya, Salsa! Pengurus OSIS sudah menjadwalkan publikasi panduan dan jadwal lomba classmeeting minimal 7 hari sebelum acara berlangsung melalui mading digital dan grup ketua kelas.',
    adminRepliedAt: '2026-11-10T15:40:00.000Z',
  },
];
