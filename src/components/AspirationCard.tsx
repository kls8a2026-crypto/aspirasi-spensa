import { Calendar, ShieldCheck, User } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Aspiration } from '../types/aspiration';
import { formatIndonesianDate } from '../utils/dateFormat';
import {
  getCategoryGlassTile,
  GlassCategoryIcon,
} from './GlassCategoryIcon';

interface AspirationCardProps {
  aspiration: Aspiration;
  index?: number;
}

export function AspirationCard({
  aspiration,
  index = 0,
}: AspirationCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const formattedDate = formatIndonesianDate(aspiration.createdAt);
  const formattedReplyDate = aspiration.adminRepliedAt
    ? formatIndonesianDate(aspiration.adminRepliedAt)
    : '';
  const glassTile = getCategoryGlassTile(
    aspiration.category,
    aspiration.message
  );

  return (
    <motion.article
      layout={!prefersReducedMotion}
      initial={
        prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        prefersReducedMotion ? undefined : { opacity: 0, y: -12, scale: 0.96 }
      }
      whileHover={
        prefersReducedMotion ? undefined : { y: -7, scale: 1.018 }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
      transition={{
        duration: 0.38,
        delay: prefersReducedMotion ? 0 : Math.min(index * 0.055, 0.34),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative overflow-hidden rounded-2xl soft-neu-card border-2 border-sky-300/35 hover:border-sky-300/80 hover:shadow-[0_24px_48px_-14px_rgba(3,10,38,0.85),0_0_34px_-6px_rgba(56,189,248,0.44)] p-6 flex flex-col justify-between gap-5 transition-[border-color,box-shadow] duration-200"
    >
      {/* Kilau kaca diagonal saat kartu disentuh kursor */}
      {!prefersReducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-[360%] transition-transform duration-700 ease-out"
        />
      )}

      <div className="relative space-y-4">
        <header className="pb-4 border-b border-sky-200/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <motion.div
              animate={
                prefersReducedMotion
                  ? undefined
                  : { y: [0, -2.5, 0] }
              }
              transition={{
                duration: 3.2 + (index % 4) * 0.45,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: (index % 5) * 0.25,
              }}
              className="shrink-0"
            >
              <GlassCategoryIcon tile={glassTile} size="md" />
            </motion.div>
            <div className="min-w-0">
              <span className="block font-display font-bold text-sm text-white truncate">
                {aspiration.category}
              </span>
              {aspiration.isSample && (
                <span className="block text-[11px] font-medium text-sky-200/75 mt-0.5">
                  Data Contoh
                </span>
              )}
            </div>
          </div>
        </header>

        <p className="text-[15px] leading-relaxed text-blue-50 font-normal whitespace-pre-line break-words">
          {aspiration.message}
        </p>

        {/* Tanggapan Admin (jika sudah ditanggapi) */}
        {aspiration.adminReply && (
          <div className="soft-neu-inset rounded-xl p-3.5 space-y-1.5 border border-sky-300/35">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-display font-bold text-sky-300">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Tanggapan Admin</span>
              </span>
              {formattedReplyDate && (
                <span className="text-[11px] text-sky-200/75 tabular-nums">
                  {formattedReplyDate}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-[13px] leading-relaxed text-sky-100 whitespace-pre-line break-words">
              {aspiration.adminReply}
            </p>
          </div>
        )}
      </div>

      <footer className="relative pt-3.5 border-t border-sky-200/20 flex items-center justify-between gap-3 text-xs text-sky-100/85">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 text-sky-300 shrink-0" />
          <span className="font-semibold text-white truncate">
            {aspiration.author || 'Anonim'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 tabular-nums font-medium text-sky-200/90">
          <Calendar className="w-3.5 h-3.5 text-sky-300/85 shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </footer>
    </motion.article>
  );
}
