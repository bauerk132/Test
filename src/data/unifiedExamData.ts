import { PracticeProblem, ModuleId } from '../types';
import { ORIGINAL_TEST_V2 } from './originalTestData';
import { QB3_EXTRA } from './practiceData';

/**
 * UNIFIED EXAM & PRACTICE QUESTION BANK (V1-V3 MESH)
 * Structure requested by user:
 * - Module 5: 5 questions
 * - Module 6: 5 questions
 * - Module 7: 10 total exam questions
 * - Module 8: 10 total exam questions
 * - Module 9: 10 total exam questions
 */

export const MODULE_5_QUESTIONS: PracticeProblem[] = [
  {
    id: '5-1',
    mod: 5,
    q: 'A manufacturing firm models its daily profit from producing x units with the quadratic function P(x) = -2x² + 120x - 800. Find the production level x that maximizes profit, and calculate the maximum profit in dollars.',
    hint: 'For a parabola opening downward (a < 0), the maximum occurs at the vertex: x = -b / (2a). Plug x back into P(x) to determine maximum profit.',
    ms: 'M5.1',
    diff: 'medium',
    answer: 'x = 30 units, Maximum profit = $1,000',
    kw: ['30', '1000', '1,000', '30 units', '$1000', '$1,000', 'x = 30'],
    partial: (ans) => ans.includes('30') || ans.includes('1000') || ans.includes('1,000') || ans.includes('-120/'),
    steps: [
      'Identify quadratic coefficients: a = -2, b = 120, c = -800.',
      'Since a < 0, the parabola opens downward, reaching a global maximum at its vertex.',
      'Calculate vertex x-coordinate: x = -b / (2a) = -120 / (2 · (-2)) = -120 / -4 = 30 units.',
      'Substitute x = 30 into P(x): P(30) = -2(30)² + 120(30) - 800.',
      'Compute: P(30) = -2(900) + 3600 - 800 = -1800 + 3600 - 800 = $1,000.',
      'Conclusion: Profit is maximized at 30 units with a maximum daily profit of $1,000.',
    ],
    graphType: 'parabola_shift',
  },
  {
    id: '5-2',
    mod: 5,
    q: 'Given the polynomial function f(x) = -3(x + 4)²(x - 1)³(x - 5), find all real zeros and state whether the graph crosses the x-axis or touches the x-axis and turns around at each zero.',
    hint: 'Set each factor to zero to find the roots. Multiplicity rule: Odd multiplicity crosses the x-axis; even multiplicity touches and turns around.',
    ms: 'M5.3',
    diff: 'medium',
    answer: 'x = -4 (touches/turns), x = 1 (crosses), x = 5 (crosses)',
    kw: ['-4 touches', '-4 touches and turns', '1 crosses', '5 crosses', 'x = -4', 'x = 1', 'x = 5'],
    partial: (ans) => ans.includes('-4') || ans.includes('touches') || ans.includes('crosses'),
    steps: [
      'Factor 1: (x + 4)² = 0 ⟹ zero at x = -4 with multiplicity 2 (even).',
      'Because multiplicity is EVEN, the graph touches the x-axis and turns around at x = -4.',
      'Factor 2: (x - 1)³ = 0 ⟹ zero at x = 1 with multiplicity 3 (odd).',
      'Because multiplicity is ODD, the graph crosses the x-axis at x = 1.',
      'Factor 3: (x - 5)¹ = 0 ⟹ zero at x = 5 with multiplicity 1 (odd).',
      'Because multiplicity is ODD, the graph crosses the x-axis at x = 5.',
    ],
  },
  {
    id: '5-3',
    mod: 5,
    q: 'Use synthetic division to divide P(x) = 2x⁴ - 5x³ - 8x + 15 by (x - 3). State the quotient polynomial Q(x) and the remainder R.',
    hint: 'Write the synthetic division divisor as c = 3. Remember to insert a 0 coefficient for the missing x² term: [2, -5, 0, -8, 15].',
    ms: 'M5.4',
    diff: 'hard',
    answer: 'Q(x) = 2x³ + x² + 3x + 1, Remainder R = 18',
    kw: ['2x^3 + x^2 + 3x + 1', '2x³ + x² + 3x + 1', '18', 'R = 18', 'R=18', 'remainder 18'],
    partial: (ans) => ans.includes('2x^3') || ans.includes('18') || ans.includes('3x'),
    steps: [
      'Align coefficients with 0 for missing x²: 2, -5, 0, -8, 15 with divisor c = 3.',
      'Drop 2: 2.',
      'Multiply 3 · 2 = 6; Add -5 + 6 = 1.',
      'Multiply 3 · 1 = 3; Add 0 + 3 = 3.',
      'Multiply 3 · 3 = 9; Add -8 + 9 = 1.',
      'Multiply 3 · 1 = 3; Add 15 + 3 = 18 (Remainder).',
      'The quotient coefficients are [2, 1, 3, 1], giving Q(x) = 2x³ + x² + 3x + 1 with Remainder R = 18.',
    ],
  },
  {
    id: '5-4',
    mod: 5,
    q: 'Find all real and complex roots of the polynomial equation x³ - 5x² + 7x - 35 = 0.',
    hint: 'Factor by grouping: group the first two terms and last two terms: x²(x - 5) + 7(x - 5) = 0.',
    ms: 'M5.5',
    diff: 'hard',
    answer: 'x = 5, x = ±i√7 (or x = 5, i√7, -i√7)',
    kw: ['5', 'i*sqrt(7)', 'i√7', '±i√7', '+-i*sqrt(7)', 'sqrt(7)i', '-i√7'],
    partial: (ans) => ans.includes('5') || ans.includes('sqrt(7)') || ans.includes('i'),
    steps: [
      'Group terms: (x³ - 5x²) + (7x - 35) = 0.',
      'Factor common monomials: x²(x - 5) + 7(x - 5) = 0.',
      'Factor out the common binomial (x - 5): (x² + 7)(x - 5) = 0.',
      'First factor: x - 5 = 0 ⟹ real root x = 5.',
      'Second factor: x² + 7 = 0 ⟹ x² = -7 ⟹ x = ±√(-7) = ±i√7.',
      'All solutions: x = 5, x = i√7, x = -i√7.',
    ],
  },
  {
    id: '5-5',
    mod: 5,
    q: 'Determine the end behavior of the polynomial function g(x) = -4x⁵ + 7x³ - 2x + 9 as x ➔ ∞ and as x ➔ -∞ using the Leading Term Test.',
    hint: 'The leading term is -4x⁵. Degree n = 5 is odd (opposite ends); leading coefficient an = -4 is negative.',
    ms: 'M5.2',
    diff: 'easy',
    answer: 'As x ➔ ∞, g(x) ➔ -∞; As x ➔ -∞, g(x) ➔ ∞ (rises left, falls right)',
    kw: ['x -> inf, g(x) -> -inf', 'x -> -inf, g(x) -> inf', '-inf and inf', 'rises left, falls right', 'rises to the left and falls to the right'],
    partial: (ans) => ans.includes('-inf') && ans.includes('inf') || ans.includes('rises') || ans.includes('falls'),
    steps: [
      'Identify the leading term: an · xⁿ = -4x⁵.',
      'The degree is n = 5 (odd), which dictates that the ends point in opposite directions.',
      'The leading coefficient is an = -4 (negative).',
      'As x ➔ ∞: (-4)(+∞)⁵ = -∞ (falls to the right).',
      'As x ➔ -∞: (-4)(-∞)⁵ = (-4)(-∞) = +∞ (rises to the left).',
    ],
  },
];

