## 2024-05-24 - React Component Re-render Bottleneck

**Learning:** Found an anti-pattern in `LiveCall` and `LiveServiceCall` where a global `setInterval` updated a local `seconds` state every 1000ms. Because these components are massive and manage the entire chat/audio interface, this single timer caused the entire complex component tree to re-render every second unnecessarily.
**Action:** Always inspect large route components for small, frequently-updating state (like timers or loading bars). Extract this fast-updating state into small, isolated leaf components (like `CallTimer`) so only that tiny component re-renders.
## 2026-09-20 - React Component Re-render Bottleneck (Inputs)
**Learning:** Just like with timers, having text input state (`typed`) update on every keystroke at the root level of a complex component like `LiveCall` or `LiveServiceCall` forces the entire large tree to re-render. This introduces latency during fast typing.
**Action:** Always extract frequently-updating user input state into small, isolated leaf components (like `CallInput`) to constrain re-renders to only the input UI.
