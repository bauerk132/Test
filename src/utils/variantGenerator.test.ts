import { describe, it, expect } from 'bun:test';
import { generateProblemVariant } from './variantGenerator';
import { PracticeProblem } from '../types';

describe('generateProblemVariant', () => {
  it('should generate identical variants for the same base problem and variantNum', () => {
    const baseProblem: PracticeProblem = {
      id: '5-1',
      mod: 5,
      q: 'Base question',
      hint: 'Base hint',
      ms: 'ms-1',
      diff: 'medium',
      answer: 'Base answer',
      kw: ['base'],
      steps: ['step 1']
    };

    const variant1 = generateProblemVariant(baseProblem, 1);
    const variant2 = generateProblemVariant(baseProblem, 1);

    expect(variant1.q).toBe(variant2.q);
    expect(variant1.hint).toBe(variant2.hint);
    expect(variant1.answer).toBe(variant2.answer);
    expect(variant1.kw).toEqual(variant2.kw);
    expect(variant1.steps).toEqual(variant2.steps);
  });

  it('should generate different variants for different variantNums', () => {
    const baseProblem: PracticeProblem = {
      id: '5-1',
      mod: 5,
      q: 'Base question',
      hint: 'Base hint',
      ms: 'ms-1',
      diff: 'medium',
      answer: 'Base answer',
      kw: ['base'],
      steps: ['step 1']
    };

    const variant1 = generateProblemVariant(baseProblem, 1);
    const variant2 = generateProblemVariant(baseProblem, 2);

    expect(variant1.q).not.toBe(variant2.q);
  });

  it('should handle fallback generic variants for unknown ids', () => {
    const baseProblem: PracticeProblem = {
      id: 'unknown-id',
      mod: 5,
      q: 'Base question',
      hint: 'Base hint',
      ms: 'ms-1',
      diff: 'medium',
      answer: 'Base answer',
      kw: ['base'],
      steps: ['step 1']
    };

    const variant = generateProblemVariant(baseProblem, 1);

    expect(variant.id).toBe('unknown-id-var-1');
    expect(variant.q).toContain('Base question');
    expect(variant.q).toContain('[Variant #1: Re-test your technique with fresh numbers!]');
  });
});
