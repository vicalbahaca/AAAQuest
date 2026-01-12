import React, { useState, useEffect } from 'react';
import { generateStudyLesson } from '../services/geminiService';
import { StudyLesson, VisualComponentType, Language, TRANSLATIONS, Theme, UserProgress, AdaptiveContext, AppMode } from '../types';
import { BookOpen, ArrowRight, ArrowLeft, Check, X, RotateCcw, Volume2, Eye, Layout, MousePointerClick, AlignLeft, Info, Globe, Image, Contrast, Type, Code, Ear, ChevronDown, Star, Lock, Sparkles, Smartphone, Monitor } from 'lucide-react';
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
    // Very basic header detection if AI returns it without ###
    if (/^[A-Z][a-zA-Z\s]+:$/.test(trimmed) || trimmed.length < 50 && trimmed.endsWith(':')) {
        return <h4 key={i} className={`mt-6 mb-3 font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{trimmed}</h4>;
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
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('aaaquest_progress');
    return saved ? JSON.parse(saved) : { maxLevel: 1, history: [], cachedLessons: {} };
  });

  const [view, setView] = useState<'SELECTOR' | 'LESSON'>('SELECTOR');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [step, setStep] = useState(1);
  const [lesson, setLesson] = useState<StudyLesson | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Step 4 Tabs
  const [docTab, setDocTab] = useState<'nonTech' | 'tech' | 'voiceOver'>('nonTech');
  const [codeTab, setCodeTab] = useState<'html' | 'ios' | 'android'>('html');
  const [srTab, setSrTab] = useState<'mobile' | 'desktop'>('mobile');

  // Test states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [testScore, setTestScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [levelComplete, setLevelComplete] = useState(false);
  const [levelFailed, setLevelFailed] = useState(false);

  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const glassPanel = isDark ? 'glass-panel' : 'bg-white/60 backdrop-blur-xl border border-slate-200/60 shadow-xl';

  useEffect(() => { localStorage.setItem('aaaquest_progress', JSON.stringify(userProgress)); }, [userProgress]);

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
            setLesson(userProgress.cachedLessons[lvl]);
        } else {
            const data = await generateStudyLesson(lvl, language);
            setLesson(data);
            setUserProgress(prev => ({ ...prev, cachedLessons: { ...prev.cachedLessons, [lvl]: data } }));
        }
    } catch (error) { setView('SELECTOR'); } finally { setLoading(false); }
  };

  const resetLessonState = () => {
    setStep(1);
    setCurrentQuestionIndex(0);
    setTestScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setLevelComplete(false);
    setLevelFailed(false);
  };

  const returnToSelector = () => {
      setFocusMode(false);
      setView('SELECTOR');
  };

  // Test Logic (same as before)
  const handleTestAnswer = (index: number) => {
    if (showResult || !lesson) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === lesson.test[currentQuestionIndex].correctIndex) setTestScore(s => s + 1);
  };

  const nextQuestion = () => {
    if (!lesson) return;
    if (currentQuestionIndex < lesson.test.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    } else {
      if (testScore >= 2) setLevelComplete(true); else setLevelFailed(true);
    }
  };

  const finishLevel = (success: boolean) => {
      const newHistoryEntry = { levelId: currentLevel, score: testScore, timestamp: Date.now() };
      const updatedHistory = [...userProgress.history, newHistoryEntry];
      let newMaxLevel = userProgress.maxLevel;
      
      if (success && currentLevel === userProgress.maxLevel && currentLevel < MAX_LEVELS) {
          newMaxLevel = currentLevel + 1;
      }

      setUserProgress(prev => ({ ...prev, history: updatedHistory, maxLevel: newMaxLevel }));
      
      // Check if finished level 10 successfully
      if (success && currentLevel === MAX_LEVELS) {
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

                      return (
                          <button
                            key={levelNum}
                            onClick={() => !isLocked && startLevel(levelNum)}
                            disabled={isLocked}
                            className={`relative p-4 h-32 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 group ${
                                isLocked 
                                    ? `opacity-50 cursor-not-allowed ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-none'}`
                                    : `active:scale-95 ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-500 shadow-sm'}`
                            }`}
                          >
                              {isLocked ? <Lock className="w-8 h-8 text-slate-500 mb-2" /> : (
                                  <>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.level}</span>
                                    <span className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{levelNum}</span>
                                    <span className={`text-xs text-center line-clamp-2 px-2 ${textSub} group-hover:text-blue-500`}>{topic}</span>
                                    <div className="flex gap-0.5 mt-2">
                                        {[1, 2, 3].map(star => (<Star key={star} className={`w-3 h-3 ${star <= bestAttempt ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />))}
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
  const hasVisual = lesson ? lesson.visualComponent !== 'NONE' : true;
  const totalSteps = hasVisual ? 6 : 5;
  const handleNext = () => { let n = step + 1; if (n === 3 && !hasVisual) n = 4; if (n <= 6) { setStep(n); } };
  const handlePrev = () => { let p = step - 1; if (p === 3 && !hasVisual) p = 2; if (p >= 1) { setStep(p); } };
  const getVisualStep = (s: number) => { if (hasVisual) return s; if (s > 3) return s - 1; return s; };

  return (
    <>
      <div className={`fixed top-[5.5rem] left-1/2 -translate-x-1/2 z-40 w-[80%] md:max-w-2xl rounded-b-2xl border-x border-b backdrop-blur-xl px-6 h-14 flex items-center justify-between shadow-xl transition-all duration-500 ${isDark ? 'bg-slate-900/95 border-slate-700/50 shadow-black/40' : 'bg-white/95 border-slate-200/50 shadow-slate-200/40'}`}>
          <button onClick={returnToSelector} className={`p-1.5 rounded-full hover:bg-slate-500/10 transition-colors relative z-10 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}><X className="w-5 h-5" /></button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
               <span className={`text-[10px] uppercase font-bold tracking-widest leading-none mb-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{t.level} {currentLevel}</span>
               <span className={`text-xs font-semibold leading-none ${textMain}`}>{lesson.topicTag}</span>
          </div>
          <div className="flex items-center relative z-10">
              <span className={`text-xs md:text-sm font-bold font-mono tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.step} <span className={isDark ? 'text-white' : 'text-black'}>{getVisualStep(step)}</span> / {totalSteps}</span>
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

        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className={`text-2xl font-bold mb-6 ${textMain}`}>{t.visualExample}</h2>
                <div className={`p-10 rounded-2xl flex items-center justify-center min-h-[350px] border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    {lesson.visualComponent === 'MATERIAL_INPUT' && (
                        <div className="relative w-full max-w-xs">
                             <input type="text" id="example-input" className={`peer w-full border-b-2 bg-transparent py-2 placeholder-transparent focus:outline-none transition-colors ${p.state === 'error' ? 'border-red-500 focus:border-red-600' : 'border-slate-400 focus:border-blue-500'}`} placeholder={p.placeholder || "Label"} aria-label={p.ariaLabel} aria-invalid={p.state === 'error'} aria-describedby={p.errorText ? "error-desc" : undefined} />
                             <label htmlFor="example-input" className={`absolute left-0 -top-3.5 text-sm transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-focus:-top-3.5 peer-focus:text-sm ${p.state === 'error' ? 'text-red-500' : 'text-slate-500 peer-focus:text-blue-500'}`}>{p.label || "Name"}</label>
                             {p.errorText && <p id="error-desc" className="text-xs text-red-500 mt-2 font-medium" role="alert">{p.errorText}</p>}
                        </div>
                    )}
                    {lesson.visualComponent === 'IOS_BUTTON' && (
                        <button className={`w-full max-w-xs rounded-xl py-4 font-bold active:opacity-80 transition-all ${p.state === 'disabled' ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-blue-600 text-white shadow-lg'}`} aria-label={p.ariaLabel} disabled={p.state === 'disabled'}>{p.buttonText || "Action"}</button>
                    )}
                    {lesson.visualComponent === 'PRODUCT_CARD' && (
                        <div className={`w-72 p-5 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
                            <div className="h-40 bg-slate-200 rounded-xl mb-4 w-full flex items-center justify-center"><Image className="opacity-20 w-12 h-12" /></div>
                            <h3 className={`font-bold text-lg mb-1 ${textMain}`}>{p.title || "Product"}</h3>
                            <p className={`text-sm mb-4 ${textSub}`}>{p.description || "Brief info."}</p>
                            <button className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-md">Add to Cart</button>
                        </div>
                    )}
                    {lesson.visualComponent === 'OTP_INPUT' && (
                        <div className="flex flex-col items-center">
                            <label className={`mb-4 font-bold ${textMain}`}>{p.label || "Verification Code"}</label>
                            <div className="flex gap-2">{[1,2,3,4].map(i => <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center font-bold text-xl ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}>-</div>)}</div>
                        </div>
                    )}
                    {lesson.visualComponent === 'CHECKBOX_GROUP' && (
                        <fieldset className="space-y-4">
                            <legend className={`font-bold mb-4 ${textMain}`}>{p.label || "Options"}</legend>
                            {(p.items || ["Option 1", "Option 2"]).map((item, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isDark ? 'border-slate-600 group-hover:border-blue-500' : 'border-slate-300 group-hover:border-blue-500'}`}><div className="w-3 h-3 bg-blue-500 rounded-sm scale-0 group-active:scale-100 transition-transform" /></div>
                                    <span className={textMain}>{item}</span>
                                </label>
                            ))}
                        </fieldset>
                    )}
                    {lesson.visualComponent === 'NONE' && <div className="text-center opacity-30"><BookOpen className={`w-20 h-20 mx-auto mb-4 ${textMain}`} /><p className={textSub}>Theoretical Lesson</p></div>}
                </div>
            </div>
        )}

        {step === 4 && (
            <div className="space-y-6 animate-fade-in">
                <h2 className={`text-2xl font-bold mb-4 text-center ${textMain}`}>Documentación</h2>
                
                {/* Main Tabs */}
                <div className="flex justify-center mb-8">
                    <div className={`inline-flex p-1 rounded-xl ${isDark ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-200'}`}>
                        {[
                            { id: 'nonTech', label: t.tabs.nonTech, icon: AlignLeft },
                            { id: 'tech', label: t.tabs.tech, icon: Code },
                            { id: 'voiceOver', label: t.tabs.voiceOver, icon: Ear },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setDocTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                                    docTab === tab.id 
                                        ? 'bg-blue-600 text-white shadow-lg' 
                                        : `${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`
                                }`}
                            >
                                <tab.icon className="w-4 h-4" /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`p-8 rounded-2xl border min-h-[400px] ${cardBg} transition-all duration-300`}>
                    
                    {/* 1. DOCUMENTACION NO TECNICA */}
                    {docTab === 'nonTech' && (
                        <div className="animate-fade-in">
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {renderFormattedText(lesson.documentation.nonTechnical, isDark)}
                            </div>
                        </div>
                    )}
                    
                    {/* 2. DOCUMENTACION TECNICA (CODIGO) */}
                    {docTab === 'tech' && (
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

                    {/* 3. LECTORES DE PANTALLA */}
                    {docTab === 'voiceOver' && (
                        <div className="animate-fade-in">
                            <div className="grid md:grid-cols-2 gap-4 mb-8">
                                <button 
                                    onClick={() => setSrTab('mobile')}
                                    className={`p-6 rounded-xl border text-left transition-all ${
                                        srTab === 'mobile' 
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' 
                                            : `${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:border-blue-300'}`
                                    }`}
                                >
                                    <Smartphone className={`w-8 h-8 mb-4 ${srTab === 'mobile' ? 'text-blue-500' : 'text-slate-400'}`} />
                                    <h3 className={`font-bold mb-1 ${textMain}`}>iOS & Android</h3>
                                    <p className={`text-xs ${textSub}`}>VoiceOver / TalkBack</p>
                                </button>

                                <button 
                                    onClick={() => setSrTab('desktop')}
                                    className={`p-6 rounded-xl border text-left transition-all ${
                                        srTab === 'desktop' 
                                            ? 'bg-purple-500/10 border-purple-500 ring-1 ring-purple-500' 
                                            : `${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:border-purple-300'}`
                                    }`}
                                >
                                    <Monitor className={`w-8 h-8 mb-4 ${srTab === 'desktop' ? 'text-purple-500' : 'text-slate-400'}`} />
                                    <h3 className={`font-bold mb-1 ${textMain}`}>Windows</h3>
                                    <p className={`text-xs ${textSub}`}>NVDA</p>
                                </button>
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

        {step === 5 && (
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

        {step === 6 && (
            <div className="animate-fade-in max-w-2xl mx-auto">
                {!levelComplete && !levelFailed ? (
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
                        {showResult && <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-end"><button onClick={nextQuestion} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">{currentQuestionIndex < lesson.test.length - 1 ? t.next : t.finish} <ArrowRight className="w-5 h-5" /></button></div>}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        {levelComplete ? (
                            <div className="space-y-6">
                                <div className="flex justify-center gap-2">{[1,2,3].map(s => <Star key={s} className={`w-12 h-12 ${s <= testScore ? 'fill-yellow-400 text-yellow-500' : 'text-slate-600'}`} />)}</div>
                                <h2 className={`text-3xl font-black ${textMain}`}>{t.levelComplete}</h2>
                                <button onClick={() => finishLevel(true)} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg">{t.continue}</button>
                            </div>
                        ) : (
                             <div className="space-y-6">
                                <X className="w-20 h-20 text-red-500 mx-auto" />
                                <h2 className={`text-3xl font-black ${textMain}`}>{t.levelFailed}</h2>
                                <button onClick={() => finishLevel(false)} className="px-8 py-3 bg-slate-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto"><RotateCcw /> {t.tryAgain}</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {step > 1 && step < 6 && (
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
