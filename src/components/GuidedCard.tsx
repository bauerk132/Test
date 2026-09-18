import React, { useState } from 'react';
import { GuidedExample, GuidedProgress, MicroSkill } from '../types';
import { FunctionVisualizer } from './FunctionVisualizer';
import { MathKeypad } from './MathKeypad';
import { Lightbulb, CheckCircle2, XCircle, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GuidedCardProps {
  example: GuidedExample;
  index: number;
  microSkill?: MicroSkill;
  progress: GuidedProgress;
  onCheckStep: (exampleId: string, stepIndex: number, userAnswer: string) => boolean;
  onNextStep: (exampleId: string, stepIndex: number) => void;
}

export const GuidedCard: React.FC<GuidedCardProps> = ({
  example,
  index,
  microSkill,
  progress,
  onCheckStep,
  onNextStep,
}) => {
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [hintVisible, setHintVisible] = useState<Record<number, boolean>>({});

  const handleInputChange = (stepIdx: number, val: string) => {
    setInputs((prev) => ({ ...prev, [stepIdx]: val }));
  };

  const toggleHint = (stepIdx: number) => {
    setHintVisible((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  const handleCheck = (stepIdx: number) => {
    const val = inputs[stepIdx] || '';
    if (!val.trim()) return;
    const isCorrect = onCheckStep(example.id, stepIdx, val);
    if (isCorrect && stepIdx === example.steps.length - 1) {
      // Completed all steps!
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const getModuleColor = (mod: number) => {
    switch (mod) {
      case 7:
        return '#8b5cf6';
      case 8:
        return '#06b6d4';
      case 9:
        return '#f59e0b';
      default:
        return '#8b5cf6';
    }
  };

  const modColor = getModuleColor(example.mod);

  return (
    <div
      id={`guided-${example.id}`}
      className="mb-8 rounded-2xl border border-slate-800 bg-[#0e111a] shadow-xl shadow-black/20 overflow-hidden"
    >
      {/* Header Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/20 p-5 sm:p-6">
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white shadow-md flex-shrink-0"
            style={{ backgroundColor: modColor }}
          >
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {example.title}
              </h3>
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: `${modColor}20`,
                  color: modColor,
                  border: `1px solid ${modColor}40`,
                }}
              >
                {example.ms}
              </span>
            </div>
            {microSkill && (
              <p className="text-xs text-slate-400 mt-0.5">{microSkill.label}</p>
            )}
          </div>
        </div>

        {/* Concept Box */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/15 p-3 sm:p-4 text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
          <span className="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Core Concept:
          </span>
          {example.concept}
          {example.formulaNote && (
            <div className="mt-2 font-mono text-[11px] sm:text-xs text-indigo-300 bg-black/40 px-2.5 py-1 rounded border border-indigo-500/20">
              {example.formulaNote}
            </div>
          )}
        </div>

        {/* Problem Box */}
        <div className="rounded-xl border border-slate-700/80 bg-[#141824] p-3 sm:p-4 text-xs sm:text-sm text-slate-200">
          <span className="font-bold text-amber-300 block mb-1">🎯 Problem:</span>
          {example.problem}
        </div>

        {/* Optional Visualizer Graph */}
        {example.graphType && (
          <FunctionVisualizer
            type={example.graphType}
            title={`${example.title} Function Curve`}
            color={modColor}
          />
        )}
      </div>

      {/* Sequential Steps Container */}
      <div className="p-4 sm:p-6 space-y-4">
        {example.steps.map((step, sIdx) => {
          const isCurrent = progress.currentStep === sIdx;
          const isPast = progress.currentStep > sIdx;
          const isLocked = progress.currentStep < sIdx;
          const stepResult = progress.stepResults[sIdx];
          const isAnswered = !!stepResult;
          const isCorrect = stepResult?.correct;

          return (
            <div
              key={sIdx}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isCurrent
                  ? 'border-purple-500/60 bg-[#121624] shadow-md shadow-purple-500/10'
                  : isPast
                  ? isCorrect
                    ? 'border-emerald-500/40 bg-[#0e171b]'
                    : 'border-slate-800 bg-[#0e111a]'
                  : 'border-slate-800/60 bg-[#0a0c12]/60 opacity-60'
              }`}
            >
              {/* Step Header */}
              <div className="p-3.5 sm:p-4 flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    isPast
                      ? isCorrect
                        ? 'bg-emerald-500 text-black'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                      : isCurrent
                      ? 'bg-purple-500 text-white ring-2 ring-purple-500/40'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isPast && isCorrect ? '✓' : sIdx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-slate-200">
                      {step.prompt}
                    </p>
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {isPast
                        ? isCorrect
                          ? '✓ Solved'
                          : 'Revealed'
                        : isCurrent
                        ? 'Your Turn'
                        : 'Locked'}
                    </span>
                  </div>

                  {/* Body only shown when active or past */}
                  {(isCurrent || isPast) && (
                    <div className="mt-3">
                      {/* Math Keypad for active step */}
                      {isCurrent && (
                        <div className="mb-2">
                          <MathKeypad
                            onInsert={(sym) =>
                              handleInputChange(sIdx, (inputs[sIdx] ?? '') + sym)
                            }
                            onClear={() => handleInputChange(sIdx, '')}
                            onBackspace={() =>
                              handleInputChange(sIdx, (inputs[sIdx] ?? '').slice(0, -1))
                            }
                          />
                        </div>
                      )}

                      {/* Input row */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={inputs[sIdx] ?? stepResult?.userAnswer ?? ''}
                          disabled={isPast}
                          onChange={(e) => handleInputChange(sIdx, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isPast) {
                              handleCheck(sIdx);
                            }
                          }}
                          placeholder="Type your answer here..."
                          className={`flex-1 rounded-xl border px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 font-mono transition-all disabled:opacity-60 disabled:bg-slate-950 ${
                            isCurrent
                              ? 'border-purple-400 ring-2 ring-purple-400/20 bg-[#070912]'
                              : 'border-slate-700 bg-slate-900/90'
                          }`}
                        />

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleHint(sIdx)}
                            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs font-bold transition-colors"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Hint</span>
                          </button>

                          {!isPast && (
                            <button
                              type="button"
                              onClick={() => handleCheck(sIdx)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30 active:scale-95"
                            >
                              Check Answer
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Hint */}
                      {hintVisible[sIdx] && (
                        <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-200/90 flex items-start gap-2 animate-fadeIn">
                          <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-300">Helpful Hint: </strong>
                            {step.hint}
                          </div>
                        </div>
                      )}

                      {/* Step Result Explanation */}
                      {isAnswered && (
                        <div
                          className={`mt-3 rounded-xl p-3 sm:p-4 border ${
                            isCorrect
                              ? 'border-emerald-500/40 bg-emerald-950/20'
                              : 'border-orange-500/40 bg-orange-950/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2 font-bold text-xs sm:text-sm">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-300">
                                  Correct! Excellent reasoning.
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-300">
                                  Not quite — here is the complete solution:
                                </span>
                              </>
                            )}
                          </div>
                          <div className="text-xs text-slate-300 leading-relaxed font-normal">
                            {step.explanation}
                          </div>

                          {/* Next Step button */}
                          {isCurrent && (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => onNextStep(example.id, sIdx)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                              >
                                <span>
                                  {sIdx < example.steps.length - 1
                                    ? 'Next Step →'
                                    : 'Complete Example ✓'}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Banner */}
      {progress.complete && (
        <div className="border-t border-purple-500/30 bg-purple-950/30 p-4 px-6 flex items-center justify-between flex-wrap gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-purple-200">
                Worked Example Complete!
              </p>
              <p className="text-[11px] text-slate-400">
                You progressed through all {example.steps.length} steps. Ready for the next challenge!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
