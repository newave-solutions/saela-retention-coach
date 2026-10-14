import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ⚡ Bolt Optimization:
// Abstracting the text input state (`typed`) into a separate leaf component
// prevents the parent LiveCall/LiveServiceCall components (which are large and complex,
// handling WebRTC, speech recognition, and complex re-renders themselves)
// from unnecessarily re-rendering on every single keystroke.

interface CallInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  busy?: boolean;
}

export function CallInput({ onSend, disabled = false, busy = false }: CallInputProps) {
  const [typed, setTyped] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text || busy) return;
    setTyped("");
    onSend(text);
  };

  return (
    <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
      <Input
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder="Or type what you'd say..."
        disabled={disabled}
      />
      <Button type="submit" aria-label="Send message" disabled={!typed.trim() || busy || disabled}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
