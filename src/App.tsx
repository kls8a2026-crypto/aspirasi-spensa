/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ParticleBackground } from './components/ParticleBackground';
import { DEFAULT_MEDIA_ASSETS } from './config/appConfig';
import { AdminPage } from './pages/AdminPage';
import { ExplorePage } from './pages/ExplorePage';
import { HomePage } from './pages/HomePage';
import { WritePage } from './pages/WritePage';
import {
  type AdminSessionUser,
  consumeSupabaseOAuthCallback,
  logoutAdmin,
  publishAspiration,
  removeAspiration,
  replyToAspiration,
  seedSampleAspirations,
  signInAdminWithCredentials,
  signInAdminWithGoogle,
  subscribeAllAspirations,
  subscribeMediaSettings,
  subscribePublicAspirations,
  toggleAspirationVisibility,
  updateMediaSettings,
} from './services/aspirationService';
import {
  Aspiration,
  CreateAspirationInput,
  MediaAssets,
  PageRoute,
} from './types/aspiration';

const HASH_TO_ROUTE: Record<string, PageRoute> = {
  '#beranda': 'home',
  '#jelajahi': 'explore',
  '#tulis': 'write',
  '#admin': 'admin',
};

const ROUTE_TO_HASH: Record<PageRoute, string> = {
  home: '#beranda',
  explore: '#jelajahi',
  write: '#tulis',
  admin: '#admin',
};

