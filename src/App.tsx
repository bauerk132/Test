import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ModuleId, GuidedProgress, PracticeResult, ModuleStats, PracticeProblem, GuidedExample } from './types';
import { MICRO_SKILLS } from './data/microSkills';
import { GUIDED } from './data/guidedData';
import { UNIFIED_EXAM_QUESTIONS } from './data/unifiedExamData';
import { Header } from './components/Header';
import { ModuleSelector } from './components/ModuleSelector';
import { GuidedCard } from './components/GuidedCard';
import { PracticeCard } from './components/PracticeCard';
import { ResultsView } from './components/ResultsView';
import { InteractiveSandboxModal } from './components/InteractiveSandboxModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { FormulaModal } from './components/FormulaModal';
import { Compass, Edit3, CheckCircle, Award, BookOpen, Layers, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateProblemVariant } from './utils/variantGenerator';

// PERFORMANCE OPTIMIZATION:
// Pre-compute lookup maps for O(1) access to guided examples and exam problems.
// This prevents expensive O(N*M) array iterations within loops (e.g. handleCheckStep, handleNextStep)
// which can cause significant CPU overhead and trigger unnecessary cascading re-renders.
const guidedMap = new Map<string, GuidedExample>();
Object.values(GUIDED).forEach((examples) => {
  examples.forEach((g) => guidedMap.set(g.id, g));
});

const problemMap = new Map<string, PracticeProblem>();
Object.values(UNIFIED_EXAM_QUESTIONS).forEach((problems) => {
  problems.forEach((p) => problemMap.set(p.id, p));
});

