import React, { useEffect, useState } from 'react';
import { AppMode, Language, TRANSLATIONS, Theme } from '../types';
import { supabase } from '../services/supabaseClient';
import { Reveal } from './Reveal';

interface SignInProps {
  setMode: (mode: AppMode) => void;
  language: Language;
  theme: Theme;
}

export const SignIn: React.FC<SignInProps> = ({ setMode, language, theme }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSignedInEmail(data.session?.user?.email ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedInEmail(session?.user?.email ?? null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleSignIn = async () => {
    resetMessages();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErrorMessage(error.message || t.signInError);
    } else {
      setStatusMessage(t.signInSuccess);
      const basePath = import.meta.env.BASE_URL || '/';
      const appPath = basePath.endsWith('/') ? `${basePath}app` : `${basePath}/app`;
      window.location.assign(`${window.location.origin}${appPath}`);
    }
    setIsSubmitting(false);
  };

  const handleOAuthSignIn = async (provider: 'google') => {
    resetMessages();
    setIsSubmitting(true);
    const basePath = import.meta.env.BASE_URL || '/';
    const callbackPath = basePath.endsWith('/') ? `${basePath}auth/callback` : `${basePath}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${callbackPath}`,
      },
    });
    if (error) {
      setErrorMessage(error.message || t.signInError);
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    resetMessages();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setErrorMessage(error.message || t.signUpError);
    } else {
      setStatusMessage(t.signUpSuccess);
      const basePath = import.meta.env.BASE_URL || '/';
      const appPath = basePath.endsWith('/') ? `${basePath}app` : `${basePath}/app`;
      window.location.assign(`${window.location.origin}${appPath}`);
    }
    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    resetMessages();
    setIsSubmitting(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message || t.signOutError);
    } else {
      setStatusMessage(t.signOutSuccess);
    }
    setIsSubmitting(false);
  };

  const inputClasses = isDark
    ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400';

  const buttonClasses = 'bg-[#038759] text-white hover:bg-[#026e49]';

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 pb-24">
      <div className="flex flex-col items-center text-center">
        <Reveal>
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.signInTitle}
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className={`mt-4 text-base md:text-lg font-light max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.signInSubtitle}
          </p>
        </Reveal>
      </div>

      <Reveal delay={250}>
        <div className={`mt-10 rounded-3xl border p-8 shadow-xl ${isDark ? 'bg-slate-900/60 border-white/10' : 'bg-white border-slate-200 shadow-slate-200/60'}`}>
          <div className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isSubmitting}
              className={`rounded-full px-6 py-3 text-sm font-bold border transition-all active:scale-95 disabled:opacity-60 ${isDark ? 'border-white/10 text-white hover:border-white/30' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
            >
              {t.signInGoogle}
            </button>

            <label className="text-left">
              <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.signInEmailLabel}
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                aria-invalid={Boolean(errorMessage)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                autoComplete="email"
              />
            </label>

            <label className="text-left">
              <span className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {t.signInPasswordLabel}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                aria-invalid={Boolean(errorMessage)}
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                autoComplete="current-password"
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSubmitting || !email || !password}
                className={`flex-1 rounded-full px-6 py-3 text-sm font-normal transition-all active:scale-95 disabled:opacity-60 ${buttonClasses}`}
              >
                {t.signInButton}
              </button>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSubmitting || !email || !password}
                className={`flex-1 rounded-full px-6 py-3 text-sm font-normal border transition-all active:scale-95 disabled:opacity-60 ${isDark ? 'border-white/10 text-white hover:border-white/30' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                {t.signUpButton}
              </button>
            </div>

            {signedInEmail && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${isDark ? 'border-white/10 text-slate-200 bg-slate-900/40' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                {t.signInSignedInAs}: <span className="font-semibold">{signedInEmail}</span>
              </div>
            )}

            {(statusMessage || errorMessage) && (
              <div
                role="alert"
                aria-live="polite"
                className={`rounded-2xl border px-4 py-3 text-sm ${errorMessage ? (isDark ? 'border-rose-400/30 text-rose-200 bg-rose-500/10' : 'border-rose-200 text-rose-600 bg-rose-50') : (isDark ? 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10' : 'border-emerald-200 text-emerald-700 bg-emerald-50')}`}
              >
                {errorMessage || statusMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSubmitting || !signedInEmail}
                className={`flex-1 rounded-full px-6 py-3 text-sm font-normal border transition-all active:scale-95 disabled:opacity-60 ${isDark ? 'border-white/10 text-white hover:border-white/30' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                {t.signOutButton}
              </button>
              <button
                type="button"
                onClick={() => setMode(AppMode.HOME)}
                className={`flex-1 rounded-full px-6 py-3 text-sm font-normal transition-all active:scale-95 ${buttonClasses}`}
              >
                {t.signInBack}
              </button>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
};
