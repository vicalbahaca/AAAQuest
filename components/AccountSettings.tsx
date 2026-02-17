import React, { useEffect, useState } from 'react';
import { Language, Theme, TRANSLATIONS } from '../types';
import { supabase } from '../services/supabaseClient';

interface AccountSettingsProps {
  language: Language;
  theme: Theme;
  authUser: any | null;
  onBack: () => void;
  onUserUpdated: (user: any) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ language, theme, authUser, onBack, onUserUpdated }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isGoogleUser = Boolean(
    authUser?.app_metadata?.provider === 'google' ||
      authUser?.app_metadata?.providers?.includes?.('google') ||
      authUser?.user_metadata?.iss?.includes?.('google')
  );

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
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if ((trimmedCurrent || trimmedNew || trimmedConfirm) && trimmedCurrent.length < 8) {
      setErrorMessage(t.authPasswordMin);
      return;
    }
    if ((trimmedCurrent || trimmedNew || trimmedConfirm) && trimmedNew.length < 8) {
      setErrorMessage(t.authPasswordMin);
      return;
    }
    if ((trimmedCurrent || trimmedNew || trimmedConfirm) && trimmedConfirm.length < 8) {
      setErrorMessage(t.authPasswordMin);
      return;
    }
    if ((trimmedCurrent || trimmedNew || trimmedConfirm) && trimmedNew !== trimmedConfirm) {
      setErrorMessage(t.accountPasswordMismatch);
      return;
    }

    const updates: Record<string, any> = {};
    if (trimmedName && trimmedName !== (authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || '')) {
      updates.data = { full_name: trimmedName };
    }
    const emailChanged = !isGoogleUser && trimmedEmail && trimmedEmail !== authUser?.email;
    if (emailChanged) {
      updates.email = trimmedEmail;
    }
    const needsReauth = Boolean(trimmedNew || emailChanged);
    if (needsReauth) {
      if (!trimmedCurrent) {
        setErrorMessage(t.accountCurrentPasswordRequired);
        return;
      }
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: authUser?.email,
        password: trimmedCurrent,
      });
      if (reauthError) {
        setErrorMessage(t.accountCurrentPasswordInvalid);
        return;
      }
    }
    if (trimmedNew) {
      updates.password = trimmedNew;
    }

    if (Object.keys(updates).length === 0) {
      setStatusMessage(t.accountNoChanges);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      setErrorMessage(t.accountNotSignedIn);
      return;
    }

    const { data, error } = await supabase.functions.invoke('update-auth-user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        full_name: trimmedName || undefined,
        email: emailChanged ? trimmedEmail : undefined,
        password: trimmedNew || undefined,
      },
    });
    if (error || !data?.ok) {
      setErrorMessage(t.authGenericError);
      return;
    }

    const { data: refreshed } = await supabase.auth.getUser();
    if (refreshed?.user) {
      onUserUpdated(refreshed.user);
    }

    setStatusMessage(t.accountSaved);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center gap-2 text-xs uppercase tracking-widest ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <span aria-hidden="true">←</span>
            {t.accountBack}
          </button>
          <h1 className={`mt-3 text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.accountTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || ''}
            </div>
            <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authUser?.email}</div>
          </div>
          {authUser?.user_metadata?.picture ? (
            <img src={authUser.user_metadata.picture} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-500/30 flex items-center justify-center text-sm font-semibold text-white">
              {(authUser?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
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
                disabled={isGoogleUser}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} ${isGoogleUser ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                {isGoogleUser ? t.accountEmailGoogleHint : t.accountEmailHint}
              </p>
            </div>
          </div>
        </section>

        <section className={`rounded-3xl border p-6 ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.accountSecurityTitle}</h2>
          <div className="mt-6 grid gap-4 max-w-xl md:grid-cols-2">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountCurrentPasswordLabel}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t.accountCurrentPasswordPlaceholder}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountPasswordLabel}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t.accountPasswordPlaceholder}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.accountPasswordConfirmLabel}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.accountPasswordConfirmPlaceholder}
                className={`rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              />
            </div>
            <p className={`text-xs md:col-span-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{t.accountPasswordHint}</p>
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
