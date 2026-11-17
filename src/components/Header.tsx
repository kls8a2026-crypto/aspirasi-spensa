import { Home, LogOut, ShieldCheck } from 'lucide-react';
import { PageRoute } from '../types/aspiration';
import { SchoolLogo } from './SchoolLogo';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  schoolLogoUrl: string | null;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
}

const PAGE_TITLES: Record<Exclude<PageRoute, 'home'>, string> = {
  explore: 'Jelajahi Aspirasi',
  write: 'Tulis Aspirasi',
  admin: 'Panel Admin',
};

export function Header({
  currentPage,
  onNavigate,
  schoolLogoUrl,
  isAdminLoggedIn,
  onAdminLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 glass-surface border-b border-sky-300/25">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Brand pada Beranda, atau Judul Halaman pada sub-halaman */}
        <div className="flex items-center gap-3 min-w-0">
          {currentPage === 'home' ? (
            <SchoolLogo
              logoUrl={schoolLogoUrl}
              onClick={() => onNavigate('home')}
            />
          ) : (
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg text-white truncate">
                {PAGE_TITLES[currentPage]}
              </h1>
            </div>
          )}
        </div>

        {/* Zone 2: Navigasi Beranda (hanya tampil di luar halaman Beranda) */}
        {currentPage !== 'home' && (
          <nav aria-label="Navigasi utama" className="flex items-center">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 bg-sky-400/20 text-sky-100 border-sky-300/35 hover:bg-sky-400/30 hover:text-white shadow-sm"
            >
              <Home className="w-4 h-4 text-sky-300" />
              <span>Beranda</span>
            </button>
          </nav>
        )}

        {/* Zone 3: Tombol Admin / Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {currentPage === 'admin' && isAdminLoggedIn ? (
            <button
              type="button"
              onClick={onAdminLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border border-indigo-200/40 shadow-[0_6px_20px_-6px_rgba(139,92,246,0.55)] transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <LogOut className="w-4 h-4 text-rose-200" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                currentPage === 'admin'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-indigo-200/60 shadow-[0_6px_22px_-6px_rgba(139,92,246,0.7)] ring-2 ring-indigo-300/40'
                  : 'bg-gradient-to-r from-indigo-700/90 to-blue-800/90 text-white border-sky-300/30 hover:from-indigo-600 hover:to-blue-700 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-sky-300" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
