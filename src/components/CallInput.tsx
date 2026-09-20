import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

// ⚡ Bolt Optimization:
// Abstracting the typed state into a separate component prevents the parent
// LiveCall/LiveServiceCall components (which contain complex state and maps)
// from re-rendering on every single keystroke.
export function CallInput({
  onSend,
  disabled,
  thinking,
  busyRef,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  thinking: boolean;
  busyRef: React.MutableRefObject<boolean>;
}) {
  const [typed, setTyped] = useState("");

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const text = typed.trim();
        if (!text || busyRef.current) return;
        setTyped("");
        onSend(text);
      }}
    >
      <Input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Or type what you'd say..."
        disabled={disabled}
      />
      <Button
        type="submit"
        aria-label="Send message"
        disabled={!typed.trim() || thinking || disabled}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
