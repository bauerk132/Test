## 2024-03-24 - Initial Recon
**Learning:** Found an existing `// ⚡ Bolt` comment in `PracticeCard.tsx` demonstrating use of `useCallback` for keypad handlers. Also found `// ⚡ Bolt` in `FunctionVisualizer.tsx`, `MathKeypad.tsx`, and `ModuleSelector.tsx`.
**Action:** Need to find 3 *new* performance optimizations that haven't been applied yet.

## $(date +%Y-%m-%d) - App Timer Cascade Leaks
**Learning:** In a top-level component like `App.tsx` that updates state frequently (like a timer ticking every second), ANY child component receiving inline object fallbacks (`prop={state || { default: true }}`) or inline functions will be forced to re-render, even if they are wrapped in `React.memo`. This is a classic memoization leak.
**Action:** Extract inline object fallbacks to module-level constants. Stabilize callbacks passed to deeply nested or heavy child components using `useCallback` to preserve `React.memo` boundaries during frequent parent state updates.
