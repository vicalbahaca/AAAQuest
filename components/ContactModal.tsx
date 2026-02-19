import React, { useEffect, useState } from 'react';
import { X, Mail } from 'lucide-react';
import { Theme } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  userName?: string | null;
  theme: Theme;
  onRequestAuth?: () => void;
}

const TARGET_EMAIL = 'victorsaizalfageme@gmail.com';

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  userName,
  theme,
  onRequestAuth
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSubject('');
    setMessage('');
    setTouched(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const hasEmail = Boolean(userEmail);
  const canSend = hasEmail && trimmedSubject.length > 0 && trimmedMessage.length > 0;

  const handleSend = () => {
    if (!canSend) {
      setTouched(true);
      return;
    }
    const displayName = userName || userEmail || 'Usuario';
    const body = [
      'Mensaje:',
      trimmedMessage,
      '',
      `Enviado por: ${displayName}`,
      `Email: ${userEmail}`
    ].join('\n');
    const mailto = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent(trimmedSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  };

  const inputBase = isDark
    ? 'border-white/10 bg-slate-900 text-white placeholder:text-slate-500'
    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400';
  const helperText = isDark ? 'text-slate-400' : 'text-slate-500';
  const labelText = isDark ? 'text-slate-200' : 'text-slate-700';
  const cardBg = isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${cardBg}`}>
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h2 className="text-lg font-semibold">Contáctanos</h2>
            <p className={`mt-1 text-sm ${helperText}`}>
              Cuéntanos tu necesidad y te responderemos lo antes posible.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition hover:bg-black/5 ${isDark ? 'hover:bg-white/10' : ''}`}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {!hasEmail && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-amber-400/40 text-amber-200 bg-amber-900/10' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
              Para enviar el mensaje desde tu correo registrado, inicia sesión primero.
              {onRequestAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestAuth();
                  }}
                  className={`ml-2 font-semibold underline underline-offset-4 ${isDark ? 'text-amber-200' : 'text-amber-700'}`}
                >
                  Iniciar sesión
                </button>
              )}
            </div>
          )}

          <div>
            <label className={`text-sm font-medium ${labelText}`}>Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              onBlur={() => setTouched(true)}
              className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-400/60 ${inputBase}`}
              placeholder="Ej: Necesitamos una demo para el equipo"
            />
            {touched && !trimmedSubject && (
              <p className="mt-1 text-xs text-rose-500">El asunto es obligatorio.</p>
            )}
          </div>

          <div>
            <label className={`text-sm font-medium ${labelText}`}>Mensaje</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onBlur={() => setTouched(true)}
              className={`mt-2 w-full min-h-[140px] resize-none rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-emerald-400/60 ${inputBase}`}
              placeholder="Cuéntanos qué necesitas, número de personas, plazos, etc."
            />
            {touched && !trimmedMessage && (
              <p className="mt-1 text-xs text-rose-500">El mensaje es obligatorio.</p>
            )}
          </div>

          <div className={`text-xs ${helperText}`}>
            {hasEmail ? (
              <>
                Se abrirá tu cliente de correo para enviar el mensaje desde{' '}
                <span className="font-semibold">{userEmail}</span>.
              </>
            ) : (
              'Inicia sesión para enviar desde tu correo registrado.'
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isDark ? 'bg-slate-900 text-slate-200 border border-white/10 hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSend}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                canSend
                  ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                  : 'bg-emerald-500/40 text-emerald-950/60 cursor-not-allowed'
              }`}
              disabled={!canSend}
            >
              <Mail className="h-4 w-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
