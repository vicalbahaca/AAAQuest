
import React, { useState, useEffect } from 'react';
import { AppMode, Language, TRANSLATIONS, Theme } from './types';
import { StudyMode } from './components/StudyMode';
import { TestMode } from './components/TestMode';
import { CheckerMode } from './components/CheckerMode';
import { InfoMode } from './components/InfoMode';
import { CertificateMode } from './components/CertificateMode';
import { NeuralCore } from './components/NeuralCore';
import { ScanEye, Globe, ChevronDown, ArrowRight } from 'lucide-react';
import { Loader } from './components/Loader';
import { Reveal } from './components/Reveal';

const homeVideoSrc = new URL('./files/VideoHome.mp4', import.meta.url).href;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [focusMode, setFocusMode] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const theme: Theme = 'light'; // Light mode only
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Scroll to top whenever mode changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

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
      case 'zh': return '中文';
      case 'ru': return 'Русский';
      case 'hi': return 'हिन्दी';
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
      default:
        return <Home setMode={setMode} t={t} theme={theme} />;
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
              className={`flex items-center justify-center gap-2 px-4 h-10 border rounded-full transition-all active:scale-95 text-xs font-bold text-white ${
                theme === 'dark' 
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50' 
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600/20 shadow-sm'
              }`}
              aria-label={t.pricingTitle}
            >
              <span className="pt-0.5 leading-none">{t.pricingTitle}</span>
            </a>

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
                    {(['es', 'en', 'zh', 'ru', 'hi'] as Language[]).map((lang) => (
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

      <footer className={`fixed bottom-0 left-0 w-full border-t py-4 backdrop-blur-md z-50 transition-all duration-300 ${theme === 'dark' ? 'border-white/5 bg-black/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-4 text-center">
          <p className={`text-xs md:text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {t.footer}{' '}
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
    </div>
  );
};

const Home: React.FC<{setMode: (m: AppMode) => void, t: any, theme: Theme}> = ({ setMode, t, theme }) => {
  const infoButtonClasses = theme === 'dark'
    ? "bg-slate-800/50 hover:bg-slate-700 border-slate-700 hover:border-white/20 text-slate-300 hover:text-white"
    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-black text-slate-600 hover:text-emerald-700 shadow-sm";

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
        <div className="flex flex-col items-center text-center">
          
          <div className="space-y-8 mb-16 max-w-3xl flex flex-col items-center">
            
            <Reveal>
              <div className="relative inline-block">
                <h1 className={`text-5xl md:text-7xl font-black tracking-tight drop-shadow-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {t.appTitle}
                </h1>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <p className={`text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                {t.homeSubtitle}
              </p>
            </Reveal>

            <Reveal delay={300}>
              <button
                onClick={() => setMode(AppMode.INFO)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all text-sm border active:scale-95 ${infoButtonClasses}`}
              >
                {t.homeInfoButton}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-6 w-full max-w-3xl" role="list">
            <Reveal delay={400} className="h-full">
              <Card 
                title={t.checkerMode}
                desc={t.checkerModeDesc}
                // Checker Mode: GREEN
                icon={<ScanEye className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-white'}`} aria-hidden="true" />}
                onClick={() => setMode(AppMode.CHECKER)}
                theme={theme}
                darkColor="from-green-500/20 to-green-900/20"
                lightColor="bg-gradient-to-br from-white to-emerald-50 border-slate-200"
                lightIconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
                ariaLabel={`${t.checkerMode}: ${t.checkerModeDesc}`}
              />
            </Reveal>
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

        </div>
      </div>
    </div>
  );
};

const Card: React.FC<{
  title: string, 
  desc: string, 
  icon: React.ReactNode, 
  onClick: () => void, 
  theme: Theme, 
  darkColor: string, 
  lightColor: string, 
  lightIconBg: string, 
  ariaLabel: string,
  badge?: string,
  disabled?: boolean
}> = ({title, desc, icon, onClick, theme, darkColor, lightColor, lightIconBg, ariaLabel, badge, disabled}) => {
    const isDark = theme === 'dark';
    
    // Updated Hover: Border changes to white (Dark) or black (Light), and subtle scale zoom
    const hoverInteraction = disabled
        ? ""
        : (isDark 
        ? "hover:border-white hover:scale-[1.02]" 
        : "hover:border-black hover:scale-[1.02]");

    const cardClass = isDark
        ? `bg-gradient-to-br ${darkColor} border-white/5 shadow-lg ${hoverInteraction}` 
        : `${lightColor} shadow-sm ${hoverInteraction}`; 
        
    const iconBg = isDark
        ? 'bg-slate-950/40 border-white/10'
        : `${lightIconBg} shadow-lg shadow-black/5`;

    return (
        <div role="listitem" className="h-full">
            <button 
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                className={`${cardClass} w-full backdrop-blur-md p-6 rounded-xl border text-center flex flex-col items-center transition-all duration-300 active:scale-95 group relative overflow-hidden h-full ${
                  disabled ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                aria-label={ariaLabel}
                aria-disabled={disabled ? "true" : "false"}
            >
                {badge && (
                  <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded border tracking-widest uppercase ${
                    isDark 
                      ? 'bg-white/10 text-white border-white/20' 
                      : 'bg-black/5 text-black/60 border-black/10'
                  }`}>
                    {badge}
                  </div>
                )}
                
                <div className={`mb-4 w-14 h-14 rounded-xl flex items-center justify-center border-none transition-transform duration-300 ${iconBg}`}>
                {icon}
                </div>
                {/* Neutral Text Colors as requested */}
                <h3 className={`text-lg font-bold mb-2 tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
                <p className={`text-sm leading-relaxed transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
            </button>
        </div>
    );
};

export default App;
