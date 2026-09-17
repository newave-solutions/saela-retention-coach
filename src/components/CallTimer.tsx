import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

// ⚡ Bolt Optimization:
// Abstracting the timer state and setInterval logic into a separate component
// prevents the parent LiveCall/LiveServiceCall components (which are large and complex)
// from unnecessarily re-rendering every single second.
export function CallTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <Badge variant="outline" className="border-white/30 bg-white/10 font-mono text-inherit">
      {mmss}
    </Badge>
  );
}
