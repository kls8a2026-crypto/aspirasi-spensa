import { SCHOOL_INFO } from '../config/appConfig';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-sky-300/20 bg-[#071546]/65 backdrop-blur-md mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-7 flex items-center justify-center">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center">
          <span className="font-display font-bold text-sm text-white">
            {SCHOOL_INFO.footerHandle}
          </span>
          <span className="hidden sm:inline text-sky-300/60" aria-hidden="true">
            ·
          </span>
          <span className="text-sm text-blue-100/85">
            Aspirasi Siswa Online {SCHOOL_INFO.name}
          </span>
        </div>
      </div>
    </footer>
  );
}
