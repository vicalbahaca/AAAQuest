import React, { useEffect, useState } from 'react';
import { Language, Theme, TRANSLATIONS } from '../types';
import { supabase } from '../services/supabaseClient';

interface AccountSettingsProps {
  language: Language;
  theme: Theme;
  authUser: any | null;
  onBack: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ language, theme, authUser, onBack }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const name = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '';
    const emailValue = authUser?.email || '';
    setFullName(name);
    setEmail(emailValue);
  }, [authUser]);

  const handleSave = async () => {
    setStatusMessage(null);
    setErrorMessage(null);

    if (!authUser) {
      setErrorMessage(t.accountNotSignedIn);
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedPassword && trimmedPassword.length < 8) {
      setErrorMessage(t.authPasswordMin);
      return;
    }

    const updates: Record<string, any> = {};
    if (trimmedName && trimmedName !== (authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '')) {
      updates.data = { full_name: trimmedName };
    }
    if (trimmedEmail && trimmedEmail !== authUser?.email) {
      updates.email = trimmedEmail;
    }
    if (trimmedPassword) {
      updates.password = trimmedPassword;
    }

    if (Object.keys(updates).length === 0) {
      setStatusMessage(t.accountNoChanges);
      return;
    }

    const { data, error } = await supabase.functions.invoke('update-auth-user', {
      body: {
        full_name: trimmedName || undefined,
        email: trimmedEmail || undefined,
        password: trimmedPassword || undefined,
      },
    });
    if (error || !data?.ok) {
      setErrorMessage(t.authGenericError);
      return;
    }

    setStatusMessage(t.accountSaved);
    setPassword('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className={`text-xs uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t.accountBack}
          </button>
          <h1 className={`mt-3 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.accountTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          {authUser?.user_metadata?.picture ? (
            <img src={authUser.user_metadata.picture} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-semibold text-white">
              {(authUser?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-right">
            <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || authUser?.email}</div>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</div>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <section className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.accountBasicInfo}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountNameLabel}</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountEmailLabel}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.accountEmailHint}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.accountSecurityTitle}</h2>
          <div className="mt-6 flex flex-col gap-2 max-w-md">
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountPasswordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.accountPasswordPlaceholder}
              className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            />
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.accountPasswordHint}</p>
          </div>
        </section>

        {(statusMessage || errorMessage) && (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${errorMessage ? 'border-rose-400/30 text-rose-200 bg-rose-500/10' : 'border-emerald-400/30 text-emerald-200 bg-emerald-500/10'}`}>
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-[#038759] px-6 py-2 text-sm font-semibold text-white"
          >
            {t.accountSave}
          </button>
        </div>
      </div>
    </div>
  );
};
