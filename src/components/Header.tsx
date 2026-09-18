import React from 'react';
import { Timer, Github, Sliders, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  seconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onOpenSandbox: () => void;
  onOpenGithub: () => void;
  onOpenFormulas: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  seconds,
  onOpenSandbox,
  onOpenGithub,
  onOpenFormulas,
  onNavigateHome,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-[#090b10]/95 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0d1017] rounded-[10px] flex items-center justify-center font-black text-lg text-white">
              📐
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent group-hover:opacity-90">
                Precalculus MAT201
              </h1>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Modules 5–9</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Unified Master Exam & Guided Suite · 40 Problems · 15 Walkthroughs
            </p>
          </div>
        </button>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono font-bold text-amber-300 shadow-inner">
            <Timer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Formulas button */}
          <button
            onClick={onOpenFormulas}
            title="Formula Reference Sheet (Modules 5-9)"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-all hover:text-purple-300 hover:border-purple-500/40"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Formulas</span>
          </button>

          {/* Graph Sandbox button */}
          <button
            onClick={onOpenSandbox}
            title="Interactive Function Graphing Sandbox"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-all hover:text-cyan-300 hover:border-cyan-500/40"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Graph Sandbox</span>
          </button>

          {/* GitHub Export button */}
          <button
            onClick={onOpenGithub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
