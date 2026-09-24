## 2024-05-24 - React Component Re-render Bottleneck

**Learning:** Found an anti-pattern in `LiveCall` and `LiveServiceCall` where a global `setInterval` updated a local `seconds` state every 1000ms. Because these components are massive and manage the entire chat/audio interface, this single timer caused the entire complex component tree to re-render every second unnecessarily.
**Action:** Always inspect large route components for small, frequently-updating state (like timers or loading bars). Extract this fast-updating state into small, isolated leaf components (like `CallTimer`) so only that tiny component re-renders.

## 2026-09-21 - Abstract Input State

**Learning:** Complex route components (e.g., LiveCall, LiveServiceCall) are highly sensitive to re-renders from fast-updating local state like text inputs. Updating state on every keystroke in these large components causes performance bottlenecks.
**Action:** Always extract fast-updating local state (timers, inputs) into isolated leaf components to maintain rendering performance in large route components.

## 2024-05-24 - High-Frequency Re-render from requestAnimationFrame

**Learning:** The `useSpeechRecognition` hook updated an `interim` state variable inside a `requestAnimationFrame` callback. Returning this state from the hook caused massive complex route components to re-render 60 times per second during speech.
**Action:** For extremely fast-updating UI (like 60fps animations or live transcription), bypass React's standard parent-down rendering. Use an external store (like `useSyncExternalStore` or a ref-based subscription) and isolate the text into a tiny leaf component (`InterimText`) that subscribes directly to the store.
