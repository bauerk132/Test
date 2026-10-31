## 2024-05-15 - [Initial Discovery]
**Learning:** Found an App with a timer state that updates every second and child components (PracticeCard, GuidedCard) that do not use memoization, likely causing massive re-renders. We should use `useMemo`, `useCallback`, and `React.memo` to optimize this. Also, the project is missing tests!
**Action:** Implement memoization and avoid modifying package.json. Run typescript checks (`bun run lint`).
## 2024-05-15 - [React Top-Level Timer Anti-Pattern]
**Learning:** Found a severe performance bottleneck where a global `seconds` timer updating every 1000ms in the top-level `App.tsx` component triggered cascading re-renders across all deeply nested child components (PracticeCard, GuidedCard) and forced expensive array mapping computations (`selectedMods.flatMap`) every second.
**Action:** Always verify if a top-level timer state is causing unnecessary re-renders. Use `React.memo` on heavy child components, stabilize event handlers with `useCallback`, and wrap expensive derived data calculations in `useMemo` to isolate the fast-changing state updates from the rest of the render tree.
## 2024-09-26 - Optimized Guided Example Lookup
**Learning:** O(N) array traversals inside callback functions like `handleCheckStep` and `handleNextStep` (which can be called frequently) can be heavily optimized by precomputing a flat map for O(1) lookups.
**Action:** When working with nested structured static data (like dictionaries grouped by module ID), flatten it into a module-scoped `Map` if frequent O(1) retrieval by ID is needed. Ensure `import` statements stay at the top of the file before any logic.

## 2026-10-04 - [Extracting Static Constants & Component Memoization]
**Learning:** Constants, lookup objects, and mathematical parameters defined inside functional components are recreated on every render tick. In , recalculating coordinates for hundreds of points in the render body blocked the thread during slider adjustments.
**Action:** Move static data out of the component scope to avoid unnecessary memory allocations. Wrap heavy computations inside , taking care to exclude outside constants from dependency arrays to avoid linting errors.

## 2026-10-04 - [Extracting Static Constants & Component Memoization]
**Learning:** Constants, lookup objects, and mathematical parameters defined inside functional components are recreated on every render tick. In InteractiveSandboxModal, recalculating coordinates for hundreds of points in the render body blocked the thread during slider adjustments.
**Action:** Move static data out of the component scope to avoid unnecessary memory allocations. Wrap heavy computations inside useMemo, taking care to exclude outside constants from dependency arrays to avoid linting errors.
## 2024-10-25 - [Optimize Component Memory and Re-renders]
**Learning:** Found several performance bottlenecks where `MathKeypad` recreated large configuration arrays (`keyGroups`, `quickKeys`) on every render, and `PracticeCard` passed unstable callbacks causing `MathKeypad` to re-render. Additionally, `FunctionVisualizer` was recalculating heavy coordinate paths on each render.
**Action:** Extract large static configuration arrays (`keyGroups`, `quickKeys`) and coordinate variables out of functional components. Wrap child components like `MathKeypad` and `FunctionVisualizer` in `React.memo`, wrap their callbacks in `useCallback` from the parent (`PracticeCard`), and use `useMemo` for heavy string/math path generation. Always add code comments to document optimizations (`// ⚡ Bolt: ...`).

## 2024-11-20 - [Memoization Leaks via Inline Fallbacks & Callbacks]
**Learning:** Found that inline object fallbacks in component props (e.g., `progress={guidedState[id] || { currentStep: 0, ... }}`) destroy `React.memo` performance by allocating a new object reference every render. Additionally, inline state dependency in functions like `onAnswerChange(id, (answer || '') + symbol)` forced callbacks to recreate every keystroke, cascading re-renders down to child components. And top level UI components (`Header`, `ModuleSelector`) weren't memoized so they re-rendered every second due to a timer.
**Action:** Always extract inline fallback objects into static module-level constants. Refactor state callbacks to use functional updaters `(prev => ...)` instead of capturing state variables in closures, allowing their dependency arrays to be empty. Finally, wrap pure presentational components in `React.memo` and stabilize their callback props with `useCallback` when rendered alongside fast-updating state (like a timer).
