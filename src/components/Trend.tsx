import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export function Trend({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  if (value > 0)
    return (
      <span className="inline-flex items-center text-xs font-medium text-success">
        <ArrowUp className="h-3 w-3" />+{value}
      </span>
    );
  if (value < 0)
    return (
      <span className="inline-flex items-center text-xs font-medium text-destructive">
        <ArrowDown className="h-3 w-3" />
        {value}
      </span>
    );
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground">
      <Minus className="h-3 w-3" />0
    </span>
  );
}

