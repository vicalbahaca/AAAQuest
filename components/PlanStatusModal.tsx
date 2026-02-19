import React from 'react';
import { X } from 'lucide-react';
import { Theme } from '../types';

interface PlanStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  planName: string;
  totalAttempts: number;
  remainingAttempts: number;
}

export const PlanStatusModal: React.FC<PlanStatusModalProps> = ({
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Tu plan actual</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Estás en la versión {planName.toLowerCase()}.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <div className="rounded-2xl border px-4 py-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Intentos restantes este mes</span>
              <span>{safeRemaining} de {safeTotal}</span>
            </div>
            <div className={`mt-3 h-2 w-full rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tu plan gratuito incluye {safeTotal} intentos al mes.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-slate-900 text-slate-200 border border-white/10 hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
