import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, PhoneCall } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { startCall } from "@/lib/training.functions";
import {
  CANCEL_REASONS,
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  PERSONALITIES,
  PERSONALITY_LABELS,
  REASON_LABELS,
  type CancelReason,
  type Difficulty,
  type Personality,
} from "@/lib/scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CallSearch = { quick: boolean };
const ANY = "any";

export const Route = createFileRoute("/call/new")({
  validateSearch: (search: Record<string, unknown>): CallSearch => ({
    quick: search["quick"] !== false && search["quick"] !== "false",
  }),
  head: () => ({
    meta: [
      { title: "Start a call — SaveLine" },
      {
        name: "description",
        content:
          "Pick a cancellation reason, difficulty, and customer personality, then take the call live.",
      },
      { property: "og:title", content: "Start a call — SaveLine" },
      {
        property: "og:description",
        content: "Pick a cancellation scenario and take the retention call live.",
      },
    ],
  }),
  component: NewCall,
});

function NewCall() {
  const navigate = useNavigate();
  const { quick } = Route.useSearch();
  const { user, loading } = useAuth();
  const begin = useServerFn(startCall);

  const [reason, setReason] = useState<string>(ANY);
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [personality, setPersonality] = useState<string>(ANY);
  const [dialing, setDialing] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  async function dial() {
    setDialing(true);
    try {
      const session = await begin({
        data: {
          reason: quick || reason === ANY ? null : (reason as CancelReason),
          difficulty: quick ? "hard" : difficulty,
          personality: quick || personality === ANY ? null : (personality as Personality),
        },
      });
      void navigate({ to: "/call/$sessionId", params: { sessionId: session.sessionId } });
    } catch (error) {
      setDialing(false);
      toast.error(error instanceof Error ? error.message : "Could not connect the call.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{quick ? "Next call in the queue" : "Build the scenario"}</CardTitle>
            <CardDescription>
              {quick
                ? "The caller, their reason, and their hidden motive are picked for you. You find out when they start talking."
                : "Set what you want to drill. The real motive stays hidden either way."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!quick && (
              <>
                <Field label="Cancellation reason">
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Surprise me</SelectItem>
                      {CANCEL_REASONS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {REASON_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Difficulty">
                  <Select
                    value={difficulty}
                    onValueChange={(value) => setDifficulty(value as Difficulty)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {DIFFICULTY_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Customer personality">
                  <Select value={personality} onValueChange={setPersonality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Surprise me</SelectItem>
                      {PERSONALITIES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {PERSONALITY_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            <div className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
              Headphones on. The call uses your microphone — speak naturally and pause when you want
              the customer to answer. You can also type if you'd rather.
            </div>

            <Button className="w-full" onClick={dial} disabled={dialing}>
              <PhoneCall className="mr-2 h-4 w-4" />
              {dialing ? "Connecting..." : "Take the call"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
