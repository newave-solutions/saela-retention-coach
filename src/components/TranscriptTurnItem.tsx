import { memo } from "react";
import type { TranscriptTurn } from "@/lib/scenarios";

// ⚡ Bolt Optimization:
// Complex route components (e.g., LiveCall, LiveServiceCall) are highly sensitive to re-renders.
// Extracting individual list items into isolated child components wrapped in `React.memo`
// genuinely prevents expensive re-renders during fast-updating local state (like timers or text inputs).

interface TranscriptTurnItemProps {
  turn: TranscriptTurn;
  customerName: string;
}

export const TranscriptTurnItem = memo(function TranscriptTurnItem({
  turn,
  customerName,
}: TranscriptTurnItemProps) {
  return (
    <div className={turn.speaker === "agent" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          turn.speaker === "agent"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground"
        }`}
      >
        <p className="mb-0.5 text-[10px] uppercase tracking-widest opacity-70">
          {turn.speaker === "agent" ? "You" : customerName}
        </p>
        {turn.text}
      </div>
    </div>
  );
});
