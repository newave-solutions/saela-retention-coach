import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, PhoneCall } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { usePosition } from "@/hooks/usePosition";
import { startServiceCall } from "@/lib/service-training.functions";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  PERSONALITIES,
  PERSONALITY_LABELS,
  type Difficulty,
  type Personality,
} from "@/lib/scenarios";
import {
  SERVICE_CALL_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceCallType,
} from "@/lib/service-scenarios";
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

export const Route = createFileRoute("/service/new")({
  validateSearch: (search: Record<string, unknown>): CallSearch => ({
    quick: search["quick"] !== false && search["quick"] !== "false",
  }),
  head: () => ({
    meta: [
      { title: "Start a service call — Saela Way CES" },
      {
        name: "description",
        content:
          "Practice CES service calls: reservices, reschedules and resign offers, graded on how well you listened.",
      },
      { property: "og:title", content: "Start a service call — Saela Way CES" },
      {
        property: "og:description",
        content: "CES listening practice — reservices, reschedules, and resign offers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewServiceCall,
});

function NewServiceCall() {
  const navigate = useNavigate();
  const { quick } = Route.useSearch();
  const { user, loading } = useAuth();
  const begin = useServerFn(startServiceCall);

  const [callType, setCallType] = useState<string>(ANY);
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [personality, setPersonality] = useState<string>(ANY);
  const [dialing, setDialing] = useState(false);

  const { position, loading: positionLoading } = usePosition(user?.id);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!positionLoading && position === "cem") void navigate({ to: "/" });
  }, [positionLoading, position, navigate]);

  async function dial() {
    setDialing(true);
    try {
      const session = await begin({
        data: {
          callType: quick || callType === ANY ? null : (callType as ServiceCallType),
          difficulty: quick ? "hard" : difficulty,
          personality: quick || personality === ANY ? null : (personality as Personality),
        },
      });
      void navigate({ to: "/service/$sessionId", params: { sessionId: session.sessionId } });
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

        <h1 className="font-display text-2xl font-semibold">Start a CES Service Call</h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          A normal customer calling in — a reservice, a reschedule, or an out-of-agreement resign.
          Everything they tell you is graded on whether you heard it.
        </p>

        <Card className="card-soft">
          <CardHeader>
            <CardTitle>{quick ? "Next call in the queue" : "Build the scenario"}</CardTitle>
            <CardDescription>
              {quick
                ? "The caller and what they need are picked for you. Listen carefully — they only say things once."
                : "Pick what you want to drill. The details they drop stay hidden until the scorecard."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!quick && (
              <>
                <Field label="Call type">
                  <Select value={callType} onValueChange={setCallType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY}>Surprise me</SelectItem>
                      {SERVICE_CALL_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {SERVICE_TYPE_LABELS[value]}
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
              Headphones on. Confirm details back to the customer as you go — anything you don't
              repeat back, they won't repeat either.
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
