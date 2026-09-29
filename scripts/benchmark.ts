import { UNIFIED_EXAM_QUESTIONS } from '../src/data/unifiedExamData.js';
import { PracticeProblem } from '../src/types.js';

// extract all problems
const allProblems = Object.values(UNIFIED_EXAM_QUESTIONS).flat();

function gradeSingleProblemOptimized(
  problem: PracticeProblem,
  rawAns: string
) {
  const ansClean = rawAns.toLowerCase().replace(/\s/g, '');

  if (!problem.kwClean) {
    problem.kwClean = problem.kw.map((kw) => kw.toLowerCase().replace(/\s/g, ''));
  }

  const isFullCredit = problem.kwClean.some((kwClean) =>
    ansClean.includes(kwClean)
  );

  return isFullCredit;
}

const numIterations = 10000;
const testAns = "this is a test answer that might contain 30 units or $1,000 or whatever but it is long to force searching through all keywords";


const startOptimized = performance.now();
for (let i = 0; i < numIterations; i++) {
  for (const p of allProblems) {
    gradeSingleProblemOptimized(p, testAns);
  }
}
const endOptimized = performance.now();
console.log(`Optimized: ${endOptimized - startOptimized}ms`);
