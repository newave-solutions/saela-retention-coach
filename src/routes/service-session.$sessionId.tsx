import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, CheckCircle2, CircleSlash, Ear, HandCoins, PhoneCall, XCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { TranscriptTurn } from "@/lib/scenarios";
import {
  DETAIL_STATUS_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  SERVICE_OUTCOME_LABELS,
  SERVICE_SCORE_LABELS,
  normalizeServiceScores,
  type DetailCheck,
  type LanguageFlag,
  type OpportunityCheck,
  type ServiceCoaching,
  type ServiceOutcome,
  type ServiceScoreBreakdown,
} from "@/lib/service-scenarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/service-session/$sessionId")({
  head: () => ({
    meta: [
      { title: "Service call scorecard — Saela Way CES" },
      {
        name: "description",
        content:
          "Your CES service call scorecard: which details you caught, what you missed, and how to improve the experience.",
      },
      { property: "og:title", content: "Service call scorecard — Saela Way CES" },
      {
        property: "og:description",
        content: "Listening breakdown, scores and coaching from your CES service call.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServiceScorecard,
});

type Row = {
  id: string;
  scenario: {
    customerName?: string;
    callTypeLabel?: string;
    accountSummary?: string;
    personalityLabel?: string;
  } | null;
  status: string;
  outcome: ServiceOutcome | null;
  overall_score: number | null;
  scores: ServiceScoreBreakdown | null;
  coaching: ServiceCoaching | null;
  detail_checks: DetailCheck[] | null;
  opportunity_checks: OpportunityCheck[] | null;
  language_flags: LanguageFlag[] | null;
  transcript: TranscriptTurn[] | null;
  duration_seconds: number | null;
};

function toneFor(outcome: ServiceOutcome | null) {
  if (outcome === "resolved") return "text-success";
  if (outcome === "partial") return "text-accent";
  return "text-destructive";
}

function statusStyle(status: DetailCheck["status"]) {
  if (status === "confirmed") return { tone: "text-success", Icon: CheckCircle2 };
  if (status === "captured") return { tone: "text-accent", Icon: Ear };
  if (status === "wrong") return { tone: "text-destructive", Icon: XCircle };
  return { tone: "text-destructive", Icon: CircleSlash };
}

function ServiceScorecard() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["service-session", sessionId],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("training_sessions")
        .select(
          "id, scenario, status, outcome, overall_score, scores, coaching, detail_checks, opportunity_checks, language_flags, transcript, duration_seconds",
        )
        .eq("id", sessionId)
        .single();
      if (error) throw error;
      return row as unknown as Row;
    },
  });

  const scores = normalizeServiceScores(data?.scores);
  const hasResign = (data?.coaching?.resignNotes?.length ?? 0) > 0 || (scores?.resignOffer ?? 0) > 0;

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
                {data.scenario?.callTypeLabel ?? "Service call"}
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
                    {data.outcome ? SERVICE_OUTCOME_LABELS[data.outcome] : "Not graded"}
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

            {data.detail_checks?.length ? (
              <Card className="card-soft mt-4">
                <CardHeader>
                  <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
                    <Ear className="h-4 w-4 text-accent" />
                    What the customer told you
                  </h2>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.detail_checks.map((check) => {
                    const { tone, Icon } = statusStyle(check.status);
                    return (
                      <div
                        key={check.id}
                        className="rounded-lg border border-border bg-secondary/30 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {check.label}:{" "}
                              <span className="font-normal text-foreground/80">{check.value}</span>
                            </p>
                            <p className={`text-xs font-semibold uppercase tracking-widest ${tone}`}>
                              {DETAIL_STATUS_LABELS[check.status]}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{check.note}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : null}

            {scores && (
              <Card className="card-soft mt-4">
                <CardHeader>
                  <h2 className="text-base font-semibold leading-none">Call quality</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(Object.keys(SERVICE_SCORE_LABELS) as (keyof ServiceScoreBreakdown)[])
                    .filter((key) => key !== "resignOffer" || hasResign)
                    .map((key) => (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span>{SERVICE_SCORE_LABELS[key]}</span>
                          <span className="text-muted-foreground">{scores[key]}</span>
                        </div>
                        <Progress value={scores[key]} />
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {data.coaching && (
              <>
                {hasResign && data.coaching.resignNotes?.length ? (
                  <Card className="card-soft mt-4 border-accent/40 bg-accent/10">
                    <CardHeader>
                      <h2 className="flex items-center gap-2 text-base font-semibold leading-none">
                        <HandCoins className="h-4 w-4 text-accent" />
                        Resign offer
                      </h2>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
                        {data.coaching.resignNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                      <p className="mt-3 rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
                        Ask their price point first, then build the resign around it: at least 4
                        services at a price they can carry, and 50% off or a free service only if
                        that's what closes it. Lock the ongoing price before giving anything away,
                        and say the terms in numbers.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="card-soft mt-4">
                  <CardHeader>
                    <h2 className="text-base font-semibold leading-none">Coaching</h2>
                  </CardHeader>
                  <CardContent className="space-y-5 text-sm">
                    <p className="text-muted-foreground">{data.coaching.summary}</p>
                    <CoachList title="Did well" items={data.coaching.didWell} tone="text-success" />
                    <CoachList title="Missed" items={data.coaching.missed} tone="text-destructive" />
                    <CoachList title="Next time" items={data.coaching.nextTime} tone="text-ring" />
                    <CoachList
                      title="What the customer experiences"
                      items={data.coaching.experienceImpact}
                      tone="text-accent"
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
                      {turn.speaker === "agent"
                        ? "You"
                        : (data.scenario?.customerName ?? "Customer")}
                    </span>
                    <p className="text-foreground/90">{turn.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button asChild className="w-full">
                <Link to="/service/new" search={{ quick: true }}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Take another service call
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
