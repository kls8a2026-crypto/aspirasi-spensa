import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import { compressImageFile } from '../utils/imageCompression';

interface PosterBannerProps {
  imageUrls: string[];
  headline: string;
  subheadline: string;
  description?: string;
  accentVariant?: 'navy' | 'emerald';
  canEdit?: boolean;
  onUpdateGallery?: (newUrls: string[]) => Promise<void> | void;
  onResetGallery?: () => Promise<void> | void;
}

export function PosterBanner({
  imageUrls,
  headline,
  subheadline,
  canEdit = false,
  onUpdateGallery,
  onResetGallery,
}: PosterBannerProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeImages = imageUrls.length > 0 ? imageUrls : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeIndex >= safeImages.length && safeImages.length > 0) {
      setActiveIndex(safeImages.length - 1);
    }
  }, [activeIndex, safeImages.length]);

  useEffect(() => {
    if (
      prefersReducedMotion ||
      isPaused ||
      isModalOpen ||
      safeImages.length <= 1
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % safeImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isPaused, isModalOpen, safeImages.length]);

  const goToIndex = (nextIndex: number) => {
    if (safeImages.length <= 1) return;
    setDirection(nextIndex >= activeIndex ? 1 : -1);
    setActiveIndex((nextIndex + safeImages.length) % safeImages.length);
  };

  const handlePrev = () => {
    if (safeImages.length <= 1) return;
    setDirection(-1);
    setActiveIndex(
      (prev) => (prev - 1 + safeImages.length) % safeImages.length
    );
  };

  const handleNext = () => {
    if (safeImages.length <= 1) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdateGallery) return;

    if (safeImages.length >= 10) {
      setUploadError('Maksimal 10 foto dalam satu galeri.');
      return;
    }

    setIsSaving(true);
    try {
      const compressed = await compressImageFile(file, 1280, 0.8);
      const next = [...safeImages, compressed];
      await onUpdateGallery(next);
      setDirection(1);
      setActiveIndex(next.length - 1);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal memproses gambar. Silakan coba lagi.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUploadError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('Masukkan tautan gambar terlebih dahulu.');
      return;
    }
    if (safeImages.length >= 10) {
      setUploadError('Maksimal 10 foto dalam satu galeri.');
      return;
    }
    if (!onUpdateGallery) return;

    setIsSaving(true);
    try {
      const next = [...safeImages, trimmed];
      await onUpdateGallery(next);
      setDirection(1);
      setActiveIndex(next.length - 1);
      setUrlInput('');
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan tautan gambar.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    if (!onUpdateGallery || safeImages.length <= 1 || isSaving) return;
    setUploadError('');
    setIsSaving(true);
    try {
      const next = safeImages.filter((_, idx) => idx !== indexToRemove);
      await onUpdateGallery(next);
      if (activeIndex >= next.length) {
        setActiveIndex(next.length - 1);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal menghapus foto.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const currentUrl = safeImages[activeIndex] ?? '';
  const isCurrentBroken = !currentUrl || Boolean(brokenUrls[currentUrl]);

  return (
    <>
      <section
        aria-label={`Galeri Foto: ${headline}`}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        className="space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-3xl"
      >
        <div className="relative overflow-hidden rounded-3xl soft-neu-card bg-[#0A1F64] aspect-[16/9] max-h-[520px] w-full">
          <AnimatePresence initial={false} mode="popLayout" custom={direction}>
            {!isCurrentBroken ? (
              <motion.img
                key={`${currentUrl}-${activeIndex}`}
                src={currentUrl}
                alt={`Galeri foto ${activeIndex + 1} dari ${safeImages.length}: ${headline} - ${subheadline}`}
                referrerPolicy="no-referrer"
                onError={() =>
                  setBrokenUrls((prev) => ({ ...prev, [currentUrl]: true }))
                }
                custom={direction}
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, x: direction > 0 ? 48 : -48 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, x: direction > 0 ? -48 : 48 }
                }
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full object-cover object-center select-none"
              />
            ) : (
              <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#0F2C85] via-[#173AA6] to-[#1E44BA]">
                <ShieldAlert className="w-12 h-12 text-sky-300 mb-3" />
                <p className="font-display font-bold text-lg text-white">
                  {headline}
                </p>
                <p className="text-sm text-sky-200 mt-1">{subheadline}</p>
              </div>
            )}
          </AnimatePresence>

          {/* Kontrol Navigasi Kiri / Kanan */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Foto sebelumnya"
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0A1D5E]/80 hover:bg-[#14359E] text-white shadow-lg backdrop-blur-md border border-sky-200/40 flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Foto berikutnya"
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#0A1D5E]/80 hover:bg-[#14359E] text-white shadow-lg backdrop-blur-md border border-sky-200/40 flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Tombol Kelola Galeri (Hanya Admin) */}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setUploadError('');
                setIsModalOpen(true);
              }}
              className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0A1D5E]/85 hover:bg-[#14359E] backdrop-blur-md border border-sky-200/40 shadow-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ImagePlus className="w-3.5 h-3.5 text-sky-300" />
              <span>Kelola Galeri</span>
            </button>
          )}

          {/* Indikator Titik & Nomor Slide */}
          {safeImages.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#051038]/75 via-[#051038]/25 to-transparent flex items-end justify-between px-4 sm:px-6 pb-3.5">
              <span className="pointer-events-auto text-xs font-mono font-semibold text-white tabular-nums bg-[#08174B]/70 border border-sky-300/30 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                {activeIndex + 1} / {safeImages.length}
              </span>

              <div
                className="pointer-events-auto flex items-center gap-2"
                role="tablist"
                aria-label="Pilih foto galeri"
              >
                {safeImages.map((_, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Foto ${idx + 1}`}
                      onClick={() => goToIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                        isActive
                          ? 'w-7 bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.85)]'
                          : 'w-2.5 bg-white/50 hover:bg-white/85'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Strip Thumbnail Galeri Foto */}
        {safeImages.length > 1 && (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {safeImages.map((url, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`${url.slice(0, 40)}-${idx}`}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  aria-label={`Tampilkan foto galeri ${idx + 1}`}
                  className={`relative h-14 sm:h-16 w-24 sm:w-28 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                    isActive
                      ? 'border-sky-300 shadow-[0_0_16px_-2px_rgba(56,189,248,0.65)] scale-[1.02]'
                      : 'border-sky-300/25 opacity-70 hover:opacity-100 hover:border-sky-300/50'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Kelola Galeri Foto (Hanya Admin) */}
      {canEdit && isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040C2E]/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="poster-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl soft-neu-card border-2 border-sky-300/35 p-6 space-y-5 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="poster-modal-title"
                  className="font-display font-bold text-lg text-white"
                >
                  Kelola Galeri Foto
                </h3>
                <p className="text-sm text-sky-100/80 mt-1">
                  Tambahkan foto baru atau hapus foto dari carousel galeri.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daftar Foto Saat Ini */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">
                Daftar Foto ({safeImages.length} / 10)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {safeImages.map((url, idx) => (
                  <div
                    key={`${url.slice(0, 30)}-${idx}`}
                    className="relative group rounded-xl overflow-hidden border border-sky-300/30 aspect-[16/10] bg-[#08174B]"
                  >
                    <img
                      src={url}
                      alt={`Foto galeri ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {safeImages.length > 1 && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleRemoveImage(idx)}
                        aria-label={`Hapus foto ${idx + 1}`}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 disabled:opacity-50 text-white shadow-sm transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-sm font-semibold text-white mb-2">
                  Tambah Foto dari Perangkat
                </span>
                <div className="flex items-center justify-center w-full px-4 py-5 rounded-xl border-2 border-dashed border-sky-300/40 bg-[#08174B]/60 hover:bg-[#0D236B]/70 transition-colors cursor-pointer">
                  <div className="text-center space-y-1.5">
                    <Upload className="w-6 h-6 text-sky-300 mx-auto" />
                    <p className="text-sm font-medium text-white">
                      {isSaving
                        ? 'Menyimpan ke server...'
                        : 'Pilih file foto (JPG, PNG, WebP)'}
                    </p>
                    <p className="text-xs text-sky-200/80">
                      Otomatis dikompresi agar ringan & cepat dimuat
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSaving}
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              </label>

              <form onSubmit={handleUrlSubmit} className="space-y-2.5">
                <label
                  htmlFor="poster-url-input"
                  className="block text-sm font-semibold text-white"
                >
                  Atau Tambah dari Tautan Gambar
                </label>
                <div className="flex gap-2">
                  <input
                    id="poster-url-input"
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://contoh.sch.id/foto.jpg"
                    className="flex-1 px-3.5 py-2 rounded-xl text-sm border-2 border-sky-300/40 bg-[#08174B]/75 text-white placeholder:text-blue-200/60 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Tambah
                  </button>
                </div>
              </form>

              {uploadError && (
                <p className="text-sm text-rose-300 font-medium" role="alert">
                  {uploadError}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-sky-300/20 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  if (!onResetGallery) return;
                  setIsSaving(true);
                  try {
                    await onResetGallery();
                    setActiveIndex(0);
                    setIsModalOpen(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-200 hover:text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kembalikan Galeri Awal</span>
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-sky-100 hover:bg-white/10 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
