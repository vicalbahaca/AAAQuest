import React from 'react';
import { X } from 'lucide-react';
import { Theme } from '../types';

interface PlanStatusBannerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  planName: string;
  totalAttempts: number;
  remainingAttempts: number;
}

export const PlanStatusBanner: React.FC<PlanStatusBannerProps> = ({
  isOpen,
  onClose,
  theme,
  planName,
  totalAttempts,
  remainingAttempts
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const safeTotal = Math.max(1, totalAttempts);
  const safeRemaining = Math.max(0, Math.min(remainingAttempts, safeTotal));
  const progress = Math.round((safeRemaining / safeTotal) * 100);

  return (
    <div className="fixed top-24 left-1/2 z-[70] w-[min(560px,92vw)] -translate-x-1/2">
      <div className={`rounded-2xl border px-5 py-4 shadow-2xl ${isDark ? 'bg-slate-950/95 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Plan {planName}</p>
            <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Estás en la versión gratuita. Tienes {safeTotal} intentos mensuales.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-1.5 transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-medium">
            <span>Intentos restantes</span>
            <span>{safeRemaining} / {safeTotal}</span>
          </div>
          <div className={`mt-2 h-2 w-full rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
