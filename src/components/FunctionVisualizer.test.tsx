import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FunctionVisualizer } from './FunctionVisualizer';

describe('FunctionVisualizer', () => {
  it('renders default parabola_shift correctly', () => {
    render(<FunctionVisualizer />);

    // Default title
    expect(screen.getByText('Graph Preview')).toBeInTheDocument();

    // Labels for parabola_shift
    expect(screen.getByText('f(x) = x²')).toBeInTheDocument();
    expect(screen.getByText('g(x) = x² - 5')).toBeInTheDocument();
  });

  it('renders with custom title and color', () => {
    render(<FunctionVisualizer title="My Custom Graph" color="#ff0000" />);

    expect(screen.getByText('My Custom Graph')).toBeInTheDocument();

    // Find color element (using style check on the circle badge)
    // The colored dot is just before the title, and the lines for labels
    const coloredDot = screen.getByText('My Custom Graph').querySelector('span.rounded-full');
    expect(coloredDot).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
  });

  it('renders exp_growth correctly', () => {
    render(<FunctionVisualizer type="exp_growth" />);

    expect(screen.getByText('f(x) = 2^x')).toBeInTheDocument();
    expect(screen.getByText('g(x) = 2^(x-1) - 4')).toBeInTheDocument();
    expect(screen.getByText('HA: y = -4')).toBeInTheDocument();
  });

  it('renders exp_decay correctly', () => {
    render(<FunctionVisualizer type="exp_decay" />);

    expect(screen.getByText('Decay Curve')).toBeInTheDocument();
    expect(screen.getByText('HA: y = 0')).toBeInTheDocument();
  });

  it('renders log_curve correctly', () => {
    render(<FunctionVisualizer type="log_curve" />);

    expect(screen.getByText('g(x) = log₂(x - 3) + 1')).toBeInTheDocument();
    expect(screen.getByText('VA: x = 3')).toBeInTheDocument();
  });

  it('renders cubic_symm correctly', () => {
    render(<FunctionVisualizer type="cubic_symm" />);

    expect(screen.getByText('Odd 180° Rotational Symmetry')).toBeInTheDocument();

    // Has no asymptotes
    expect(screen.queryByText(/VA:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/HA:/)).not.toBeInTheDocument();
  });

  it('renders rational_curve correctly', () => {
    render(<FunctionVisualizer type="rational_curve" />);

    expect(screen.getByText('f(x) = (2x + 1)/(x - 2)')).toBeInTheDocument();
    expect(screen.getByText('VA: x = 2')).toBeInTheDocument();
  });
});
