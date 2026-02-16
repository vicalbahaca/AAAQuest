import React, { useEffect, useState } from 'react';
import { ArrowLeft, X, Eye, EyeOff } from 'lucide-react';
import { Language, Theme, TRANSLATIONS } from '../types';
import { checkAuthUserByEmail, supabase, upsertUser } from '../services/supabaseClient';

const registerImage = new URL('../files/Registrar.png', import.meta.url).href;

type AuthEntry = 'signup' | 'signin';
type AuthStep = 'email' | 'password' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  entry: AuthEntry;
  onClose: () => void;
  language: Language;
  theme: Theme;
}


export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, entry, onClose, language, theme }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('email');
    setEmail('');
    setPassword('');
    setFullName('');
    setShowPassword(false);
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSubmitting(false);
    setEmailExists(null);
  }, [isOpen, entry]);

  if (!isOpen) return null;

  const resetMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  const handleGoogle = async () => {
    resetMessages();
    setIsSubmitting(true);
    sessionStorage.setItem('oauthPending', '1');
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#pricing`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) {
      setErrorMessage(t.authGenericError);
      setIsSubmitting(false);
    }
  };

  const handleEmailContinue = async () => {
    resetMessages();
    const emailValue = email.trim();
    if (!emailValue) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      setErrorMessage(t.authInvalidEmail);
      return;
    }
    try {
      const check = await checkAuthUserByEmail(emailValue);
      setEmailExists(Boolean(check?.user));
    } catch (error) {
      console.warn('Auth lookup failed', error);
      setEmailExists(null);
    }
    setStep('password');
  };

  const handlePasswordContinue = async () => {
    resetMessages();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitting(true);

    const emailValue = email.trim();
    const passwordValue = password.trim();
    if (emailExists === false) {
      setErrorMessage(t.authInvalidCredentials);
      setIsSubmitting(false);
      return;
    }
    if (emailExists === null) {
      try {
        const check = await checkAuthUserByEmail(emailValue);
        if (!check?.user) {
          setErrorMessage(t.authInvalidCredentials);
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.warn('Auth lookup failed', error);
      }
    }

    const signInResult = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (!signInResult.error && signInResult.data?.session) {
      try {
        await upsertUser(signInResult.data.session.user);
      } catch (error) {
        console.warn('Failed to upsert profile', error);
      }
      let displayName =
        signInResult.data.session.user.user_metadata?.full_name
        || signInResult.data.session.user.user_metadata?.name
        || '';
      if (!displayName) {
        try {
          const check = await checkAuthUserByEmail(emailValue);
          displayName =
            check?.user?.user_metadata?.full_name
            || check?.user?.user_metadata?.name
            || '';
        } catch (error) {
          console.warn('Auth lookup failed', error);
        }
      }
      if (!displayName) {
        displayName = emailValue.split('@')[0] || 'usuario';
      }
      sessionStorage.setItem('welcomeToast', displayName);
      window.location.reload();
      setIsSubmitting(false);
      onClose();
      return;
    }

    setErrorMessage(t.authInvalidCredentials);
    setIsSubmitting(false);
  };

  const handleCreateAccount = async () => {
    resetMessages();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    setIsSubmitting(true);

    const emailValue = email.trim();
    const passwordValue = password.trim();
    const { data, error } = await supabase.functions.invoke('create-auth-user', {
      body: {
        email: emailValue,
        password: passwordValue,
        full_name: fullName.trim(),
      },
    });

    if (error || !data?.ok) {
      setErrorMessage(t.authGenericError);
      setIsSubmitting(false);
      return;
    }

    sessionStorage.setItem('signupToast', '1');
    sessionStorage.setItem('signupToastName', fullName.trim());
    window.location.reload();
    setIsSubmitting(false);
  };

  const title = step === 'email'
    ? (entry === 'signup' ? t.signUpTitle : t.signInTitle)
    : (step === 'signup' ? t.signUpCreateTitle : t.signInTitle);

  const primaryButtonLabel = step === 'email'
    ? t.authContinue
    : (step === 'signup' ? t.signUpButton : t.signInButton);

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
        className={`relative w-full max-w-5xl overflow-hidden rounded-[2rem] border shadow-2xl min-h-[520px] ${isDark ? 'bg-black border-white/10' : 'bg-white border-slate-200'}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center transition hover:bg-white/20"
          aria-label="Close sign up"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid md:grid-cols-[1.05fr_1fr] h-full items-stretch">
          <div className={`px-8 py-10 md:px-10 md:py-12 h-full min-h-[520px] flex flex-col justify-between ${isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
            <div className="flex items-center gap-3">
              {step !== 'email' && (
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
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('');
                      setEmailExists(null);
                      setStep('signup');
                    }}
                    className={`rounded-full px-6 py-3 text-sm font-normal transition border ${isDark ? 'border-white/10 text-white hover:bg-white/10' : 'border-slate-200 text-slate-900 hover:bg-slate-100'}`}
                  >
                    {t.signUpButton}
                  </button>
                  <p className="mt-2 text-xs text-slate-500">
                    {t.signUpTerms}
                  </p>
                </div>
              </>
            )}

            {step === 'password' && (
              <div className="flex-1 flex items-center">
                <div className="w-full flex flex-col gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.signUpEmailPlaceholder}
                    className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                    autoComplete="email"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t.signInPasswordLabel}
                      className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 pr-12 ${inputClasses}`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordContinue}
                    disabled={isSubmitting || !password.trim()}
                    className={`rounded-full px-6 py-3 text-sm font-normal transition hover:opacity-95 disabled:opacity-60 ${buttonClasses}`}
                  >
                    {primaryButtonLabel}
                  </button>
                </div>
              </div>
            )}

            {step === 'signup' && (
              <div className="flex-1 flex items-center">
                <div className="w-full flex flex-col gap-4">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={t.signUpNamePlaceholder}
                    className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                    autoComplete="name"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.signUpEmailPlaceholder}
                    className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 ${inputClasses}`}
                    autoComplete="email"
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t.signInPasswordLabel}
                      className={`w-full rounded-full border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 pr-12 ${inputClasses}`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={isSubmitting || !fullName.trim() || !email.trim() || !password.trim()}
                    className={`rounded-full px-6 py-3 text-sm font-normal transition hover:opacity-95 disabled:opacity-60 ${buttonClasses}`}
                  >
                    {t.signUpButton}
                  </button>
                </div>
              </div>
            )}

            {(statusMessage || errorMessage) && (
              <div
                className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${errorMessage ? 'border-rose-400/30 text-rose-200 bg-rose-500/10' : 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10'}`}
              >
                {errorMessage || statusMessage}
              </div>
            )}
          </div>

          <div className="relative hidden md:flex items-center justify-center">
            <img
              src={registerImage}
              alt="Registro"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
