import React, { useState } from 'react';
import { ModuleId, ModuleStats, PracticeProblem, PracticeResult, GuidedProgress, GuidedExample } from '../types';
import { MICRO_SKILLS } from '../data/microSkills';
import { Trophy, Compass, BookOpen, RotateCcw, Eye, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultsViewProps {
  selectedMods: ModuleId[];
  earnedPts: number;
  maxPts: number;
  modScores: Record<number, ModuleStats>;
  practiceProblems: PracticeProblem[];
  practiceResults: Record<string, PracticeResult>;
  guidedData: Record<number, GuidedExample[]>;
  guidedState: Record<string, GuidedProgress>;
  onReset: () => void;
  onOpenGithub: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  selectedMods,
  earnedPts,
  maxPts,
  modScores,
  practiceProblems,
  practiceResults,
  guidedData,
  guidedState,
  onReset,
  onOpenGithub,
}) => {
  const [showStudyGuide, setShowStudyGuide] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [filterReview, setFilterReview] = useState<'all' | 'missed' | 'correct'>('all');

  const pct = maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0;
  const grade =
    pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  const gradeColors: Record<string, { ring: string; text: string; bg: string }> = {
    A: { ring: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    B: { ring: 'border-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10' },
    C: { ring: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    D: { ring: 'border-rose-400', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    F: { ring: 'border-rose-600', text: 'text-rose-500', bg: 'bg-rose-500/10' },
  };

  const adviceMap: Record<string, string> = {
    'M5.1': 'Parabola vertex: h = -b/(2a), k = f(h). Vertex is maximum if a < 0 and minimum if a > 0.',
    'M5.2': 'Leading term test: an · xⁿ determines end behavior. Odd degree ➔ opposite ends; Even degree ➔ same direction.',
    'M5.3': 'Multiplicity rule: Even multiplicity touches axis and turns around; Odd multiplicity crosses the axis.',
    'M5.4': 'Synthetic division: Use divisor c for (x - c). Remember to insert 0 for missing degree terms.',
    'M5.5': 'Rational Zero Theorem: ±(factors of a0) / (factors of an). Factor completely to uncover imaginary complex roots.',
    'M6.1': 'Rational domain: set denominator ≠ 0. Non-canceling factors yield vertical asymptotes x = c.',
    'M6.2': 'Removable holes: factor both numerator and denominator; canceled factors give hole coordinates (c, f_reduced(c)).',
    'M6.3': 'Slant asymptote: if degree(num) = degree(denom) + 1, use polynomial long division. The linear quotient is the slant asymptote line y = mx + b.',
    'M6.4': 'Rational equations: multiply all terms by LCD to clear denominators. Always check against original restrictions to discard extraneous roots.',
    'M6.5': 'Inverse functions: swap x and y and isolate y. For radical equations, square both sides and check for extraneous solutions.',
    'M7.1': 'Practice point mapping (x, y) ➔ (x, y + k). Vertical shifts only affect y-values, not x.',
    'M7.2': 'Remember: f(x - h) shifts RIGHT h units, f(x + h) shifts LEFT h units. The sign inside is inverted.',
    'M7.7': "Use x' = x/b + h and y' = a·y + k. Factor the argument inside first to identify b and h accurately.",
    'M7.8': 'Compute f(-x) completely before comparing. A lone constant term or mixed powers usually breaks symmetry.',
    'M7.9': 'Domain responds to horizontal shifts/scalings only; Range responds to vertical stretch and shifts.',
    'M7.6': 'Transformations order: horizontal shift ➔ horizontal scale ➔ reflection ➔ vertical scale ➔ vertical shift.',
    'M8.3': 'Plot anchor points at exponent -1, 0, and 1. Asymptote is always y = 0 for the basic parent form.',
    'M8.4': 'Only the vertical shift k moves the horizontal asymptote: new HA is y = k.',
    'M8.7': 'Take ln of both sides, bring powers out with power rule, and distribute thoroughly before isolating x.',
    'M8.8': 'Identify n accurately: annual n=1, monthly n=12, daily n=365. For continuous growth, use A = Pe^(rt).',
    'M8.9': 'Half-life decay model: Q(t) = Q₀(1/2)^(t/h). Rate constant k = -ln(2) / h.',
    'M8.10': 'Change of base: argument on top, base on bottom: log_b(a) = ln(a) / ln(b).',
    'M9.1': 'Fundamental definition: log_b(x) = y ⟺ b^y = x. "Base stays the base, other two swap."',
    'M9.2': 'Express both the argument and base as powers of the same number: log_b(b^p) = p.',
    'M9.8': 'Vertical asymptote is at argument = 0: x = h. Domain is x > h. x-intercept is where argument = 1.',
    'M9.11': 'Expanding: move power rule exponents LAST. Numerator gets +, denominator gets -.',
    'M9.13': 'Condensing: move coefficients to exponents FIRST. Group + in numerator, - in denominator.',
    'M9.14': 'Isolate log term, convert to exponential form, solve, and check argument > 0.',
    'M9.15': 'Always check candidate roots in original equations; discard any root that produces a non-positive argument.',
    'M9.16': 'Each step of 1 on the Richter or Decibel scale is an order of magnitude (10^x factor difference).',
  };

  // Guided Statistics
  let totalSteps = 0;
  let correctSteps = 0;
  let totalAttempts = 0;
  let completedExamples = 0;
  let totalExamples = 0;

  selectedMods.forEach((m) => {
    (guidedData[m] || []).forEach((g) => {
      totalExamples++;
      const st = guidedState[g.id];
      if (st?.complete) completedExamples++;
      g.steps.forEach((_, sIdx) => {
        totalSteps++;
        const res = st?.stepResults[sIdx];
        if (res) {
          if (res.correct) correctSteps++;
          totalAttempts += res.attempts || 1;
        }
      });
    });
  });

  const avgAttempts = correctSteps > 0 ? (totalAttempts / correctSteps).toFixed(1) : '1.0';

  // Analysis Engine Gaps
  const gaps: Array<{ mod: ModuleId; ms: string; errors: number; priority: 'high' | 'medium' }> = [];
  selectedMods.forEach((m) => {
    const errorCountByMs: Record<string, number> = {};
    practiceProblems
      .filter((q) => q.mod === m)
      .forEach((q) => {
        const res = practiceResults[q.id];
        if (res && res.points < 2) {
          errorCountByMs[q.ms] = (errorCountByMs[q.ms] || 0) + 1;
        }
      });

    Object.entries(errorCountByMs).forEach(([ms, count]) => {
      gaps.push({
        mod: m,
        ms,
        errors: count,
        priority: count >= 2 ? 'high' : 'medium',
      });
    });
  });

  gaps.sort((a, b) => (a.priority === 'high' ? -1 : 1));

  const handleStudyGuideTrigger = () => {
    setShowStudyGuide(true);
    try {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const filteredReviewList = practiceProblems.filter((p) => {
    const res = practiceResults[p.id];
    if (filterReview === 'missed') return res && res.points < 2;
    if (filterReview === 'correct') return res && res.points === 2;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Hero Score Card */}
      <div className="text-center rounded-3xl border border-slate-800 bg-gradient-to-b from-[#141828] via-[#0d101a] to-[#0a0c14] p-8 sm:p-12 mb-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Grade Circle */}
        <div
          className={`w-32 h-32 mx-auto mb-6 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${
            gradeColors[grade].ring
          } ${gradeColors[grade].bg}`}
        >
          <span className={`text-4xl font-black ${gradeColors[grade].text}`}>{pct}%</span>
          <span className="text-xs font-bold text-slate-300">Grade {grade}</span>
          <span className="text-[10px] text-slate-400">{earnedPts} / {maxPts} pts</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Assessment & Practice Complete
        </h2>
        <p className="text-slate-400 text-sm max-w-lg mx-auto">
          {pct >= 90
            ? 'Outstanding work! You have shown strong fluency across transformations, exponentials, and logarithms.'
            : pct >= 80
            ? 'Well done! A solid grasp of the core concepts with just a few fine-tuning opportunities.'
            : pct >= 70
            ? 'Good progress! Check out the targeted study guide below to solidify tricky steps.'
            : 'Keep persevering! Revisit the step-by-step guided examples for the flagged skills below.'}
        </p>

        {/* Actions bar */}
        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={handleStudyGuideTrigger}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Generate Targeted Study Guide</span>
          </button>
          <button
            onClick={() => setShowReview(!showReview)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-all"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{showReview ? 'Hide Problem Review' : 'Review All Answers'}</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* Module Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {selectedMods.map((m) => {
          const s = modScores[m] || { earned: 0, max: 0, pct: 0 };
          const p = s.max > 0 ? Math.round((s.earned / s.max) * 100) : 0;
          const colorClass =
            p >= 80 ? 'text-emerald-400' : p >= 60 ? 'text-amber-400' : 'text-orange-400';
          const barColor =
            p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-orange-500';

          const modNames: Record<number, { name: string; emoji: string }> = {
            5: { name: 'Polynomial Functions', emoji: '📐' },
            6: { name: 'Rational Functions', emoji: '⚡' },
            7: { name: 'Transformations', emoji: '🔄' },
            8: { name: 'Exponentials', emoji: '📈' },
            9: { name: 'Logarithms', emoji: '🧮' },
          };
          const info = modNames[m] || { name: `Module ${m}`, emoji: '📚' };

          return (
            <div
              key={m}
              className="p-5 rounded-2xl border border-slate-800 bg-[#0e111a] text-center shadow-lg"
            >
              <div className="text-xl mb-1">{info.emoji}</div>
              <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                Module {m}
              </div>
              <div className="text-xs font-bold text-slate-300 mb-1">{info.name}</div>
              <div className={`text-2xl font-black my-1.5 ${colorClass}`}>{p}%</div>
              <div className="text-xs text-slate-400 font-medium">
                {s.earned} / {s.max} Practice Points
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${p}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guided Walkthrough Performance */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#0f121e] p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Guided Learning Metrics</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Tracking your active participation through the multi-step scaffolded examples:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xl font-extrabold text-purple-400">
              {completedExamples} / {totalExamples}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Completed Examples</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xl font-extrabold text-emerald-400">
              {correctSteps} / {totalSteps}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Steps Solved First Attempt</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xl font-extrabold text-cyan-400">{avgAttempts}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Avg Tries Per Step</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <div className="text-xl font-extrabold text-amber-400">
              {Math.max(0, totalSteps - correctSteps)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Steps Revealed / Hinted</div>
          </div>
        </div>
      </div>

      {/* Analysis Engine: Prioritized Diagnostic Gaps */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e111a] p-6 mb-8 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Diagnostic Gap Engine</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">Ranked by Priority</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Automated analysis of missed questions with targeted coaching recommendations:
        </p>

        {gaps.length === 0 ? (
          <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center">
            <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-emerald-300">Perfect Diagnostic Score!</h4>
            <p className="text-xs text-slate-400 mt-1">
              You answered all practice problems with full credit. No conceptual gaps detected.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {gaps.map((gap, idx) => {
              const msInfo = MICRO_SKILLS[gap.ms];
              const advice =
                adviceMap[gap.ms] ||
                'Review the guided example for this skill and re-attempt the problem.';
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-bold text-xs text-rose-300 flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {gap.ms}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {msInfo?.label || gap.ms}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          gap.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {gap.priority === 'high' ? 'High Priority' : 'Review'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{advice}</p>
                    {msInfo?.keyFormula && (
                      <div className="mt-2 text-[11px] font-mono text-cyan-300 bg-black/40 px-2 py-1 rounded inline-block">
                        Formula: {msInfo.keyFormula}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personalized Study Guide */}
      {showStudyGuide && (
        <div className="rounded-2xl border border-indigo-500/40 bg-[#0d101c] p-6 sm:p-8 mb-8 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">
              Personalized Precalculus Study Guide
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-6">
            Custom-tailored cheat sheets, prerequisites, and remediation steps based on your session:
          </p>

          <div className="space-y-6">
            {selectedMods.map((m) => {
              const msInMod = Object.values(MICRO_SKILLS).filter((ms) => ms.mod === m);
              return (
                <div key={m} className="border-t border-slate-800 pt-4">
                  <h4 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
                    <span>Module {m} Core Knowledge Base</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {msInMod.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/60"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-bold text-purple-400">
                            {ms.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {ms.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                          {ms.desc}
                        </p>
                        {ms.keyFormula && (
                          <div className="font-mono text-[11px] text-emerald-300 bg-black/50 p-1.5 rounded border border-emerald-950">
                            {ms.keyFormula}
                          </div>
                        )}
                        {ms.commonMistake && (
                          <p className="text-[10px] text-amber-300/80 mt-1.5">
                            ⚠️ Watch out: {ms.commonMistake}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Problem Review */}
      {showReview && (
        <div className="rounded-2xl border border-slate-800 bg-[#0e111a] p-6 mb-8 shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h3 className="text-base font-bold text-white">Full Practice Problem Review</h3>
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setFilterReview('all')}
                className={`px-3 py-1 rounded font-medium ${
                  filterReview === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({practiceProblems.length})
              </button>
              <button
                onClick={() => setFilterReview('missed')}
                className={`px-3 py-1 rounded font-medium ${
                  filterReview === 'missed'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setFilterReview('correct')}
                className={`px-3 py-1 rounded font-medium ${
                  filterReview === 'correct'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Correct
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {filteredReviewList.map((p, idx) => {
              const res = practiceResults[p.id];
              const statusColor =
                res?.status === 'correct'
                  ? 'border-emerald-500/40'
                  : res?.status === 'partial'
                  ? 'border-amber-500/40'
                  : 'border-orange-500/40';

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border bg-slate-900/60 ${statusColor}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        Q{idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{p.q}</span>
                    </div>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        res?.status === 'correct'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : res?.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      {res?.points || 0}/2 pts
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded bg-black/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Your Submission:
                      </span>
                      <span className="font-mono text-slate-200">
                        {res?.userAnswer || '(Empty)'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/40">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Accepted Answer:
                      </span>
                      <span className="font-mono text-emerald-300">{p.answer}</span>
                    </div>
                  </div>

                  {res?.userWork && (
                    <div className="mb-2 p-2 rounded bg-black/30 text-xs text-slate-300">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                        Your Scratchpad Work:
                      </span>
                      <span className="font-mono">{res.userWork}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Solution Walkthrough:
                    </span>
                    {p.steps.map((st, sI) => (
                      <div key={sI} className="flex items-start gap-1.5 text-slate-300">
                        <span className="text-indigo-400 font-mono">{sI + 1}.</span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
