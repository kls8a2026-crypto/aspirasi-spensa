import { AspirationCategory } from '../types/aspiration';

export type GlassTileKey =
  | 'school'
  | 'hygiene'
  | 'education'
  | 'organization'
  | 'canteen'
  | 'security'
  | 'environment'
  | 'speech';

interface SpriteRect {
  x: number;
  y: number;
}

const IMAGE_WIDTH = 1672;
const IMAGE_HEIGHT = 941;
const TILE_SIZE = 300;

/**
 * Koordinat crop 300x300 untuk 8 ikon kaca futuristik pada aset
 * /assets/aistudio/Futuristic_Glass_Icon_Grid_3c3e27c1.png (1672x941).
 */
const TILE_RECTS: Record<GlassTileKey, SpriteRect> = {
  school: { x: 156, y: 131 },       // Baris 1, Kolom 1: Gedung Sekolah
  hygiene: { x: 510, y: 131 },      // Baris 1, Kolom 2: Kebersihan / Sanitasi
  education: { x: 865, y: 131 },    // Baris 1, Kolom 3: Topi Toga / Pembelajaran
  organization: { x: 1215, y: 131 },// Baris 1, Kolom 4: Grup Siswa / Organisasi
  canteen: { x: 156, y: 484 },      // Baris 2, Kolom 1: Sendok & Garpu / Kantin
  security: { x: 510, y: 484 },     // Baris 2, Kolom 2: Perisai & Gembok / Keamanan
  environment: { x: 865, y: 484 },  // Baris 2, Kolom 3: Daun / Lingkungan
  speech: { x: 1215, y: 484 },      // Baris 2, Kolom 4: Balon Pesan / Aspirasi
};

export function getCategoryGlassTile(
  category: AspirationCategory,
  message = ''
): GlassTileKey {
  const lower = message.toLowerCase();

  if (
    category === 'Lingkungan dan Kebersihan' &&
    /(toilet|wc|kamar mandi|wastafel|sanitasi)/.test(lower)
  ) {
    return 'hygiene';
  }
  if (
    (category === 'Fasilitas Sekolah' || category === 'Lingkungan dan Kebersihan') &&
    /(kantin|makan|jajan|minum|gizi)/.test(lower)
  ) {
    return 'canteen';
  }

  switch (category) {
    case 'Fasilitas Sekolah':
      return 'school';
    case 'Lingkungan dan Kebersihan':
      return 'environment';
    case 'Pembelajaran':
      return 'education';
    case 'Keamanan dan Anti-Bullying':
      return 'security';
    case 'Kegiatan dan Ekstrakurikuler':
      return 'canteen';
    case 'OSIS dan Organisasi':
      return 'organization';
    default:
      return 'speech';
  }
}

interface GlassCategoryIconProps {
  tile: GlassTileKey;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-13 h-13 rounded-2xl',
  lg: 'w-16 h-16 rounded-2xl',
};

export function GlassCategoryIcon({
  tile,
  size = 'md',
  className = '',
}: GlassCategoryIconProps) {
  const rect = TILE_RECTS[tile];
  const widthPct = (IMAGE_WIDTH / TILE_SIZE) * 100;
  const heightPct = (IMAGE_HEIGHT / TILE_SIZE) * 100;
  const leftPct = -(rect.x / TILE_SIZE) * 100;
  const topPct = -(rect.y / TILE_SIZE) * 100;

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden shrink-0 ring-1 ring-sky-200/50 shadow-[0_8px_20px_-6px_rgba(56,189,248,0.55),inset_0_1px_0_rgba(255,255,255,0.45)] transition-transform duration-200 group-hover:scale-105 ${SIZE_CLASSES[size]} ${className}`}
    >
      <img
        src="/assets/aistudio/Futuristic_Glass_Icon_Grid_3c3e27c1.png"
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          maxWidth: 'none',
          left: `${leftPct}%`,
          top: `${topPct}%`,
        }}
        className="pointer-events-none select-none"
      />
    </div>
  );
}
