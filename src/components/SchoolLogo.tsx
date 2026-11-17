import { useState } from 'react';
import { SCHOOL_INFO } from '../config/appConfig';

interface SchoolLogoProps {
  logoUrl: string | null;
  onClick?: () => void;
}

export function SchoolLogo({ logoUrl, onClick }: SchoolLogoProps) {
  const [imageError, setImageError] = useState(false);

  const showCustomLogo = Boolean(logoUrl) && !imageError;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded-xl py-1 pr-2 transition-transform duration-150 active:scale-[0.99] shrink-0"
      aria-label={`Beranda ${SCHOOL_INFO.name}`}
    >
      {showCustomLogo ? (
        <img
          src={logoUrl as string}
          alt={`Logo ${SCHOOL_INFO.name}`}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-10 h-10 rounded-xl object-contain bg-white/95 border border-sky-200/60 p-1 shadow-sm shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400/35 via-blue-600/50 to-indigo-700/70 text-white flex flex-col items-center justify-center shadow-[0_6px_18px_-4px_rgba(56,189,248,0.45)] border border-sky-200/45 backdrop-blur-md shrink-0"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 36 36"
            className="w-8 h-8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 3L31 8.5V17.5C31 24.9 25.4 31.3 18 33C10.6 31.3 5 24.9 5 17.5V8.5L18 3Z"
              stroke="rgba(224,242,254,0.9)"
              strokeWidth="1.6"
              fill="rgba(255,255,255,0.14)"
            />
            <text
              x="18"
              y="17.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="7.2"
              fontWeight="800"
              fontFamily="Plus Jakarta Sans, sans-serif"
              letterSpacing="0.02em"
            >
              SMP
            </text>
            <text
              x="18"
              y="26"
              textAnchor="middle"
              fill="#BAE6FD"
              fontSize="8.5"
              fontWeight="800"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              1
            </text>
          </svg>
        </div>
      )}

      <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap shrink-0">
        {SCHOOL_INFO.name}
      </span>
    </button>
  );
}
