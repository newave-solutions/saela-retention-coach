import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Ear,
  Headphones,
  LogOut,
  PhoneOutgoing,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Landing } from "@/components/landing/Landing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { labelForDifficulty } from "@/lib/scenarios";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Saela Way — Retention Call Training Dashboard" },
      {
        name: "description",
        content:
          "Run realistic pest control cancellation roleplays, uncover the caller's hidden motive, and track your save rate.",
      },
      { property: "og:title", content: "Saela Way — Retention Call Training Dashboard" },
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
  scenario: {
    customerName?: string;
    reasonLabel?: string;
    callTypeLabel?: string;
    difficulty?: string;
  } | null;
  track?: string | null;
  status: string;
  outcome: string | null;
  overall_score: number | null;
  duration_seconds: number | null;
  created_at: string;
};

function outcomeTone(outcome: string | null) {
  if (outcome === "saved" || outcome === "resolved")
    return "bg-success/15 text-success ring-1 ring-success/30";
  if (outcome === "partial") return "bg-accent/20 text-accent-foreground ring-1 ring-accent/40";
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

type Position = "ces" | "cem";

function RolePicker({ onPick, busy }: { onPick: (p: Position) => void; busy: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Headphones className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold">Which seat do you work?</h1>
            <p className="text-sm text-muted-foreground">
              Your training floor is built around your role. You can change it later.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ear className="h-4 w-4 text-accent" />
                Customer Experience Specialist
              </CardTitle>
              <CardDescription>
                First point of contact. Reservices, reschedules, coverage questions, resigns and
                listening comprehension.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={busy} onClick={() => onPick("ces")}>
                I'm a CES
              </Button>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PhoneOutgoing className="h-4 w-4 text-accent" />
                Customer Experience Manager
              </CardTitle>
              <CardDescription>
                Retention seat. Cancellation calls, hidden motives, GEOC and escalated save
                authority.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled={busy} onClick={() => onPick("cem")}>
                I'm a CEM
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [savingRole, setSavingRole] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, position")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function setPosition(position: Position | null) {
    if (!user) return;
    setSavingRole(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, position }, { onConflict: "id" });
    setSavingRole(false);
    if (error) {
      toast.error("Couldn't save your role. Try again.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select("id, scenario, track, status, outcome, overall_score, duration_seconds, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as SessionRow[];
    },
  });

  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Landing />;
  if (profileLoading) return <div className="min-h-screen bg-background" />;

  const position = (profile?.position ?? null) as Position | null;
  if (!position) return <RolePicker onPick={(p) => void setPosition(p)} busy={savingRole} />;

  const isCes = position === "ces";

  const all = sessions ?? [];
  const serviceSessions = all.filter((s) => s.track === "service");
  const retentionSessions = all.filter((s) => s.track !== "service");
  const mine = isCes ? serviceSessions : retentionSessions;
  const graded = mine.filter((s) => s.status === "complete");
  const saves = graded.filter((s) => s.outcome === "saved" || s.outcome === "resolved").length;
  const partials = graded.filter((s) => s.outcome === "partial").length;
  const saveRate = graded.length ? Math.round(((saves + partials * 0.5) / graded.length) * 100) : 0;
  const avgScore = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / graded.length)
    : 0;

  return (
    <main className="min-h-screen bg-background">
      <header className="brand-surface">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold leading-tight">
                  {isCes ? "Saela Way — CES Service Call Simulator" : "Saela Way — Retention Call Simulator"}
                </h1>
                <p className="text-xs opacity-80">
                  Saela Pest Control · customer experience training
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/10"
                disabled={savingRole}
                onClick={() => void setPosition(null)}
              >
                Change role
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/10"
                onClick={async () => {
                  await supabase.auth.signOut();
                  void navigate({ to: "/auth" });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed opacity-90">
            {isCes
              ? "You're the first voice the customer hears. Listen for every detail, resolve the reason they called, build value on what they already pay for, and spot the opening to help them further. Connect, discover the why behind the why, resolve, confirm."
              : "Our job is not to stop a cancellation — it's to help the customer and resolve the concern. Every call is graded on the Saela Customer Resolution Playbook: help people, build value, over-communicate, trust and integrity, and hold the line together."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Calls graded" value={String(graded.length)} />
            <StatCard label={isCes ? "Resolution rate" : "Save rate"} value={`${saveRate}%`} />
            <StatCard label="Average score" value={graded.length ? String(avgScore) : "—"} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {isCes ? (
          <>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              CES track — service calls & listening
            </h2>
            <section className="grid gap-4 sm:grid-cols-2">
              <Card className="card-soft border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Ear className="h-4 w-4 text-accent" />
                    Take a service call
                  </CardTitle>
                  <CardDescription>
                    Reservices, reschedules, access problems and out-of-agreement resigns. Every
                    detail they give you is graded on whether you caught it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to="/service/new" search={{ quick: true }}>
                      Answer the next service call
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SlidersHorizontal className="h-4 w-4 text-ring" />
                    Build a service scenario
                  </CardTitle>
                  <CardDescription>
                    Pick the call type — including resign practice for customers out of agreement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/service/new" search={{ quick: false }}>
                      Configure a service call
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>

            <HistorySection
              title="Service call history"
              rows={serviceSessions}
              emptyText="No service calls yet. Take one and we'll grade what you heard."
              kind="service"
            />
          </>
        ) : (
          <>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Retention track — cancellation calls
            </h2>
            <section className="grid gap-4 sm:grid-cols-2">
              <Card className="card-soft border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <PhoneOutgoing className="h-4 w-4 text-accent" />
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

              <Card className="card-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <SlidersHorizontal className="h-4 w-4 text-ring" />
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

            <HistorySection
              title="Retention call history"
              rows={retentionSessions}
              emptyText="No cancellation calls yet. Your first one shows up here with a full scorecard."
              kind="retention"
            />
          </>
        )}
      </div>
    </main>
  );
}

function HistorySection({
  title,
  rows,
  emptyText,
  kind,
}: {
  title: string;
  rows: SessionRow[];
  emptyText: string;
  kind: "retention" | "service";
}) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
      </div>

      {!rows.length ? (
        <p className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="card-soft divide-y divide-border overflow-hidden rounded-xl border border-border">
          {rows.map((s) => (
            <li key={s.id}>
              <Link
                to={kind === "service" ? "/service-session/$sessionId" : "/session/$sessionId"}
                params={{ sessionId: s.id }}
                className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-3.5 transition-colors hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {s.scenario?.customerName ?? "Customer"} ·{" "}
                    {s.scenario?.reasonLabel ?? s.scenario?.callTypeLabel ?? "Call"}
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
                        {s.outcome === "partial"
                          ? kind === "service"
                            ? "partly resolved"
                            : "partial save"
                          : (s.outcome ?? "graded")}
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
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-widest opacity-75">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
    </div>
  );
}
