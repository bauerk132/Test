import React, { useState } from 'react';
import { Delete, X, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export interface MathKeypadProps {
  onInsert: (text: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  disabled?: boolean;
  className?: string;
  defaultOpen?: boolean;
}

interface KeyGroup {
  name: string;
  badgeColor: string;
  btnStyle: string;
  keys: { label: string; insert: string; desc?: string }[];
}

export const MathKeypad: React.FC<MathKeypadProps> = React.memo(({
  onInsert,
  onClear,
  onBackspace,
  disabled = false,
  className = '',
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<'all' | 'powers' | 'transcendental' | 'intervals'>('all');

  // Categorized buttons with rich high-contrast colors
  const keyGroups: KeyGroup[] = [
    {
      name: 'Powers & Roots',
      badgeColor: 'text-purple-300 bg-purple-950/70 border-purple-500/40',
      btnStyle: 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/40 hover:border-purple-400 shadow-purple-950/30',
      keys: [
        { label: 'x²', insert: '^2', desc: 'Squared' },
        { label: 'x³', insert: '^3', desc: 'Cubed' },
        { label: 'xⁿ', insert: '^', desc: 'Exponent' },
        { label: '√x', insert: 'sqrt(', desc: 'Square root' },
        { label: '∛x', insert: 'cbrt(', desc: 'Cube root' },
        { label: '|x|', insert: 'abs(', desc: 'Absolute value' },
      ],
    },
    {
      name: 'Operations & Relations',
      badgeColor: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40',
      btnStyle: 'bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 border-cyan-500/40 hover:border-cyan-400 shadow-cyan-950/30',
      keys: [
        { label: '±', insert: '±', desc: 'Plus or minus' },
        { label: '·', insert: '*', desc: 'Multiply' },
        { label: '÷', insert: '/', desc: 'Fraction / Division' },
        { label: '≠', insert: '!=', desc: 'Not equal' },
        { label: '≤', insert: '<=', desc: 'Less than or equal' },
        { label: '≥', insert: '>=', desc: 'Greater than or equal' },
      ],
    },
    {
      name: 'Functions & Logs',
      badgeColor: 'text-amber-300 bg-amber-950/70 border-amber-500/40',
      btnStyle: 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-200 border-amber-500/40 hover:border-amber-400 shadow-amber-950/30',
      keys: [
        { label: 'log()', insert: 'log(', desc: 'Base-10 log' },
        { label: 'ln()', insert: 'ln(', desc: 'Natural log' },
        { label: 'log_b()', insert: 'log_', desc: 'Subscript base' },
        { label: 'eˣ', insert: 'e^', desc: 'Euler exponential' },
        { label: 'π', insert: 'pi', desc: 'Pi constant' },
        { label: 'f(x)', insert: 'f(x)', desc: 'Function notation' },
      ],
    },
    {
      name: 'Intervals & Sets',
      badgeColor: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
      btnStyle: 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/30',
      keys: [
        { label: '∞', insert: 'inf', desc: 'Infinity' },
        { label: '-∞', insert: '-inf', desc: 'Negative infinity' },
        { label: '∪', insert: 'U', desc: 'Union' },
        { label: '(-∞, ∞)', insert: '(-inf, inf)', desc: 'All real numbers' },
        { label: '( , )', insert: '()', desc: 'Open interval' },
        { label: '[ , ]', insert: '[]', desc: 'Closed interval' },
      ],
    },
  ];

  // Quick primary bar shown even when drawer is closed
  const quickKeys = [
    { label: 'x²', insert: '^2', color: 'hover:bg-purple-900/50 text-purple-300 border-purple-500/40' },
    { label: '√x', insert: 'sqrt(', color: 'hover:bg-purple-900/50 text-purple-300 border-purple-500/40' },
    { label: 'ln', insert: 'ln(', color: 'hover:bg-amber-900/50 text-amber-300 border-amber-500/40' },
    { label: 'log', insert: 'log(', color: 'hover:bg-amber-900/50 text-amber-300 border-amber-500/40' },
    { label: 'eˣ', insert: 'e^', color: 'hover:bg-amber-900/50 text-amber-300 border-amber-500/40' },
    { label: '∞', insert: 'inf', color: 'hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40' },
    { label: '∪', insert: 'U', color: 'hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/40' },
    { label: '±', insert: '±', color: 'hover:bg-cyan-900/50 text-cyan-300 border-cyan-500/40' },
    { label: '/', insert: '/', color: 'hover:bg-cyan-900/50 text-cyan-300 border-cyan-500/40' },
  ];

  if (disabled) return null;

  return (
    <div className={`mt-2 select-none ${className}`}>
      {/* Top Quick-Access Strip with High Contrast */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap p-1.5 rounded-xl bg-[#080b12] border border-slate-700/80 shadow-inner">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">
            Math Keys
          </span>
          {quickKeys.map((qk, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onInsert(qk.insert)}
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-[#0e1320] border transition-all duration-150 active:scale-95 shadow-sm ${qk.color}`}
            >
              {qk.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={onBackspace}
            title="Backspace"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95 text-xs flex items-center justify-center"
          >
            <Delete className="w-3.5 h-3.5 text-orange-400" />
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Clear Input"
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 text-[11px] font-mono font-bold"
          >
            C
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all active:scale-95 ${
              isOpen
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-900/40'
                : 'bg-slate-800/90 hover:bg-slate-700 text-cyan-300 border-cyan-500/40'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>{isOpen ? 'Close Pad' : 'Full Keypad'}</span>
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Keypad Drawer */}
      {isOpen && (
        <div className="mt-2 p-3 sm:p-4 rounded-2xl bg-[#0a0e18] border-2 border-indigo-500/40 shadow-2xl shadow-black/60 animate-fadeIn">
          {/* Tab Filter */}
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/90 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Symbol Insertion Dock
            </span>

            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Symbols
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('powers')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'powers'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Powers & Ops
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('transcendental')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'transcendental'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Logs & Exponentials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('intervals')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  activeTab === 'intervals'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Intervals & Sets
              </button>
            </div>
          </div>

          {/* Key Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {keyGroups
              .filter((g) => {
                if (activeTab === 'powers') return g.name.includes('Powers') || g.name.includes('Operations');
                if (activeTab === 'transcendental') return g.name.includes('Functions');
                if (activeTab === 'intervals') return g.name.includes('Intervals');
                return true;
              })
              .map((group, gIdx) => (
                <div
                  key={gIdx}
                  className="p-2.5 rounded-xl bg-[#0c101c] border border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${group.badgeColor}`}
                    >
                      {group.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {group.keys.map((k, kIdx) => (
                      <button
                        key={kIdx}
                        type="button"
                        onClick={() => onInsert(k.insert)}
                        title={k.desc}
                        className={`h-9 rounded-lg border font-mono font-black text-xs sm:text-sm transition-all duration-150 active:scale-90 flex items-center justify-center shadow-md ${group.btnStyle}`}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Quick Syntax Hint Guide */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              💡 <strong className="text-cyan-300">Format Guide:</strong> Fractions like <code className="text-cyan-300 font-mono">3/4</code>, square roots like <code className="text-purple-300 font-mono">sqrt(5)</code>, coordinates like <code className="text-amber-300 font-mono">(3, -4)</code>, and intervals like <code className="text-emerald-300 font-mono">(-inf, 2]</code> are auto-graded.
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <X className="w-3 h-3" />
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MathKeypad.displayName = 'MathKeypad';
