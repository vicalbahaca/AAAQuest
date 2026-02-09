
import React, { useState, useEffect } from 'react';
import { generateStudyLesson } from '../services/geminiService';
import { StudyLesson, VisualComponentType, Language, TRANSLATIONS, Theme, UserProgress, AdaptiveContext, AppMode } from '../types';
import { BookOpen, ArrowRight, ArrowLeft, Check, X, RotateCcw, Volume2, Eye, Layout, MousePointerClick, AlignLeft, Info, Globe, Image, Contrast, Type, Code, Ear, ChevronDown, Star, Lock, Sparkles, Smartphone, Monitor, Plus, Edit2, CircleDot } from 'lucide-react';
import { Loader } from './Loader';
import { Reveal } from './Reveal';

interface StudyModeProps {
  setFocusMode: (focus: boolean) => void;
  language: Language;
  theme: Theme;
  setMode: (mode: AppMode) => void;
}

const MAX_LEVELS = 10;

const renderFormattedText = (text: string, isDark: boolean) => {
  if (!text) return null;
  const parseBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={isDark ? "text-blue-300 font-bold" : "text-blue-700 font-bold"}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  
  let processedText = text;
  // Basic markdown normalization
  processedText = processedText.replace(/###\s/g, ""); // Remove headers for now, handle via typography
  processedText = processedText.replace(/([.:?!])\s*-\s/g, "$1\n- "); 
  processedText = processedText.replace(/([.:?!])\s*\*\s/g, "$1\n* ");
  processedText = processedText.replace(/\s+-\s+([A-ZÁÉÍÓÚÑ])/g, "\n- $1");
  processedText = processedText.replace(/\s+[•]\s+/g, "\n• ");

  return processedText.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-3" />;

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        const content = trimmed.replace(/^[-*•]\s+/, '');
        return (
            <div key={i} className="flex gap-3 ml-2 mb-4 items-start group">
                <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isDark ? 'bg-blue-400 group-hover:bg-blue-300' : 'bg-blue-600 group-hover:bg-blue-500'}`} />
                <p className={`leading-relaxed text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{parseBold(content)}</p>
            </div>
        );
    }
    // Header detection from the updated prompt (Step 2)
    if (/^¿?Qué es|Rol y|Nombre Accesible|Estados del|Comportamiento/.test(trimmed)) {
        return <h3 key={i} className={`mt-8 mb-4 font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed}</h3>;
    }
    
    return <p key={i} className={`mb-4 leading-relaxed text-base ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{parseBold(line)}</p>;
  });
};

const iconMap: Record<string, React.ComponentType<any>> = {
    book: BookOpen, globe: Globe, image: Image, contrast: Contrast, layout: Layout, text: Type, mouse: MousePointerClick, code: Code, eye: Eye, ear: Ear, info: Info, star: Star
};

