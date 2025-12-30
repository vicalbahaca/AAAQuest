import React from 'react';

export const NeuralCore: React.FC = () => {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center" aria-hidden="true">
      {/* Outer Glow Ring */}
      <div className="absolute w-full h-full rounded-full border border-blue-500/20 animate-[spin_10s_linear_infinite]" />
      <div className="absolute w-[90%] h-[90%] rounded-full border border-purple-500/20 animate-[spin_15s_linear_infinite_reverse]" />
      
      {/* Central Neural Mass */}
      <div className="relative w-40 h-40 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse-glow" />
      <div className="absolute w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center overflow-hidden border border-slate-700/50 backdrop-blur-sm">
        {/* Inner Activity */}
        <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent animate-pulse" />
        <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white]" />
      </div>

      {/* Floating Particles */}
      <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-[float_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-10 right-10 w-1.5 h-1.5 bg-pink-400 rounded-full animate-[float_5s_ease-in-out_infinite_delay-1000]" />
      <div className="absolute top-1/2 left-0 w-2 h-2 bg-purple-400 rounded-full animate-[float_6s_ease-in-out_infinite_delay-2000]" />
    </div>
  );
};