export default function App() {
  const [selectedMods, setSelectedMods] = useState<ModuleId[]>([5, 6, 7, 8, 9]);
  const [view, setView] = useState<'select' | 'learning' | 'results'>('select');

  // Live Timer
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Guided Progression State: exampleId -> GuidedProgress
  const [guidedState, setGuidedState] = useState<Record<string, GuidedProgress>>({});

  // Practice & Test Answers State
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [userWork, setUserWork] = useState<Record<string, string>>({});
  const [practiceResults, setPracticeResults] = useState<Record<string, PracticeResult>>({});
  const [isGraded, setIsGraded] = useState(false);

  // Algorithmic Variant Generator State
  const [problemVariants, setProblemVariants] = useState<Record<string, PracticeProblem>>({});
  const [variantCounters, setVariantCounters] = useState<Record<string, number>>({});

  // Modals
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isGithubOpen, setIsGithubOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);

  // Active module anchor tab in learning view
  const [activeTab, setActiveTab] = useState<ModuleId>(5);

  // Timer Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleMod = (mod: ModuleId) => {
    setSelectedMods((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod].sort((a, b) => a - b)
    );
  };

  const handleSelectAll = () => {
    setSelectedMods([5, 6, 7, 8, 9]);
  };

  const handleSelectTest2Only = () => {
    setSelectedMods([7, 8, 9]);
  };

  const handleSelectAlgebraOnly = () => {
    setSelectedMods([5, 6]);
  };

  const handleStart = () => {
    if (selectedMods.length === 0) return;
    // Initialize guided progression states for selected modules
    const initGuided: Record<string, GuidedProgress> = {};
    selectedMods.forEach((m) => {
      (GUIDED[m] || []).forEach((g) => {
        initGuided[g.id] = {
          currentStep: 0,
          stepResults: [],
          complete: false,
        };
      });
    });
    setGuidedState(initGuided);
    setActiveTab(selectedMods[0]);
    setView('learning');
    setIsTimerRunning(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smart checking for guided steps
  const handleCheckStep = useCallback((exampleId: string, stepIndex: number, userAnswer: string): boolean => {
    const targetExample = guidedMap.get(exampleId);
    if (!targetExample) return false;

    const step = targetExample.steps[stepIndex];
    const cleanUser = userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const cleanNoSpaces = cleanUser.replace(/\s/g, '');

    const candidates = [
      step.answer.toLowerCase(),
      ...(step.acceptableAnswers || []).map((a) => a.toLowerCase()),
    ];

    let isCorrect = candidates.some((cand) => {
      const candClean = cand.replace(/\s+/g, ' ');
      const candNoSpaces = cand.replace(/\s/g, '');
      if (cleanUser === candClean || cleanNoSpaces === candNoSpaces) return true;
      if (cleanUser.includes(candClean) || cleanNoSpaces.includes(candNoSpaces)) return true;
      return false;
    });

    // Flexible numerical/keyword parsing
    if (!isCorrect) {
      const numsInAnswer: string[] = step.answer.match(/[-]?\d+\.?\d*\/?\d*/g) || [];
      const numsInUser: string[] = userAnswer.match(/[-]?\d+\.?\d*\/?\d*/g) || [];
      if (numsInAnswer.length > 0 && numsInUser.length > 0) {
        const matchesAllNums = numsInAnswer.every((n: string) => numsInUser.includes(n));
        if (matchesAllNums && numsInAnswer.length === numsInUser.length) {
          isCorrect = true;
        }
      }
    }

    setGuidedState((prev) => {
      const cur = prev[exampleId] || { currentStep: 0, stepResults: [], complete: false };
      const updatedResults = [...cur.stepResults];
      const prevAttempt = updatedResults[stepIndex]?.attempts || 0;
      updatedResults[stepIndex] = {
        attempts: prevAttempt + 1,
        correct: isCorrect,
        userAnswer,
        revealed: true,
      };
      return {
        ...prev,
        [exampleId]: {
          ...cur,
          stepResults: updatedResults,
        },
      };
    });

    return isCorrect;
  }, [selectedMods]);

  const handleNextStep = useCallback((exampleId: string, stepIndex: number) => {
    const targetExample = guidedMap.get(exampleId);
    if (!targetExample) return;

    setGuidedState((prev) => {
      const cur = prev[exampleId];
      if (!cur) return prev;
      const nextIdx = stepIndex + 1;
      const isComplete = nextIdx >= targetExample.steps.length;
      return {
        ...prev,
        [exampleId]: {
          ...cur,
          currentStep: isComplete ? stepIndex : nextIdx,
          complete: isComplete,
        },
      };
    });
  }, [selectedMods]);

  const handleAnswerChange = useCallback((qId: string, val: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: val }));
  }, []);

  const handleWorkChange = useCallback((qId: string, val: string) => {
    setUserWork((prev) => ({ ...prev, [qId]: val }));
  }, []);

  // Generate a single problem variant with randomized numbers
  const handleGenerateVariant = useCallback((problemId: string) => {
    const baseProblem = problemMap.get(problemId);
    if (!baseProblem) return;

    const currentCount = variantCounters[problemId] || 1;
    const nextCount = currentCount + 1;
    const newVariant = generateProblemVariant(baseProblem, nextCount);

    setVariantCounters((prev) => ({ ...prev, [problemId]: nextCount }));
    setProblemVariants((prev) => ({ ...prev, [problemId]: newVariant }));

    // Reset user answers and work for this card so the student can work fresh
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
    setUserWork((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
  }, [selectedMods, variantCounters]);

  // Reset a problem back to the original baseline numbers
  const handleResetVariant = useCallback((problemId: string) => {
    setProblemVariants((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
    setVariantCounters((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
    setUserWork((prev) => {
      const next = { ...prev };
      delete next[problemId];
      return next;
    });
  }, []);

  // Bulk shuffle all problems in a module with new algorithmic variants
  const handleShuffleModuleVariants = (modId: ModuleId) => {
    const problems = UNIFIED_EXAM_QUESTIONS[modId] || [];
    const updatedVariants = { ...problemVariants };
    const updatedCounters = { ...variantCounters };
    const updatedAnswers = { ...userAnswers };
    const updatedWork = { ...userWork };

    problems.forEach((p) => {
      const currentCount = updatedCounters[p.id] || 1;
      const nextCount = currentCount + 1;
      updatedCounters[p.id] = nextCount;
      updatedVariants[p.id] = generateProblemVariant(p, nextCount);
      delete updatedAnswers[p.id];
      delete updatedWork[p.id];
    });

    setProblemVariants(updatedVariants);
    setVariantCounters(updatedCounters);
    setUserAnswers(updatedAnswers);
    setUserWork(updatedWork);
  };

  // Find a problem from active variants or baseline bank
  const findProblem = (qId: string): PracticeProblem | null => {
    if (problemVariants[qId]) return problemVariants[qId];
    return problemMap.get(qId) || null;
  };

  // Grade Practice / Test Problem
  const gradeSingleProblem = (
    qId: string,
    rawAns: string,
    work: string
  ): { points: 0 | 1 | 2; status: 'correct' | 'partial' | 'wrong' } => {
    const problem = findProblem(qId);
    if (!problem || !rawAns.trim()) return { points: 0, status: 'wrong' };

    const ansClean = rawAns.toLowerCase().replace(/\s/g, '');
    const workClean = (work || '').toLowerCase();

    // 1. Direct keyword match -> full credit (2 pts)
    const isFullCredit = problem.kw.some((kw) =>
      ansClean.includes(kw.toLowerCase().replace(/\s/g, ''))
    );
    if (isFullCredit) return { points: 2, status: 'correct' };

    // 2. Partial function or work match -> partial credit (1 pt)
    if (problem.partial && problem.partial(ansClean)) {
      return { points: 1, status: 'partial' };
    }
    if (workClean.length > 10 && problem.partial && problem.partial(workClean)) {
      return { points: 1, status: 'partial' };
    }

    return { points: 0, status: 'wrong' };
  };

  // Resolve all active exam problems across selected modules (incorporating active variants)
  const activeProblems: PracticeProblem[] = useMemo(() => {
    return selectedMods.flatMap(
      (m) => (UNIFIED_EXAM_QUESTIONS[m] || []).map((p) => problemVariants[p.id] || p)
    );
  }, [selectedMods, problemVariants]);

  const handleSubmit = () => {
    setIsTimerRunning(false);
    setIsGraded(true);

    const results: Record<string, PracticeResult> = {};
    activeProblems.forEach((q) => {
      const uAns = userAnswers[q.id] || '';
      const uWork = userWork[q.id] || '';
      const graded = gradeSingleProblem(q.id, uAns, uWork);
      results[q.id] = {
        points: graded.points,
        status: graded.status,
        userAnswer: uAns,
        userWork: uWork,
      };
    });

    setPracticeResults(results);
    setView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const handleReset = () => {
    setUserAnswers({});
    setUserWork({});
    setPracticeResults({});
    setIsGraded(false);
    setSeconds(0);
    setIsTimerRunning(false);
    setView('select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Progress Calculations
  const {
    problemsAnswered,
    guidedStepsTotal,
    guidedStepsDone,
    totalActionItems,
    completedActionItems,
    overallPct
  } = useMemo(() => {
    const pAns = activeProblems.filter(
      (p) => userAnswers[p.id] && userAnswers[p.id].trim() !== ''
    ).length;

    let gTotal = 0;
    let gDone = 0;
    selectedMods.forEach((m) => {
      (GUIDED[m] || []).forEach((g) => {
        gTotal += g.steps.length;
        const st = guidedState[g.id];
        if (st) {
          gDone += st.stepResults.filter((r) => r && r.revealed).length;
        }
      });
    });

    const totalAct = gTotal + activeProblems.length;
    const compAct = gDone + pAns;
    const pct = totalAct > 0 ? Math.round((compAct / totalAct) * 100) : 0;

    return {
      problemsAnswered: pAns,
      guidedStepsTotal: gTotal,
      guidedStepsDone: gDone,
      totalActionItems: totalAct,
      completedActionItems: compAct,
      overallPct: pct
    };
  }, [activeProblems, userAnswers, selectedMods, guidedState]);

  // Results Scores
  const { earnedPts, maxPts, modScores } = useMemo(() => {
    let earned = 0;
    const max = activeProblems.length * 2;
    const scores: Record<number, ModuleStats> = {};

    selectedMods.forEach((m) => {
      const modProbs = activeProblems.filter((p) => p.mod === m);
      let modEarned = 0;
      modProbs.forEach((p) => {
        const res = practiceResults[p.id];
        if (res) modEarned += res.points;
      });
      const modMax = modProbs.length * 2;
      scores[m] = {
        earned: modEarned,
        max: modMax,
        pct: modMax > 0 ? Math.round((modEarned / modMax) * 100) : 0,
      };
      earned += modEarned;
    });

    return { earnedPts: earned, maxPts: max, modScores: scores };
  }, [activeProblems, selectedMods, practiceResults]);

  const scrollToAnchor = (mod: ModuleId) => {
    setActiveTab(mod);
    const el = document.getElementById(`mod-section-${mod}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const moduleHeaderInfo: Record<
    ModuleId,
    { title: string; subtitle: string; emoji: string; gradient: string }
  > = {
    5: {
      title: 'Polynomial & Power Functions',
      subtitle: '5 Authentic Exam & Optimization Questions',
      emoji: '📐',
      gradient: 'from-blue-500 to-indigo-500',
    },
    6: {
      title: 'Rational & Radical Functions',
      subtitle: '5 Authentic Exam, Asymptote & Radical Questions',
      emoji: '⚡',
      gradient: 'from-cyan-400 to-blue-500',
    },
    7: {
      title: 'Transformations & Symmetry',
      subtitle: '5 Interactive Walkthroughs + 10 Comprehensive Exam Questions',
      emoji: '🔄',
      gradient: 'from-purple-400 to-indigo-400',
    },
    8: {
      title: 'Exponential Functions',
      subtitle: '5 Interactive Walkthroughs + 10 Comprehensive Exam Questions',
      emoji: '📈',
      gradient: 'from-emerald-400 to-teal-400',
    },
    9: {
      title: 'Logarithmic Functions',
      subtitle: '5 Interactive Walkthroughs + 10 Comprehensive Exam Questions',
      emoji: '🧮',
      gradient: 'from-amber-400 to-orange-400',
    },
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] flex flex-col font-sans">
      <Header
        seconds={seconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenGithub={() => setIsGithubOpen(true)}
        onOpenFormulas={() => setIsFormulaOpen(true)}
        onNavigateHome={() => setView('select')}
      />

      <main className="flex-1 w-full pb-16">
        {view === 'select' && (
          <ModuleSelector
            selectedMods={selectedMods}
            onToggleMod={toggleMod}
            onSelectAll={handleSelectAll}
            onSelectTest2Only={handleSelectTest2Only}
            onSelectAlgebraOnly={handleSelectAlgebraOnly}
            onStart={handleStart}
          />
        )}

        {view === 'learning' && (
          <div className="max-w-5xl mx-auto px-4 py-6 animate-fadeIn">
            {/* Sticky Navigation & Progress Bar */}
            <div className="sticky top-[57px] z-30 mb-8 rounded-2xl border border-slate-800/90 bg-[#0c0f18]/95 p-3.5 sm:p-4 backdrop-blur-md shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                {/* Module Anchor Tabs */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {selectedMods.map((m) => (
                    <button
                      key={m}
                      onClick={() => scrollToAnchor(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === m
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-lg'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Module {m}
                    </button>
                  ))}
                </div>

                {/* Counter & Percentage */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setView('select')}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                  >
                    Select Modules
                  </button>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-200">
                      {completedActionItems} / {totalActionItems} Completed
                    </span>
                    <span className="text-xs text-cyan-400 ml-1.5 font-extrabold">
                      ({overallPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${overallPct}%` }}
                ></div>
              </div>
            </div>

            {/* Modules Content */}
            {selectedMods.map((modId) => {
              const guidedList = GUIDED[modId] || [];
              const examList = UNIFIED_EXAM_QUESTIONS[modId] || [];
              const meta = moduleHeaderInfo[modId];

              return (
                <div key={modId} id={`mod-section-${modId}`} className="mb-16 scroll-mt-28">
                  {/* Module Title Banner */}
                  <div className="mb-6 flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-3">
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl p-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md">
                        {meta.emoji}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Module {modId}
                          </span>
                          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                            {meta.title}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{meta.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-300 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        {examList.length} Exam Questions
                      </span>
                      {guidedList.length > 0 && (
                        <span className="text-xs font-bold text-purple-300 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20">
                          {guidedList.length} Walkthroughs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. GUIDED WALKTHROUGHS (for Modules 7, 8, 9) */}
                  {guidedList.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-black text-purple-300">
                              Interactive Guided Walkthroughs
                            </h3>
                            <p className="text-xs text-slate-400">
                              Try each step on your own before revealing the tiered hints.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wide">
                          5 Scaffolded Steps
                        </span>
                      </div>

                      <div className="space-y-4">
                        {guidedList.map((g, gIdx) => (
                          <GuidedCard
                            key={g.id}
                            example={g}
                            index={gIdx}
                            microSkill={MICRO_SKILLS[g.ms]}
                            progress={
                              guidedState[g.id] || {
                                currentStep: 0,
                                stepResults: [],
                                complete: false,
                              }
                            }
                            onCheckStep={handleCheckStep}
                            onNextStep={handleNextStep}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. EXAM PROBLEMS SECTION (5 for M5/M6; 10 for M7/M8/M9) */}
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-cyan-300">
                            Comprehensive Exam Questions
                          </h3>
                          <p className="text-xs text-slate-400">
                            Enter final answers and show your scratchpad work for partial credit.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {!isGraded && (
                          <button
                            type="button"
                            onClick={() => handleShuffleModuleVariants(modId)}
                            title="Regenerate all questions in this module with fresh randomized numbers"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-950 via-indigo-950 to-cyan-950 hover:from-blue-900 hover:to-cyan-900 border border-cyan-400/50 text-cyan-200 hover:text-white text-xs font-black shadow-lg shadow-black/40 transition-all active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                            <span>Regenerate Module Problems 🎲</span>
                          </button>
                        )}
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                          {examList.length} Exam Problems
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {examList.map((p, pIdx) => {
                        const activeProb = problemVariants[p.id] || p;
                        const vNum = variantCounters[p.id] || 1;
                        return (
                          <PracticeCard
                            key={activeProb.id}
                            problem={activeProb}
                            index={pIdx}
                            answer={userAnswers[p.id] || ''}
                            work={userWork[p.id] || ''}
                            result={practiceResults[p.id]}
                            isGraded={isGraded}
                            variantNum={vNum}
                            onGenerateVariant={handleGenerateVariant}
                            onResetVariant={handleResetVariant}
                            onAnswerChange={handleAnswerChange}
                            onWorkChange={handleWorkChange}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Submission Section */}
            <div className="my-10 p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-purple-950/20 via-[#0e111a] to-cyan-950/20 text-center shadow-2xl">
              <h3 className="text-lg sm:text-xl font-black text-white mb-2">
                Ready to Grade Your Precalculus Exam Problems?
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
                {problemsAnswered < activeProblems.length
                  ? `You have answered ${problemsAnswered} of ${activeProblems.length} questions across your selected modules. You can submit now or complete the rest.`
                  : `All ${activeProblems.length} questions answered! Click below to run the diagnostic grading engine.`}
              </p>

              <button
                onClick={handleSubmit}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-xl shadow-teal-600/30 transition-all active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit & View Diagnostic Grade Breakdown</span>
              </button>
            </div>
          </div>
        )}

        {view === 'results' && (
          <ResultsView
            selectedMods={selectedMods}
            earnedPts={earnedPts}
            maxPts={maxPts}
            modScores={modScores}
            practiceProblems={activeProblems}
            practiceResults={practiceResults}
            guidedData={GUIDED}
            guidedState={guidedState}
            onReset={handleReset}
            onOpenGithub={() => setIsGithubOpen(true)}
          />
        )}
      </main>

      {/* Interactive Graphing Sandbox Modal */}
      <InteractiveSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
      />

      {/* GitHub Export Modal */}
      <GitHubExportModal
        isOpen={isGithubOpen}
        onClose={() => setIsGithubOpen(false)}
      />

      {/* Formula Sheet Modal */}
      <FormulaModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />
    </div>
  );
}
