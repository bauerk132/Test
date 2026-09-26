## 2024-05-15 - [Initial Discovery]
**Learning:** Found an App with a timer state that updates every second and child components (PracticeCard, GuidedCard) that do not use memoization, likely causing massive re-renders. We should use `useMemo`, `useCallback`, and `React.memo` to optimize this. Also, the project is missing tests!
**Action:** Implement memoization and avoid modifying package.json. Run typescript checks (`bun run lint`).
## 2024-05-15 - [React Top-Level Timer Anti-Pattern]
**Learning:** Found a severe performance bottleneck where a global `seconds` timer updating every 1000ms in the top-level `App.tsx` component triggered cascading re-renders across all deeply nested child components (PracticeCard, GuidedCard) and forced expensive array mapping computations (`selectedMods.flatMap`) every second.
**Action:** Always verify if a top-level timer state is causing unnecessary re-renders. Use `React.memo` on heavy child components, stabilize event handlers with `useCallback`, and wrap expensive derived data calculations in `useMemo` to isolate the fast-changing state updates from the rest of the render tree.
## 2024-05-15 - [O(1) Map for Lookups]
**Learning:** Found a performance bottleneck where `findProblem` used an O(N) array search inside a loop repeatedly to look up problems by ID. Converting an array to a Map for O(1) lookups significantly improves performance, dropping lookup times from ~1000ms to ~150ms for 100k operations.
**Action:** Always consider converting arrays of objects into maps (using the unique ID as key) for faster lookups when finding elements, particularly if the lookups happen often. Avoid iterating arrays if direct access is possible. Ensure correct typing when extracting properties from the mapped elements.
