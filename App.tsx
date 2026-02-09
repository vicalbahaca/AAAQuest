
import React, { useState, useEffect } from 'react';
import { AppMode, Language, TRANSLATIONS, Theme } from './types';
import { StudyMode } from './components/StudyMode';
import { TestMode } from './components/TestMode';
import { CheckerMode } from './components/CheckerMode';
import { InfoMode } from './components/InfoMode';
import { CertificateMode } from './components/CertificateMode';
import { SignIn } from './components/SignIn';
import { AuthModal } from './components/AuthModal';
import { NeuralCore } from './components/NeuralCore';
import { ScanEye, Globe, ChevronDown, ArrowRight, UserPlus, LogIn, Sparkles, FileText, Layers, Plug, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Loader } from './components/Loader';
import { Reveal } from './components/Reveal';

const homeVideoSrc = new URL('./files/VideoHome.mp4', import.meta.url).href;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [focusMode, setFocusMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const theme: Theme = 'dark'; // Default to dark mode
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authEntry, setAuthEntry] = useState<'signup' | 'signin'>('signup');

  // Scroll to top whenever mode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  useEffect(() => {
    if (!isAuthOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isAuthOpen]);

  const openAuth = (entry: 'signup' | 'signin') => {
    setAuthEntry(entry);
    setIsAuthOpen(true);
  };

  const t = TRANSLATIONS[language];

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
        return <StudyMode setFocusMode={setFocusMode} language={language} theme={theme} setMode={setMode} />;
      case AppMode.TEST:
        return <TestMode language={language} theme={theme} />;
      case AppMode.CHECKER:
        return <CheckerMode language={language} theme={theme} />;
      case AppMode.INFO:
        return <InfoMode setMode={setMode} language={language} theme={theme} />;
      case AppMode.CERTIFICATE:
        return <CertificateMode language={language} theme={theme} setMode={setMode} />;
      case AppMode.SIGNIN:
        return <SignIn language={language} theme={theme} setMode={setMode} />;
      default:
        return <Home setMode={setMode} t={t} theme={theme} language={language} onOpenAuth={openAuth} />;
    }
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
      <header className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full transition-all duration-300 h-16 px-6 flex items-center justify-between ${headerClasses}`}>
          <button 
            className="flex items-center gap-3 font-bold text-lg cursor-pointer group active:scale-95 transition-transform rounded-full px-2 py-1"
            onClick={() => setMode(AppMode.HOME)}
            aria-label={t.appTitle + " - " + t.returnSelector}
          >
            {/* Logo Icon - Green Gradient - ScanEye used for 'eye with cables' look */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 bg-gradient-to-tr from-emerald-500 to-green-600 hover:shadow-emerald-500/50`}>
              <ScanEye className="text-white w-5 h-5" />
            </div>
            
            <span className={`tracking-tight transition-colors hidden sm:inline ${logoClasses}`}>{t.appTitle}</span>
          </button>
          
          <nav className="flex items-center gap-2" aria-label="Main Navigation">
            {/* Pricing Button */}
            <a
              href="/pricing"
              className={`flex items-center justify-center gap-2 px-4 h-10 border rounded-full transition-all active:scale-95 text-xs font-normal ${navButtonClasses}`}
              aria-label={t.pricingTitle}
            >
              <span className="pt-0.5 leading-none">{t.pricingTitle}</span>
            </a>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="flex items-center justify-center px-4 h-10 border rounded-full transition-all active:scale-95 text-xs font-normal text-white border-[#038759] bg-[#038759] hover:bg-[#026e49]"
              aria-label={t.signUpNav}
            >
              <span className="pt-0.5 leading-none">{t.signUpForFree}</span>
            </button>

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

          </nav>
      </header>

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
  const starterPrice = 12;
  const starterOriginal = 14.99;
  const discountFactor = starterPrice / starterOriginal;
  const proPrice = 36;
  const proOriginal = Number((proPrice / discountFactor).toFixed(2));

  const formatCurrency = (value: number) =>
    value.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const featureCards = [
    { icon: Sparkles, ...t.features[0] },
    { icon: FileText, ...t.features[1] },
    { icon: Layers, ...t.features[2] },
    { icon: ShieldCheck, ...t.features[3] }
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
                  {t.signUpNav}
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
              onLoadedMetadata={(event) => {
                event.currentTarget.playbackRate = 1.5;
              }}
              aria-label="Video demo del detector de accesibilidad"
            />
          </div>
        </div>

        <section className="w-full mt-20">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <span className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border ${theme === 'dark' ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300' : 'bg-emerald-100 border-emerald-200 text-emerald-700'}`}>
                {t.homeEyebrow}
              </span>
              <h2 className={`mt-6 text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t.featuresTitle}
              </h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.featuresSubtitle}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {featureCards.map((feature: any, index: number) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={index * 100}>
                  <div className={`group rounded-3xl border p-6 transition-all tilt-hover ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
                    <div className="relative h-36 rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-black">
                      <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-[#038759]/30 blur-2xl animate-float-slow" />
                      <div className="absolute bottom-4 left-4 w-24 h-10 rounded-xl bg-white/10" />
                      <div className="absolute top-5 left-5 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#9ff0cf]" />
                      </div>
                      <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/5 animate-float-fast" />
                    </div>
                    <h3 className={`mt-6 text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                    <p className={`mt-3 text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{feature.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="w-full mt-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div>
                <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.workflowTitle}</h2>
                <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.workflowSubtitle}</p>
                <div className="mt-8 space-y-4">
                  {t.workflowSteps.map((step: any, index: number) => (
                    <div key={step.title} className={`flex items-start gap-4 rounded-2xl border p-4 ${theme === 'dark' ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-white shadow-md shadow-slate-200/40'}`}>
                      <div className="w-10 h-10 rounded-full bg-[#038759] text-white flex items-center justify-center text-sm font-normal">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <div className={`relative rounded-[2rem] border p-8 overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/50'}`}>
                <div className="absolute -top-10 -left-6 w-40 h-40 rounded-full bg-[#038759]/20 blur-3xl" />
                <div className="space-y-4 relative">
                  <div className="h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-4">
                    <div className="w-24 h-2 rounded-full bg-white/20" />
                    <div className="w-12 h-2 rounded-full bg-white/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-float-slow" />
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-float-fast" />
                    <div className="col-span-2 h-24 rounded-2xl bg-white/5 border border-white/10" />
                  </div>
                  <div className="h-10 rounded-2xl bg-[#038759] text-white text-sm flex items-center justify-center">
                    {t.pricingContactOnly}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="w-full mt-24">
          <div className={`rounded-[2.5rem] border p-8 md:p-12 relative overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-10 right-10 w-40 h-40 rounded-full bg-[#038759]/20 blur-3xl" />
              <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-white/5 blur-3xl" />
            </div>
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center relative">
              <Reveal>
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#038759] flex items-center justify-center text-white">
                      <Plug className="w-6 h-6" />
                    </div>
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
                    <a
                      href="#"
                      onClick={(event) => event.preventDefault()}
                      className="inline-flex items-center gap-2 text-sm font-normal text-[#038759] border-b border-transparent hover:border-[#038759] transition"
                    >
                      {t.pluginCta} <ArrowUpRight className="w-4 h-4" />
                    </a>
                    <span className={`text-xs uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.pluginNote}</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="relative h-64 md:h-80 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute top-6 left-6 w-24 h-10 rounded-full bg-white/10" />
                    <div className="absolute top-6 right-6 w-16 h-10 rounded-full bg-white/10" />
                    <div className="absolute bottom-6 left-6 w-36 h-16 rounded-2xl bg-white/10" />
                    <div className="absolute bottom-6 right-6 w-24 h-24 rounded-3xl bg-[#038759]/30 animate-float" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl animate-float-slow" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="w-full mt-24">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.showcaseTitle}</h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.showcaseSubtitle}</p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[0, 1, 2].map((item) => (
              <Reveal key={item} delay={item * 120}>
                <div className={`rounded-3xl border p-6 relative overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-lg shadow-slate-200/40'}`}>
                  <div className="absolute -top-8 right-8 w-32 h-32 rounded-full bg-[#038759]/20 blur-3xl" />
                  <div className="relative space-y-4">
                    <div className="h-10 rounded-2xl bg-white/5 border border-white/10" />
                    <div className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-float-fast" />
                    <div className="h-14 rounded-2xl bg-white/5 border border-white/10" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="w-full mt-24">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.pricingTitle}</h2>
              <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{t.pricingSubtitle}</p>
            </div>
          </Reveal>

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            <Reveal>
              <div className={`rounded-3xl border p-8 h-full ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
                <div className="text-sm uppercase tracking-widest text-slate-400">{t.pricingStarterName}</div>
                <div className={`mt-3 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>12€<span className="text-base font-normal">{t.pricingPerMonth}</span></div>
                <div className="mt-2 text-sm text-slate-500">
                  {t.pricingBefore} <span className="line-through">{formatCurrency(starterOriginal)}€</span>
                </div>
                <div className="mt-6 text-sm text-slate-400">{t.pricingStarterDesc}</div>
                <div className="mt-6 text-sm text-slate-300">{`25 ${t.pricingScreensPerMonth}`}</div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className={`rounded-3xl border p-8 h-full relative ${theme === 'dark' ? 'border-[#038759] bg-slate-900/80' : 'border-[#038759] bg-white shadow-xl shadow-slate-200/40'}`}>
                <div className="absolute -top-4 right-6 px-3 py-1 rounded-full bg-[#038759] text-white text-xs">{t.pricingPopular}</div>
                <div className="text-sm uppercase tracking-widest text-slate-400">{t.pricingProName}</div>
                <div className={`mt-3 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>36€<span className="text-base font-normal">{t.pricingPerMonth}</span></div>
                <div className="mt-2 text-sm text-slate-500">
                  {t.pricingBefore} <span className="line-through">{formatCurrency(proOriginal)}€</span>
                </div>
                <div className="mt-6 text-sm text-slate-400">{t.pricingProDesc}</div>
                <div className="mt-6 text-sm text-slate-300">{`100 ${t.pricingScreensPerMonth}`}</div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className={`rounded-3xl border p-8 h-full ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-xl shadow-slate-200/40'}`}>
                <div className="text-sm uppercase tracking-widest text-slate-400">{t.pricingEnterpriseName}</div>
                <div className={`mt-3 text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Custom</div>
                <div className="mt-6 text-sm text-slate-400">{t.pricingEnterpriseDesc}</div>
                <a
                  href="mailto:victorsaizalfageme@gmail.com"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-normal text-[#038759]"
                >
                  {t.pricingEnterpriseCta} <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </Reveal>
          </div>

          <p className={`mt-6 text-center text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{t.pricingFootnote}</p>
        </section>

        <section className="w-full mt-24 mb-16">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className={`text-3xl md:text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.faqTitle}</h2>
            </div>
          </Reveal>
          <div className="mt-10 space-y-4">
            {t.faqItems.map((item: any, index: number) => (
              <Reveal key={item.q} delay={index * 120}>
                <div className={`rounded-2xl border p-6 ${theme === 'dark' ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white shadow-md shadow-slate-200/40'}`}>
                  <h3 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.q}</h3>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
