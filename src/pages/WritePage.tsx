import {
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  PenLine,
  Send,
  UserCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { FormEvent, useState } from 'react';
import {
  getCategoryGlassTile,
  GlassCategoryIcon,
} from '../components/GlassCategoryIcon';
import { PosterBanner } from '../components/PosterBanner';
import { ASPIRATION_CATEGORIES, FORM_LIMITS } from '../config/appConfig';
import {
  AspirationCategory,
  CreateAspirationInput,
  PageRoute,
} from '../types/aspiration';

interface WritePageProps {
  galleryUrls: string[];
  isAdminLoggedIn: boolean;
  onUpdateGallery: (newUrls: string[]) => Promise<void> | void;
  onResetGallery: () => Promise<void> | void;
  onPublishAspiration: (input: CreateAspirationInput) => Promise<void>;
  onNavigate: (page: PageRoute) => void;
}

export function WritePage({
  galleryUrls,
  isAdminLoggedIn,
  onUpdateGallery,
  onResetGallery,
  onPublishAspiration,
  onNavigate,
}: WritePageProps) {
  const prefersReducedMotion = useReducedMotion();

  const [category, setCategory] = useState<AspirationCategory | ''>('');
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [errors, setErrors] = useState<{
    category?: string;
    message?: string;
  }>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const messageLength = message.length;
  const trimmedLength = message.trim().length;

  const validate = (): boolean => {
    const nextErrors: { category?: string; message?: string } = {};
    if (!category) {
      nextErrors.category = 'Silakan pilih kategori aspirasi terlebih dahulu.';
    }
    if (trimmedLength === 0) {
      nextErrors.message = 'Isi aspirasi wajib diisi.';
    } else if (trimmedLength < FORM_LIMITS.minMessageLength) {
      nextErrors.message = `Tuliskan aspirasi minimal ${FORM_LIMITS.minMessageLength} karakter agar pesan lebih jelas.`;
    } else if (messageLength > FORM_LIMITS.maxMessageLength) {
      nextErrors.message = `Maksimal panjang aspirasi adalah ${FORM_LIMITS.maxMessageLength} karakter.`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);
    setSubmitError('');

    if (!validate() || !category) return;

    setIsSubmitting(true);
    try {
      await onPublishAspiration({
        category,
        message,
        author,
      });

      setCategory('');
      setMessage('');
      setAuthor('');
      setErrors({});
      setIsSuccess(true);
    } catch {
      setSubmitError(
        'Gagal mengirim aspirasi ke server. Periksa koneksi internet Anda dan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10"
    >
      {/* Galeri Foto Carousel */}
      <PosterBanner
        imageUrls={galleryUrls}
        headline="Jadilah Teman, Bukan Alasan Seseorang Takut ke Sekolah."
        subheadline="Tolak bullying. Dukung teman yang membutuhkan."
        description="Tolak bullying. Dukung teman yang membutuhkan. Mari menciptakan sekolah yang aman dan nyaman bagi semua."
        accentVariant="emerald"
        canEdit={isAdminLoggedIn}
        onUpdateGallery={onUpdateGallery}
        onResetGallery={onResetGallery}
      />

      {/* Formulir Penulisan Aspirasi */}
      <section className="soft-neu-card rounded-3xl p-6 sm:p-9 lg:p-10 space-y-7">
        <div className="space-y-2 border-b border-sky-200/20 pb-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
            <PenLine className="w-4 h-4" />
            <span>Publikasi Langsung Tanpa Login</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
            Sampaikan Ide dan Aspirasimu
          </h2>
          <p className="text-sm sm:text-[15px] text-blue-100/85">
            Setiap aspirasi yang kamu kirim akan langsung dipublikasikan di
            halaman Jelajahi Aspirasi agar dapat dibaca bersama.
          </p>
        </div>

        {/* Notifikasi Berhasil */}
        {isSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-emerald-500/20 border-2 border-emerald-300/45 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
              <div>
                <p className="font-display font-bold text-sm sm:text-base text-white">
                  Terima kasih! Aspirasi kamu berhasil dipublikasikan.
                </p>
                <p className="text-xs sm:text-sm text-emerald-100/90 mt-0.5">
                  Aspirasimu kini sudah tampil di halaman Jelajahi Aspirasi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-300/40 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat di Jelajahi Aspirasi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="rounded-2xl bg-rose-500/20 border-2 border-rose-300/45 p-4 text-sm text-rose-100"
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* 1. Kategori Aspirasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="aspiration-category"
                className="block text-sm font-semibold text-white"
              >
                Kategori Aspirasi <span className="text-rose-300">*</span>
              </label>
              {category && (
                <div className="flex items-center gap-2 text-xs text-sky-200">
                  <GlassCategoryIcon
                    tile={getCategoryGlassTile(category, message)}
                    size="sm"
                    className="!w-7 !h-7 !rounded-lg"
                  />
                  <span>Ikon kartu terpilih</span>
                </div>
              )}
            </div>
            <select
              id="aspiration-category"
              value={category}
              disabled={isSubmitting}
              onChange={(e) => {
                setCategory(e.target.value as AspirationCategory | '');
                if (errors.category) {
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.category)}
              className={`w-full px-4 py-3 rounded-xl text-sm sm:text-[15px] bg-[#08174B]/80 border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 ${
                errors.category
                  ? 'border-rose-400 text-rose-100'
                  : 'border-sky-300/50 text-white'
              }`}
            >
              <option value="" className="bg-[#0B2066] text-sky-200">
                -- Pilih Kategori Aspirasi --
              </option>
              {ASPIRATION_CATEGORIES.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-[#0B2066] text-white"
                >
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p
                className="text-xs sm:text-sm text-rose-300 font-medium"
                role="alert"
              >
                {errors.category}
              </p>
            )}
          </div>

          {/* 2. Isi Aspirasi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="aspiration-message"
                className="block text-sm font-semibold text-white"
              >
                Isi Aspirasi <span className="text-rose-300">*</span>
              </label>
              <span
                className={`text-xs font-mono tabular-nums ${
                  messageLength > FORM_LIMITS.maxMessageLength
                    ? 'text-rose-300 font-semibold'
                    : 'text-sky-200/80'
                }`}
              >
                {messageLength} / {FORM_LIMITS.maxMessageLength}
              </span>
            </div>
            <textarea
              id="aspiration-message"
              rows={6}
              maxLength={FORM_LIMITS.maxMessageLength}
              disabled={isSubmitting}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors((prev) => ({ ...prev, message: undefined }));
                }
              }}
              placeholder="Tuliskan ide, saran, kritik yang membangun, atau kepedulianmu untuk lingkungan SMP Negeri 1 Ungaran..."
              aria-invalid={Boolean(errors.message)}
              className={`w-full px-4 py-3.5 rounded-2xl text-sm sm:text-[15px] leading-relaxed bg-[#08174B]/80 border-2 transition-colors resize-y focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 ${
                errors.message
                  ? 'border-rose-400 text-rose-100'
                  : 'border-sky-300/50 text-white placeholder:text-blue-200/60'
              }`}
            />
            {errors.message && (
              <p
                className="text-xs sm:text-sm text-rose-300 font-medium"
                role="alert"
              >
                {errors.message}
              </p>
            )}
          </div>

          {/* 3. Nama Pengirim (Opsional) */}
          <div className="space-y-2">
            <label
              htmlFor="aspiration-author"
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <UserCheck className="w-4 h-4 text-sky-300" />
              <span>Nama Pengirim (Opsional)</span>
            </label>
            <input
              id="aspiration-author"
              type="text"
              maxLength={FORM_LIMITS.maxAuthorLength}
              disabled={isSubmitting}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Contoh: Raka - 8A (Kosongkan untuk mengirim sebagai Anonim)"
              className="w-full px-4 py-3 rounded-xl text-sm sm:text-[15px] bg-[#08174B]/80 border-2 border-sky-300/50 text-white placeholder:text-blue-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300"
            />
            <p className="text-xs text-sky-200/80">
              Jika kolom ini dikosongkan, identitas pengirim otomatis tampil
              sebagai <strong className="text-white">Anonim</strong>.
            </p>
          </div>

          {/* Pengingat Etika Bahasa */}
          <div className="soft-neu-inset rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-300 mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              <strong className="text-white">
                Etika Penyampaian Aspirasi:
              </strong>{' '}
              Gunakan bahasa yang santun, jujur, dan membangun. Dilarang
              mengirimkan hinaan, ancaman, fitnah, ujaran kebencian, maupun
              menyebarkan data pribadi orang lain.
            </p>
          </div>

          {/* Tombol Kirim */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-display font-semibold text-sm sm:text-[15px] text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 border border-sky-200/45 shadow-[0_10px_28px_-8px_rgba(56,189,248,0.65)] transition-all duration-150 active:scale-[0.98] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>MENGIRIM...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>KIRIM ASPIRASI</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </motion.div>
  );
}
