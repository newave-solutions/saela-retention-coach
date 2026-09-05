import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Headphones, LogOut, PhoneOutgoing, SlidersHorizontal, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labelForDifficulty } from "@/lib/scenarios";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SaveLine — Retention Call Training Dashboard" },
      {
        name: "description",
        content:
          "Run realistic pest control cancellation roleplays, uncover the caller's hidden motive, and track your save rate.",
      },
      { property: "og:title", content: "SaveLine — Retention Call Training Dashboard" },
      {
        property: "og:description",
        content: "Run realistic pest control cancellation roleplays and track your save rate.",
      },
    ],
  }),
  component: Dashboard,
});

type SessionRow = {
  id: string;
  scenario: { customerName?: string; reasonLabel?: string; difficulty?: string } | null;
  status: string;
  outcome: string | null;
  overall_score: number | null;
  duration_seconds: number | null;
  created_at: string;
};

function outcomeTone(outcome: string | null) {
  if (outcome === "saved") return "bg-success/15 text-success ring-1 ring-success/30";
  if (outcome === "partial") return "bg-warning/15 text-warning ring-1 ring-warning/30";
  return "bg-destructive/15 text-destructive ring-1 ring-destructive/30";
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("id, scenario, status, outcome, overall_score, duration_seconds, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as SessionRow[];
    },
  });

  const graded = (sessions ?? []).filter((s) => s.status === "complete");
  const saves = graded.filter((s) => s.outcome === "saved").length;
  const partials = graded.filter((s) => s.outcome === "partial").length;
  const saveRate = graded.length ? Math.round(((saves + partials * 0.5) / graded.length) * 100) : 0;
  const avgScore = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / graded.length)
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                SaveLine — Retention Call Simulator
              </h1>
              <p className="text-xs text-muted-foreground">Retention call simulator</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              void navigate({ to: "/auth" });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Calls graded" value={String(graded.length)} />
          <StatCard label="Save rate" value={`${saveRate}%`} />
          <StatCard label="Average score" value={graded.length ? String(avgScore) : "—"} />
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneOutgoing className="h-4 w-4 text-primary" />
                Take a live call
              </CardTitle>
              <CardDescription>
                A cancellation comes through with a hidden motive. Find it, or lose the account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/call/new" search={{ quick: true }}>
                  Answer the next call
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-accent" />
                Build a scenario
              </CardTitle>
              <CardDescription>
                Drill a specific cancel reason, difficulty, and customer personality.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/call/new" search={{ quick: false }}>
                  Configure a call
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Call history
            </h2>
          </div>

          {!sessions?.length ? (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No calls yet. Your first one shows up here with a full scorecard.
            </p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    to="/session/$sessionId"
                    params={{ sessionId: s.id }}
                    className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3 transition-colors hover:bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {s.scenario?.customerName ?? "Customer"} ·{" "}
                        {s.scenario?.reasonLabel ?? "Cancellation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatWhen(s.created_at)} ·{" "}
                        {labelForDifficulty(s.scenario?.difficulty ?? "hard")}
                        {s.duration_seconds
                          ? ` · ${Math.max(1, Math.round(s.duration_seconds / 60))} min`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === "complete" ? (
                        <>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${outcomeTone(s.outcome)}`}
                          >
                            {s.outcome === "partial" ? "partial save" : (s.outcome ?? "graded")}
                          </span>
                          <Badge variant="secondary">{s.overall_score ?? 0}</Badge>
                        </>
                      ) : (
                        <Badge variant="outline">unfinished</Badge>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
