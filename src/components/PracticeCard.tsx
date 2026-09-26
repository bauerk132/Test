import React, { useState } from 'react';
import { PracticeProblem, PracticeResult } from '../types';
import { FunctionVisualizer } from './FunctionVisualizer';
import { MathKeypad } from './MathKeypad';
import { CheckCircle, AlertCircle, XCircle, Lightbulb, ChevronDown, ChevronUp, Edit2, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';

interface PracticeCardProps {
  problem: PracticeProblem;
  index: number;
  answer: string;
  work: string;
  result?: PracticeResult;
  isGraded: boolean;
  variantNum?: number;
  onGenerateVariant?: (id: string) => void;
  onResetVariant?: (id: string) => void;
  onAnswerChange: (id: string, val: string) => void;
  onWorkChange: (id: string, val: string) => void;
}

export const PracticeCard: React.FC<PracticeCardProps> = React.memo(({
  problem,
  index,
  answer,
  work,
  result,
  isGraded,
  variantNum = 1,
  onGenerateVariant,
  onResetVariant,
  onAnswerChange,
  onWorkChange,
}) => {
  const [showSteps, setShowSteps] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [activeTarget, setActiveTarget] = useState<'answer' | 'work'>('answer');

  const handleKeypadInsert = (symbol: string) => {
    if (activeTarget === 'answer') {
      onAnswerChange(problem.id, (answer || '') + symbol);
    } else {
      onWorkChange(problem.id, (work || '') + symbol);
    }
  };

  const handleKeypadClear = () => {
    if (activeTarget === 'answer') {
      onAnswerChange(problem.id, '');
    } else {
      onWorkChange(problem.id, '');
    }
  };

  const handleKeypadBackspace = () => {
    if (activeTarget === 'answer') {
      onAnswerChange(problem.id, (answer || '').slice(0, -1));
    } else {
      onWorkChange(problem.id, (work || '').slice(0, -1));
    }
  };

  const getDiffBadge = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-400/60 font-bold';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-400/60 font-bold';
      case 'hard':
        return 'bg-purple-950/80 text-purple-200 border-purple-400/60 font-bold';
    }
  };

  const getBorderColor = () => {
    if (!isGraded || !result) return 'border-slate-700/80 hover:border-slate-600';
    if (result.status === 'correct') return 'border-emerald-400 ring-2 ring-emerald-500/30';
    if (result.status === 'partial') return 'border-amber-400 ring-2 ring-amber-500/30';
    return 'border-orange-500 ring-2 ring-orange-500/30';
  };

  return (
    <div
      id={`card-${problem.id}`}
      className={`mb-8 rounded-2xl border bg-[#0a0d16] p-5 sm:p-7 shadow-2xl shadow-black/40 transition-all ${getBorderColor()}`}
    >
      {/* Header with High-Contrast Badges */}
      <div className="flex items-start gap-3.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-indigo-950/60 flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-indigo-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm">
                {problem.ms}
              </span>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-sm ${getDiffBadge(
                  problem.diff
                )}`}
              >
                {problem.diff}
              </span>
              {variantNum > 1 && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-400/60 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  Variant #{variantNum}
                </span>
              )}
            </div>

            {/* Algorithmic Variant Generator Controls */}
            {!isGraded && onGenerateVariant && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onGenerateVariant(problem.id)}
                  title="Generate new randomized numbers for this problem"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-700/80 via-indigo-700/80 to-cyan-700/80 hover:from-blue-600 hover:via-indigo-600 hover:to-cyan-600 text-cyan-100 hover:text-white border border-cyan-400/50 text-[11px] font-black transition-all active:scale-95 shadow-md shadow-indigo-950/50"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-300" />
                  <span>{variantNum > 1 ? 'Next Numbers 🎲' : 'New Variant 🎲'}</span>
                </button>
                {variantNum > 1 && onResetVariant && (
                  <button
                    type="button"
                    onClick={() => onResetVariant(problem.id)}
                    title="Reset back to baseline problem numbers"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-400" />
                    <span>Original</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <p className="text-sm sm:text-base text-white leading-relaxed font-bold">
            {problem.q}
          </p>
        </div>
      </div>

      {/* Optional Hint Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-amber-100 hover:bg-amber-900/50 transition-all"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>{showHint ? 'Hide Problem Hint' : 'Show Problem Hint'}</span>
        </button>
        {showHint && (
          <div className="mt-2.5 p-3 rounded-xl border border-amber-400/50 bg-[#120f06] text-xs text-amber-200 leading-relaxed animate-fadeIn shadow-lg">
            <strong className="text-amber-300 block mb-0.5">Hint:</strong>
            {problem.hint}
          </div>
        )}
      </div>

      {/* Optional Visualizer Graph */}
      {problem.graphType && (
        <FunctionVisualizer
          type={problem.graphType}
          title="Reference Curve"
          color="#38bdf8"
        />
      )}

      {/* Math Keypad Virtual Toolbar */}
      {!isGraded && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Virtual Math Keyboard:
            </span>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <span>Insert Into:</span>
              <button
                type="button"
                onClick={() => setActiveTarget('answer')}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeTarget === 'answer'
                    ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Final Answer
              </button>
              <button
                type="button"
                onClick={() => setActiveTarget('work')}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeTarget === 'work'
                    ? 'bg-indigo-500 text-white font-extrabold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Scratchpad
              </button>
            </div>
          </div>
          <MathKeypad
            onInsert={handleKeypadInsert}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
            disabled={isGraded}
          />
        </div>
      )}

      {/* Answer Inputs with Contrasting Rings */}
      <div className="space-y-3 pt-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-black text-cyan-300 uppercase tracking-wider">
              Your Final Answer
            </label>
            {activeTarget === 'answer' && !isGraded && (
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                Keypad active on this field
              </span>
            )}
          </div>
          <input
            type="text"
            value={answer}
            disabled={isGraded}
            onFocus={() => setActiveTarget('answer')}
            onChange={(e) => onAnswerChange(problem.id, e.target.value)}
            placeholder="Enter exact formula, coordinate, or number..."
            className={`w-full rounded-xl border px-3.5 py-3 text-sm text-white placeholder-slate-500 font-mono transition-all disabled:opacity-75 disabled:bg-slate-950 ${
              activeTarget === 'answer' && !isGraded
                ? 'border-cyan-400 ring-2 ring-cyan-400/20 bg-[#080c14]'
                : 'border-slate-700 bg-slate-900/90 focus:border-cyan-400'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-black text-indigo-300 uppercase tracking-wider">
              Show Your Work (Scratchpad · Earns Partial Credit)
            </label>
            {activeTarget === 'work' && !isGraded && (
              <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                Keypad active on scratchpad
              </span>
            )}
          </div>
          <textarea
            rows={2}
            value={work}
            disabled={isGraded}
            onFocus={() => setActiveTarget('work')}
            onChange={(e) => onWorkChange(problem.id, e.target.value)}
            placeholder="Type your intermediate calculations or algebraic steps here..."
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 font-mono resize-y transition-all disabled:opacity-75 disabled:bg-slate-950 ${
              activeTarget === 'work' && !isGraded
                ? 'border-indigo-400 ring-2 ring-indigo-400/20 bg-[#080c14]'
                : 'border-slate-700 bg-slate-900/90 focus:border-indigo-400'
            }`}
          />
        </div>
      </div>

      {/* Post-Grading Feedback */}
      {isGraded && result && (
        <div
          className={`mt-4 rounded-xl border p-4 transition-all animate-fadeIn ${
            result.status === 'correct'
              ? 'border-emerald-500/40 bg-emerald-950/20'
              : result.status === 'partial'
              ? 'border-amber-500/40 bg-amber-950/20'
              : 'border-orange-500/40 bg-orange-950/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 font-bold text-sm">
              {result.status === 'correct' && (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Correct!</span>
                </>
              )}
              {result.status === 'partial' && (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">Partial Credit Awarded</span>
                </>
              )}
              {result.status === 'wrong' && (
                <>
                  <XCircle className="w-4 h-4 text-orange-400" />
                  <span className="text-orange-300">Incorrect</span>
                </>
              )}
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                result.status === 'correct'
                  ? 'bg-emerald-500 text-black'
                  : result.status === 'partial'
                  ? 'bg-amber-400 text-black'
                  : 'bg-orange-500 text-white'
              }`}
            >
              {result.points}/2 pts
            </span>
          </div>

          {result.status !== 'correct' && (
            <div className="text-xs text-slate-300 mb-2">
              <strong className="text-slate-100">Accepted Answer: </strong>
              <span className="font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {problem.answer}
              </span>
            </div>
          )}

          {result.status === 'partial' && (
            <p className="text-[11px] text-amber-200/90 mb-2 bg-amber-500/10 p-2 rounded border border-amber-500/20">
              ⭐ Partial credit earned: Your algebraic steps in the scratchpad show correct conceptual reasoning. Review the verified steps below to master the final form.
            </p>
          )}

          {/* Collapsible Step-by-Step Solution */}
          <div className="pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowSteps(!showSteps)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-300 hover:text-white"
            >
              <span>Step-by-Step Solution ({problem.steps.length} steps)</span>
              {showSteps ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSteps && (
              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-indigo-500/40 animate-fadeIn">
                {problem.steps.map((st, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="font-mono text-indigo-400 font-bold">{i + 1}.</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
