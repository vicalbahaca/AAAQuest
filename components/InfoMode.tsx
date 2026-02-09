
import React from 'react';
import { AppMode, Language, TRANSLATIONS, Theme } from '../types';
import { BookOpen, CheckCircle, Zap, ChevronRight, Smartphone, ArrowRight, Coffee } from 'lucide-react';
import { Reveal } from './Reveal';

interface InfoModeProps {
  setMode: (mode: AppMode) => void;
  language: Language;
  theme: Theme;
  variant?: 'page' | 'home';
}

// --- LOGOS ---
const WindowsLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 88 88" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 12.402L35.656 7.523V41.816H0V12.402ZM41.426 6.742L87.086 0V41.816H41.426V6.742ZM0 47.609H35.656V81.859L0 77.016V47.609ZM41.426 47.609H87.086V88L41.426 81.285V47.609Z" /></svg>
);
const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z"/></svg>
);
const AndroidLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.523 15.3414C17.523 15.3414 17.523 15.3414 17.523 15.3414C17.523 15.3414 17.523 15.3414 17.523 15.3414ZM14.908 4.3879L16.299 1.979C16.375 1.847 16.331 1.678 16.199 1.602C16.067 1.526 15.898 1.57 15.822 1.702L14.414 4.141C12.986 3.489 11.411 3.125 9.718 3.125C8.025 3.125 6.45 3.489 5.022 4.141L3.614 1.702C3.538 1.57 3.369 1.526 3.237 1.602C3.105 1.678 3.061 1.847 3.137 1.979L4.528 4.3879C2.071 5.7369 0.384 8.2449 0.054 11.1719H19.382C19.052 8.2449 17.365 5.7369 14.908 4.3879ZM5.385 8.783C4.942 8.783 4.583 8.424 4.583 7.981C4.583 7.538 4.942 7.179 5.385 7.179C5.828 7.179 6.187 7.538 6.187 7.981C6.187 8.424 5.828 8.783 5.385 8.783ZM14.051 8.783C13.608 8.783 13.249 8.424 13.249 7.981C13.249 7.538 13.608 7.179 14.051 7.179C14.494 7.179 14.853 7.538 14.853 7.981C14.853 8.424 14.494 8.783 14.051 8.783Z" /></svg>
);

