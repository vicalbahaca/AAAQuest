import React, { useEffect, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language, Theme, TRANSLATIONS } from '../types';
import { supabase } from '../services/supabaseClient';

const analyzerImage = new URL('../files/Analizador.png', import.meta.url).href;

type AuthEntry = 'signup' | 'signin';
type AuthStep = 'email' | 'password';

interface AuthModalProps {
  isOpen: boolean;
  entry: AuthEntry;
  onClose: () => void;
  language: Language;
  theme: Theme;
}

const isGoogleEmail = (value: string) => /@(gmail\.com|googlemail\.com)$/i.test(value.trim());

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, entry, onClose, language, theme }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('email');
    setEmail('');
    setPassword('');
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleGoogle = async () => {
    resetMessages();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setErrorMessage(t.authGenericError);
      setIsSubmitting(false);
    }
  };

  const handleEmailContinue = async () => {
    resetMessages();
    if (!email.trim()) return;
    if (isGoogleEmail(email)) {
      await handleGoogle();
      return;
    }
    setStep('password');
  };

  const handlePasswordContinue = async () => {
    resetMessages();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);

    const signInResult = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (!signInResult.error && signInResult.data?.session) {
      setIsSubmitting(false);
      onClose();
      return;
    }

    const signUpResult = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpResult.error) {
      setErrorMessage(t.authGenericError);
    } else if (signUpResult.data?.session) {
      onClose();
      return;
    } else {
      setStatusMessage(t.authCheckInbox);
    }

    setIsSubmitting(false);
  };

  const title = step === 'email'
    ? (entry === 'signup' ? t.signUpTitle : t.signInTitle)
    : (entry === 'signup' ? t.signUpPasswordTitle : t.signInPasswordTitle);

  const primaryButtonLabel = step === 'email'
    ? t.authContinue
    : (entry === 'signup' ? t.signUpButton : t.signInButton);

  const inputClasses = isDark
    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

  const buttonClasses = 'bg-[#038759] text-white hover:bg-[#026e49]';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-5xl overflow-hidden rounded-[2rem] border shadow-2xl ${isDark ? 'bg-slate-950 border-white/10' : 'bg-slate-950 border-white/10'}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center transition hover:bg-white/20"
          aria-label="Close sign up"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[1.05fr_1fr]">
          <div className="bg-[#0d0f13] px-8 py-10 md:px-10 md:py-12 text-white">
            <div className="flex items-center gap-3">
              {step === 'password' && (
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-white"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {title}
              </h2>
            </div>

            {step === 'email' && (
              <>
                <div className="mt-8 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-3 rounded-full bg-white text-slate-900 px-6 py-3 text-sm font-normal shadow-sm transition hover:shadow-md disabled:opacity-60"
                  >
                    <span className="text-base">G</span>
                    {t.signUpGoogle}
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500">
                  <span className="h-px flex-1 bg-white/10" />
                  {t.signUpOr}
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.signUpEmailPlaceholder}
                    className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    onClick={handleEmailContinue}
                    disabled={isSubmitting || !email.trim()}
                    className={`rounded-full px-6 py-3 text-sm font-normal transition hover:opacity-95 disabled:opacity-60 ${buttonClasses}`}
                  >
                    {primaryButtonLabel}
                  </button>
                </div>

                <p className="mt-6 text-xs text-slate-500">
                  {t.signUpTerms}
                </p>
              </>
            )}

            {step === 'password' && (
              <>
                <div className="mt-8 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  <span className="text-base">@</span>
                  <span className="text-slate-200 font-medium truncate">{email}</span>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.signInPasswordLabel}
                    className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordContinue}
                    disabled={isSubmitting || !password.trim()}
                    className={`rounded-full px-6 py-3 text-sm font-normal transition hover:opacity-95 disabled:opacity-60 ${buttonClasses}`}
                  >
                    {primaryButtonLabel}
                  </button>
                </div>
              </>
            )}

            {(statusMessage || errorMessage) && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${errorMessage ? 'border-rose-400/30 text-rose-200 bg-rose-500/10' : 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10'}`}
              >
                {errorMessage || statusMessage}
              </div>
            )}
          </div>

          <div className="relative hidden md:block">
            <div className="absolute inset-0 p-6">
              <img
                src={analyzerImage}
                alt="Analizador de accesibilidad"
                className="mt-4 w-full rounded-2xl border border-white/10 object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-800/70 to-slate-950/80" />
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_45%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.25),transparent_50%)]" />
            <div className="absolute inset-0 p-6">
              <div className="absolute bottom-10 left-10 right-10 rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
                <div className="text-sm uppercase tracking-widest text-emerald-300">{t.appTitle}</div>
                <div className="mt-2 text-2xl font-semibold">{t.signUpPanelTitle}</div>
                <div className="mt-2 text-sm text-slate-300">
                  {t.signUpPanelSubtitle}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
