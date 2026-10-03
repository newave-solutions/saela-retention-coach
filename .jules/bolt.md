## $(date +%Y-%m-%d) - Optimizing Transcript Mapping
**Learning:** In complex route components sensitive to unrelated state changes (e.g., microphone toggles or audio playback statuses), rendering lists inline without memoization causes severe re-render cascades.
**Action:** Always extract list items in fast-updating UI components into isolated components wrapped in `React.memo` to prevent costly Virtual DOM tree diffing.
