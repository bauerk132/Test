export type ModuleId = 5 | 6 | 7 | 8 | 9;

export interface MicroSkill {
  id: string;
  mod: ModuleId;
  label: string;
  desc: string;
  prereqs: string[];
  keyFormula?: string;
  commonMistake?: string;
}

export interface GuidedStep {
  prompt: string;
  hint: string;
  answer: string;
  explanation: string;
  acceptableAnswers?: string[];
}

export interface GuidedExample {
  id: string;
  mod: ModuleId;
  title: string;
  ms: string; // MicroSkill ID
  concept: string;
  problem: string;
  formulaNote?: string;
  steps: GuidedStep[];
  graphType?: 'parabola_shift' | 'exp_growth' | 'exp_decay' | 'log_curve' | 'cubic_symm' | 'rational_curve';
}

export interface PracticeProblem {
  id: string;
  mod: ModuleId;
  q: string;
  hint: string;
  ms: string;
  diff: 'easy' | 'medium' | 'hard';
  answer: string;
  kw: string[];
  partial?: (ans: string) => boolean;
  steps: string[];
  graphType?: 'parabola_shift' | 'exp_growth' | 'exp_decay' | 'log_curve' | 'cubic_symm' | 'rational_curve';
}

export interface StepProgress {
  attempts: number;
  correct: boolean;
  userAnswer?: string;
  revealed: boolean;
}

export interface GuidedProgress {
  currentStep: number;
  stepResults: StepProgress[];
  complete: boolean;
}

export interface PracticeResult {
  points: 0 | 1 | 2;
  status: 'correct' | 'partial' | 'wrong';
  userAnswer: string;
  userWork: string;
}

export interface ModuleStats {
  earned: number;
  max: number;
  pct: number;
}
