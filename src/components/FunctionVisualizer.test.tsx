import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { render, cleanup } from '@testing-library/react';
import React from 'react';
import { FunctionVisualizer } from './FunctionVisualizer';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

beforeAll(() => {
  GlobalRegistrator.register();
});

afterAll(() => {
  GlobalRegistrator.unregister();
});

afterEach(() => {
  cleanup();
});

describe('FunctionVisualizer', () => {
  it('renders default parabola_shift type correctly', () => {
    const { container, getByText } = render(<FunctionVisualizer />);

    // Check if SVG is rendered
    expect(container.querySelector('svg')).not.toBeNull();

    // Check default title
    expect(getByText('Graph Preview')).not.toBeNull();

    // Check default labels for parabola_shift
    expect(getByText('f(x) = x²')).not.toBeNull();
    expect(getByText('g(x) = x² - 5')).not.toBeNull();
  });

  it('renders with custom title and color', () => {
    const { container, getByText } = render(
      <FunctionVisualizer title="My Custom Title" color="#ff0000" />
    );

    // Check custom title
    expect(getByText('My Custom Title')).not.toBeNull();

    // The colored dot in the title uses the background color
    const dotSpan = container.querySelector('.rounded-full') as HTMLElement;
    expect(dotSpan).not.toBeNull();
    expect(dotSpan.style.backgroundColor).toBe('#ff0000');

    // The line indicating transformed label color
    const lineSpans = container.querySelectorAll('.bg-slate-500, .h-0\\.5');
    // We can also check that a path has the custom color stroke
    const pathWithCustomStroke = container.querySelector('path[stroke="#ff0000"]');
    expect(pathWithCustomStroke).not.toBeNull();
  });

  it('renders exp_growth type correctly with asymptotes', () => {
    const { getByText } = render(<FunctionVisualizer type="exp_growth" />);

    expect(getByText('f(x) = 2^x')).not.toBeNull();
    expect(getByText('g(x) = 2^(x-1) - 4')).not.toBeNull();
    expect(getByText('HA: y = -4')).not.toBeNull();
  });

  it('renders exp_decay type correctly with asymptotes', () => {
    const { getByText, queryByText } = render(<FunctionVisualizer type="exp_decay" />);

    expect(queryByText('Q(t) = Q₀(1/2)^t')).toBeNull(); // No parent path for exp_decay
    expect(getByText('Decay Curve')).not.toBeNull();
    expect(getByText('HA: y = 0')).not.toBeNull();
  });

  it('renders log_curve type correctly with asymptotes', () => {
    const { getByText, queryByText } = render(<FunctionVisualizer type="log_curve" />);

    expect(queryByText('f(x) = log₂(x)')).toBeNull(); // No parent path for log_curve
    expect(getByText('g(x) = log₂(x - 3) + 1')).not.toBeNull();
    expect(getByText('VA: x = 3')).not.toBeNull();
  });

  it('renders cubic_symm type correctly', () => {
    const { getByText, queryByText } = render(<FunctionVisualizer type="cubic_symm" />);

    expect(queryByText('f(x) = x³ - 4x')).toBeNull(); // No parent path for cubic_symm
    expect(getByText('Odd 180° Rotational Symmetry')).not.toBeNull();
  });

  it('renders rational_curve type correctly with asymptotes', () => {
    const { getByText, queryByText } = render(<FunctionVisualizer type="rational_curve" />);

    expect(queryByText('Vertical Asymptote x = 2')).toBeNull(); // No parent path for rational_curve
    expect(getByText('f(x) = (2x + 1)/(x - 2)')).not.toBeNull();
    expect(getByText('VA: x = 2')).not.toBeNull();
  });
});