const LearningPillAccordion: React.FC<{
    pill: { title: string; description: string; icon: string; link?: string };
    isDark: boolean;
    t: any;
}> = ({ pill, isDark, t }) => {
    const [isOpen, setIsOpen] = useState(true);
    const IconComponent = iconMap[pill.icon] || Info;

    const parseAndRender = (text: string) => {
        const parts = text.split('\n');
        return parts.map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-3" />;

            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
            const content = trimmed.replace(/^[-*•]\s+/, '');

            return (
                <div key={i} className={`group relative mb-4 select-text ${isBullet ? 'flex gap-3 ml-2 items-start' : ''}`}>
                    {isBullet && <span className={`mt-2.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />}
                    <div className="flex-grow">
                        <p className={`leading-relaxed text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {content.split(/(\*\*.*?\*\*)/g).map((part, pi) => (
                                part.startsWith('**') && part.endsWith('**') 
                                ? <strong key={pi} className={isDark ? "text-blue-300 font-bold" : "text-blue-700 font-bold"}>{part.slice(2, -2)}</strong> 
                                : part
                            ))}
                        </p>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className={`border rounded-xl transition-all duration-300 overflow-hidden ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left group"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                        <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className={`text-lg font-bold group-hover:text-blue-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{pill.title}</h3>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-6 pl-[4.5rem] animate-fade-in border-t border-dashed border-opacity-10" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                    <div className="pt-5">{parseAndRender(pill.description)}</div>
                </div>
            )}
        </div>
    );
};

export const StudyMode: React.FC<StudyModeProps> = ({ setFocusMode, language, theme, setMode }) => {
  const [userProgress, setUserProgress] = useState<UserProgress>({ maxLevel: 1, history: [], cachedLessons: {} });

  const [view, setView] = useState<'SELECTOR' | 'LESSON'>('SELECTOR');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [step, setStep] = useState(1);
  const [lesson, setLesson] = useState<StudyLesson | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Updated Tabs for Combined Step 3
  const [activeTab, setActiveTab] = useState<'visual' | 'nonTech' | 'tech' | 'voiceOver'>('visual');
  const [codeTab, setCodeTab] = useState<'html' | 'ios' | 'android'>('html');
  const [srTab, setSrTab] = useState<'mobile' | 'desktop'>('mobile');

  // Test states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);

  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const glassPanel = isDark ? 'glass-panel' : 'bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-xl';

  // Automatic scroll on view or step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, step]);

  const startLevel = async (lvl: number) => {
  setLoading(true);
  setCurrentLevel(lvl);
  setView('LESSON');
  resetLessonState();
  setFocusMode(true);
  try {
      if (userProgress.cachedLessons[lvl]) {
          console.log(`✅ Loading cached lesson ${lvl} with ${userProgress.cachedLessons[lvl].test?.length || 0} questions`);
          setLesson(userProgress.cachedLessons[lvl]);
      } else {
          console.log(`🔄 Generating new lesson ${lvl}`);
          const data = await generateStudyLesson(lvl, language);
          console.log(`✅ Generated lesson ${lvl} with ${data.test?.length || 0} questions`);
          setLesson(data);
          setUserProgress(prev => ({ ...prev, cachedLessons: { ...prev.cachedLessons, [lvl]: data } }));
      }
  } catch (error) { 
      console.error("Error loading lesson:", error);
      setView('SELECTOR'); 
  } finally { setLoading(false); }
};

  const resetLessonState = () => {
    setStep(1);
    setActiveTab('visual'); // Reset tab to Visual by default
    setCurrentQuestionIndex(0);
    setTestScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setLevelComplete(false);
  };

  const returnToSelector = () => {
      setFocusMode(false);
      setView('SELECTOR');
  };

  // Test Logic
  const handleTestAnswer = (index: number) => {
    if (showResult || !lesson) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === lesson.test[currentQuestionIndex].correctIndex) setTestScore(s => s + 1);
  };

  const nextQuestion = () => {
  if (!lesson) return;
  
  if (!lesson.test || lesson.test.length === 0) {
    console.error("No test questions available");
    setLevelComplete(true);
    return;
  }
  
  if (currentQuestionIndex < lesson.test.length - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
    setShowResult(false);
    setSelectedAnswer(null);
  } else {
    setLevelComplete(true);
  }
};

  const finishLevel = () => {
      const newHistoryEntry = { levelId: currentLevel, score: testScore, timestamp: Date.now() };
      const updatedHistory = [...userProgress.history, newHistoryEntry];
      let newMaxLevel = userProgress.maxLevel;
      
      if (currentLevel === userProgress.maxLevel && currentLevel < MAX_LEVELS) {
          newMaxLevel = currentLevel + 1;
      }

      setUserProgress(prev => ({ ...prev, history: updatedHistory, maxLevel: newMaxLevel }));
      
      if (currentLevel === MAX_LEVELS) {
          setFocusMode(false);
          setMode(AppMode.CERTIFICATE);
          return;
      }

      setFocusMode(false);
      setView('SELECTOR');
  };

  if (view === 'SELECTOR') {
      return (
          <div className="max-w-6xl mx-auto p-6 animate-fade-in">
              <div className="text-center mb-10">
                  <h2 className={`text-4xl font-bold mb-2 flex justify-center items-center gap-3 ${textMain}`}>
                    <BookOpen className={`w-10 h-10 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} aria-hidden="true" /> 
                    <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-blue-600 to-blue-800'}`}>{t.studyTitle}</span>
                  </h2>
                  <p className={`text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto ${textSub}`}>{t.studySubtitle}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: MAX_LEVELS }).map((_, idx) => {
                      const levelNum = idx + 1;
                      const isLocked = levelNum > userProgress.maxLevel;
                      const levelAttempts = userProgress.history.filter(h => h.levelId === levelNum);
                      const bestAttempt = levelAttempts.length > 0 ? Math.max(...levelAttempts.map(h => h.score)) : 0;
                      const cachedLesson = userProgress.cachedLessons[levelNum];
                      const topic = cachedLesson ? cachedLesson.topicTag : `${t.level} ${levelNum}`;
                      
                      // Check if the user has attempted the level but has 0 correct answers (Failed)
                      const hasFailed = levelAttempts.length > 0 && bestAttempt === 0;

                      return (
                          <button
                            key={levelNum}
                            onClick={() => !isLocked && startLevel(levelNum)}
                            disabled={isLocked}
                            className={`relative p-4 h-32 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 group ${
                                isLocked 
                                    ? `opacity-50 cursor-not-allowed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-none'}`
                                    : `active:scale-95 ${
                                        hasFailed 
                                            ? (isDark ? 'bg-slate-800 hover:bg-slate-700 border-red-500 text-red-400' : 'bg-white border-red-500 text-red-600 shadow-sm shadow-red-100')
                                            : (isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm')
                                    }`
                            }`}
                          >
                              {isLocked ? <Lock className="w-8 h-8 text-slate-500 mb-2" /> : (
                                  <>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${hasFailed ? (isDark ? 'text-red-400' : 'text-red-500') : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>{t.level}</span>
                                    <span className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{levelNum}</span>
                                    <span className={`text-xs text-center line-clamp-2 px-2 ${hasFailed ? 'text-inherit' : textSub} group-hover:text-blue-500`}>{topic}</span>
                                    <div className="flex gap-0.5 mt-2">
                                        {[1, 2, 3].map(star => (<Star key={star} className={`w-3 h-3 ${star <= bestAttempt ? 'fill-yellow-400 text-yellow-400' : (hasFailed ? 'text-red-200 dark:text-red-900' : 'text-slate-600')}`} />))}
                                    </div>
                                  </>
                              )}
                          </button>
                      );
                  })}
              </div>
          </div>
      );
  }

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader text={t.generatingLesson} theme={theme} /></div>;
  if (!lesson) return null;

  const p = lesson.visualComponentProps || {};
  const totalSteps = 5; // Reduced from 6 to 5 because Step 3 & 4 are combined
  const handleNext = () => { let n = step + 1; if (n <= totalSteps) { setStep(n); } };
  const handlePrev = () => { let p = step - 1; if (p >= 1) { setStep(p); } };

  return (
    <>
      <div className={`fixed top-[5.5rem] left-1/2 -translate-x-1/2 z-40 w-[80%] md:max-w-2xl rounded-b-2xl border-x border-b backdrop-blur-xl px-6 h-14 flex items-center justify-between shadow-xl transition-all duration-500 ${isDark ? 'bg-slate-900/95 border-slate-700/50 shadow-black/40' : 'bg-white/95 border-slate-200/50 shadow-slate-200/40'}`}>
          <button onClick={returnToSelector} className={`p-1.5 rounded-full hover:bg-slate-500/10 transition-colors relative z-10 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}><X className="w-5 h-5" /></button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
               <span className={`text-[10px] uppercase font-bold tracking-widest leading-none mb-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t.level} {currentLevel}</span>
               <span className={`text-xs font-semibold leading-none ${textMain}`}>{lesson.topicTag}</span>
          </div>
          <div className="flex items-center relative z-10">
              <span className={`text-xs md:text-sm font-bold font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.step} <span className={isDark ? 'text-white' : 'text-black'}>{step}</span> / {totalSteps}</span>
          </div>
      </div>

      <div className={`animate-fade-in relative pt-14 ${step === 1 ? '' : 'pb-20'}`}>
        <div className="max-w-4xl mx-auto px-4">
        
        {step === 1 && (
            <div className="flex flex-col items-center justify-start pt-10 min-h-[calc(100vh-17.5rem)] space-y-8 animate-fade-in">
                <div className={`inline-block p-4 rounded-full mb-4 ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <Layout className={`w-12 h-12 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h1 className={`text-center text-4xl md:text-5xl font-black ${textMain}`}>{lesson.introTitle}</h1>
                <p className={`text-center text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto ${textSub}`}>{lesson.introSubtitle}</p>
                <button onClick={handleNext} className={`mt-8 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 mx-auto transition-all hover:scale-105 active:scale-95 text-white shadow-lg ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}>
                    {t.start} <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className={`text-2xl font-bold mb-6 text-center ${textMain}`}>{t.concepts}</h2>
                <div className="flex flex-col gap-4">
                    {lesson.learningPills.map((pill, idx) => (
                        <LearningPillAccordion key={idx} pill={pill} isDark={isDark} t={t} />
                    ))}
                </div>
            </div>
        )}

        {/* COMBINED STEP 3: VISUAL + DOCUMENTATION */}
        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className={`text-2xl font-bold mb-4 text-center ${textMain}`}>Ejemplo de componente & Documentación</h2>
                
                {/* Main Tabs - Mobile: Grid, Desktop: Horizontal Pills */}
                {(() => {
                    const tabs = [
                        { id: 'visual', label: 'Ejemplo de componente', icon: Eye },
                        { id: 'nonTech', label: t.tabs.nonTech, icon: AlignLeft },
                        { id: 'tech', label: t.tabs.tech, icon: Code },
                        { id: 'voiceOver', label: t.tabs.voiceOver, icon: Ear },
                    ];

                    return (
                        <>
                            {/* Mobile Grid Layout */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 md:hidden">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm border transition-all active:scale-95 ${
                                            activeTab === tab.id 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                                : `${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`
                                        }`}
                                    >
                                        <tab.icon className="w-4 h-4" /> {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Desktop Horizontal Layout */}
                            <div className="hidden md:flex justify-center mb-8">
                                <div className={`inline-flex p-1 rounded-xl whitespace-nowrap ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-200'}`}>
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                                                activeTab === tab.id 
                                                    ? 'bg-blue-600 text-white shadow-lg' 
                                                    : `${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`
                                            }`}
                                        >
                                            <tab.icon className="w-4 h-4" /> {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    );
                })()}

                <div className={`p-4 md:p-8 rounded-2xl border min-h-[400px] ${cardBg} transition-all duration-300`}>
                    
                    {/* 1. VISUAL EXAMPLE TAB */}
                    {activeTab === 'visual' && (
                        <div className="animate-fade-in flex flex-col items-center">
                            <div className={`w-full p-4 md:p-10 rounded-2xl flex items-center justify-center min-h-[350px] border relative overflow-hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="font-sans antialiased flex flex-col items-center gap-4">
                                    
                                    {/* M3 TEXT FIELD */}
                                    {lesson.visualComponent === 'M3_TEXT_FIELD' && (
                                        <div className="relative w-full max-w-xs group">
                                            <div className={`relative bg-slate-100 dark:bg-slate-800 rounded-t-lg border-b-2 flex items-center px-4 pt-6 pb-2 transition-colors ${
                                                p.state === 'error' 
                                                    ? 'border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10' 
                                                    : 'border-slate-500 dark:border-slate-400 focus-within:border-blue-600 dark:focus-within:border-blue-400'
                                            }`}>
                                                <input 
                                                    type="text" 
                                                    id="m3-input"
                                                    className="block w-full bg-transparent border-none focus:ring-0 p-0 text-base text-slate-900 dark:text-white placeholder-transparent peer"
                                                    placeholder=" "
                                                    disabled={p.state === 'disabled'}
                                                    aria-invalid={p.state === 'error'}
                                                    aria-describedby={p.errorText ? "error-desc" : undefined}
                                                />
                                                <label 
                                                    htmlFor="m3-input"
                                                    className={`absolute left-4 top-4 origin-[0] -translate-y-3 scale-75 transform text-sm duration-200 pointer-events-none peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 ${
                                                        p.state === 'error' 
                                                            ? 'text-red-600 dark:text-red-400' 
                                                            : 'text-slate-500 dark:text-slate-400 peer-focus:text-blue-600 dark:peer-focus:text-blue-400'
                                                    }`}
                                                >
                                                    {p.label || "Label"}
                                                </label>
                                            </div>
                                            {(p.helperText || p.errorText) && (
                                                <p id="error-desc" className={`mt-1 text-xs px-4 ${p.state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>
                                                    {p.errorText || p.helperText}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* M3 BUTTON */}
                                    {lesson.visualComponent === 'M3_BUTTON' && (
                                        <button 
                                            className={`h-10 px-6 rounded-full font-medium text-sm transition-all shadow-sm active:shadow-none flex items-center justify-center gap-2 overflow-hidden relative ${
                                                p.state === 'disabled' 
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20 dark:bg-blue-400 dark:text-blue-950 dark:hover:bg-blue-300'
                                            }`}
                                            aria-label={p.ariaLabel} 
                                            disabled={p.state === 'disabled'}
                                        >
                                            {/* Ripple effect simulator could go here */}
                                            {p.iconName && <Plus className="w-4 h-4" />}
                                            {p.buttonText || p.label || "Button"}
                                        </button>
                                    )}

                                    {/* M3 FAB */}
                                    {lesson.visualComponent === 'M3_FAB' && (
                                        <button 
                                            className={`w-14 h-14 rounded-2xl transition-all shadow-lg hover:shadow-xl active:shadow-md flex items-center justify-center ${
                                                p.state === 'disabled' 
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600' 
                                                    : 'bg-blue-200 text-blue-900 hover:bg-blue-300 dark:bg-blue-700 dark:text-blue-100'
                                            }`}
                                            aria-label={p.ariaLabel || "Floating Action Button"} 
                                            disabled={p.state === 'disabled'}
                                        >
                                            <Edit2 className="w-6 h-6" />
                                        </button>
                                    )}

                                    {/* M3 CARD */}
                                    {lesson.visualComponent === 'M3_CARD' && (
                                        <div className={`w-72 rounded-[12px] overflow-hidden border transition-all hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-surface border-slate-200 text-slate-900 bg-white'}`}>
                                            <div className={`h-40 w-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                                <Image className="opacity-20 w-12 h-12 text-slate-500" />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-xl mb-1 tracking-tight">{p.title || "Headline"}</h3>
                                                <p className={`text-sm mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p.description || "Explain a bit about this card."}</p>
                                                <div className="flex justify-end gap-2">
                                                    <button className={`px-3 py-1.5 rounded-full text-sm font-medium hover:bg-slate-500/10 ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Action</button>
                                                    <button className={`px-4 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-400 dark:text-blue-950`}>{p.buttonText || "Primary"}</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* M3 SWITCH */}
                                    {lesson.visualComponent === 'M3_SWITCH' && (
                                        <div className="flex items-center justify-between w-64 p-4 border rounded-xl dark:border-slate-700">
                                            <label className={`text-base font-medium ${textMain}`}>{p.label || "Settings"}</label>
                                            <button 
                                                role="switch" 
                                                aria-checked={p.checked}
                                                className={`w-[52px] h-8 rounded-full p-1 transition-colors relative border-2 ${
                                                    p.checked 
                                                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-400 dark:border-blue-400' 
                                                        : 'bg-transparent border-slate-400 dark:border-slate-500'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full shadow-sm transition-transform duration-200 absolute top-1.5 ${
                                                    p.checked 
                                                        ? 'translate-x-[22px] bg-white dark:bg-blue-950 w-5 h-5 top-1' 
                                                        : 'translate-x-[2px] bg-slate-500 dark:bg-slate-400'
                                                }`} />
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* M3 CHIPS */}
                                    {lesson.visualComponent === 'M3_CHIPS' && (
                                        <div className="flex flex-wrap gap-2">
                                            {(p.items || ["Chip 1", "Chip 2"]).map((item, i) => (
                                                <div key={i} className={`h-8 px-4 rounded-[8px] border flex items-center justify-center text-sm font-medium transition-colors cursor-pointer ${i === 0 ? (isDark ? 'bg-blue-900/50 border-transparent text-blue-200' : 'bg-blue-100 border-transparent text-blue-900') : (isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50')}`}>
                                                    {i === 0 && <Check className="w-4 h-4 mr-2" />}
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* M3 CHECKBOX */}
                                    {lesson.visualComponent === 'M3_CHECKBOX' && (
                                        <fieldset className="space-y-2 p-4 border rounded-xl dark:border-slate-700">
                                            <legend className={`text-sm font-medium px-2 ${textSub}`}>{p.label || "Select options"}</legend>
                                            {(p.items || ["Option 1", "Option 2"]).map((item, i) => (
                                                <label key={i} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-500/10 -ml-2">
                                                    <div className={`w-[18px] h-[18px] rounded-[2px] border-2 flex items-center justify-center transition-colors ${i === 0 ? 'bg-blue-600 border-blue-600 dark:bg-blue-400 dark:border-blue-400' : 'border-slate-500 group-hover:border-slate-700 dark:border-slate-400'}`}>
                                                        {i === 0 && <Check className="w-3.5 h-3.5 text-white dark:text-blue-950" />}
                                                    </div>
                                                    <span className={`text-base ${textMain}`}>{item}</span>
                                                </label>
                                            ))}
                                        </fieldset>
                                    )}

                                    {/* M3 RADIO GROUP */}
                                    {lesson.visualComponent === 'M3_RADIO_GROUP' && (
                                        <fieldset className="space-y-2 p-4 border rounded-xl dark:border-slate-700 w-64">
                                            <legend className={`text-sm font-medium px-2 mb-2 ${textSub}`}>{p.label || "Choose one"}</legend>
                                            {(p.items || ["Choice A", "Choice B"]).map((item, i) => (
                                                <label key={i} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-500/10 -ml-2">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${i === 0 ? 'border-blue-600 dark:border-blue-400' : 'border-slate-500 dark:border-slate-400'}`}>
                                                        {i === 0 && <div className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                                                    </div>
                                                    <span className={`text-base ${textMain}`}>{item}</span>
                                                </label>
                                            ))}
                                        </fieldset>
                                    )}
                                    
                                    {lesson.visualComponent === 'NONE' && (
                                        <div className="text-center opacity-40">
                                            <Sparkles className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <p className={textSub}>Theoretical Lesson</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 flex justify-center">
                               <a href="https://m3.material.io/" target="_blank" rel="noreferrer" className={`text-xs font-mono opacity-50 hover:opacity-100 transition-opacity ${textSub} flex items-center gap-1`}>
                                   <CircleDot className="w-3 h-3" /> Style: Material Design 3
                               </a>
                            </div>
                        </div>
                    )}

                    {/* 2. DOCUMENTACION NO TECNICA */}
                    {activeTab === 'nonTech' && (
                        <div className="animate-fade-in">
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {renderFormattedText(lesson.documentation.nonTechnical, isDark)}
                            </div>
                        </div>
                    )}
                    
                    {/* 3. DOCUMENTACION TECNICA (CODIGO) */}
                    {activeTab === 'tech' && (
                        <div className="animate-fade-in">
                             {/* Sub-tabs for Code */}
                            <div className="flex border-b border-opacity-10 mb-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                {['html', 'ios', 'android'].map((id) => {
                                    const labels: any = { html: 'HTML (Web)', ios: 'Swift (iOS)', android: 'XML (Android)' };
                                    return (
                                        <button 
                                            key={id} 
                                            onClick={() => setCodeTab(id as any)} 
                                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                                                codeTab === id 
                                                    ? 'border-blue-500 text-blue-500' 
                                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {labels[id]}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={`relative group rounded-xl overflow-hidden border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-800 text-white border-slate-900'}`}>
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-mono text-slate-500 px-2 py-1 bg-black/50 rounded">readonly</span>
                                </div>
                                <pre className="p-6 font-mono text-xs md:text-sm overflow-x-auto">
                                    <code className="language-html">
                                        {lesson.documentation.codeExamples?.[codeTab] || "// No code available"}
                                    </code>
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* 4. LECTORES DE PANTALLA */}
                    {activeTab === 'voiceOver' && (
                        <div className="animate-fade-in">
                            {/* Horizontal Tabs for Screen Readers - Replaces Grid Buttons */}
                            <div className="flex border-b border-opacity-10 mb-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                {['mobile', 'desktop'].map((id) => {
                                    const labels: any = { mobile: 'Mobile (VoiceOver/TalkBack)', desktop: 'Desktop (NVDA)' };
                                    const isActive = srTab === id;
                                    return (
                                        <button 
                                            key={id} 
                                            onClick={() => setSrTab(id as any)} 
                                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                                                isActive 
                                                    ? 'border-blue-500 text-blue-500' 
                                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {id === 'mobile' ? <Smartphone className="w-4 h-4"/> : <Monitor className="w-4 h-4"/>}
                                            {labels[id]}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className={`p-6 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <Volume2 className="w-4 h-4" /> 
                                    {srTab === 'mobile' ? 'Experiencia Táctil (Mobile)' : 'Experiencia de Teclado (Desktop)'}
                                </h4>
                                <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base">
                                    {renderFormattedText(
                                        srTab === 'mobile' 
                                            ? lesson.documentation.mobileScreenReader 
                                            : lesson.documentation.desktopScreenReader, 
                                        isDark
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {step === 4 && (
            <div className="space-y-8 animate-fade-in">
                <h2 className={`text-2xl font-bold ${textMain} text-center`}>{t.deepDive}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-xl border border-green-500/30 ${isDark ? 'bg-green-500/5' : 'bg-green-50'}`}>
                        <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2 text-lg"><Check /> {t.dos}</h3>
                        <ul className="space-y-3">{lesson.goodPractices.map((item, i) => <li key={i} className={`text-sm flex gap-2 ${isDark ? 'text-green-200' : 'text-green-800'}`}>• {item}</li>)}</ul>
                    </div>
                    <div className={`p-6 rounded-xl border border-red-500/30 ${isDark ? 'bg-red-500/5' : 'bg-red-50'}`}>
                        <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2 text-lg"><X /> {t.donts}</h3>
                        <ul className="space-y-3">{lesson.badPractices.map((item, i) => <li key={i} className={`text-sm flex gap-2 ${isDark ? 'text-red-200' : 'text-red-800'}`}>• {item}</li>)}</ul>
                    </div>
                </div>
            </div>
        )}

        {step === 5 && (
            <div className="animate-fade-in max-w-2xl mx-auto">
                {!levelComplete ? (
                    <div className={`p-8 rounded-2xl border ${glassPanel}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold ${textMain}`}>{t.question} {currentQuestionIndex + 1} / {lesson.test.length}</h2>
                            <div className="flex items-center gap-1 text-sm font-mono text-blue-500 font-bold"><Star className="w-4 h-4 fill-current" /><span>{testScore} {t.correct}</span></div>
                        </div>
                        <p className={`text-lg mb-8 leading-relaxed ${textMain}`}>{lesson.test[currentQuestionIndex].question}</p>
                        <div className="space-y-3">
                            {lesson.test[currentQuestionIndex].options.map((opt, idx) => (
                                <button key={idx} onClick={() => handleTestAnswer(idx)} disabled={showResult} className={`w-full text-left p-4 rounded-xl border transition-all ${showResult ? idx === lesson.test[currentQuestionIndex].correctIndex ? 'bg-green-500/20 border-green-500 text-green-600' : idx === selectedAnswer ? 'bg-red-500/20 border-red-500 text-red-600' : 'opacity-50' : isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'}`}>{opt}</button>
                            ))}
                        </div>
                        {showResult && (
                            <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-end">
                                <button onClick={nextQuestion} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                                    {/* Show Finish only if it's the last question */}
                                    {currentQuestionIndex < lesson.test.length - 1 ? t.next : t.finish} <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <div className="space-y-6">
                            <div className="flex justify-center gap-2">
                                {/* Always show 3 stars slots, fill based on score */}
                                {[1,2,3].map(s => <Star key={s} className={`w-12 h-12 ${s <= testScore ? 'fill-yellow-400 text-yellow-500' : 'text-slate-600'}`} />)}
                            </div>
                            <h2 className={`text-3xl font-black ${textMain}`}>{t.levelComplete}</h2>
                            <p className={`${textSub} text-lg`}>{t.score}: {testScore}/{lesson.test.length}</p>
                            <button onClick={finishLevel} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-500 transition-colors">{t.continue}</button>
                        </div>
                    </div>
                )}
            </div>
        )}

        {step > 1 && step < 5 && (
            <div className="mt-10 flex justify-between items-center w-full animate-fade-in">
                    <button onClick={handlePrev} className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 border backdrop-blur-xl ${isDark ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-600'}`}><ArrowLeft className="w-5 h-5" /> {t.back}</button>
                    <button onClick={handleNext} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold flex items-center gap-2 shadow-xl shadow-blue-500/30">{t.next} <ArrowRight className="w-5 h-5" /></button>
            </div>
        )}
        </div>
      </div>
    </>
  );
};