export const MODULE_6_QUESTIONS: PracticeProblem[] = [
  {
    id: '6-1',
    mod: 6,
    q: 'Find the domain, the vertical asymptote(s), and the coordinates (x, y) of any hole(s) for the rational function f(x) = (x² - 9) / (2x² + 5x - 3).',
    hint: 'Factor both numerator and denominator completely. A factor that cancels creates a removable hole (plug x into simplified form for y); a factor remaining in denominator creates a vertical asymptote.',
    ms: 'M6.1',
    diff: 'hard',
    answer: 'Domain: x ≠ -3, 1/2; Hole at (-3, 6/7); Vertical Asymptote: x = 1/2',
    kw: ['x = 1/2', 'x=1/2', '(-3, 6/7)', '(-3,6/7)', 'hole at (-3, 6/7)', '6/7', 'x != -3'],
    partial: (ans) => ans.includes('1/2') || ans.includes('-3') || ans.includes('6/7'),
    steps: [
      'Factor numerator: x² - 9 = (x - 3)(x + 3).',
      'Factor denominator: 2x² + 5x - 3 = (2x - 1)(x + 3).',
      'State domain restrictions: 2x - 1 ≠ 0 ⟹ x ≠ 1/2, and x + 3 ≠ 0 ⟹ x ≠ -3. Domain: (-∞, -3) ∪ (-3, 1/2) ∪ (1/2, ∞).',
      'The factor (x + 3) cancels: f(x) = (x - 3) / (2x - 1) for x ≠ -3.',
      'Calculate hole y-coordinate: y = (-3 - 3) / (2(-3) - 1) = -6 / (-7) = 6/7. Hole is at (-3, 6/7).',
      'The remaining denominator factor (2x - 1) gives Vertical Asymptote: x = 1/2.',
    ],
  },
  {
    id: '6-2',
    mod: 6,
    q: 'Find the equation of the slant (oblique) asymptote of the rational function R(x) = (3x³ + 5x² - 4) / (x² + 2x - 1).',
    hint: 'Since the numerator degree (3) is exactly 1 greater than denominator degree (2), divide using polynomial long division. The linear quotient is the slant asymptote y = mx + b.',
    ms: 'M6.3',
    diff: 'medium',
    answer: 'y = 3x - 1',
    kw: ['y = 3x - 1', 'y=3x-1', '3x - 1', '3x-1'],
    partial: (ans) => ans.includes('3x') || ans.includes('-1') || ans.includes('y='),
    steps: [
      'Divide 3x³ + 5x² + 0x - 4 by x² + 2x - 1 using polynomial long division.',
      'First term: 3x³ ÷ x² = 3x.',
      'Multiply and subtract: 3x(x² + 2x - 1) = 3x³ + 6x² - 3x. Subtracting yields -x² + 3x - 4.',
      'Second term: -x² ÷ x² = -1.',
      'Multiply and subtract: -1(x² + 2x - 1) = -x² - 2x + 1. Subtracting yields remainder 5x - 5.',
      'As x ➔ ±∞, the remainder term (5x - 5) / (x² + 2x - 1) ➔ 0.',
      'Therefore, the slant asymptote line is y = 3x - 1.',
    ],
  },
  {
    id: '6-3',
    mod: 6,
    q: 'Solve the rational equation for x and state any extraneous roots:  x / (x - 2) + 1 / (x - 4) = 2 / (x² - 6x + 8).',
    hint: 'Notice x² - 6x + 8 = (x - 2)(x - 4). Multiply all terms by LCD = (x - 2)(x - 4), solve the quadratic, and check against restrictions x ≠ 2, 4.',
    ms: 'M6.4',
    diff: 'hard',
    answer: 'x = -1 (extraneous root: x = 4)',
    kw: ['x = -1', 'x=-1', '-1', 'extraneous: 4', 'extraneous 4', '4 is extraneous'],
    partial: (ans) => ans.includes('-1') || ans.includes('4') || ans.includes('extraneous'),
    steps: [
      'Factor denominator: x² - 6x + 8 = (x - 2)(x - 4). LCD is (x - 2)(x - 4).',
      'Multiply both sides by LCD: x(x - 4) + 1(x - 2) = 2.',
      'Expand: x² - 4x + x - 2 = 2 ⟹ x² - 3x - 4 = 0.',
      'Factor quadratic: (x - 4)(x + 1) = 0 ⟹ candidate roots: x = 4 and x = -1.',
      'Check restrictions: x = 4 makes denominators (x - 4) and (x² - 6x + 8) zero! Thus x = 4 is an EXTRANEOUS ROOT.',
      'x = -1 does not cause division by zero: -1/(-3) + 1/(-5) = 1/3 - 1/5 = 2/15, and 2/(1 + 6 + 8) = 2/15. True!',
      'Final valid solution: x = -1.',
    ],
  },
  {
    id: '6-4',
    mod: 6,
    q: 'Find the formula for the inverse function f⁻¹(x) for f(x) = (4x + 1) / (3 - 2x) and state its domain in interval notation.',
    hint: 'Replace f(x) with y, swap x and y to get x = (4y + 1) / (3 - 2y), clear denominator, collect y terms, and isolate y.',
    ms: 'M6.5',
    diff: 'medium',
    answer: 'f⁻¹(x) = (3x - 1) / (2x + 4), Domain: (-∞, -2) ∪ (-2, ∞) (or x ≠ -2)',
    kw: ['(3x - 1) / (2x + 4)', '(3x-1)/(2x+4)', '(1 - 3x) / (-2x - 4)', '(-inf, -2)', 'x != -2', 'x ≠ -2'],
    partial: (ans) => ans.includes('3x') && ans.includes('2x') || ans.includes('-2'),
    steps: [
      'Set y = (4x + 1) / (3 - 2x). Swap variables: x = (4y + 1) / (3 - 2y).',
      'Multiply both sides by (3 - 2y): x(3 - 2y) = 4y + 1.',
      'Expand: 3x - 2xy = 4y + 1.',
      'Group y terms on one side: 3x - 1 = 4y + 2xy = y(2x + 4).',
      'Divide by (2x + 4): y = (3x - 1) / (2x + 4).',
      'Therefore, f⁻¹(x) = (3x - 1) / (2x + 4).',
      'Domain restriction: 2x + 4 ≠ 0 ⟹ x ≠ -2, which is (-∞, -2) ∪ (-2, ∞).',
    ],
  },
  {
    id: '6-5',
    mod: 6,
    q: 'Solve the radical equation √(2x + 15) - x = 6. Clearly identify any extraneous roots.',
    hint: 'Isolate the square root: √(2x + 15) = x + 6. Square both sides (remember to expand (x + 6)² as x² + 12x + 36), solve the quadratic, and check both solutions in original equation.',
    ms: 'M6.5',
    diff: 'medium',
    answer: 'x = -3 (extraneous root: x = -7)',
    kw: ['x = -3', 'x=-3', '-3', 'extraneous: -7', 'extraneous -7', '-7 is extraneous'],
    partial: (ans) => ans.includes('-3') || ans.includes('-7') || ans.includes('extraneous'),
    steps: [
      'Isolate radical: √(2x + 15) = x + 6.',
      'Square both sides: [√(2x + 15)]² = (x + 6)² ⟹ 2x + 15 = x² + 12x + 36.',
      'Rearrange to standard form: x² + 10x + 21 = 0.',
      'Factor: (x + 3)(x + 7) = 0 ⟹ candidate solutions: x = -3 and x = -7.',
      'Check x = -7 in original: √[2(-7) + 15] - (-7) = √1 + 7 = 1 + 7 = 8 ≠ 6. Extraneous!',
      'Check x = -3 in original: √[2(-3) + 15] - (-3) = √9 + 3 = 3 + 3 = 6. True!',
      'Final valid solution: x = -3 (x = -7 is extraneous).',
    ],
  },
];

/**
 * UNIFIED MASTER EXAM QUESTION BANK (40 Questions total):
 * Module 5: 5 questions
 * Module 6: 5 questions
 * Module 7: 10 questions (Original Test 2 [5] + Extra Bank [5])
 * Module 8: 10 questions (Original Test 2 [5] + Extra Bank [5])
 * Module 9: 10 questions (Original Test 2 [5] + Extra Bank [5])
 */
export const UNIFIED_EXAM_QUESTIONS: Record<ModuleId, PracticeProblem[]> = {
  5: MODULE_5_QUESTIONS,
  6: MODULE_6_QUESTIONS,
  7: [...(ORIGINAL_TEST_V2[7] || []), ...(QB3_EXTRA[7] || [])],
  8: [...(ORIGINAL_TEST_V2[8] || []), ...(QB3_EXTRA[8] || [])],
  9: [...(ORIGINAL_TEST_V2[9] || []), ...(QB3_EXTRA[9] || [])],
};
