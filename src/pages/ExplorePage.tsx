import { MessageSquareOff, PenLine, Search } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { AspirationCard } from '../components/AspirationCard';
import {
  getCategoryGlassTile,
  GlassCategoryIcon,
} from '../components/GlassCategoryIcon';
import { PosterBanner } from '../components/PosterBanner';
import { EXPLORE_FILTERS } from '../config/appConfig';
import { Aspiration, CategoryFilter, PageRoute } from '../types/aspiration';

interface ExplorePageProps {
  aspirations: Aspiration[];
  isLoading?: boolean;
  galleryUrls: string[];
  isAdminLoggedIn: boolean;
  onUpdateGallery: (newUrls: string[]) => Promise<void> | void;
  onResetGallery: () => Promise<void> | void;
  onNavigate: (page: PageRoute) => void;
}

export function ExplorePage({
  aspirations,
  isLoading = false,
  galleryUrls,
  isAdminLoggedIn,
  onUpdateGallery,
  onResetGallery,
  onNavigate,
}: ExplorePageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>('Semua Aspirasi');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua Aspirasi': aspirations.length,
    };
    for (const item of aspirations) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [aspirations]);

  const filteredAspirations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return aspirations.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua Aspirasi' ||
        item.category === selectedCategory;
      const matchQuery =
        !q ||
        item.message.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [aspirations, selectedCategory, searchQuery]);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10"
    >
      {/* Galeri Foto Carousel */}
      <PosterBanner
        imageUrls={galleryUrls}
        headline="STOP BULLYING!"
        subheadline="Berani Peduli, Saling Menghargai."
        description="Sekolah yang nyaman dimulai dari sikap kita hari ini. Sampaikan kepedulian dan ide positifmu untuk menciptakan SMP Negeri 1 Ungaran yang ramah bagi semua."
        accentVariant="navy"
        canEdit={isAdminLoggedIn}
        onUpdateGallery={onUpdateGallery}
        onResetGallery={onResetGallery}
      />

      {/* Judul + Pencarian + Filter Kategori */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Jelajahi Aspirasi Teman-Temanmu
            </h2>
            <p className="text-sm text-sky-100/85 mt-1">
              Menampilkan{' '}
              <span className="font-mono font-semibold text-sky-200 tabular-nums">
                {filteredAspirations.length}
              </span>{' '}
              aspirasi terbaru yang telah dipublikasikan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aspirasi..."
                aria-label="Cari aspirasi"
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#08174B]/75 backdrop-blur-md border-2 border-sky-300/40 text-white placeholder:text-blue-200/65 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300"
              />
            </div>
          </div>
        </div>

        {/* Tombol Filter Kategori */}
        <div
          role="tablist"
          aria-label="Filter kategori aspirasi"
          className="flex flex-wrap items-center gap-2.5"
        >
          {EXPLORE_FILTERS.map((category) => {
            const isActive = selectedCategory === category;
            const count = categoryCounts[category] || 0;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedCategory(category)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-200/60 shadow-[0_6px_20px_-6px_rgba(56,189,248,0.65)]'
                    : 'bg-[#0C2168]/65 backdrop-blur-md text-sky-100 border-sky-300/30 hover:bg-[#133294]/80 hover:text-white hover:border-sky-300/55'
                }`}
              >
                {category !== 'Semua Aspirasi' && (
                  <GlassCategoryIcon
                    tile={getCategoryGlassTile(category)}
                    size="sm"
                    className="!w-6 !h-6 !rounded-lg"
                  />
                )}
                <span>{category}</span>
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? 'text-sky-100' : 'text-sky-300/90'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Daftar Kartu Aspirasi / Loading Skeleton / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="soft-neu-card rounded-2xl p-6 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3.5 pb-4 border-b border-sky-200/20">
                  <div className="w-13 h-13 rounded-2xl bg-sky-300/20" />
                  <div className="h-4 w-32 rounded bg-sky-300/20" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-sky-300/15" />
                  <div className="h-3.5 w-5/6 rounded bg-sky-300/15" />
                  <div className="h-3.5 w-2/3 rounded bg-sky-300/15" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAspirations.length > 0 ? (
          <motion.div
            layout={!prefersReducedMotion}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {filteredAspirations.map((aspiration, idx) => (
                <AspirationCard
                  key={aspiration.id}
                  aspiration={aspiration}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 18, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="soft-neu-card rounded-3xl p-10 sm:p-14 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-sky-400/20 border border-sky-300/35 text-sky-300 flex items-center justify-center mx-auto">
              <MessageSquareOff className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-lg text-white">
                Belum ada aspirasi pada kategori ini.
              </h3>
              <p className="text-sm text-blue-100/80 max-w-md mx-auto">
                {searchQuery.trim()
                  ? 'Tidak ditemukan aspirasi yang sesuai dengan kata kunci pencarianmu.'
                  : 'Jadilah siswa pertama yang membagikan ide atau saran pada kategori ini.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/15 border border-sky-200/30 hover:bg-white/25 transition-colors"
                >
                  Reset Pencarian
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('write')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border border-sky-200/45 transition-colors"
              >
                <PenLine className="w-4 h-4" />
                <span>Tulis Aspirasi Sekarang</span>
              </button>
            </div>
          </motion.div>
        )}
      </section>
    </motion.div>
  );
}
