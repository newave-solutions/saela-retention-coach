import { useSyncExternalStore } from "react";

// ⚡ Bolt Optimization:
// This tiny leaf component uses useSyncExternalStore to subscribe to fast-updating
// speech recognition text directly. This prevents the large parent route components
// from re-rendering 60 times per second during dictation.
export function InterimText({
  subscribe,
  getSnapshot,
  fallback,
}: {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
  fallback: string;
}) {
  const text = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return <>{text || fallback}</>;
}
