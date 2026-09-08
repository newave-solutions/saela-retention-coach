import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Eye, PhoneCall } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LEGACY_SCORE_LABELS,
  OUTCOME_LABELS,
  SCORE_LABELS,
  type Coaching,
  type Outcome,
  type ScoreBreakdown,
  type TranscriptTurn,
} from "@/lib/scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/session/$sessionId")({
  head: () => ({
    meta: [
      { title: "Call scorecard — Retention Practice" },
      {
        name: "description",
        content:
          "Your retention call scorecard: outcome, category scores, the hidden motive, and coaching for next time.",
      },
      { property: "og:title", content: "Call scorecard — Retention Practice" },
      {
        property: "og:description",
        content: "Outcome, scores, the hidden motive, and coaching from your retention call.",
      },
    ],
  }),
  component: Scorecard,
});

type Row = {
  id: string;
  scenario: {
    customerName?: string;
    reasonLabel?: string;
    accountSummary?: string;
    personalityLabel?: string;
  } | null;
  status: string;
  outcome: Outcome | null;
  overall_score: number | null;
  scores: ScoreBreakdown | null;
  coaching: Coaching | null;
  transcript: TranscriptTurn[] | null;
  duration_seconds: number | null;
};

function toneFor(outcome: Outcome | null) {
  if (outcome === "saved") return "text-success-foreground";
  if (outcome === "partial") return "text-accent";
  return "text-destructive-foreground";
}

function Scorecard() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["session", sessionId, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("training_sessions")
        .select(
          "id, scenario, status, outcome, overall_score, scores, coaching, transcript, duration_seconds",
        )
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return row as unknown as Row;
    },
  });

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Pulling up the call...</p>
        ) : (
          <>
            <section className="brand-surface card-soft rounded-xl p-6">
              <p className="text-xs uppercase tracking-widest opacity-75">
                {data.scenario?.reasonLabel ?? "Cancellation call"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                {data.scenario?.customerName ?? "Customer"}
              </h1>
              <p className="mt-1 text-sm opacity-80">
                {data.scenario?.accountSummary} · {data.scenario?.personalityLabel}
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-8">
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-75">Outcome</p>
                  <p className={`font-display text-2xl font-semibold ${toneFor(data.outcome)}`}>
                    {data.outcome ? OUTCOME_LABELS[data.outcome] : "Not graded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-75">Score</p>
                  <p className="font-display text-2xl font-semibold">{data.overall_score ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest opacity-75">Length</p>
                  <p className="font-display text-2xl font-semibold">
                    {data.duration_seconds
                      ? `${Math.max(1, Math.round(data.duration_seconds / 60))}m`
                      : "—"}
                  </p>
                </div>
              </div>
            </section>

            {data.scores && (
              <Card className="card-soft mt-4">
                <CardHeader>
                  <h2 className="text-base font-semibold leading-none">Category scores</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(Object.keys(SCORE_LABELS) as (keyof ScoreBreakdown)[]).map((key) => (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{SCORE_LABELS[key]}</span>
                        <span className="text-muted-foreground">{data.scores?.[key] ?? 0}</span>
                      </div>
                      <Progress value={data.scores?.[key] ?? 0} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {data.coaching && (
              <>
                <Card className="card-soft mt-4 border-accent/40 bg-accent/10">
                  <CardHeader>
                    <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
                        <Eye className="h-4 w-4 text-accent" />
                        What was really going on
                      </h2>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-foreground/90">
                    {data.coaching.hiddenMotive}
                  </CardContent>
                </Card>

                <Card className="card-soft mt-4">
                  <CardHeader>
                    <h2 className="text-base font-semibold leading-none">Coaching</h2>
                  </CardHeader>
                  <CardContent className="space-y-5 text-sm">
                    <p className="text-muted-foreground">{data.coaching.summary}</p>
                    <p className="rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
                      Graded against Saela Pest Control service standards: protect the home first,
                      be straight about the treatment, honor the agreement, and win the save with
                      responsiveness rather than price.
                    </p>
                    <CoachList title="Did well" items={data.coaching.didWell} tone="text-success" />
                    <CoachList title="Missed" items={data.coaching.missed} tone="text-destructive" />
                    <CoachList
                      title="Next time"
                      items={data.coaching.nextTime}
                      tone="text-ring"
                    />
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="card-soft mt-4">
              <CardHeader>
                <h2 className="text-base font-semibold leading-none">Transcript</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data.transcript ?? []).map((turn, index) => (
                  <div key={`${turn.at}-${index}`} className="text-sm">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {turn.speaker === "agent" ? "You" : (data.scenario?.customerName ?? "Customer")}
                    </span>
                    <p className="text-foreground/90">{turn.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button asChild className="w-full">
                <Link to="/call/new" search={{ quick: true }}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Take another call
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function CoachList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className={`mb-1 text-xs font-semibold uppercase tracking-widest ${tone}`}>{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-foreground/90">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
