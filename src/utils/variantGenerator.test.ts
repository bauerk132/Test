import { describe, it, expect } from 'bun:test';
import { generateProblemVariant } from './variantGenerator';
import { PracticeProblem } from '../types';

describe('generateProblemVariant', () => {
  const baseProblem: PracticeProblem = {
    id: 'unknown-id',
    mod: 5,
    q: 'Base question',
    hint: 'Base hint',
    ms: 'ms-1',
    diff: 'easy',
    answer: 'Base answer',
    kw: ['base'],
    steps: ['Step 1'],
  };

  it('should be deterministic for a given base and variantNum', () => {
    const variant1 = generateProblemVariant(baseProblem, 1);
    const variant2 = generateProblemVariant(baseProblem, 1);

    expect(variant1).toEqual(variant2);
  });

  it('should generate a different variant for a different variantNum', () => {
    const variant1 = generateProblemVariant(baseProblem, 1);
    const variant2 = generateProblemVariant(baseProblem, 2);

    expect(variant1).not.toEqual(variant2);
  });

  it('should use the fallback generator for an unknown ID', () => {
    const variant = generateProblemVariant(baseProblem, 1);

    expect(variant.id).toBe('unknown-id-var-1');
    expect(variant.q).toContain('[Variant #1: Re-test your technique with fresh numbers!]');
    expect(variant.hint).toContain('(Apply the exact same formula structure with the active numbers above.)');
  });

  it('should handle specific module variants (e.g., id: 5-1)', () => {
    const mod5Problem: PracticeProblem = {
      ...baseProblem,
      id: '5-1',
    };

    const variant = generateProblemVariant(mod5Problem, 1);

    expect(variant.q).toContain('A manufacturing firm models its daily profit');
    expect(variant.answer).toContain('Maximum profit');
    expect(variant.steps.length).toBeGreaterThan(0);
  });

  it('should handle specific module variants (e.g., id: v2-7-1)', () => {
    const mod7Problem: PracticeProblem = {
      ...baseProblem,
      id: 'v2-7-1',
    };

    const variant = generateProblemVariant(mod7Problem, 1);

    expect(variant.q).toContain('Given the parent function f(x) = √x, describe all transformations');
    expect(variant.answer).toContain('Domain:');
    expect(variant.answer).toContain('Range:');
    expect(variant.steps.length).toBeGreaterThan(0);
  });
});
