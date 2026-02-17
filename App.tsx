
import React, { useState, useEffect, useRef } from 'react';
import { AppMode, Language, TRANSLATIONS, Theme } from './types';
import { StudyMode } from './components/StudyMode';
import { TestMode } from './components/TestMode';
import { CheckerMode } from './components/CheckerMode';
import { InfoMode } from './components/InfoMode';
import { CertificateMode } from './components/CertificateMode';
import { SignIn } from './components/SignIn';
import { AuthModal } from './components/AuthModal';
import { AccountSettings } from './components/AccountSettings';
import { NeuralCore } from './components/NeuralCore';
import { ScanEye, Globe, ChevronDown, UserPlus, LogIn, Clock, FileText, Layers, RefreshCcw, X } from 'lucide-react';
import { Loader } from './components/Loader';
import { Reveal } from './components/Reveal';
import { checkAuthUserByEmail, supabase, upsertUser } from './services/supabaseClient';

const homeVideoSrc = new URL('./files/AAADemo.mp4', import.meta.url).href;
const faviconIcon = new URL('./files/favicon.svg', import.meta.url).href;
const figmaLogo = new URL('./files/figma-logo.svg', import.meta.url).href;
const unsplashGreenFlow = new URL('./files/unsplash-green-flow.jpg', import.meta.url).href;
const pluginFigmaAsset = new URL('./files/PluginFigma.png', import.meta.url).href;
const workflowImage = unsplashGreenFlow;
const pluginImage = pluginFigmaAsset;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [focusMode, setFocusMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const theme: Theme = 'dark'; // Default to dark mode
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState<'signup' | 'signin'>('signup');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [authName, setAuthName] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);
  const [cookieAnalytics, setCookieAnalytics] = useState(true);
  const [cookieMarketing, setCookieMarketing] = useState(true);
  const basePath = import.meta.env.BASE_URL || '/';
  const [allowLandingAccess, setAllowLandingAccess] = useState(false);

  const normalizePath = (value: string) => value.replace(/\/+$/, '') || '/';
  const normalizedHome = normalizePath(basePath);
  const homeHref = basePath.endsWith('/') ? basePath : `${basePath}/`;
  const appHref = normalizedHome === '/' ? '/app' : `${normalizedHome}/app`;

  const resolveModeFromPath = () => {
    const path = normalizePath(window.location.pathname);
    if (path === normalizePath(appHref)) {
      return AppMode.CHECKER;
    }
    return AppMode.HOME;
  };

  const isPublicMode = (nextMode: AppMode) =>
    [
      AppMode.HOME,
      AppMode.STUDY,
      AppMode.TEST,
      AppMode.INFO,
      AppMode.CERTIFICATE,
      AppMode.SIGNIN,
    ].includes(nextMode);

  const navigateMode = (nextMode: AppMode) => {
    const isLockedToApp = Boolean(authUser) && mode !== AppMode.HOME;
    const resolvedMode = isLockedToApp && isPublicMode(nextMode) ? AppMode.CHECKER : nextMode;
    setMode(resolvedMode);
    if (resolvedMode === AppMode.CHECKER || resolvedMode === AppMode.ACCOUNT) {
      history.pushState(null, '', appHref);
    } else if (resolvedMode === AppMode.HOME) {
      history.pushState(null, '', homeHref);
    }
  };

  // Scroll to top whenever mode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    const stored = document.cookie.split('; ').find((row) => row.startsWith('cookie_prefs='));
    if (!stored) {
      setShowCookieBanner(true);
      return;
    }
    const value = stored.split('=')[1] ?? '';
    try {
      const parsed = JSON.parse(decodeURIComponent(value));
      if (typeof parsed?.analytics === 'boolean') setCookieAnalytics(parsed.analytics);
      if (typeof parsed?.marketing === 'boolean') setCookieMarketing(parsed.marketing);
      setShowCookieBanner(false);
    } catch {
      setShowCookieBanner(true);
    }
  }, []);

  const persistCookiePrefs = (prefs: { analytics: boolean; marketing: boolean }) => {
    const payload = encodeURIComponent(JSON.stringify({ essential: true, ...prefs }));
    document.cookie = `cookie_prefs=${payload}; path=/; max-age=31536000; SameSite=Lax`;
  };

  useEffect(() => {
    const seen = sessionStorage.getItem('maintenanceSeen');
    if (!seen) {
      setShowMaintenance(true);
      sessionStorage.setItem('maintenanceSeen', '1');
    }
  }, []);

  useEffect(() => {
    setMode(resolveModeFromPath());
    const path = normalizePath(window.location.pathname);
    const isLandingPath = path === normalizedHome;
    let isDirect = true;
    if (document.referrer) {
      try {
        isDirect = new URL(document.referrer).origin !== window.location.origin;
      } catch {
        isDirect = true;
      }
    }
    if (isLandingPath && isDirect) {
      setAllowLandingAccess(true);
    }
    const handlePopState = () => {
      setMode(resolveModeFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!isAuthOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAuthOpen]);

  const t = TRANSLATIONS[language];

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  };

  const openAuth = async (entry: 'signup' | 'signin') => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      showToast(t.alreadyRegisteredToast);
      return;
    }
    setAuthEntry(entry);
    setIsAuthOpen(true);
  };

  useEffect(() => {
    const exchangeCode = async () => {
      const params = new URLSearchParams(window.location.search);
      const hasCode = params.get('code');
      if (hasCode) {
        try {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        } catch (error) {
          console.warn('Failed to exchange auth code', error);
        } finally {
          setAllowLandingAccess(false);
          setMode(AppMode.CHECKER);
          history.replaceState(null, '', appHref);
        }
        return;
      }
    };

    exchangeCode();

    const handleAuthUser = async (user: any, shouldToast: boolean) => {
      let existed = false;
      let name = '';
      try {
        if (user.email) {
          const check = await checkAuthUserByEmail(user.email);
          if (check?.user) {
            const createdAt = check.user.created_at ?? '';
            const lastSignInAt = check.user.last_sign_in_at ?? '';
            existed = Boolean(lastSignInAt && createdAt && lastSignInAt !== createdAt);
            name =
              check.user.user_metadata?.full_name
              || check.user.user_metadata?.name
              || check.user.email?.split('@')[0]
              || '';
          }
        } else {
          const createdAt = user.created_at ?? '';
          const lastSignInAt = user.last_sign_in_at ?? '';
          existed = Boolean(lastSignInAt && createdAt && lastSignInAt !== createdAt);
        }
      } catch (error) {
        console.warn('Auth lookup failed', error);
      }

      upsertUser(user).catch((error: any) => {
        console.warn('Failed to upsert user', error);
      });

      setAuthUser(user);
      const resolvedName =
        name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '';
      setAuthName(resolvedName);

      if (shouldToast) {
        setAllowLandingAccess(false);
        navigateMode(AppMode.CHECKER);
        if (existed) {
          const displayName = name || user.user_metadata?.full_name || user.user_metadata?.name || 'usuario';
          showToast(`${t.welcomeToastPrefix}${displayName}${t.welcomeToastSuffix}`);
        } else {
          const displayName =
            name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'usuario';
          showToast(`${t.signupSuccessPrefix}${displayName}`);
        }
      }
    };

    const shouldToastFromFlags = () => {
      return sessionStorage.getItem('oauthPending') === '1'
        || sessionStorage.getItem('welcomeToast') !== null
        || sessionStorage.getItem('signupToast') === '1';
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const shouldToast = shouldToastFromFlags();
        if (sessionStorage.getItem('oauthPending') === '1') sessionStorage.removeItem('oauthPending');
        handleAuthUser(data.session.user, shouldToast);
      } else {
        setAuthUser(null);
        setAuthName('');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const shouldToast = shouldToastFromFlags();
        if (sessionStorage.getItem('oauthPending') === '1') sessionStorage.removeItem('oauthPending');
        handleAuthUser(session.user, shouldToast);
      } else {
        setAuthUser(null);
        setAuthName('');
      }
    });

    const params = new URLSearchParams(window.location.search);
    const welcomeName = sessionStorage.getItem('welcomeToast');
    if (welcomeName) {
      showToast(`${t.welcomeToastPrefix}${welcomeName}`);
      sessionStorage.removeItem('welcomeToast');
    }

    if (params.get('signup') === '1' || sessionStorage.getItem('signupToast') === '1') {
      const signupName = sessionStorage.getItem('signupToastName');
      if (signupName) {
        showToast(`${t.signupSuccessPrefix}${signupName}`);
        sessionStorage.removeItem('signupToastName');
      } else {
        showToast(t.signupSuccessToast);
      }
      params.delete('signup');
      sessionStorage.removeItem('signupToast');
      const query = params.toString();
      const cleanHash = window.location.hash
        .replace(/access_token=[^&]+&?/i, '')
        .replace(/refresh_token=[^&]+&?/i, '')
        .replace(/provider_token=[^&]+&?/i, '')
        .replace(/expires_in=[^&]+&?/i, '')
        .replace(/token_type=[^&]+&?/i, '')
        .replace(/&$/, '');
      history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + cleanHash);
    }

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setIsLangMenuOpen(false);
    if (lang === language) return;
    
    setIsLoadingLanguage(true);
    setTimeout(() => {
      setLanguage(lang);
      setIsLoadingLanguage(false);
    }, 1500); // Simulate network/reload delay
  };

  const getLangLabel = (lang: Language) => {
    switch(lang) {
      case 'es': return 'Español';
      case 'en': return 'English';
      default: return 'English';
    }
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.STUDY:
        return <StudyMode setFocusMode={setFocusMode} language={language} theme={theme} setMode={navigateMode} />;
      case AppMode.TEST:
        return <TestMode language={language} theme={theme} />;
      case AppMode.CHECKER:
        return <CheckerMode language={language} theme={theme} onOpenAuth={openAuth} />;
      case AppMode.INFO:
        return <InfoMode setMode={navigateMode} language={language} theme={theme} />;
      case AppMode.CERTIFICATE:
        return <CertificateMode language={language} theme={theme} setMode={navigateMode} />;
      case AppMode.ACCOUNT:
        return (
          <AccountSettings
            language={language}
            theme={theme}
            authUser={authUser}
            onBack={() => navigateMode(AppMode.CHECKER)}
            onUserUpdated={(user) => {
              setAuthUser(user);
              const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';
              setAuthName(name);
            }}
          />
        );
      case AppMode.SIGNIN:
        return <SignIn language={language} theme={theme} setMode={navigateMode} />;
      default:
        return <Home setMode={navigateMode} t={t} theme={theme} language={language} onOpenAuth={openAuth} />;
    }
  };

  useEffect(() => {
    if (!authUser) return;
    if (mode === AppMode.HOME && !allowLandingAccess) {
      navigateMode(AppMode.CHECKER);
    }
  }, [authUser, mode, allowLandingAccess]);

  const handleLogoClick = () => {
    if (authUser && mode !== AppMode.HOME) {
      navigateMode(AppMode.CHECKER);
      return;
    }
    navigateMode(AppMode.HOME);
  };

  if (isLoadingLanguage) {
    const loaderText = t.changingLanguage;
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-inter ${theme === 'dark' ? 'bg-black text-white' : 'bg-slate-100 text-emerald-900'}`} role="status" aria-live="polite">
        <Loader text={loaderText} theme={theme} />
      </div>
    );
  }

  // Theme-based Classes
  const mainContainerClasses = theme === 'dark' 
    ? "bg-black text-slate-100 selection:bg-emerald-500/30"
    : "bg-slate-50 text-slate-900 selection:bg-emerald-500/30";

  // Modern Floating Header Classes - Glassmorphism Update
  const headerClasses = theme === 'dark'
    ? "bg-slate-900/60 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl"
    : "bg-white/60 border border-slate-200/60 shadow-xl shadow-slate-200/60 backdrop-blur-xl";

  const logoClasses = theme === 'dark'
    ? "text-white group-hover:text-emerald-400"
    : "text-slate-900 group-hover:text-emerald-600"; 

  // Updated Hover: Clean white/slate-50 in light mode to avoid dark shadows
  // Added hover:border-black for light mode
  const navButtonClasses = theme === 'dark'
    ? "bg-slate-800/50 hover:bg-slate-700 border-slate-700 hover:border-white/20 text-slate-300 hover:text-white"
    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-black text-slate-600 hover:text-emerald-700 shadow-sm";

  const footerLinkClasses = theme === 'dark'
    ? "text-emerald-500 hover:text-emerald-400 decoration-emerald-500/50 rounded px-1"
    : "text-emerald-600 hover:text-emerald-500 decoration-emerald-600/50 rounded px-1";

  return (
    <div className={`min-h-screen flex flex-col font-inter transition-colors duration-500 ${mainContainerClasses}`}>
      <style>{`
        .toggle{cursor:pointer;display:inline-flex;align-items:center}
        .toggle-switch{display:inline-block;background:#2b2f3a;border-radius:999px;width:58px;height:32px;position:relative;vertical-align:middle;transition:background .25s}
        .toggle-switch:before{content:"";display:block;background:linear-gradient(to bottom,#fff 0%,#eee 100%);border-radius:999px;box-shadow:0 0 0 1px rgba(0,0,0,.25);width:24px;height:24px;position:absolute;top:4px;left:4px;transition:left .25s}
        .toggle:hover .toggle-switch:before{background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.5)}
        .toggle-checkbox{position:absolute;visibility:hidden}
        .toggle-checkbox:checked + .toggle-switch{background:#038759}
        .toggle-checkbox:checked + .toggle-switch:before{left:30px}
        .toggle-switch{max-width:100%}
      `}</style>
      <div className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500 px-4 py-2 text-xs text-amber-950 shadow-lg shadow-black/40" role="status" aria-live="polite">
        <svg viewBox="-0.5 0 25 25" className="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10.8809 16.15C10.8809 16.0021 10.9101 15.8556 10.967 15.7191C11.024 15.5825 11.1073 15.4586 11.2124 15.3545C11.3175 15.2504 11.4422 15.1681 11.5792 15.1124C11.7163 15.0567 11.8629 15.0287 12.0109 15.03C12.2291 15.034 12.4413 15.1021 12.621 15.226C12.8006 15.3499 12.9399 15.5241 13.0211 15.7266C13.1024 15.9292 13.122 16.1512 13.0778 16.3649C13.0335 16.5786 12.9272 16.7745 12.7722 16.9282C12.6172 17.0818 12.4204 17.1863 12.2063 17.2287C11.9922 17.2711 11.7703 17.2494 11.5685 17.1663C11.3666 17.0833 11.1938 16.9426 11.0715 16.7618C10.9492 16.5811 10.8829 16.3683 10.8809 16.15ZM11.2408 13.42L11.1008 8.20001C11.0875 8.07453 11.1008 7.94766 11.1398 7.82764C11.1787 7.70761 11.2424 7.5971 11.3268 7.5033C11.4112 7.40949 11.5144 7.33449 11.6296 7.28314C11.7449 7.2318 11.8697 7.20526 11.9958 7.20526C12.122 7.20526 12.2468 7.2318 12.3621 7.28314C12.4773 7.33449 12.5805 7.40949 12.6649 7.5033C12.7493 7.5971 12.813 7.70761 12.8519 7.82764C12.8909 7.94766 12.9042 8.07453 12.8909 8.20001L12.7609 13.42C12.7609 13.6215 12.6809 13.8149 12.5383 13.9574C12.3958 14.0999 12.2024 14.18 12.0009 14.18C11.7993 14.18 11.606 14.0999 11.4635 13.9574C11.321 13.8149 11.2408 13.6215 11.2408 13.42Z" />
          <path d="M12 21.5C17.1086 21.5 21.25 17.3586 21.25 12.25C21.25 7.14137 17.1086 3 12 3C6.89137 3 2.75 7.14137 2.75 12.25C2.75 17.3586 6.89137 21.5 12 21.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        La plataforma está en mantenimiento, puedes registrarte y te informaremos vía correo electrónico.
      </div>
      {showCookieBanner && (
      <div className="fixed bottom-4 right-4 z-[76]">
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          className="w-[min(480px,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-slate-950 px-6 py-5 text-white shadow-2xl shadow-black/50"
        >
          {!showCookiePrefs ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center">
                      <img src={faviconIcon} alt="AAAQuest" className="h-7 w-7" />
                    </div>
                    <span id="cookie-banner-title" className="text-[18px] font-semibold text-white">AAAQuest</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Utilizamos cookies para mejorar su experiencia de navegación, ofrecer anuncios o contenidos personalizados y analizar nuestro tráfico.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      persistCookiePrefs({ analytics: true, marketing: true });
                      setCookieAnalytics(true);
                      setCookieMarketing(true);
                      setShowCookieBanner(false);
                    }}
                    className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950"
                  >
                    Aceptar todas
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        persistCookiePrefs({ analytics: false, marketing: false });
                        setCookieAnalytics(false);
                        setCookieMarketing(false);
                        setShowCookieBanner(false);
                      }}
                      className="w-full rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Denegar todas
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setShowCookiePrefs(true);
                      }}
                      className="w-full rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Preferencias
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div>
                        <p id="cookie-essential-title" className="text-sm font-semibold">Esenciales <span className="text-xs font-normal text-slate-400">(obligatorio)</span></p>
                        <p id="cookie-essential-desc" className="mt-2 text-xs text-slate-400">Necesarios para que el sitio web funcione. No se pueden desactivar.</p>
                      </div>
                      <label className="toggle">
                        <input
                          className="toggle-checkbox"
                          type="checkbox"
                          checked
                          disabled
                          aria-disabled="true"
                          aria-labelledby="cookie-essential-title"
                          aria-describedby="cookie-essential-desc"
                        />
                        <div className="toggle-switch" aria-hidden="true" />
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div>
                        <p id="cookie-analytics-title" className="text-sm font-semibold">Analíticos</p>
                        <p id="cookie-analytics-desc" className="mt-2 text-xs text-slate-400">Nos ayudan a comprender cómo interactúan los visitantes con el sitio web.</p>
                      </div>
                      <label className="toggle">
                        <input
                          className="toggle-checkbox"
                          type="checkbox"
                          checked={cookieAnalytics}
                          onChange={() => setCookieAnalytics((prev) => !prev)}
                          aria-labelledby="cookie-analytics-title"
                          aria-describedby="cookie-analytics-desc"
                        />
                        <div className="toggle-switch" aria-hidden="true" />
                      </label>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div>
                        <p id="cookie-marketing-title" className="text-sm font-semibold">Marketing</p>
                        <p id="cookie-marketing-desc" className="mt-2 text-xs text-slate-400">Se utilizan para rastrear a los visitantes en distintos sitios web con el fin de mostrar anuncios relevantes.</p>
                      </div>
                      <label className="toggle">
                        <input
                          className="toggle-checkbox"
                          type="checkbox"
                          checked={cookieMarketing}
                          onChange={() => setCookieMarketing((prev) => !prev)}
                          aria-labelledby="cookie-marketing-title"
                          aria-describedby="cookie-marketing-desc"
                        />
                        <div className="toggle-switch" aria-hidden="true" />
                      </label>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    persistCookiePrefs({ analytics: cookieAnalytics, marketing: cookieMarketing });
                    setShowCookiePrefs(false);
                    setShowCookieBanner(false);
                  }}
                  className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  Guardar preferencias
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setShowCookiePrefs(false);
                  }}
                  className="w-full text-center text-sm font-semibold text-[#038759]"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {showMaintenance && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div
            role="alert"
            className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-slate-950 px-8 py-8 text-center text-white shadow-2xl shadow-black/60"
          >
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              onClick={() => setShowMaintenance(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-semibold">Plataforma en mantenimiento</h2>
            <p className="mt-3 text-sm text-slate-200">
              Estamos añadiendo mejoras en la plataforma, tanto la funcionalidad de modo estudio como la de analizador ha sido bloqueada. Puedes registrarte y te informaremos. Para más información puedes ver el estado en{' '}
              <a
                href="https://www.linkedin.com/in/victorsaizalfageme/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline underline-offset-4"
              >
                LinkedIn
              </a>
              .
            </p>
          </div>
        </>
      )}
      
      {/* Dynamic Background Grid */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" 
           style={{
             backgroundImage: theme === 'dark' 
                ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
                : 'linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px)',
             backgroundSize: '50px 50px'
           }} 
           aria-hidden="true"
      />

      {/* Modern Floating Header - Width aligned to Content (max-w-5xl) */}
      {mode !== AppMode.ACCOUNT && (
      <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full transition-all duration-300 h-16 px-6 flex items-center justify-between ${headerClasses}`}>
          <button 
            className="flex items-center gap-3 font-bold text-lg cursor-pointer group active:scale-95 transition-transform rounded-full px-2 py-1"
            onClick={handleLogoClick}
            aria-label={t.appTitle + " - " + t.returnSelector}
          >
            {/* Logo Icon - Green Gradient - ScanEye used for 'eye with cables' look */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-gradient-to-tr from-emerald-500 to-green-600 hover:shadow-emerald-500/50`}>
              <ScanEye className="text-white w-5 h-5" />
            </div>
            
            <span className={`tracking-tight transition-colors hidden sm:inline ${logoClasses}`}>{t.appTitle}</span>
          </button>
          
          <nav className="flex items-center gap-2" aria-label="Main Navigation">
            {mode === AppMode.HOME && (
              <a
                href="#pricing"
                className={`flex items-center justify-center gap-2 px-4 h-10 rounded-full transition-all active:scale-95 text-xs font-normal ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                aria-label={t.pricingNav}
              >
                <span className="pt-0.5 leading-none">{t.pricingNav}</span>
              </a>
            )}
            {!authUser && (
              <button
                type="button"
                onClick={() => openAuth('signup')}
                className="flex items-center justify-center px-4 h-10 border rounded-full transition-all active:scale-95 text-xs font-normal text-white border-[#038759] bg-[#038759] hover:bg-[#026e49]"
                aria-label={t.signUpNav}
              >
                <span className="pt-0.5 leading-none">{t.signUpNav}</span>
              </button>
            )}

            {/* Language Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`flex items-center justify-center gap-2 px-4 h-10 border rounded-full transition-all active:scale-95 text-xs font-bold ${navButtonClasses}`}
                aria-expanded={isLangMenuOpen}
                aria-haspopup="true"
                aria-label={`Current language: ${getLangLabel(language)}. Click to change.`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline pt-0.5 leading-none">{getLangLabel(language)}</span>
                <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} aria-hidden="true" />
                  <div 
                    className={`absolute right-0 mt-3 w-40 border rounded-2xl shadow-xl overflow-hidden z-50 animate-fade-in ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'
                    }`}
                    role="menu"
                  >
                    {(['es', 'en'] as Language[]).map((lang) => (
                      <button 
                        key={lang}
                        onClick={() => changeLanguage(lang)} 
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                            theme === 'dark'
                                ? (language === lang ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white')
                                : (language === lang ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700')
                        }`}
                        role="menuitem"
                      >
                        {getLangLabel(lang)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {authUser && (
              <div className="relative">
                {(() => {
                  const avatarUrl =
                    authUser?.user_metadata?.picture
                    || authUser?.user_metadata?.avatar_url
                    || '';
                  return (
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-white shadow-lg active:scale-95 ${avatarUrl ? 'bg-slate-900/40' : 'bg-gradient-to-tr from-emerald-500 to-teal-500'}`}
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  aria-label="User menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold uppercase">{(authName || authUser.email || 'U').slice(0, 1)}</span>
                  )}
                </button>
                  );
                })()}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} aria-hidden="true" />
                    <div className={`absolute right-0 mt-3 w-64 border rounded-2xl shadow-xl overflow-hidden z-50 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                      <div className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                        <div className="text-sm font-semibold">{authName || authUser.email?.split('@')[0]}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} whitespace-nowrap`}>
                          {authUser.email}
                        </div>
                      </div>
                      <div className={`h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigateMode(AppMode.ACCOUNT);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Mi cuenta
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Mi plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Facturación
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Términos y condiciones
                      </button>
                      <div className={`h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <button
                        type="button"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        Contáctanos
                      </button>
                      <div className={`h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <button
                        type="button"
                        onClick={async () => {
                          setIsUserMenuOpen(false);
                          await supabase.auth.signOut();
                          setAuthUser(null);
                          setAuthName('');
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        {t.signOutButton}
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M12.9999 2C10.2385 2 7.99991 4.23858 7.99991 7C7.99991 7.55228 8.44762 8 8.99991 8C9.55219 8 9.99991 7.55228 9.99991 7C9.99991 5.34315 11.3431 4 12.9999 4H16.9999C18.6568 4 19.9999 5.34315 19.9999 7V17C19.9999 18.6569 18.6568 20 16.9999 20H12.9999C11.3431 20 9.99991 18.6569 9.99991 17C9.99991 16.4477 9.55219 16 8.99991 16C8.44762 16 7.99991 16.4477 7.99991 17C7.99991 19.7614 10.2385 22 12.9999 22H16.9999C19.7613 22 21.9999 19.7614 21.9999 17V7C21.9999 4.23858 19.7613 2 16.9999 2H12.9999Z" fill="currentColor"></path>
                          <path d="M13.9999 11C14.5522 11 14.9999 11.4477 14.9999 12C14.9999 12.5523 14.5522 13 13.9999 13V11Z" fill="currentColor"></path>
                          <path d="M5.71783 11C5.80685 10.8902 5.89214 10.7837 5.97282 10.682C6.21831 10.3723 6.42615 10.1004 6.57291 9.90549C6.64636 9.80795 6.70468 9.72946 6.74495 9.67492L6.79152 9.61162L6.804 9.59454L6.80842 9.58848C6.80846 9.58842 6.80892 9.58778 5.99991 9L6.80842 9.58848C7.13304 9.14167 7.0345 8.51561 6.58769 8.19098C6.14091 7.86637 5.51558 7.9654 5.19094 8.41215L5.18812 8.41602L5.17788 8.43002L5.13612 8.48679C5.09918 8.53682 5.04456 8.61033 4.97516 8.7025C4.83623 8.88702 4.63874 9.14542 4.40567 9.43937C3.93443 10.0337 3.33759 10.7481 2.7928 11.2929L2.08569 12L2.7928 12.7071C3.33759 13.2519 3.93443 13.9663 4.40567 14.5606C4.63874 14.8546 4.83623 15.113 4.97516 15.2975C5.04456 15.3897 5.09918 15.4632 5.13612 15.5132L5.17788 15.57L5.18812 15.584L5.19045 15.5872C5.51509 16.0339 6.14091 16.1336 6.58769 15.809C7.0345 15.4844 7.13355 14.859 6.80892 14.4122L5.99991 15C6.80892 14.4122 6.80897 14.4123 6.80892 14.4122L6.804 14.4055L6.79152 14.3884L6.74495 14.3251C6.70468 14.2705 6.64636 14.1921 6.57291 14.0945C6.42615 13.8996 6.21831 13.6277 5.97282 13.318C5.89214 13.2163 5.80685 13.1098 5.71783 13H13.9999V11H5.71783Z" fill="currentColor"></path>
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

          </nav>
      </header>
      )}

      {toastMessage && (
        <div className="fixed top-24 right-6 z-[60]" role="alert" aria-live="polite">
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <span className="text-sm">{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className={`w-7 h-7 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content - Added top padding for header and bottom padding for fixed footer */}
      <main className="flex-grow container mx-auto px-4 pt-32 pb-24 relative z-10" id="main-content">
        {renderContent()}
      </main>

      <footer className={`w-full border-t py-4 backdrop-blur-md transition-all duration-300 ${theme === 'dark' ? 'border-white/5 bg-black/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{t.footer} </span>
            <a 
              href="https://www.linkedin.com/in/victorsaizalfageme/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`transition-colors hover:underline underline-offset-4 font-medium ${footerLinkClasses}`}
              aria-label="Victor Saiz Alfageme LinkedIn Profile"
            >
              Victor Saiz Alfageme
            </a>
          </p>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        entry={authEntry}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        theme={theme}
      />
    </div>
  );
};

const Home: React.FC<{setMode: (m: AppMode) => void, t: any, theme: Theme, language: Language, onOpenAuth: (entry: 'signup' | 'signin') => void}> = ({ setMode, t, theme, language, onOpenAuth }) => {
  const discountRate = 0.15;
  const starterOriginal = 15;
  const proOriginal = 40;
  const starterPrice = Number((starterOriginal * (1 - discountRate)).toFixed(2));
  const proPrice = Number((proOriginal * (1 - discountRate)).toFixed(2));
  const [openFaqIndexes, setOpenFaqIndexes] = useState<Set<number>>(new Set());

  const formatCurrency = (value: number) =>
    value.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const formatEuro = (value: number) => `${formatCurrency(value)} EUR`;

  const featureCards = [
    { icon: Clock, ...t.features[0] },
    { icon: FileText, ...t.features[1] },
    { icon: Layers, ...t.features[2] },
    { icon: RefreshCcw, ...t.features[3] }
  ];

  const pricingPlans = [
    {
      id: 'starter',
      name: t.pricingStarterName,
      desc: t.pricingStarterDesc,
      badge: t.pricingStarterBadge,
      price: starterPrice,
      original: starterOriginal,
      cta: t.pricingStarterCta,
      includesLabel: t.pricingStarterIncludes,
      features: t.pricingStarterFeatures,
      highlight: false,
      disabled: true
    },
    {
      id: 'pro',
      name: t.pricingProName,
      desc: t.pricingProDesc,
      badge: t.pricingProBadge,
      price: proPrice,
      original: proOriginal,
      cta: t.pricingProCta,
      includesLabel: t.pricingProIncludes,
      features: t.pricingProFeatures,
      highlight: true,
      disabled: true
    },
    {
      id: 'enterprise',
      name: t.pricingEnterpriseName,
      desc: t.pricingEnterpriseDesc,
      badge: t.pricingEnterpriseBadge,
      priceLabel: t.pricingEnterprisePrice,
      cta: t.pricingEnterpriseCta,
      ctaHref: 'mailto:victorsaizalfageme@gmail.com',
      includesLabel: t.pricingEnterpriseIncludes,
      features: t.pricingEnterpriseFeatures,
      highlight: false
    }
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] w-full">
      
      {/* Blurred Background Visual */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" aria-hidden="true">
         <div className={`transform scale-[2.5] origin-center blur-2xl filter saturate-50 ${theme === 'dark' ? 'opacity-30' : 'opacity-10'}`}>
           <NeuralCore />
         </div>
      </div>

      {/* Main Foreground Container */}
      <div className="relative z-10 w-full max-w-6xl px-4">
        <div className="flex flex-col items-center text-center mt-6 md:mt-10">
          
          <div className="space-y-8 mb-16 max-w-3xl flex flex-col items-center">
            
            <Reveal>
              <div className="flex flex-col items-center gap-4">
                <div className="relative inline-block">
                <h1 className={`text-4xl md:text-6xl font-black tracking-tight drop-shadow-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  <span>{t.homeTitle}</span>
                </h1>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <p className={`text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.homeSubtitle}
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm font-normal border border-[#038759] bg-[#038759] text-white hover:bg-[#026e49] active:scale-95"
                  aria-label={t.signUpNav}
                >
                  <UserPlus className="w-4 h-4" />
                  {t.signUpForFree}
                </button>
                <button
                  onClick={() => setMode(AppMode.CHECKER)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm font-normal border active:scale-95 ${theme === 'dark' ? 'bg-slate-900 text-white border-slate-700 hover:bg-slate-800' : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'}`}
                >
                  <LogIn className="w-4 h-4" />
                  {t.launchApp}
                </button>
              </div>
            </Reveal>
          </div>

        </div>

        <div className="w-full max-w-6xl mx-auto mt-10 md:mt-14">
          <div className={`rounded-[2rem] overflow-hidden border ${theme === 'dark' ? 'bg-slate-900 border-white/10 shadow-2xl shadow-black/50' : 'bg-white border-slate-200 shadow-2xl shadow-slate-200/70'}`}>
            <video
              className="w-full h-auto block"
              src={homeVideoSrc}
              autoPlay
              muted
              loop
              playsInline
              controls
              preload="metadata"
              aria-label="Video demo del detector de accesibilidad"
            />
          </div>
        </div>

        <section className="w-full mt-28">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`mt-6 text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t.featuresTitle}
              </h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.featuresSubtitle}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 items-stretch">
            {featureCards.map((feature: any, index: number) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 100}>
                  <div className={`group rounded-3xl border p-6 transition-all tilt-hover h-full ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#9ff0cf]" />
                    </div>
                    <h3 className={`mt-6 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                    <p className={`mt-3 text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="w-full mt-32">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.workflowTitle}</h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.workflowSubtitle}</p>
            </div>
          </Reveal>

          <div className="relative mt-12">
            <div className="grid lg:grid-cols-3 gap-6">
              {t.workflowSteps.map((step: any, index: number) => (
                  <Reveal key={step.title} delay={index * 120}>
                    <div className="relative p-8 text-center">
                      <div className="mx-auto w-14 h-14 rounded-full bg-[#038759] text-white flex items-center justify-center text-lg font-semibold shadow-lg shadow-emerald-500/20">
                        {index + 1}
                      </div>
                      <h3 className={`mt-6 text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                      <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
                    </div>
                  </Reveal>
                ))}
            </div>
          </div>
        </section>

        <section className="w-full mt-32">
          <div className={`rounded-[2.5rem] border px-8 md:px-12 relative overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 right-10 w-40 h-40 rounded-full bg-[#038759]/20 blur-3xl" />
              <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
            </div>
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative">
              <Reveal>
                <div>
                  <div className="flex items-center gap-3">
                    <img src={figmaLogo} alt="Figma" className="w-[60px] h-[60px]" />
                    <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pluginTitle}</h2>
                  </div>
                  <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.pluginSubtitle}</p>
                  <ul className="mt-6 space-y-3">
                    {t.pluginBullets.map((bullet: string) => (
                      <li key={bullet} className={`flex items-center gap-3 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="w-6 h-6 rounded-full bg-[#038759] text-white flex items-center justify-center text-xs">✓</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <span className={`text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.pluginNote}</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="relative w-[420px] h-[420px] max-w-full rounded-[2rem] overflow-hidden mx-auto">
                  <img
                    src={pluginImage}
                    alt={t.pluginTitle}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="pricing" className="w-full mt-32 scroll-mt-32">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pricingTitle}</h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.pricingSubtitle}</p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            {pricingPlans.map((plan: any, index: number) => (
              <Reveal key={plan.id} delay={index * 120}>
                <div
                  className={`rounded-3xl border p-10 h-full flex flex-col ${
                    theme === 'dark'
                      ? 'border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl shadow-black/40'
                      : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'
                  } ${plan.highlight ? 'ring-1 ring-[#038759]/70' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                      <p className={`mt-2 text-sm min-h-[48px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{plan.desc}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest border ${
                      theme === 'dark' ? 'bg-slate-800/80 border-white/10 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>

                  <div className="mt-6">
                    {plan.original && (
                      <div className="text-sm text-slate-500">
                        {t.pricingBefore} <span className="line-through">{formatEuro(plan.original)}</span>
                      </div>
                    )}
                    <div className={`mt-2 text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price ? formatEuro(plan.price) : plan.priceLabel}
                      {plan.price && (
                        <span className={`text-base font-normal ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.pricingPerMonth}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-8">
                    {plan.ctaHref ? (
                      <a
                        href={plan.ctaHref}
                        className={`w-full rounded-full text-center py-2 text-sm font-normal transition inline-flex items-center justify-center ${
                          theme === 'dark' ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled={plan.disabled}
                        aria-disabled={plan.disabled}
                        className={`w-full rounded-full py-2 text-sm font-normal transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          theme === 'dark' ? 'bg-white text-slate-900 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {plan.cta}
                      </button>
                    )}
                  </div>

                </div>
              </Reveal>
            ))}
          </div>

          <p className={`mt-6 text-center text-[10px] px-12 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.pricingFootnote}</p>
        </section>

        <section className="w-full mt-32">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.faqTitle}</h2>
            </div>
          </Reveal>
          <div className="mt-10 space-y-4">
            {t.faqItems.map((item: any, index: number) => {
              const isOpen = openFaqIndexes.has(index);
              return (
                <Reveal key={item.q} delay={index * 120}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenFaqIndexes((prev) => {
                        const next = new Set(prev);
                        if (next.has(index)) {
                          next.delete(index);
                        } else {
                          next.add(index);
                        }
                        return next;
                      });
                    }}
                    className={`w-full rounded-2xl border px-6 py-5 text-left transition ${theme === 'dark' ? 'border-white/10 bg-slate-900/60 hover:border-white/20' : 'border-slate-200 bg-white hover:border-slate-300 shadow-md shadow-slate-200/40'}`}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.q}</h3>
                      <div className="flex items-center gap-3">
                        {item.comingSoon && (
                          <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {t.faqTagComingSoon}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`} />
                      </div>
                    </div>
                    {isOpen && (
                      <p className={`mt-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.a}</p>
                    )}
                  </button>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="w-full mt-24 mb-16">
          <Reveal>
            <div className={`rounded-[2rem] border px-6 py-10 md:px-10 md:py-12 text-center ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
              <h3 className={`text-2xl md:text-3xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.contactCtaTitle}</h3>
              <p className={`mt-3 text-sm md:text-base ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.contactCtaSubtitle}</p>
              <a
                href="mailto:victorsaizalfageme@gmail.com"
                className="mt-6 inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-normal bg-[#038759] text-white hover:bg-[#026e49]"
              >
                {t.contactCtaButton}
              </a>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
};

export default App;
