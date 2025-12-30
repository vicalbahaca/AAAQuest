
import React, { useEffect, useState } from 'react';
import { Theme } from '../types';

interface LoaderProps {
  text?: string;
  duration?: number;
  timerLabel?: string;
  theme?: Theme;
}

export const Loader: React.FC<LoaderProps> = ({ text = "Processing...", duration, timerLabel, theme = 'dark' }) => {
  const [timeLeft, setTimeLeft] = useState(duration || 0);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!duration) return;
    
    setTimeLeft(duration);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration]);

  // Updated to 3 shades of Green/Emerald/Teal
  const orb1Class = "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]";
  const orb2Class = "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]";
  const orb3Class = "bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.6)]";

  const coreClass = isDark
    ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]"
    : "bg-slate-800 shadow-[0_0_20px_rgba(30,41,59,0.3)]";

  const textMainClass = isDark ? "text-slate-300" : "text-slate-700 font-bold";
  const textSubClass = isDark ? "text-slate-500" : "text-slate-500 font-medium";

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full" role="status" aria-live="polite">
      <div className="relative w-24 h-24 mb-8">
        {/* Core */}
        <div className={`absolute top-1/2 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse ${coreClass}`} />
        
        {/* Orbiting Balls */}
        {/* Orb 1 */}
        <div className="absolute top-0 left-0 w-full h-full animate-[orbit_2s_linear_infinite]">
          <div className={`w-6 h-6 rounded-full blur-[2px] ${orb1Class}`} />
        </div>

        {/* Orb 2 (Reverse Orbit) */}
        <div className="absolute top-0 left-0 w-full h-full animate-[orbit-reverse_2.5s_linear_infinite]">
          <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full blur-[2px] ${orb2Class}`} />
        </div>

        {/* Orb 3 */}
        <div className="absolute top-0 left-0 w-full h-full animate-[orbit_3s_linear_infinite_reverse]">
          <div className={`absolute top-1/2 left-0 w-4 h-4 rounded-full blur-[2px] ${orb3Class}`} />
        </div>
      </div>
      
      <p className={`${textMainClass} font-mono text-sm tracking-widest uppercase animate-pulse mb-2`}>
        {text}
      </p>

      {duration && duration > 0 && (
         <p className={`${textSubClass} font-mono text-xs animate-pulse`}>
           {timerLabel ? timerLabel.replace(/\d+s/, '') : 'Estimated time:'} {timeLeft}s
         </p>
      )}
    </div>
  );
};
