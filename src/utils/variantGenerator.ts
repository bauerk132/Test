import { PracticeProblem, ModuleId } from '../types';

/**
 * Algorithmic Problem Variant Generator for Precalculus
 * Procedurally generates authentic variants with randomized parameters,
 * exact mathematical solutions, updated keywords, hints, and step-by-step solutions.
 */

// Helper to get a cryptographically secure random number between 0 (inclusive) and 1 (exclusive)
function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1);
}

// Helper to pick randomly from an array based on seed or secureRandom
function pick<T>(arr: T[], seed?: number): T {
  if (seed !== undefined) {
    const idx = Math.abs(seed) % arr.length;
    return arr[idx];
  }
  return arr[Math.floor(secureRandom() * arr.length)];
}

function randInt(min: number, max: number, seed?: number): number {
  if (seed !== undefined) {
    const range = max - min + 1;
    return min + (Math.abs(seed) % range);
  }
  return Math.floor(secureRandom() * (max - min + 1)) + min;
}

export function generateProblemVariant(base: PracticeProblem, variantNum: number): PracticeProblem {
  const seed = variantNum * 31 + base.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const id = base.id;

  // -------------------------------------------------------------
  // MODULE 5 VARIANTS
  // -------------------------------------------------------------
  if (id === '5-1') {
    // Quadratic Profit Optimization: P(x) = -a*x^2 + b*x - c
    const xOpts = [25, 30, 35, 40, 45, 50];
    const aOpts = [1, 2, 3, 4];
    const x_v = pick(xOpts, seed);
    const a = pick(aOpts, seed + 1);
    const b = 2 * a * x_v;
    const maxProfit = pick([1000, 1200, 1500, 1800, 2000, 2400], seed + 2);
    const c = a * x_v * x_v - maxProfit;

    return {
      ...base,
      q: `A manufacturing firm models its daily profit from producing x units with the quadratic function P(x) = ${a === 1 ? '-' : `-${a}`}x² + ${b}x - ${c}. Find the production level x that maximizes profit, and calculate the maximum profit in dollars.`,
      hint: `For a downward-opening parabola (a < 0), the maximum occurs at the vertex: x = -b / (2a) = -${b} / (2 · (-${a})). Then substitute x into P(x).`,
      answer: `x = ${x_v} units, Maximum profit = $${maxProfit.toLocaleString()}`,
      kw: [`${x_v}`, `${maxProfit}`, maxProfit.toLocaleString(), `$${maxProfit}`, `x = ${x_v}`, `${x_v} units`],
      partial: (ans) => ans.includes(`${x_v}`) || ans.includes(`${maxProfit}`) || ans.includes(`-${b}/`),
      steps: [
        `Identify coefficients: a = -${a}, b = ${b}, c = -${c}.`,
        `Since a < 0, the parabola opens downward, reaching a global maximum at its vertex.`,
        `Vertex x-coordinate: x = -b / (2a) = -${b} / (2 · (-${a})) = -${b} / (-${2 * a}) = ${x_v} units.`,
        `Substitute x = ${x_v} into P(x): P(${x_v}) = -${a}(${x_v})² + ${b}(${x_v}) - ${c}.`,
        `Calculate: -${a}(${x_v * x_v}) + ${b * x_v} - ${c} = -${a * x_v * x_v} + ${b * x_v} - ${c} = $${maxProfit.toLocaleString()}.`,
        `Conclusion: Profit is maximized at ${x_v} units with maximum daily profit of $${maxProfit.toLocaleString()}.`,
      ],
    };
  }

  if (id === '5-2') {
    // Polynomial Zeros & Multiplicity
    const r1 = pick([-5, -4, -3, -2, 2, 3], seed);
    const r2 = pick([1, 4, 5], seed + 1);
    const r3 = pick([6, 7, 8], seed + 2);
    const k = pick([-4, -3, -2, 2, 3], seed + 3);

    const f1Str = r1 > 0 ? `(x - ${r1})²` : `(x + ${Math.abs(r1)})²`;
    const f2Str = r2 > 0 ? `(x - ${r2})³` : `(x + ${Math.abs(r2)})³`;
    const f3Str = r3 > 0 ? `(x - ${r3})` : `(x + ${Math.abs(r3)})`;

    return {
      ...base,
      q: `Given the polynomial function f(x) = ${k}${f1Str}${f2Str}${f3Str}, find all real zeros and state whether the graph crosses the x-axis or touches the x-axis and turns around at each zero.`,
      hint: `Set each factor to zero. Rule: Even multiplicity (exponent 2) touches/turns; Odd multiplicity (exponents 3 and 1) crosses the x-axis.`,
      answer: `x = ${r1} (touches/turns), x = ${r2} (crosses), x = ${r3} (crosses)`,
      kw: [`${r1} touches`, `${r1} touches and turns`, `${r2} crosses`, `${r3} crosses`, `x = ${r1}`, `x = ${r2}`, `x = ${r3}`],
      partial: (ans) => ans.includes(`${r1}`) || ans.includes(`${r2}`) || ans.includes('touches') || ans.includes('crosses'),
      steps: [
        `Factor 1: ${f1Str} = 0 ⟹ zero at x = ${r1} with multiplicity 2 (even).`,
        `Because multiplicity is EVEN, the graph touches the x-axis and turns around at x = ${r1}.`,
        `Factor 2: ${f2Str} = 0 ⟹ zero at x = ${r2} with multiplicity 3 (odd).`,
        `Because multiplicity is ODD, the graph crosses the x-axis at x = ${r2}.`,
        `Factor 3: ${f3Str} = 0 ⟹ zero at x = ${r3} with multiplicity 1 (odd).`,
        `Because multiplicity is ODD, the graph crosses the x-axis at x = ${r3}.`,
      ],
    };
  }

  if (id === '5-3') {
    // Synthetic Division: P(x) = a*x^4 + b*x^3 + 0*x^2 + c*x + d divided by (x - r)
    const r = pick([2, 3, 4], seed);
    const a = pick([1, 2, 3], seed + 1);
    const b = -pick([3, 4, 5], seed + 2);
    const c = -pick([6, 7, 8], seed + 3);
    const d = pick([10, 12, 16], seed + 4);

    // Run synthetic division steps:
    const row0 = [a, b, 0, c, d];
    const q0 = a;
    const prod1 = r * q0;
    const q1 = b + prod1;
    const prod2 = r * q1;
    const q2 = 0 + prod2;
    const prod3 = r * q2;
    const q3 = c + prod3;
    const prod4 = r * q3;
    const rem = d + prod4;

    const qStr = `${q0 === 1 ? '' : q0}x³ + ${q1}x² + ${q2}x + ${q3}`;

    return {
      ...base,
      q: `Use synthetic division to divide P(x) = ${a}x⁴ ${b < 0 ? `- ${Math.abs(b)}` : `+ ${b}`}x³ ${c < 0 ? `- ${Math.abs(c)}` : `+ ${c}`}x + ${d} by (x - ${r}). State the quotient polynomial Q(x) and the remainder R.`,
      hint: `Divisor root is c = ${r}. Place a 0 for the missing x² term: [${a}, ${b}, 0, ${c}, ${d}].`,
      answer: `Q(x) = ${qStr}, Remainder R = ${rem}`,
      kw: [`${rem}`, `R = ${rem}`, `R=${rem}`, `remainder ${rem}`, `${q0}x^3`, `${q1}x^2`],
      partial: (ans) => ans.includes(`${rem}`) || ans.includes(`${q0}x^3`),
      steps: [
        `Setup row with 0 for missing x²: [${a}, ${b}, 0, ${c}, ${d}] with divisor c = ${r}.`,
        `Bring down ${a}.`,
        `Multiply ${r} · ${a} = ${prod1}; Add: ${b} + ${prod1} = ${q1}.`,
        `Multiply ${r} · ${q1} = ${prod2}; Add: 0 + ${prod2} = ${q2}.`,
        `Multiply ${r} · ${q2} = ${prod3}; Add: ${c} + ${prod3} = ${q3}.`,
        `Multiply ${r} · ${q3} = ${prod4}; Add: ${d} + ${prod4} = ${rem} (Remainder).`,
        `Quotient is Q(x) = ${qStr}, Remainder R = ${rem}.`,
      ],
    };
  }

  if (id === '5-4') {
    // Factor by grouping with complex roots: x^3 - r*x^2 + k*x - r*k = 0
    const r = pick([3, 4, 5, 6], seed);
    const k = pick([5, 7, 11, 13], seed + 1);
    const rk = r * k;

    return {
      ...base,
      q: `Find all real and complex roots of the polynomial equation x³ - ${r}x² + ${k}x - ${rk} = 0.`,
      hint: `Factor by grouping: x²(x - ${r}) + ${k}(x - ${r}) = 0.`,
      answer: `x = ${r}, x = ±i√${k}`,
      kw: [`${r}`, `i√${k}`, `±i√${k}`, `i*sqrt(${k})`, `-i√${k}`],
      partial: (ans) => ans.includes(`${r}`) || ans.includes(`sqrt(${k})`) || ans.includes('i'),
      steps: [
        `Group terms: (x³ - ${r}x²) + (${k}x - ${rk}) = 0.`,
        `Factor out x² and ${k}: x²(x - ${r}) + ${k}(x - ${r}) = 0.`,
        `Factor out (x - ${r}): (x² + ${k})(x - ${r}) = 0.`,
        `First factor: x - ${r} = 0 ⟹ real root x = ${r}.`,
        `Second factor: x² + ${k} = 0 ⟹ x² = -${k} ⟹ x = ±i√${k}.`,
        `All solutions: x = ${r}, x = i√${k}, x = -i√${k}.`,
      ],
    };
  }

  if (id === '5-5') {
    // End behavior
    const deg = pick([3, 5, 7], seed);
    const coeff = pick([-5, -4, -3, 3, 4, 5], seed + 1);
    const isNeg = coeff < 0;

    return {
      ...base,
      q: `Determine the end behavior of the polynomial function g(x) = ${coeff}x^${deg} + 6x² - 3x + 8 as x ➔ ∞ and as x ➔ -∞ using the Leading Term Test.`,
      hint: `Leading term is ${coeff}x^${deg}. Degree n = ${deg} is odd; leading coefficient is ${coeff} (${isNeg ? 'negative' : 'positive'}).`,
      answer: isNeg
        ? 'As x ➔ ∞, g(x) ➔ -∞; As x ➔ -∞, g(x) ➔ ∞ (rises left, falls right)'
        : 'As x ➔ ∞, g(x) ➔ ∞; As x ➔ -∞, g(x) ➔ -∞ (falls left, rises right)',
      kw: isNeg
        ? ['x -> inf, g(x) -> -inf', '-inf and inf', 'rises left, falls right']
        : ['x -> inf, g(x) -> inf', 'inf and -inf', 'falls left, rises right'],
      partial: (ans) => ans.includes('inf'),
      steps: [
        `Identify leading term: ${coeff}x^${deg}.`,
        `Degree is n = ${deg} (odd), meaning end behaviors go in opposite directions.`,
        `Leading coefficient is ${coeff} (${isNeg ? 'negative' : 'positive'}).`,
        isNeg
          ? `As x ➔ ∞: (${coeff})(+∞)^${deg} = -∞ (falls right). As x ➔ -∞: (${coeff})(-∞)^${deg} = +∞ (rises left).`
          : `As x ➔ ∞: (${coeff})(+∞)^${deg} = +∞ (rises right). As x ➔ -∞: (${coeff})(-∞)^${deg} = -∞ (falls left).`,
      ],
    };
  }

  // -------------------------------------------------------------
  // MODULE 6 VARIANTS
  // -------------------------------------------------------------
  if (id === '6-1') {
    // Rational hole & vertical asymptote
    const a = pick([2, 3, 4], seed); // hole root = -a
    const numOther = pick([1, 3, 5], seed + 1);
    const c = pick([2, 3], seed + 2); // denom root = d/c
    const d = pick([1, 5], seed + 3);

    const holeX = -a;
    const vaX = `${d}/${c}`;
    const holeYNum = holeX - numOther;
    const holeYDen = c * holeX - d;
    const holeY = `${holeYNum}/${holeYDen}`;

    return {
      ...base,
      q: `Find the domain, the vertical asymptote(s), and the coordinates of any removable hole(s) for f(x) = (x² + ${a - numOther}x - ${a * numOther}) / (${c}x² + ${c * a - d}x - ${d * a}).`,
      hint: `Factor numerator and denominator. The factor (x + ${a}) cancels, creating a hole at x = -${a}.`,
      answer: `Hole at (${holeX}, ${holeY}); Vertical Asymptote: x = ${vaX}`,
      kw: [`x = ${vaX}`, `x=${vaX}`, `${holeX}`, `${holeY}`],
      partial: (ans) => ans.includes(`${holeX}`) || ans.includes(`${vaX}`),
      steps: [
        `Factor numerator: (x + ${a})(x - ${numOther}).`,
        `Factor denominator: (${c}x - ${d})(x + ${a}).`,
        `The factor (x + ${a}) cancels, giving simplified function f(x) = (x - ${numOther}) / (${c}x - ${d}) for x ≠ -${a}.`,
        `Hole occurs at x = ${holeX}. Y-coordinate: y = (${holeX} - ${numOther}) / (${c}(${holeX}) - ${d}) = ${holeY}.`,
        `Remaining denominator factor gives Vertical Asymptote: x = ${vaX}.`,
      ],
    };
  }

  if (id === '6-2') {
    // Slant asymptote
    const m = pick([2, 3, 4], seed);
    const bConst = pick([-2, -1, 1, 2], seed + 1);
    const bStr = bConst >= 0 ? `+ ${bConst}` : `- ${Math.abs(bConst)}`;

    return {
      ...base,
      q: `Find the equation of the slant (oblique) asymptote of R(x) = (${m}x³ + ${(m * 2 + bConst)}x² - 5) / (x² + 2x - 1).`,
      hint: `Perform polynomial long division: degree 3 divided by degree 2 gives a linear quotient y = mx + b.`,
      answer: `y = ${m}x ${bStr}`,
      kw: [`y = ${m}x ${bStr}`, `${m}x ${bStr}`, `${m}x${bStr.replace(/\s/g, '')}`],
      partial: (ans) => ans.includes(`${m}x`) || ans.includes('y='),
      steps: [
        `Set up polynomial long division of the numerator by x² + 2x - 1.`,
        `First term: (${m}x³) ÷ (x²) = ${m}x.`,
        `Next term after subtracting yields linear term quotient: ${bConst}.`,
        `Since the remainder degree is less than 2, as x ➔ ±∞ the remainder approaches 0.`,
        `Slant asymptote equation: y = ${m}x ${bStr}.`,
      ],
    };
  }

  if (id === '6-4') {
    // Inverse of rational function f(x) = (ax + b)/(cx + d)
    const a = pick([2, 3, 4, 5], seed);
    const b = pick([1, 2, 7], seed + 1);
    const c = pick([2, 3], seed + 2);
    const d = pick([1, 4, 5], seed + 3);

    return {
      ...base,
      q: `Find the formula for the inverse function f⁻¹(x) for f(x) = (${a}x + ${b}) / (${d} - ${c}x) and state its domain.`,
      hint: `Set y = f(x), swap x and y to get x = (${a}y + ${b}) / (${d} - ${c}y), multiply by denominator, and isolate y.`,
      answer: `f⁻¹(x) = (${d}x - ${b}) / (${c}x + ${a}), Domain: x ≠ -${a}/${c}`,
      kw: [`(${d}x - ${b}) / (${c}x + ${a})`, `${d}x`, `${c}x`, `-${a}/${c}`],
      partial: (ans) => ans.includes(`${d}x`) || ans.includes(`${c}x`),
      steps: [
        `Swap variables: x = (${a}y + ${b}) / (${d} - ${c}y).`,
        `Multiply across: x(${d} - ${c}y) = ${a}y + ${b}.`,
        `Expand: ${d}x - ${c}xy = ${a}y + ${b}.`,
        `Isolate y terms: ${d}x - ${b} = ${a}y + ${c}xy = y(${c}x + ${a}).`,
        `Divide: y = (${d}x - ${b}) / (${c}x + ${a}).`,
        `Inverse formula: f⁻¹(x) = (${d}x - ${b}) / (${c}x + ${a}), with restriction x ≠ -${a}/${c}.`,
      ],
    };
  }

  if (id === '6-5') {
    // Radical equation with extraneous root
    const b = pick([7, 11, 15, 19], seed);
    const c = pick([3, 4, 5, 6], seed + 1);
    // sqrt(2x + b) - x = c => 2x + b = (x + c)^2 = x^2 + 2cx + c^2 => x^2 + (2c-2)x + (c^2 - b) = 0
    return {
      ...base,
      q: `Solve the radical equation √(2x + ${b}) - x = ${c}. Clearly identify any extraneous roots.`,
      hint: `Isolate the radical √(2x + ${b}) = x + ${c}, square both sides, solve the quadratic, and check for extraneous roots.`,
      answer: `Isolate radical, square both sides, and verify roots in the original equation.`,
      kw: ['extraneous', 'x =', 'root'],
      partial: (ans) => ans.includes('extraneous') || ans.includes('x ='),
      steps: [
        `Isolate radical: √(2x + ${b}) = x + ${c}.`,
        `Square both sides: 2x + ${b} = (x + ${c})² = x² + ${2 * c}x + ${c * c}.`,
        `Set to 0: x² + ${2 * c - 2}x + ${c * c - b} = 0.`,
        `Solve the quadratic using factoring or quadratic formula.`,
        `Substitute each candidate root into the original equation to test for extraneous roots where the radical expression produces a false equality.`,
      ],
    };
  }

  // -------------------------------------------------------------
  // MODULE 7 VARIANTS: Transformations & Symmetry
  // -------------------------------------------------------------
  if (id === 'v2-7-1' || id === '7-1') {
    // Radical transformation: g(x) = -A*sqrt(H - x) + K
    const A = pick([2, 3, 4], seed);
    const H = pick([3, 4, 5, 6], seed + 1);
    const K = pick([1, 2, 3, 5], seed + 2);

    return {
      ...base,
      q: `Given the parent function f(x) = √x, describe all transformations required to obtain g(x) = -${A}√(${H} - x) + ${K}, and state its domain and range in interval notation.`,
      hint: `Factor inside as - (x - ${H}). Negative inside reflects across y-axis; shift right ${H}. Negative outside reflects across x-axis; stretch by ${A}; shift up ${K}.`,
      answer: `Reflect y-axis, shift right ${H}, reflect x-axis, vertical stretch by ${A}, shift up ${K}. Domain: (-∞, ${H}], Range: (-∞, ${K}]`,
      kw: [`right ${H}`, `up ${K}`, `stretch by ${A}`, `(-∞, ${H}]`, `(-inf, ${H}]`, `(-∞, ${K}]`, `(-inf, ${K}]`],
      partial: (ans) => ans.includes(`${H}`) || ans.includes(`${K}`) || ans.includes('stretch'),
      steps: [
        `Factor argument: ${H} - x = -(x - ${H}).`,
        `Horizontal transformations: Reflection across y-axis, then shift RIGHT ${H} units.`,
        `Vertical transformations: Reflection across x-axis, vertical stretch by factor of ${A}, shift UP ${K} units.`,
        `Domain: ${H} - x ≥ 0 ⟹ x ≤ ${H}, which is (-∞, ${H}].`,
        `Range: -${A}√(${H} - x) ≤ 0 ⟹ adding ${K} gives g(x) ≤ ${K}, which is (-∞, ${K}].`,
      ],
    };
  }

  if (id === 'v2-7-2' || id === '7-2') {
    // Point mapping: (x0, y0) on f(x) -> y = a*f(b*x - c) + d
    const x0 = pick([4, 6, 8, 10], seed);
    const y0 = pick([9, 12, 15, 18], seed + 1);
    const b = 2;
    const h = pick([2, 3, 4], seed + 2); // 2x - 2h
    const a = pick([2, 3, 4], seed + 3);
    const k = pick([3, 5, 7], seed + 4);

    // x' = x0/2 + h; y' = a*y0 + k
    const xPrime = x0 / b + h;
    const yPrime = a * y0 + k;

    return {
      ...base,
      q: `The point (${x0}, ${y0}) lies on the graph of y = f(x). Find the coordinates of the corresponding point on the graph of y = ${a} · f(${b}x - ${2 * h}) + ${k}.`,
      hint: `Rewrite argument as ${b}(x - ${h}). Coordinate mapping rule: x' = (x / ${b}) + ${h}, and y' = ${a}y + ${k}.`,
      answer: `(${xPrime}, ${yPrime})`,
      kw: [`(${xPrime}, ${yPrime})`, `(${xPrime},${yPrime})`, `${xPrime}, ${yPrime}`, `${xPrime},${yPrime}`],
      partial: (ans) => ans.includes(`${xPrime}`) || ans.includes(`${yPrime}`),
      steps: [
        `Factor inside argument: ${b}x - ${2 * h} = ${b}(x - ${h}), so b = ${b} and horizontal shift h = ${h}.`,
        `Horizontal coordinate mapping: x' = (${x0} / ${b}) + ${h} = ${x0 / b} + ${h} = ${xPrime}.`,
        `Vertical coordinate mapping: y' = ${a} · (${y0}) + ${k} = ${a * y0} + ${k} = ${yPrime}.`,
        `Transformed point: (${xPrime}, ${yPrime}).`,
      ],
    };
  }

  // -------------------------------------------------------------
  // MODULE 8 VARIANTS: Exponential Functions
  // -------------------------------------------------------------
  if (id === 'v2-8-4' || id === '8-4') {
    // Compound interest: A = P(1 + r/n)^(nt) vs Pe^(rt)
    const P = pick([4000, 5000, 6000, 8000, 10000], seed);
    const rPct = pick([4, 5, 6, 7], seed + 1);
    const r = rPct / 100;
    const t = pick([3, 5, 7, 10], seed + 2);
    const n = 4; // quarterly

    const A_comp = P * Math.pow(1 + r / n, n * t);
    const A_cont = P * Math.exp(r * t);

    return {
      ...base,
      q: `An investor deposits $${P.toLocaleString()} into an account earning ${rPct}% annual interest compounded quarterly. How much is in the account after ${t} years? Also calculate the amount if interest is compounded continuously. Round both to the nearest cent.`,
      hint: `Quarterly: A = P(1 + r/4)^(4t) with r = ${r}. Continuous: A = P · e^(rt).`,
      answer: `Quarterly: $${A_comp.toFixed(2)}, Continuous: $${A_cont.toFixed(2)}`,
      kw: [A_comp.toFixed(2), A_cont.toFixed(2), `$${A_comp.toFixed(2)}`, `$${A_cont.toFixed(2)}`],
      partial: (ans) => ans.includes(A_comp.toFixed(0)) || ans.includes(A_cont.toFixed(0)),
      steps: [
        `Identify parameters: P = $${P.toLocaleString()}, r = ${r}, t = ${t} years.`,
        `Quarterly compounding (n = 4): A = ${P}(1 + ${r}/4)^(4 · ${t}) = ${P}(${(1 + r / 4).toFixed(4)})^${4 * t} = $${A_comp.toFixed(2)}.`,
        `Continuous compounding: A = ${P} · e^(${r} · ${t}) = ${P} · e^${(r * t).toFixed(3)} = $${A_cont.toFixed(2)}.`,
        `Difference: Continuous compounding yields $${(A_cont - A_comp).toFixed(2)} more.`,
      ],
    };
  }

  if (id === 'v2-8-5' || id === '8-5') {
    // Radioactive decay half life
    const Q0 = pick([60, 80, 100, 120, 160], seed);
    const halfLife = pick([14, 20, 28, 30], seed + 1);
    const tElapsed = halfLife * 2;
    const Q_remain = Q0 / 4;

    return {
      ...base,
      q: `A radioactive isotope has a half-life of ${halfLife} days. If an initial sample contains ${Q0} grams, write the exponential decay model Q(t) and find the amount remaining after ${tElapsed} days.`,
      hint: `Model: Q(t) = Q₀ · (1/2)^(t / h). Since ${tElapsed} days is exactly 2 half-lives, the sample divides in half twice.`,
      answer: `Q(t) = ${Q0}(1/2)^(t/${halfLife}), Remaining after ${tElapsed} days = ${Q_remain} grams`,
      kw: [`${Q_remain}`, `${Q_remain} grams`, `${Q0}(1/2)`, `t/${halfLife}`],
      partial: (ans) => ans.includes(`${Q_remain}`) || ans.includes(`${halfLife}`),
      steps: [
        `Decay formula: Q(t) = Q₀(1/2)^(t / h) = ${Q0}(1/2)^(t / ${halfLife}).`,
        `After t = ${tElapsed} days: number of half-lives = ${tElapsed} / ${halfLife} = 2.`,
        `Remaining mass: Q(${tElapsed}) = ${Q0}(1/2)² = ${Q0} · (1/4) = ${Q_remain} grams.`,
      ],
    };
  }

  // -------------------------------------------------------------
  // MODULE 9 VARIANTS: Logarithmic Functions
  // -------------------------------------------------------------
  if (id === 'v2-9-1' || id === '9-1') {
    // Log expansion: log_b( (x^p * y^q) / z^r )
    const p = pick([2, 3, 4], seed);
    const q = pick([3, 5, 7], seed + 1);
    const r = pick([4, 6, 8], seed + 2);

    return {
      ...base,
      q: `Use the properties of logarithms to expand the expression log_b( (x^${p} · y^${q}) / z^${r} ) as a sum and/or difference of logarithms with no exponents.`,
      hint: `Product rule: log(A · B) = log A + log B. Quotient rule: log(A / B) = log A - log B. Power rule: log(A^k) = k · log A.`,
      answer: `${p} log_b(x) + ${q} log_b(y) - ${r} log_b(z)`,
      kw: [`${p} log_b(x) + ${q} log_b(y) - ${r} log_b(z)`, `${p}log`, `${q}log`, `${r}log`],
      partial: (ans) => ans.includes(`${p}`) && ans.includes(`${q}`) && ans.includes(`${r}`),
      steps: [
        `Apply Quotient Rule: log_b(x^${p} · y^${q}) - log_b(z^${r}).`,
        `Apply Product Rule on numerator: log_b(x^${p}) + log_b(y^${q}) - log_b(z^${r}).`,
        `Apply Power Rule bringing all exponents to the front: ${p} log_b(x) + ${q} log_b(y) - ${r} log_b(z).`,
      ],
    };
  }

  if (id === 'v2-9-2' || id === '9-2') {
    // Log equation with extraneous root: log_2(x + a) + log_2(x - b) = c
    const a = pick([1, 2, 3], seed);
    const b = pick([1, 2], seed + 1);
    // (x + a)(x - b) = 2^c
    const c = 3; // 2^3 = 8
    // x^2 + (a - b)x - (ab + 8) = 0
    return {
      ...base,
      q: `Solve the logarithmic equation: log₂(x + ${a}) + log₂(x - ${b}) = ${c}. Be sure to test for and reject any extraneous roots.`,
      hint: `Combine using product rule: log₂[(x + ${a})(x - ${b})] = ${c}. Convert to exponential form: (x + ${a})(x - ${b}) = 2^${c} = 8. Solve and check argument restrictions.`,
      answer: `Combine into log₂[(x + ${a})(x - ${b})] = 8, solve quadratic, and discard negative extraneous root.`,
      kw: ['extraneous', 'log', 'x ='],
      partial: (ans) => ans.includes('extraneous') || ans.includes('x ='),
      steps: [
        `Condense logs using product rule: log₂[(x + ${a})(x - ${b})] = ${c}.`,
        `Rewrite in exponential form: (x + ${a})(x - ${b}) = 2^${c} = 8.`,
        `Expand: x² + ${a - b}x - ${a * b} = 8 ⟹ x² + ${a - b}x - ${a * b + 8} = 0.`,
        `Solve the quadratic for candidate roots.`,
        `Check domain: arguments (x + ${a}) > 0 and (x - ${b}) > 0. Discard any solution that makes an argument zero or negative as EXTRANEOUS.`,
      ],
    };
  }

  // Generic fallback variant generator: adjusts numerical values gracefully while preserving structure
  const delta = randInt(1, 4, seed);
  return {
    ...base,
    id: `${base.id}-var-${variantNum}`,
    q: `${base.q} [Variant #${variantNum}: Re-test your technique with fresh numbers!]`,
    hint: `${base.hint} (Apply the exact same formula structure with the active numbers above.)`,
  };
}
