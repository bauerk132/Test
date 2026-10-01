## 2024-05-15 - [Initial Discovery]
**Learning:** Found an App with a timer state that updates every second and child components (PracticeCard, GuidedCard) that do not use memoization, likely causing massive re-renders. We should use `useMemo`, `useCallback`, and `React.memo` to optimize this. Also, the project is missing tests!
**Action:** Implement memoization and avoid modifying package.json. Run typescript checks (`bun run lint`).
## 2024-05-15 - [React Top-Level Timer Anti-Pattern]
**Learning:** Found a severe performance bottleneck where a global `seconds` timer updating every 1000ms in the top-level `App.tsx` component triggered cascading re-renders across all deeply nested child components (PracticeCard, GuidedCard) and forced expensive array mapping computations (`selectedMods.flatMap`) every second.
**Action:** Always verify if a top-level timer state is causing unnecessary re-renders. Use `React.memo` on heavy child components, stabilize event handlers with `useCallback`, and wrap expensive derived data calculations in `useMemo` to isolate the fast-changing state updates from the rest of the render tree.
## 2024-09-26 - Optimized Guided Example Lookup
**Learning:** O(N) array traversals inside callback functions like `handleCheckStep` and `handleNextStep` (which can be called frequently) can be heavily optimized by precomputing a flat map for O(1) lookups.
**Action:** When working with nested structured static data (like dictionaries grouped by module ID), flatten it into a module-scoped `Map` if frequent O(1) retrieval by ID is needed. Ensure `import` statements stay at the top of the file before any logic.
## 2024-09-26 - [Inline Object Fallback Memoization Leak]
**Learning:** Supplying a default inline object fallback (e.g., `progress={guidedState[id] || { currentStep: 0, stepResults: [], complete: false }}`) as a prop dynamically generates a new object reference on every render. If the parent component renders frequently (like on every 1000ms timer tick), it actively defeats any `React.memo` wrappers on child components, creating a cascading memoization leak.
**Action:** Extract default object fallbacks into immutable module-level constants (e.g., `const DEFAULT_PROGRESS = {...}`) to maintain stable object references across frequent renders, preserving the efficiency of `React.memo`.