function getInitialRoute(): PageRoute {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('access_token=') || hash.includes('error=')) {
    return 'admin';
  }
  return HASH_TO_ROUTE[hash] ?? 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);
  const [publicAspirations, setPublicAspirations] = useState<Aspiration[]>([]);
  const [adminAspirations, setAdminAspirations] = useState<Aspiration[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(true);
  const [mediaAssets, setMediaAssets] = useState<MediaAssets>(
    DEFAULT_MEDIA_ASSETS
  );

  // State Auth Admin (Supabase Auth in-memory)
  const [authUser, setAuthUser] = useState<AdminSessionUser | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [oauthFeedback, setOauthFeedback] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // Sinkronkan navigasi dengan hash URL agar tombol Back/Forward browser berfungsi
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.toLowerCase();
      if (rawHash.includes('access_token=') || rawHash.includes('error=')) {
        setCurrentPage('admin');
        return;
      }
      const next = HASH_TO_ROUTE[rawHash] ?? 'home';
      setCurrentPage(next);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Tangani callback OAuth Google dari Supabase saat halaman dimuat
  useEffect(() => {
    let cancelled = false;
    void consumeSupabaseOAuthCallback()
      .then((result) => {
        if (cancelled) return;
        if (result.status === 'authenticated') {
          setAuthUser(result.user);
          setIsAdminVerified(true);
          setOauthFeedback(null);
          setCurrentPage('admin');
        } else if (result.status === 'unauthorized') {
          setAuthUser(result.user);
          setIsAdminVerified(false);
          setOauthFeedback(null);
          setCurrentPage('admin');
        } else if (result.status === 'error') {
          setAuthUser(null);
          setIsAdminVerified(false);
          setOauthFeedback(result.message);
          setCurrentPage('admin');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Muat aspirasi publik & pengaturan media
  useEffect(() => {
    const unsubPublic = subscribePublicAspirations(
      (items) => {
        setPublicAspirations(items);
        setIsLoadingPublic(false);
        setDataError(null);
      },
      (err) => {
        setIsLoadingPublic(false);
        setDataError(err.message);
      }
    );

    const unsubMedia = subscribeMediaSettings(
      (assets) => setMediaAssets(assets),
      (err) => setDataError(err.message)
    );

    return () => {
      unsubPublic();
      unsubMedia();
    };
  }, []);

  // Muat seluruh aspirasi (termasuk disembunyikan) khusus Admin terverifikasi
  useEffect(() => {
    if (!isAdminVerified) return;

    const unsubAdmin = subscribeAllAspirations(
      (items) => {
        setAdminAspirations(items);
        setDataError(null);
      },
      (err) => setDataError(err.message)
    );

    return () => unsubAdmin();
  }, [isAdminVerified]);

  const handleNavigate = useCallback((page: PageRoute) => {
    setCurrentPage(page);
    const targetHash = ROUTE_TO_HASH[page];
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePublishAspiration = useCallback(
    async (input: CreateAspirationInput) => {
      await publishAspiration(input);
    },
    []
  );

  const handleToggleVisibility = useCallback(
    async (id: string, nextHidden: boolean) => {
      if (!isAdminVerified) return;
      await toggleAspirationVisibility(id, nextHidden);
    },
    [isAdminVerified]
  );

  const handleDeleteAspiration = useCallback(
    async (id: string) => {
      if (!isAdminVerified) return;
      await removeAspiration(id);
    },
    [isAdminVerified]
  );

  const handleReplyAspiration = useCallback(
    async (id: string, reply: string) => {
      if (!isAdminVerified) return;
      await replyToAspiration(id, reply);
    },
    [isAdminVerified]
  );

  const handleSeedSamples = useCallback(async () => {
    if (!isAdminVerified) return;
    await seedSampleAspirations();
  }, [isAdminVerified]);

  const handleUpdateMedia = useCallback(
    async <K extends keyof MediaAssets>(key: K, value: MediaAssets[K]) => {
      if (!isAdminVerified) return;
      const next: MediaAssets = {
        ...mediaAssets,
        [key]: value,
      };
      await updateMediaSettings(next);
    },
    [isAdminVerified, mediaAssets]
  );

  const handleResetMedia = useCallback(
    async (key: keyof MediaAssets) => {
      if (!isAdminVerified) return;
      const next: MediaAssets = {
        ...mediaAssets,
        [key]: DEFAULT_MEDIA_ASSETS[key],
      };
      await updateMediaSettings(next);
    },
    [isAdminVerified, mediaAssets]
  );

  const handleAdminGoogleLogin = useCallback(async () => {
    setOauthFeedback(null);
    return signInAdminWithGoogle();
  }, []);

  const handleAdminCredentialsLogin = useCallback(
    async (username: string, password: string) => {
      setOauthFeedback(null);
      const user = await signInAdminWithCredentials(username, password);
      setAuthUser(user);
      setIsAdminVerified(true);
      setIsCheckingAdmin(false);
    },
    []
  );

  const handleAdminLogout = useCallback(async () => {
    await logoutAdmin();
    setAuthUser(null);
    setIsAdminVerified(false);
    setOauthFeedback(null);
    setAdminAspirations([]);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col text-[#F0F7FF]">
      <ParticleBackground />

      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        schoolLogoUrl={mediaAssets.schoolLogoUrl}
        isAdminLoggedIn={isAdminVerified}
        onAdminLogout={() => void handleAdminLogout()}
      />

      <main className="relative z-10 flex-1 flex flex-col">
        {dataError && (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
            <div
              role="alert"
              className="rounded-2xl bg-rose-500/20 border border-rose-300/40 px-4 py-3 flex items-center justify-between gap-3 text-sm text-rose-100"
            >
              <span>{dataError}</span>
              <button
                type="button"
                onClick={() => setDataError(null)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
        {currentPage === 'home' && (
          <HomePage
            publicAspirations={publicAspirations}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'explore' && (
          <ExplorePage
            aspirations={publicAspirations}
            isLoading={isLoadingPublic}
            galleryUrls={mediaAssets.exploreGalleryUrls}
            isAdminLoggedIn={isAdminVerified}
            onUpdateGallery={(urls) =>
              handleUpdateMedia('exploreGalleryUrls', urls)
            }
            onResetGallery={() => handleResetMedia('exploreGalleryUrls')}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'write' && (
          <WritePage
            galleryUrls={mediaAssets.writeGalleryUrls}
            isAdminLoggedIn={isAdminVerified}
            onUpdateGallery={(urls) =>
              handleUpdateMedia('writeGalleryUrls', urls)
            }
            onResetGallery={() => handleResetMedia('writeGalleryUrls')}
            onPublishAspiration={handlePublishAspiration}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'admin' && (
          <AdminPage
            isAuthenticated={isAdminVerified}
            isAuthChecking={isCheckingAdmin}
            authUser={authUser}
            oauthFeedback={oauthFeedback}
            aspirations={adminAspirations}
            mediaAssets={mediaAssets}
            onLoginWithGoogle={handleAdminGoogleLogin}
            onLoginWithCredentials={handleAdminCredentialsLogin}
            onLogout={handleAdminLogout}
            onToggleVisibility={handleToggleVisibility}
            onDeleteAspiration={handleDeleteAspiration}
            onReplyAspiration={handleReplyAspiration}
            onSeedSamples={handleSeedSamples}
            onUpdateMediaAsset={handleUpdateMedia}
            onResetMediaAsset={handleResetMedia}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
