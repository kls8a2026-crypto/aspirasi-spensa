import { Compass, Lightbulb, PenLine } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  GlassCategoryIcon,
  GlassTileKey,
} from '../components/GlassCategoryIcon';
import { SCHOOL_INFO } from '../config/appConfig';
import { Aspiration, PageRoute } from '../types/aspiration';

interface HomePageProps {
  publicAspirations: Aspiration[];
  onNavigate: (page: PageRoute) => void;
}

interface HomeFeatureCard {
  tile: GlassTileKey;
  title: string;
  description: string;
  showCount?: boolean;
}

const FEATURE_CARDS: HomeFeatureCard[] = [
  {
    tile: 'speech',
    title: '01. Tulis Tanpa Login',
    description:
      'Pilih kategori aspirasi, tuliskan pesan secara sopan, dan kirimkan dengan nama asli atau sebagai Anonim.',
  },
  {
    tile: 'education',
    title: '02. Terbit Langsung',
    description:
      'Setiap aspirasi yang kamu kirim langsung dipublikasikan ke halaman Jelajahi Aspirasi agar bisa dibaca bersama.',
  },
  {
    tile: 'organization',
    title: '03. Terbuka & Terpantau',
    description: '',
    showCount: true,
  },
];

export function HomePage({ publicAspirations, onNavigate }: HomePageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative border-b border-sky-300/20">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto text-center flex flex-col items-center space-y-6"
          >
            <div className="inline-flex items-center gap-2.5 text-sm font-semibold text-sky-200">
              <Lightbulb className="w-5 h-5 text-amber-300 shrink-0" />
              <span>Ruang Suara Siswa {SCHOOL_INFO.name}</span>
            </div>

            <h1 className="font-display font-extrabold text-[clamp(2.25rem,4.4vw,3.6rem)] leading-[1.12] tracking-tight text-white drop-shadow-[0_4px_24px_rgba(56,189,248,0.28)] text-balance">
              Berani Bicara, Untuk Perubahan Nyata.
            </h1>

            <p className="text-base sm:text-[17px] leading-relaxed text-blue-100/90 max-w-2xl">
              Aspirasi Siswa adalah ruang bagi seluruh siswa SMP Negeri 1
              Ungaran untuk menyampaikan ide, saran, kritik, dan kepedulian demi
              menciptakan lingkungan sekolah yang lebih baik, aman, nyaman, dan
              menyenangkan.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onNavigate('write')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-display font-semibold text-sm sm:text-[15px] text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border border-sky-200/45 shadow-[0_10px_28px_-8px_rgba(56,189,248,0.65)] transition-all duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <PenLine className="w-4 h-4 shrink-0 text-sky-100" />
                <span>TULIS ASPIRASI SISWA</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-display font-semibold text-sm sm:text-[15px] text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-200/45 shadow-[0_10px_28px_-8px_rgba(139,92,246,0.58)] transition-all duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <Compass className="w-4 h-4 shrink-0 text-indigo-100" />
                <span>JELAJAHI ASPIRASI</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ringkasan Alur & Statistik Nyata */}
      <section className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURE_CARDS.map((card, idx) => (
            <motion.div
              key={card.title}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 24, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={
                prefersReducedMotion
                  ? undefined
                  : { y: -7, scale: 1.018 }
              }
              whileTap={
                prefersReducedMotion ? undefined : { scale: 0.99 }
              }
              transition={{
                duration: 0.42,
                delay: prefersReducedMotion ? 0 : 0.1 + idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group relative overflow-hidden soft-neu-card rounded-2xl p-6 space-y-3.5 transition-[border-color,box-shadow] duration-200 hover:border-sky-300/75 hover:shadow-[0_22px_46px_-14px_rgba(3,10,38,0.82),0_0_32px_-6px_rgba(56,189,248,0.42)]"
            >
              {/* Kilau kaca halus saat hover */}
              {!prefersReducedMotion && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-[360%] transition-transform duration-700 ease-out"
                />
              )}

              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { y: [0, -3, 0] }
                }
                transition={{
                  duration: 3.4 + idx * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: idx * 0.4,
                }}
                className="inline-block"
              >
                <GlassCategoryIcon tile={card.tile} size="md" />
              </motion.div>

              <h2 className="font-display font-bold text-base text-white">
                {card.title}
              </h2>

              {card.showCount ? (
                <p className="text-sm text-blue-100/85 leading-relaxed">
                  Saat ini terdapat{' '}
                  <strong className="font-mono tabular-nums text-sky-200">
                    {publicAspirations.length}
                  </strong>{' '}
                  aspirasi siswa yang aktif ditampilkan pada halaman Jelajahi
                  Aspirasi.
                </p>
              ) : (
                <p className="text-sm text-blue-100/85 leading-relaxed">
                  {card.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
