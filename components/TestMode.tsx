
import React, { useState } from 'react';
import { generateTest } from '../services/geminiService';
import { Difficulty, TestQuestion, TestType, Language, TRANSLATIONS, Theme } from '../types';
import { Check, X, Award, ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Loader } from './Loader';

interface TestModeProps {
  language: Language;
  theme: Theme;
}

export const TestMode: React.FC<TestModeProps> = ({ language, theme }) => {
  const [step, setStep] = useState<'SELECT_TOPIC' | 'SELECT_DIFFICULTY' | 'TEST_RUNNING' | 'FINISHED'>('SELECT_TOPIC');
  const [selectedTopic, setSelectedTopic] = useState<TestType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const t = TRANSLATIONS[language];
  const isDark = theme === 'dark';

  const textMain = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200 shadow-sm';
  const cardHover = isDark ? 'hover:bg-slate-800 hover:border-white' : 'hover:bg-purple-50 hover:border-black hover:shadow-md hover:shadow-purple-500/10';
  const glassCard = isDark ? 'glass-card' : 'bg-white/90 border-slate-200 shadow-xl shadow-purple-500/5 backdrop-blur-xl';

  const difficultyLevels = [
    { label: Difficulty.BASIC, symbol: '--', color: 'text-green-500' },
    { label: Difficulty.INTERMEDIATE_1, symbol: '-', color: 'text-green-400' },
    { label: Difficulty.INTERMEDIATE_2, symbol: '=', color: 'text-blue-500' },
    { label: Difficulty.ADVANCED, symbol: '+', color: 'text-orange-500' },
    { label: Difficulty.EXPERT, symbol: '++', color: 'text-red-500' },
  ];

  const handleTopicSelect = (topic: TestType) => {
    setSelectedTopic(topic);
    setStep('SELECT_DIFFICULTY');
  };

  const handleDifficultySelect = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    startTest(selectedTopic!, diff);
  };

  const startTest = async (topic: TestType, diff: Difficulty) => {
    setLoading(true);
    try {
      const q = await generateTest(diff, topic, language);
      setQuestions(q);
      setStep('TEST_RUNNING');
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
    } catch (error) {
      console.error(error);
      alert("Error generando el test. Inténtalo de nuevo.");
      setStep('SELECT_TOPIC');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    if (idx === questions[currentIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setShowResult(false);
      setSelectedAnswer(null);
    } else {
      setStep('FINISHED');
    }
  };

  const reset = () => {
    setStep('SELECT_TOPIC');
    setSelectedTopic(null);
    setSelectedDifficulty(null);
    setQuestions([]);
  };

  if (step === 'SELECT_TOPIC') {
    return (
      <div className="max-w-5xl mx-auto p-4 animate-fade-in">
        <div className="text-center mb-10">
          <h2 className={`text-4xl font-bold mb-2 flex justify-center items-center gap-3 ${textMain}`}>
            <GraduationCap className={`w-10 h-10 ${isDark ? 'text-purple-500' : 'text-purple-600'}`} aria-hidden="true" /> 
            <span className={`text-transparent bg-clip-text ${isDark ? 'bg-gradient-to-r from-purple-500 to-purple-700' : 'bg-gradient-to-r from-purple-600 to-purple-800'}`}>
              {t.testTitle}
            </span>
          </h2>
          <p className={`text-base md:text-lg font-light leading-relaxed max-w-2xl mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t.testSubtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(TestType).map((type) => (
            <button
              key={type}
              onClick={() => handleTopicSelect(type)}
              className={`p-6 rounded-xl text-left group transition-all active:scale-[0.99] border ${cardBg} ${cardHover}`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-lg group-hover:text-purple-600 transition-colors ${textMain}`}>{type}</span>
                <ArrowRight className={`w-5 h-5 transition-colors ${isDark ? 'text-slate-400 group-hover:text-purple-500' : 'text-slate-400 group-hover:text-purple-600'}`} aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'SELECT_DIFFICULTY') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" role="dialog" aria-modal="true" aria-label={t.selectDifficulty}>
        <div className={`${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} border rounded-xl p-8 max-w-lg w-full relative shadow-2xl`}>
          <button onClick={() => setStep('SELECT_TOPIC')} className={`absolute top-4 left-4 text-sm ${isDark ? 'text-slate-500 hover:text-purple-500' : 'text-slate-400 hover:text-purple-600'}`}>← {t.backBtn}</button>
          
          <h2 className={`text-2xl font-bold text-center mb-8 mt-4 ${textMain}`}>{t.selectDifficulty}</h2>
          
          <div className="space-y-3">
            {difficultyLevels.map((lvl) => (
              <button
                key={lvl.label}
                onClick={() => handleDifficultySelect(lvl.label)}
                className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all active:scale-[0.98] border ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-white' : 'bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-black hover:shadow-sm'}`}
              >
                <span className={`font-medium ${textMain} group-hover:text-purple-700`}>{lvl.label}</span>
                <span className={`font-mono font-bold text-lg ${lvl.color}`}>{lvl.symbol}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader text={`${t.generatingTest} ${selectedTopic}...`} theme={theme} />;
  }

  if (step === 'FINISHED') {
    return (
      <div className={`max-w-2xl mx-auto text-center p-12 rounded-xl animate-fade-in relative overflow-hidden mt-10 border ${isDark ? 'glass-card border-slate-700' : 'bg-white shadow-2xl border-slate-200'}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
        <Award className="w-24 h-24 text-yellow-400 mx-auto mb-6 animate-pulse-glow" aria-hidden="true" />
        <h2 className={`text-4xl font-bold mb-2 ${textMain}`}>{t.completed}</h2>
        <p className={`text-2xl mb-10 ${textSub}`}>
          {t.score}: <span className="font-bold text-purple-600">{score}</span> / {questions.length}
        </p>
        <button
          onClick={reset}
          className={`px-10 py-4 rounded-xl font-bold shadow-lg shadow-purple-900/30 transition-all border border-transparent hover:border-white/20 active:scale-95 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/30'}`}
        >
          {t.returnMenu}
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-1 mt-6">
      <div className={`${glassCard} rounded-xl p-8 border ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <div className={`flex justify-between items-center mb-8 text-xs font-mono uppercase tracking-widest ${isDark ? 'text-purple-500' : 'text-purple-700'}`}>
          <span className={`${isDark ? 'bg-purple-900/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'} px-3 py-1 rounded-xl border`}>{selectedDifficulty} • {selectedTopic}</span>
          <span>{t.question} {currentIndex + 1} / {questions.length}</span>
        </div>

        <h2 className={`text-2xl font-medium mb-8 leading-relaxed ${textMain}`}>
          {currentQ.question}
        </h2>

        <div className="space-y-4 mb-8">
          {currentQ.options.map((opt, idx) => {
            let style = "";
            
            if (showResult) {
              if (idx === currentQ.correctAnswerIndex) {
                style = "bg-green-500/20 border-green-500 text-green-600 shadow-md";
              } else if (idx === selectedAnswer) {
                style = "bg-red-500/20 border-red-500 text-red-600";
              } else {
                style = isDark ? "opacity-40 bg-slate-900 border-transparent text-slate-500" : "opacity-40 bg-slate-100 border-transparent text-slate-400";
              }
            } else {
                style = isDark 
                    ? "bg-slate-800/50 hover:bg-slate-700/50 border-slate-700 hover:border-white text-slate-300 active:scale-[0.98]"
                    : "bg-white hover:bg-purple-50 border-slate-200 hover:border-black text-slate-700 shadow-sm active:scale-[0.98]";
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
                className={`w-full text-left p-5 rounded-xl border transition-all flex justify-between items-center ${style}`}
              >
                <span className="font-medium">{opt}</span>
                {showResult && idx === currentQ.correctAnswerIndex && <Check className="w-6 h-6 text-green-500" aria-hidden="true" />}
                {showResult && idx === selectedAnswer && idx !== currentQ.correctAnswerIndex && <X className="w-6 h-6 text-red-500" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`p-6 rounded-xl border-l-4 border-purple-500 mb-8 animate-fade-in ${isDark ? 'bg-slate-900/80' : 'bg-purple-50'}`} role="alert">
            <div className="flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-purple-500 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-purple-600 text-sm mb-2 tracking-wide uppercase">{t.explanation}</p>
                <p className={`leading-relaxed text-sm font-mono ${textMain}`}>{currentQ.explanation}</p>
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="flex justify-end">
            <button
              onClick={nextQuestion}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all transform shadow-lg border border-transparent active:scale-95 text-white ${isDark ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/30'}`}
            >
              {currentIndex === questions.length - 1 ? t.finish : t.next} <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
