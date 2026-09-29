import { expect, test, describe, mock, afterEach, beforeEach } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MathKeypad } from './MathKeypad';

describe('MathKeypad', () => {
  let defaultProps: any;

  beforeEach(() => {
    defaultProps = {
      onInsert: mock(),
      onClear: mock(),
      onBackspace: mock(),
    };
  });

  afterEach(() => {
    cleanup();
  });

  test('renders quick keys by default', () => {
    render(<MathKeypad {...defaultProps} />);
    expect(screen.getByText('Math Keys')).toBeTruthy();
  });

  test('returns null when disabled', () => {
    const { container } = render(<MathKeypad {...defaultProps} disabled={true} />);
    expect(container.firstChild).toBeNull();
  });

  test('calls onInsert when a quick key is clicked', () => {
    render(<MathKeypad {...defaultProps} />);
    const squareBtn = screen.getByText('x²');
    fireEvent.click(squareBtn);
    expect(defaultProps.onInsert).toHaveBeenCalledWith('^2');
  });

  test('calls onBackspace when backspace button is clicked', () => {
    render(<MathKeypad {...defaultProps} />);
    const backspaceBtn = screen.getByTitle('Backspace');
    fireEvent.click(backspaceBtn);
    expect(defaultProps.onBackspace).toHaveBeenCalled();
  });

  test('calls onClear when clear button is clicked', () => {
    render(<MathKeypad {...defaultProps} />);
    const clearBtn = screen.getByTitle('Clear Input');
    fireEvent.click(clearBtn);
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  test('toggles expanded keypad when sparkle button is clicked', () => {
    render(<MathKeypad {...defaultProps} />);
    const toggleBtn = screen.getByText('Full Keypad');

    // Initial state: not expanded
    const dockQuery = screen.queryByText('Symbol Insertion Dock');
    expect(dockQuery).toBeNull();

    // Click to expand
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Symbol Insertion Dock')).toBeTruthy();
    expect(screen.getByText('Close Pad')).toBeTruthy();

    // Click to collapse
    fireEvent.click(screen.getByText('Close Pad'));
    expect(screen.queryByText('Symbol Insertion Dock')).toBeNull();
  });

  test('filters keypad groups when tabs are clicked', () => {
    render(<MathKeypad {...defaultProps} defaultOpen={true} />);

    // Helper to find tab buttons specifically since text is also in group labels
    const getTabButton = (text: string) => screen.getByRole('button', { name: text });

    // Default 'all' tab shows all groups
    expect(screen.getByText('Powers & Roots')).toBeTruthy();
    expect(screen.getByText('Operations & Relations')).toBeTruthy();
    expect(screen.getByText('Functions & Logs')).toBeTruthy();

    // Intervals & Sets is both a tab and a group, look specifically for group label
    const intervalGroups = screen.getAllByText('Intervals & Sets');
    expect(intervalGroups.length).toBeGreaterThan(1);

    // Click 'powers' tab
    fireEvent.click(getTabButton('Powers & Ops'));
    expect(screen.getByText('Powers & Roots')).toBeTruthy();
    expect(screen.getByText('Operations & Relations')).toBeTruthy();
    expect(screen.queryByText('Functions & Logs')).toBeNull();
    // Only tab button should remain for Intervals & Sets
    expect(screen.getAllByText('Intervals & Sets').length).toBe(1);

    // Click 'transcendental' tab
    fireEvent.click(getTabButton('Logs & Exponentials'));
    expect(screen.queryByText('Powers & Roots')).toBeNull();
    expect(screen.queryByText('Operations & Relations')).toBeNull();
    expect(screen.getByText('Functions & Logs')).toBeTruthy();
    expect(screen.getAllByText('Intervals & Sets').length).toBe(1);

    // Click 'intervals' tab
    fireEvent.click(getTabButton('Intervals & Sets'));
    expect(screen.queryByText('Powers & Roots')).toBeNull();
    expect(screen.queryByText('Operations & Relations')).toBeNull();
    expect(screen.queryByText('Functions & Logs')).toBeNull();
    // Both tab and group should exist
    expect(screen.getAllByText('Intervals & Sets').length).toBeGreaterThan(1);
  });

  test('calls onInsert with correct values from expanded keypad', () => {
    render(<MathKeypad {...defaultProps} defaultOpen={true} />);

    // Test a button from the expanded keypad
    const infBtn = screen.getAllByText('∞').find(btn => btn.getAttribute('title') === 'Infinity');
    if (infBtn) {
      fireEvent.click(infBtn);
      expect(defaultProps.onInsert).toHaveBeenCalledWith('inf');
    }

    const logBtn = screen.getAllByText('log()').find(btn => btn.getAttribute('title') === 'Base-10 log');
    if (logBtn) {
        fireEvent.click(logBtn);
        expect(defaultProps.onInsert).toHaveBeenCalledWith('log(');
    }
  });

  test('can dismiss the format guide', () => {
    render(<MathKeypad {...defaultProps} defaultOpen={true} />);

    // Guide is present
    expect(screen.getByText('Format Guide:')).toBeTruthy();

    // Click dismiss
    fireEvent.click(screen.getByText('Dismiss'));

    // Entire keypad is dismissed (isOpen set to false)
    expect(screen.queryByText('Format Guide:')).toBeNull();
  });
});