export const InfoMode: React.FC<InfoModeProps> = ({ setMode, language, theme, variant = 'page' }) => {
  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';
  const isHome = variant === 'home';
  const showHero = !isHome;
  const showStudySection = !isHome;
  const showCheckerCta = !isHome;

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-600';
  const glassCard = isDark 
    ? 'bg-slate-900/60 backdrop-blur-xl border border-white/10' 
    : 'bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl shadow-slate-200/50';
  const containerClasses = isHome
    ? 'w-full max-w-7xl mx-auto px-4 md:px-8 pb-24'
    : 'w-full max-w-7xl mx-auto px-6 md:px-8 pb-32';

  return (
    <div className={containerClasses}>
      
      {/* --- HERO SECTION --- */}
      {showHero && (
        <section className="min-h-[50vh] flex flex-col items-center justify-center text-center pt-0 pb-10 relative">
          <Reveal delay={200}>
            <h1 className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9] ${textMain}`}>
              {t.infoTitle.split(':')[0]}<span className={isDark ? 'text-emerald-500' : 'text-emerald-600'}>.</span>
            </h1>
          </Reveal>

          <Reveal delay={400}>
            <p className={`text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto ${textSub}`}>
              {t.infoSubtitle}
            </p>
          </Reveal>
        </section>
      )}

      {/* --- SECTION 1: LEARNING (Large Visual Left) --- */}
      {showStudySection && (
        <section className="py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
              
              {/* Visual: Abstract "Knowledge Stack" */}
              <Reveal className="relative order-2 lg:order-1 h-[500px]">
                 <div className={`w-full h-full rounded-[3rem] overflow-hidden relative border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
                    {/* Decorative Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-blue-900/20 via-slate-900 to-purple-900/20' : 'from-blue-50 via-white to-indigo-50'}`} />
                    
                    {/* Floating Elements */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                        {/* Card 1 */}
                        <div className={`w-full max-w-sm p-6 rounded-2xl mb-[-40px] z-10 transform scale-90 opacity-60 ${glassCard}`}>
                            <div className="h-2 w-1/3 bg-slate-400/30 rounded mb-4"/>
                            <div className="h-2 w-full bg-slate-400/20 rounded"/>
                        </div>
                        {/* Card 2 */}
                        <div className={`w-full max-w-sm p-6 rounded-2xl mb-[-40px] z-20 transform scale-95 opacity-80 shadow-lg ${glassCard}`}>
                            <div className="flex justify-between items-center mb-4">
                               <div className="h-2 w-1/2 bg-blue-500/40 rounded"/>
                               <div className="w-6 h-6 rounded-full bg-blue-500/20"/>
                            </div>
                            <div className="space-y-2">
                               <div className="h-2 w-full bg-slate-400/20 rounded"/>
                               <div className="h-2 w-3/4 bg-slate-400/20 rounded"/>
                            </div>
                        </div>
                        {/* Card 3 (Main) */}
                        <div className={`w-full max-w-sm p-8 rounded-3xl z-30 shadow-2xl border-t border-white/20 relative ${isDark ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-white'}`}>
                            <div className={`absolute top-0 right-0 p-8 opacity-20`}>
                               <BookOpen className={`w-24 h-24 ${isDark ? 'text-white' : 'text-blue-500'}`} />
                            </div>
                            <div className="relative z-10">
                                <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${isDark ? 'text-blue-200' : 'text-blue-600'}`}>{t.infoLevel1}</span>
                                <h3 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.infoFoundations}</h3>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>WCAG</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
              </Reveal>

              {/* Content */}
              <div className="order-1 lg:order-2 space-y-8">
                  <Reveal delay={200}>
                      <div className="mb-8">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-100 border-blue-200 text-blue-800'}`}>
                          {t.studyMode}
                        </span>
                        
                      </div>
                      <h2 className={`text-4xl md:text-5xl font-bold leading-tight mb-12 ${textMain}`}>
                          {t.learnSectionTitle}
                      </h2>
                      <p className={`text-xl leading-relaxed ${textSub}`}>
                          {t.learnSectionDesc}
                      </p>
                      
                      <ul className="space-y-4 mt-8">
                           {t.infoLearnList.map((item: string, i: number) => (
                               <li key={i} className="flex items-start gap-4">
                                   <div className={`mt-1 p-1 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                       <CheckCircle className="w-4 h-4" />
                                   </div>
                                   <span className={`text-lg ${textMain}`}>{item}</span>
                               </li>
                           ))}
                       </ul>

                      <button 
                          onClick={() => setMode(AppMode.STUDY)}
                          className={`mt-8 px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30'}`}
                      >
                          {t.studyMode} <ArrowRight className="w-5 h-5" />
                      </button>
                  </Reveal>
              </div>
          </div>
        </section>
      )}

      {/* --- SECTION 2: SCREEN READERS (Modern Cards) --- */}
      <section className="py-24">
         <Reveal className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 ${textMain}`}>{t.srTitle}</h2>
            <p className={`text-xl ${textSub}`}>{t.srDesc}</p>
         </Reveal>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card NVDA */}
            <Reveal delay={100} className="h-full">
                <div className={`h-full p-8 rounded-[2rem] border relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                     <div className="mb-8">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                            <WindowsLogo className="w-8 h-8" />
                         </div>
                         <h3 className={`text-2xl font-bold mb-2 ${textMain}`}>{t.nvdaTitle}</h3>
                         <span className={`text-xs font-bold uppercase tracking-widest opacity-60 ${textSub}`}>{t.nvdaSubtitle}</span>
                     </div>
                     <p className={`text-base leading-relaxed ${textSub}`}>{t.nvdaDesc}</p>
                </div>
            </Reveal>

            {/* Card VoiceOver */}
            <Reveal delay={200} className="h-full">
                <div className={`h-full p-8 rounded-[2rem] border relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                     <div className="mb-8">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                            <AppleLogo className="w-8 h-8" />
                         </div>
                         <h3 className={`text-2xl font-bold mb-2 ${textMain}`}>{t.voiceOverTitle}</h3>
                         <span className={`text-xs font-bold uppercase tracking-widest opacity-60 ${textSub}`}>{t.voiceOverSubtitle}</span>
                     </div>
                     <p className={`text-base leading-relaxed ${textSub}`}>{t.voiceOverDesc}</p>
                </div>
            </Reveal>

            {/* Card TalkBack */}
            <Reveal delay={300} className="h-full">
                <div className={`h-full p-8 rounded-[2rem] border relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xl'}`}>
                     <div className="mb-8">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
                            <AndroidLogo className="w-8 h-8" />
                         </div>
                         <h3 className={`text-2xl font-bold mb-2 ${textMain}`}>{t.talkBackTitle}</h3>
                         <span className={`text-xs font-bold uppercase tracking-widest opacity-60 ${textSub}`}>{t.talkBackSubtitle}</span>
                     </div>
                     <p className={`text-base leading-relaxed ${textSub}`}>{t.talkBackDesc}</p>
                </div>
            </Reveal>
         </div>
      </section>

      {/* --- SECTION 3: CHECKER (Modern Split) --- */}
      <section className="py-24">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
            
            <div className="space-y-10">
                <Reveal>
                    <div className="flex items-center gap-4 mb-6">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
                            {t.checkerMode}
                        </span>
                    </div>
                    <h2 className={`text-4xl md:text-5xl font-bold leading-tight ${textMain}`}>
                        {t.auditSectionTitle}
                    </h2>
                </Reveal>
                
                <Reveal delay={200}>
                    <p className={`text-xl leading-relaxed mb-8 ${textSub}`}>{t.auditSectionDesc}</p>
                    
                    <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                        {t.whyBetterList.map((item: string, i: number) => (
                            <div key={i} className="py-4 flex items-start gap-4">
                                <CheckCircle className={`w-6 h-6 shrink-0 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`} />
                                <span className={`text-lg font-medium ${textMain}`}>{item}</span>
                            </div>
                        ))}
                    </div>
                </Reveal>

                <Reveal delay={400}>
                    {showCheckerCta && (
                    <button 
                        onClick={() => setMode(AppMode.CHECKER)}
                        className="px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-2xl bg-[#038759] text-white hover:bg-[#026e49] shadow-emerald-900/40"
                    >
                        {t.ctaChecker} <ArrowRight className="w-5 h-5" />
                    </button>
                    )}
                </Reveal>
            </div>

            <Reveal className="relative h-[600px]" delay={300}>
                <div className={`w-full h-full rounded-[3rem] border relative overflow-hidden flex flex-col items-center justify-center ${isDark ? 'bg-black border-slate-800' : 'bg-white border-slate-200 shadow-2xl'}`}>
                    
                    {/* Background Grid Pattern inside the scanner */}
                    <div className={`absolute inset-0 opacity-20`} style={{
                         backgroundImage: `linear-gradient(${isDark ? '#334155' : '#cbd5e1'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? '#334155' : '#cbd5e1'} 1px, transparent 1px)`,
                         backgroundSize: '40px 40px'
                    }} />

                    {/* Abstract UI Representation */}
                    <div className="w-[75%] h-[80%] relative z-10 flex flex-col gap-6">
                        
                        {/* Header */}
                        <div className={`w-full h-16 rounded-2xl border flex items-center justify-between px-6 relative ${glassCard}`}>
                             <div className="w-8 h-8 rounded-full bg-slate-400/30" />
                             <div className="w-24 h-3 rounded-full bg-slate-400/30" />

                             {/* Header Tag */}
                             <div className="absolute -top-3 left-2 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-500 text-[10px] font-bold rounded">HEADER</div>
                             <div className="absolute -top-3 right-[-10px] w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-20">1</div>
                        </div>
                        
                        {/* Hero Area */}
                        <div className={`w-full h-48 rounded-2xl border flex items-end p-6 relative ${glassCard}`}>
                             <div className="space-y-3 w-full">
                                <div className="w-2/3 h-6 rounded-lg bg-slate-400/40" />
                                <div className="w-1/2 h-3 rounded bg-slate-400/20" />
                             </div>
                             
                             {/* Body Tag */}
                             <div className="absolute -top-3 left-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-500 text-[10px] font-bold rounded">BODY</div>
                             <div className="absolute -top-3 right-[-10px] w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-20">2</div>
                        </div>

                        {/* Grid (Body Content) */}
                        <div className="grid grid-cols-2 gap-4 flex-grow relative">
                             <div className={`rounded-2xl border ${glassCard}`} />
                             <div className={`rounded-2xl border ${glassCard}`} />
                             <div className={`rounded-2xl border ${glassCard}`} />
                             <div className={`rounded-2xl border ${glassCard}`} />
                             
                        </div>

                         {/* Footer */}
                         <div className={`w-full h-16 rounded-2xl border flex items-center justify-center px-6 relative ${glassCard}`}>
                             <div className="w-32 h-3 rounded-full bg-slate-400/30" />

                             {/* Footer Tag */}
                             <div className="absolute -top-3 left-2 px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-500 text-[10px] font-bold rounded">FOOTER</div>
                             <div className="absolute -top-3 right-[-10px] w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-20">3</div>
                        </div>
                    </div>
                </div>
            </Reveal>

        </div>
      </section>

      {/* --- SECTION 4: COMING SOON --- */}
      <section className="py-20 text-center relative">
          <Reveal>
              <h2 className={`text-3xl md:text-4xl font-bold mb-8 ${textMain}`}>{t.comingSoon}</h2>
              <div className="flex justify-center">
                <a
                  href="https://buymeacoffee.com/victorsaiz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-[#038759] rounded-full transition-all active:scale-95 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-1 bg-[#038759] hover:bg-[#026e49]"
                  aria-label={t.supportBtn}
                >
                  <Coffee className="w-5 h-5 shrink-0" />
                  <span>{t.supportBtn}</span>
                </a>
              </div>
          </Reveal>
      </section>

    </div>
  );
};
