import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  MessageSquareReply,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User as UserIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  getCategoryGlassTile,
  GlassCategoryIcon,
} from '../components/GlassCategoryIcon';
import { ADMIN_AUTH_DOMAIN } from '../config/appConfig';
import type { AdminSessionUser } from '../services/aspirationService';
import { Aspiration, MediaAssets, PageRoute } from '../types/aspiration';
import { formatIndonesianDateTime } from '../utils/dateFormat';
import { compressImageFile } from '../utils/imageCompression';

interface AdminPageProps {
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  authUser: AdminSessionUser | null;
  oauthFeedback?: string | null;
  aspirations: Aspiration[];
  mediaAssets: MediaAssets;
  onLoginWithGoogle: () => Promise<{
    oauthUrl: string;
    requiresNewTab: boolean;
  }>;
  onLoginWithCredentials: (username: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onToggleVisibility: (id: string, nextHidden: boolean) => Promise<void>;
  onDeleteAspiration: (id: string) => Promise<void>;
  onReplyAspiration: (id: string, reply: string) => Promise<void>;
  onSeedSamples: () => Promise<void>;
  onUpdateMediaAsset: <K extends keyof MediaAssets>(
    key: K,
    value: MediaAssets[K]
  ) => Promise<void>;
  onResetMediaAsset: (key: keyof MediaAssets) => Promise<void>;
  onNavigate: (page: PageRoute) => void;
}

type VisibilityFilter = 'all' | 'visible' | 'hidden';
type AdminTab = 'aspirations' | 'media';

export function AdminPage({
  isAuthenticated,
  isAuthChecking,
  authUser,
  oauthFeedback,
  aspirations,
  mediaAssets,
  onLoginWithGoogle,
  onLoginWithCredentials,
  onLogout,
  onToggleVisibility,
  onDeleteAspiration,
  onReplyAspiration,
  onSeedSamples,
  onUpdateMediaAsset,
  onResetMediaAsset,
  onNavigate,
}: AdminPageProps) {
  const prefersReducedMotion = useReducedMotion();

  // State Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pendingGoogleOAuthUrl, setPendingGoogleOAuthUrl] = useState<
    string | null
  >(null);
  const [copiedUid, setCopiedUid] = useState(false);

  // State Dashboard
  const [activeTab, setActiveTab] = useState<AdminTab>('aspirations');
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Aspiration | null>(null);
  const [mediaNotice, setMediaNotice] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [busyAspirationId, setBusyAspirationId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savedReplyId, setSavedReplyId] = useState<string | null>(null);

  const totalCount = aspirations.length;
  const visibleCount = aspirations.filter((a) => !a.isHidden).length;
  const hiddenCount = totalCount - visibleCount;

  const filteredAspirations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return aspirations.filter((item) => {
      const matchVisibility =
        visibilityFilter === 'all' ||
        (visibilityFilter === 'visible' && !item.isHidden) ||
        (visibilityFilter === 'hidden' && Boolean(item.isHidden));
      const matchQuery =
        !q ||
        item.message.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchVisibility && matchQuery;
    });
  }, [aspirations, visibilityFilter, searchQuery]);

  const isInIframe =
    typeof window !== 'undefined' && window.self !== window.top;
  const currentAdminUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#admin`
      : '#admin';

  const handleGoogleLogin = async () => {
    setLoginError('');
    setPendingGoogleOAuthUrl(null);
    setIsLoggingIn(true);
    try {
      const result = await onLoginWithGoogle();
      if (result.requiresNewTab) {
        setPendingGoogleOAuthUrl(result.oauthUrl);
        setIsLoggingIn(false);
      }
    } catch (err) {
      setLoginError(
        err instanceof Error && err.message
          ? err.message
          : 'Gagal menyiapkan login Google melalui Supabase.'
      );
      setIsLoggingIn(false);
    }
  };

  const handleCredentialsLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setLoginError('Masukkan username dan password admin terlebih dahulu.');
      setPendingGoogleOAuthUrl(null);
      return;
    }

    setLoginError('');
    setPendingGoogleOAuthUrl(null);
    setIsLoggingIn(true);
    try {
      await onLoginWithCredentials(cleanUsername, password);
      setPassword('');
    } catch (err) {
      if (err instanceof Error && err.message) {
        setLoginError(err.message);
      } else {
        setLoginError(
          'Gagal masuk ke Panel Admin. Periksa username dan password Anda.'
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCopyUid = async (uid: string) => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Abaikan jika clipboard API tidak tersedia
    }
  };

  const formatAdminIdentity = (email?: string | null) => {
    if (!email) return '';
    const domainSuffix = `@${ADMIN_AUTH_DOMAIN}`;
    return email.endsWith(domainSuffix)
      ? email.slice(0, -domainSuffix.length)
      : email;
  };

  const handleLogoFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setMediaNotice('');
    setMediaError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsSavingMedia(true);
    try {
      const compressed = await compressImageFile(file, 512, 0.85);
      await onUpdateMediaAsset('schoolLogoUrl', compressed);
      setMediaNotice('Logo sekolah berhasil diperbarui.');
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : 'Gagal mengunggah logo sekolah.'
      );
    } finally {
      setIsSavingMedia(false);
    }
  };

  const handleGalleryFileUpload = async (
    key: 'exploreGalleryUrls' | 'writeGalleryUrls',
    label: string,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setMediaNotice('');
    setMediaError('');
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (mediaAssets[key].length >= 10) {
      setMediaError(`${label} maksimal menampung 10 foto.`);
      return;
    }

    setIsSavingMedia(true);
    try {
      const compressed = await compressImageFile(file, 1280, 0.8);
      await onUpdateMediaAsset(key, [...mediaAssets[key], compressed]);
      setMediaNotice(`Foto baru berhasil ditambahkan ke ${label}.`);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : `Gagal menambah foto ke ${label}.`
      );
    } finally {
      setIsSavingMedia(false);
    }
  };

  const handleRemoveGalleryPhoto = async (
    key: 'exploreGalleryUrls' | 'writeGalleryUrls',
    index: number,
    label: string
  ) => {
    setMediaNotice('');
    setMediaError('');
    const current = mediaAssets[key];
    if (current.length <= 1) {
      setMediaError(`${label} harus memiliki minimal 1 foto.`);
      return;
    }

    setIsSavingMedia(true);
    try {
      await onUpdateMediaAsset(
        key,
        current.filter((_, idx) => idx !== index)
      );
      setMediaNotice(`Foto berhasil dihapus dari ${label}.`);
    } catch (err) {
      setMediaError(
        err instanceof Error ? err.message : `Gagal menghapus foto ${label}.`
      );
    } finally {
      setIsSavingMedia(false);
    }
  };

  const handleReplySubmit = async (item: Aspiration) => {
    const draft =
      replyDrafts[item.id] !== undefined
        ? replyDrafts[item.id]
        : (item.adminReply ?? '');
    setBusyAspirationId(item.id);
    try {
      await onReplyAspiration(item.id, draft);
      setSavedReplyId(item.id);
      window.setTimeout(() => {
        setSavedReplyId((prev) => (prev === item.id ? null : prev));
      }, 2500);
    } finally {
      setBusyAspirationId(null);
    }
  };

  const handleClearReply = async (item: Aspiration) => {
    setBusyAspirationId(item.id);
    try {
      setReplyDrafts((prev) => ({ ...prev, [item.id]: '' }));
      await onReplyAspiration(item.id, '');
      setSavedReplyId(null);
    } finally {
      setBusyAspirationId(null);
    }
  };

  // Tampilan Memeriksa Sesi Auth Admin
  if (isAuthChecking) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="soft-neu-card rounded-3xl p-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-7 h-7 text-sky-300 animate-spin" />
          <p className="text-sm font-medium text-sky-100">
            Memeriksa otorisasi Admin...
          </p>
        </div>
      </div>
    );
  }

  // Tampilan Login Admin (Username & Password serta Masuk dengan Google)
  if (!isAuthenticated) {
    const isNonAdminSignedIn = Boolean(authUser);

    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex items-center justify-center px-4 py-12"
      >
        <div className="w-full max-w-md soft-neu-card rounded-3xl p-7 sm:p-9 space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400/35 to-indigo-600/70 border border-sky-200/45 text-white flex items-center justify-center mx-auto shadow-[0_8px_20px_-6px_rgba(56,189,248,0.55)]">
              {isNonAdminSignedIn ? (
                <ShieldAlert className="w-5 h-5 text-amber-300" />
              ) : (
                <Lock className="w-5 h-5 text-sky-200" />
              )}
            </div>
            <h2 className="font-display font-extrabold text-2xl text-white">
              Login Panel Admin
            </h2>
            <p className="text-sm text-blue-100/85">
              {isNonAdminSignedIn
                ? 'Akun ini belum memiliki hak akses Admin untuk mengelola aspirasi.'
                : 'Masuk menggunakan username & password atau akun Google Admin terdaftar.'}
            </p>
          </div>

          {isNonAdminSignedIn && authUser && (
            <div className="soft-neu-inset rounded-2xl p-4 space-y-3 text-xs text-amber-100 border border-amber-300/35">
              <p className="font-semibold text-amber-200">
                Masuk sebagai: {formatAdminIdentity(authUser.email) || authUser.uid}
              </p>
              <p className="text-blue-100/80 leading-relaxed">
                Silakan keluar dan masuk kembali menggunakan akun Google Admin
                utama (<code className="font-mono text-sky-200">kls8a2026@gmail.com</code>).
              </p>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[#06123B]/80 border border-sky-300/25 px-3 py-2">
                <code className="font-mono text-[11px] text-sky-200 truncate">
                  {authUser.uid}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyUid(authUser.uid)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-sky-500/20 text-sky-100 hover:bg-sky-500/35 border border-sky-300/30 shrink-0 transition-colors"
                >
                  {copiedUid ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin UID</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {(loginError || oauthFeedback) && (
            <div
              className="rounded-2xl bg-rose-500/15 border border-rose-300/35 px-4 py-3 space-y-2.5"
              role="alert"
            >
              <p className="text-sm text-rose-200 font-medium text-center">
                {loginError || oauthFeedback}
              </p>
            </div>
          )}

          {pendingGoogleOAuthUrl && (
            <div className="rounded-2xl bg-emerald-500/15 border border-emerald-300/35 p-4 space-y-2.5 text-xs text-blue-100/90">
              <p className="font-semibold text-emerald-200">
                Pratinjau iframe tidak dapat menampilkan halaman login Google
                secara langsung.
              </p>
              <p className="leading-relaxed">
                Klik tombol di bawah untuk membuka halaman login Google melalui
                Supabase di tab baru:
              </p>
              <a
                href={pendingGoogleOAuthUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3.5 rounded-xl font-display font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 border border-emerald-200/40 shadow-sm transition-all inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lanjutkan Login Google di Tab Baru</span>
              </a>
            </div>
          )}

          {isNonAdminSignedIn ? (
            <button
              type="button"
              onClick={() => void onLogout()}
              className="w-full py-3.5 rounded-xl font-display font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-200/45 shadow-md transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar & Ganti Akun</span>
            </button>
          ) : (
            <div className="space-y-4">
              <form
                onSubmit={(e) => void handleCredentialsLogin(e)}
                className="space-y-3.5"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-username"
                    className="block text-xs font-display font-bold text-sky-100"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-username"
                      type="text"
                      required
                      autoComplete="username"
                      disabled={isLoggingIn}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username atau email admin"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-[#08174B]/85 border-2 border-sky-300/40 text-white placeholder:text-blue-200/55 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-display font-bold text-sky-100"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      disabled={isLoggingIn}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password admin"
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm bg-[#08174B]/85 border-2 border-sky-300/40 text-white placeholder:text-blue-200/55 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan password'
                          : 'Tampilkan password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-sky-200/80 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-5 rounded-xl font-display font-bold text-sm text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 border border-sky-200/45 shadow-[0_10px_28px_-8px_rgba(56,189,248,0.65)] transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2.5"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Masuk dengan Username</span>
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-sky-300/20" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-200/65">
                  atau
                </span>
                <div className="h-px flex-1 bg-sky-300/20" />
              </div>

              <button
                type="button"
                disabled={isLoggingIn}
                onClick={() => void handleGoogleLogin()}
                className="w-full py-3.5 px-5 rounded-xl font-display font-bold text-sm text-white bg-[#0C2168]/85 hover:bg-[#133294]/90 disabled:opacity-60 border border-sky-300/35 shadow-sm transition-all active:scale-[0.99] inline-flex items-center justify-center gap-2.5"
              >
                <ShieldCheck className="w-4 h-4 text-sky-300" />
                <span>Masuk dengan Google</span>
              </button>

              {isInIframe && (
                <p className="text-[11px] text-center text-sky-200/75 leading-relaxed">
                  Pop-up Google terblokir di pratinjau?{' '}
                  <a
                    href={currentAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-300 hover:text-white underline underline-offset-2"
                  >
                    <span>Buka di tab baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Tampilan Dashboard Admin
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8"
    >
      {/* Baris Judul Dashboard & Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
            <ShieldCheck className="w-4 h-4" />
            <span>
              Sesi Admin Aktif
              {authUser?.email
                ? ` · ${formatAdminIdentity(authUser.email)}`
                : ''}
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white mt-1">
            Dashboard Pengelolaan Aspirasi
          </h2>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-200/40 shadow-sm transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4 text-rose-200" />
          <span>Logout</span>
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="soft-neu-card rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-semibold text-sky-200/85">
            Jumlah Seluruh Aspirasi
          </p>
          <p className="font-display font-extrabold text-3xl text-white mt-2 tabular-nums">
            {totalCount}
          </p>
        </div>

        <div className="soft-neu-card rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-semibold text-sky-200/85">
            Jumlah Aspirasi Ditampilkan
          </p>
          <p className="font-display font-extrabold text-3xl text-emerald-300 mt-2 tabular-nums">
            {visibleCount}
          </p>
        </div>

        <div className="soft-neu-card rounded-2xl p-5 sm:p-6">
          <p className="text-xs font-semibold text-sky-200/85">
            Aspirasi Disembunyikan
          </p>
          <p className="font-display font-extrabold text-3xl text-amber-200 mt-2 tabular-nums">
            {hiddenCount}
          </p>
        </div>
      </div>

      {/* Tab Navigasi Panel Admin */}
      <div className="flex flex-wrap items-center gap-2 border-b border-sky-300/20 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('aspirations')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeTab === 'aspirations'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-200/50 shadow-sm'
              : 'bg-[#0C2168]/65 text-sky-100 hover:bg-[#133294]/80 border-sky-300/25'
          }`}
        >
          Manajemen Aspirasi
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            activeTab === 'media'
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-200/50 shadow-sm'
              : 'bg-[#0C2168]/65 text-sky-100 hover:bg-[#133294]/80 border-sky-300/25'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Logo Sekolah & Galeri Foto</span>
        </button>
      </div>

      {activeTab === 'aspirations' ? (
        <section className="space-y-5">
          {/* Toolbar Filter & Pencarian */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 bg-[#091A54]/75 p-1 rounded-xl border border-sky-300/25 self-start backdrop-blur-md">
              <button
                type="button"
                onClick={() => setVisibilityFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  visibilityFilter === 'all'
                    ? 'bg-sky-500 text-white'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setVisibilityFilter('visible')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  visibilityFilter === 'visible'
                    ? 'bg-sky-500 text-white'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                Ditampilkan ({visibleCount})
              </button>
              <button
                type="button"
                onClick={() => setVisibilityFilter('hidden')}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  visibilityFilter === 'hidden'
                    ? 'bg-sky-500 text-white'
                    : 'text-sky-200 hover:text-white'
                }`}
              >
                Disembunyikan ({hiddenCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-sky-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari isi, pengirim, atau kategori..."
                aria-label="Cari aspirasi di panel admin"
                className="w-full md:w-72 pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#08174B]/80 border-2 border-sky-300/40 text-white placeholder:text-blue-200/60 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Daftar Aspirasi */}
          {filteredAspirations.length > 0 ? (
            <div className="space-y-4">
              {filteredAspirations.map((item) => {
                const draftValue =
                  replyDrafts[item.id] !== undefined
                    ? replyDrafts[item.id]
                    : (item.adminReply ?? '');
                const hasChanges =
                  draftValue.trim() !== (item.adminReply ?? '').trim();
                const isBusy = busyAspirationId === item.id;

                return (
                  <article
                    key={item.id}
                    className={`group soft-neu-card rounded-2xl p-5 sm:p-6 space-y-4 transition-opacity ${
                      item.isHidden ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <GlassCategoryIcon
                          tile={getCategoryGlassTile(
                            item.category,
                            item.message
                          )}
                          size="md"
                        />
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-semibold text-sky-300">
                              {item.category}
                            </span>
                            <span className="text-sky-300/40" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-white">
                              {item.author || 'Anonim'}
                            </span>
                            <span className="text-sky-300/40" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-sky-200/80 tabular-nums">
                              {formatIndonesianDateTime(item.createdAt)}
                            </span>
                            {item.isSample && (
                              <>
                                <span
                                  className="text-sky-300/40"
                                  aria-hidden="true"
                                >
                                  ·
                                </span>
                                <span className="text-sky-200/75">
                                  Data Contoh
                                </span>
                              </>
                            )}
                            <span className="text-sky-300/40" aria-hidden="true">
                              ·
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                item.isHidden
                                  ? 'text-amber-300'
                                  : 'text-emerald-300'
                              }`}
                            >
                              {item.isHidden ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Disembunyikan</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ditampilkan</span>
                                </>
                              )}
                            </span>
                          </div>

                          <p className="text-sm sm:text-[15px] text-blue-50 leading-relaxed whitespace-pre-line break-words">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      {/* Aksi Admin */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={async () => {
                            setBusyAspirationId(item.id);
                            try {
                              await onToggleVisibility(
                                item.id,
                                !item.isHidden
                              );
                            } finally {
                              setBusyAspirationId(null);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap disabled:opacity-50 ${
                            item.isHidden
                              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-300/40 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-200 border-amber-300/40 hover:bg-amber-500/30'
                          }`}
                        >
                          {item.isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Tampilkan</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Sembunyikan</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-200 bg-rose-500/20 border border-rose-300/40 hover:bg-rose-500/35 disabled:opacity-50 transition-colors whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>

                    {/* Kolom Tanggapan Admin */}
                    <div className="soft-neu-inset rounded-xl p-4 space-y-2.5 border border-sky-300/30">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label
                          htmlFor={`admin-reply-${item.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-sky-200"
                        >
                          <MessageSquareReply className="w-3.5 h-3.5 text-sky-300" />
                          <span>Tanggapan Admin (Tampil di Halaman Siswa)</span>
                        </label>
                        {item.adminRepliedAt && (
                          <span className="text-[11px] text-sky-200/75 tabular-nums">
                            Diperbarui:{' '}
                            {formatIndonesianDateTime(item.adminRepliedAt)}
                          </span>
                        )}
                      </div>

                      <textarea
                        id={`admin-reply-${item.id}`}
                        rows={2}
                        maxLength={400}
                        disabled={isBusy}
                        value={draftValue}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Tulis tanggapan resmi sekolah atau OSIS untuk aspirasi ini..."
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-[#071546]/85 border-2 border-sky-300/40 text-white placeholder:text-blue-200/55 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-300 resize-y"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleReplySubmit(item)}
                            disabled={
                              isBusy || (!draftValue.trim() && !item.adminReply)
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-45 disabled:cursor-not-allowed border border-sky-200/40 transition-colors whitespace-nowrap"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {item.adminReply
                                ? hasChanges
                                  ? 'Perbarui Tanggapan'
                                  : 'Simpan Tanggapan'
                                : 'Kirim Tanggapan'}
                            </span>
                          </button>

                          {item.adminReply && (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleClearReply(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-200 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-sky-300/25 transition-colors whitespace-nowrap"
                            >
                              <span>Hapus Tanggapan</span>
                            </button>
                          )}
                        </div>

                        {savedReplyId === item.id && (
                          <span
                            role="status"
                            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Tanggapan tersimpan</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="soft-neu-card rounded-2xl p-10 text-center space-y-4">
              <div className="space-y-1.5">
                <p className="font-display font-bold text-base text-white">
                  {totalCount === 0
                    ? 'Data aspirasi masih kosong'
                    : 'Tidak ada aspirasi ditemukan'}
                </p>
                <p className="text-sm text-sky-200/80">
                  {totalCount === 0
                    ? 'Anda dapat memuat 6 contoh aspirasi awal atau menunggu siswa mengirim aspirasi baru.'
                    : 'Coba ubah filter status atau kata kunci pencarian.'}
                </p>
              </div>
              {totalCount === 0 && (
                <button
                  type="button"
                  disabled={isSeeding}
                  onClick={async () => {
                    setIsSeeding(true);
                    try {
                      await onSeedSamples();
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 border border-sky-200/45 transition-colors"
                >
                  {isSeeding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  <span>
                    {isSeeding
                      ? 'Memuat Contoh Aspirasi...'
                      : 'Muat 6 Aspirasi Contoh'}
                  </span>
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        /* Pengaturan Logo Sekolah & Galeri Foto Carousel */
        <section className="space-y-6">
          {mediaNotice && (
            <div
              role="status"
              className="rounded-2xl bg-emerald-500/20 border border-emerald-300/40 px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-emerald-100"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{mediaNotice}</span>
            </div>
          )}

          {mediaError && (
            <div
              role="alert"
              className="rounded-2xl bg-rose-500/20 border border-rose-300/40 px-4 py-3 text-sm font-medium text-rose-100"
            >
              {mediaError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Logo Sekolah */}
            <div className="soft-neu-card rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <h3 className="font-display font-bold text-base text-white">
                  Logo Sekolah
                </h3>
                <p className="text-xs text-sky-200/80">
                  Ditampilkan pada header sebelah kiri halaman Beranda.
                </p>
                <div className="h-36 rounded-xl bg-[#08174B]/70 border border-sky-300/25 flex items-center justify-center p-4">
                  {mediaAssets.schoolLogoUrl ? (
                    <img
                      src={mediaAssets.schoolLogoUrl}
                      alt="Logo sekolah kustom"
                      className="max-h-28 object-contain"
                    />
                  ) : (
                    <span className="text-xs font-medium text-sky-200/80 text-center">
                      Menggunakan lambang bawaan SMP 1
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSavingMedia}
                    className="sr-only"
                    onChange={(e) => void handleLogoFileUpload(e)}
                  />
                </label>
                <button
                  type="button"
                  disabled={isSavingMedia}
                  onClick={async () => {
                    setMediaNotice('');
                    setMediaError('');
                    setIsSavingMedia(true);
                    try {
                      await onResetMediaAsset('schoolLogoUrl');
                      setMediaNotice('Logo sekolah dikembalikan ke bawaan.');
                    } finally {
                      setIsSavingMedia(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-100 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-sky-300/25 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Galeri Carousel Jelajahi Aspirasi */}
            <div className="soft-neu-card rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-base text-white">
                    Galeri Jelajahi Aspirasi
                  </h3>
                  <span className="text-xs font-semibold text-sky-200 bg-sky-400/20 px-2.5 py-0.5 rounded-lg border border-sky-300/35 tabular-nums">
                    {mediaAssets.exploreGalleryUrls.length} foto
                  </span>
                </div>
                <p className="text-xs text-sky-200/80">
                  Ditampilkan sebagai carousel galeri foto di halaman Jelajahi
                  Aspirasi.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {mediaAssets.exploreGalleryUrls.map((url, idx) => (
                    <div
                      key={`${url.slice(0, 28)}-${idx}`}
                      className="relative group h-20 rounded-xl overflow-hidden bg-[#08174B] border border-sky-300/30"
                    >
                      <img
                        src={url}
                        alt={`Foto galeri Jelajahi ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {mediaAssets.exploreGalleryUrls.length > 1 && (
                        <button
                          type="button"
                          disabled={isSavingMedia}
                          onClick={() =>
                            void handleRemoveGalleryPhoto(
                              'exploreGalleryUrls',
                              idx,
                              'Galeri Jelajahi Aspirasi'
                            )
                          }
                          aria-label={`Hapus foto ${idx + 1} dari Galeri Jelajahi`}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSavingMedia}
                    className="sr-only"
                    onChange={(e) =>
                      void handleGalleryFileUpload(
                        'exploreGalleryUrls',
                        'Galeri Jelajahi Aspirasi',
                        e
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={isSavingMedia}
                  onClick={async () => {
                    setMediaNotice('');
                    setMediaError('');
                    setIsSavingMedia(true);
                    try {
                      await onResetMediaAsset('exploreGalleryUrls');
                      setMediaNotice(
                        'Galeri Jelajahi Aspirasi dikembalikan ke foto bawaan.'
                      );
                    } finally {
                      setIsSavingMedia(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-100 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-sky-300/25 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Galeri Carousel Tulis Aspirasi */}
            <div className="soft-neu-card rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-base text-white">
                    Galeri Tulis Aspirasi
                  </h3>
                  <span className="text-xs font-semibold text-sky-200 bg-sky-400/20 px-2.5 py-0.5 rounded-lg border border-sky-300/35 tabular-nums">
                    {mediaAssets.writeGalleryUrls.length} foto
                  </span>
                </div>
                <p className="text-xs text-sky-200/80">
                  Ditampilkan sebagai carousel galeri foto di halaman Tulis
                  Aspirasi.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {mediaAssets.writeGalleryUrls.map((url, idx) => (
                    <div
                      key={`${url.slice(0, 28)}-${idx}`}
                      className="relative group h-20 rounded-xl overflow-hidden bg-[#08174B] border border-sky-300/30"
                    >
                      <img
                        src={url}
                        alt={`Foto galeri Tulis ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {mediaAssets.writeGalleryUrls.length > 1 && (
                        <button
                          type="button"
                          disabled={isSavingMedia}
                          onClick={() =>
                            void handleRemoveGalleryPhoto(
                              'writeGalleryUrls',
                              idx,
                              'Galeri Tulis Aspirasi'
                            )
                          }
                          aria-label={`Hapus foto ${idx + 1} dari Galeri Tulis`}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600/90 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 cursor-pointer transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSavingMedia}
                    className="sr-only"
                    onChange={(e) =>
                      void handleGalleryFileUpload(
                        'writeGalleryUrls',
                        'Galeri Tulis Aspirasi',
                        e
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={isSavingMedia}
                  onClick={async () => {
                    setMediaNotice('');
                    setMediaError('');
                    setIsSavingMedia(true);
                    try {
                      await onResetMediaAsset('writeGalleryUrls');
                      setMediaNotice(
                        'Galeri Tulis Aspirasi dikembalikan ke foto bawaan.'
                      );
                    } finally {
                      setIsSavingMedia(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-100 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-sky-300/25 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Aspirasi Secara Permanen?"
        description={
          deleteTarget
            ? `Aspirasi dari "${deleteTarget.author}" pada kategori "${deleteTarget.category}" akan dihapus secara permanen.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const id = deleteTarget.id;
            setDeleteTarget(null);
            setBusyAspirationId(id);
            void onDeleteAspiration(id).finally(() => {
              setBusyAspirationId(null);
            });
          }
        }}
      />
    </motion.div>
  );
}
