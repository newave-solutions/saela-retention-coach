import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Minus, Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { getTeamOverview } from "@/lib/team.functions";
import { daysSince, recurringMisses, summarize } from "@/lib/team-stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/team/")({
  head: () => ({
    meta: [
      { title: "Team results — Saela Way Team Lead View" },
      { name: "description", content: "Team lead view of agent practice scores, trends and coaching needs." },
      { property: "og:title", content: "Team results — Saela Way Team Lead View" },
      { property: "og:description", content: "See every agent's practice results and where to coach next." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

type SortKey = "name" | "calls" | "avg" | "rate" | "trend";

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

function TeamPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const fetchTeam = useServerFn(getTeamOverview);
  const [sort, setSort] = useState<SortKey>("avg");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["team-overview", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchTeam(),
    retry: false,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const list = data.agents.map((a) => {
      const mine = data.sessions.filter((s) => s.user_id === a.id);
      return { agent: a, stats: summarize(mine) };
    });
    const val = (r: (typeof list)[number]) =>
      sort === "name"
        ? (r.agent.display_name ?? "")
        : sort === "calls"
          ? r.stats.calls
          : sort === "avg"
            ? (r.stats.avgScore ?? -1)
            : sort === "rate"
              ? (r.stats.rate ?? -1)
              : (r.stats.trend ?? -999);
    return list.sort((x, y) => {
      const a = val(x);
      const b = val(y);
      return typeof a === "string" ? a.localeCompare(b as string) : (b as number) - a;
    });
  }, [data, sort]);

  if (loading || isLoading) return <div className="min-h-screen bg-background" />;
  if (error || !data)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <p className="font-display text-lg font-semibold">Team leads only</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This page is for CES and CEM team leads. Ask your admin to add you as a lead.
          </p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );

  const team = summarize(data.sessions);
  const misses = recurringMisses(team.graded);
  const inactive = rows.filter((r) => (daysSince(r.stats.lastActive) ?? 99) >= 7);
  const seatName = data.seat === "ces" ? "CES — Customer Experience Specialists" : "CEM — Customer Experience Managers";

  return (
    <main className="min-h-screen bg-background">
      <header className="brand-surface">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold">Team lead view</h1>
              <p className="text-xs opacity-80">{seatName} · last 90 days</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Agents" value={String(data.agents.length)} />
            <Stat label="Calls graded" value={String(team.calls)} />
            <Stat label={data.seat === "ces" ? "Resolution rate" : "Save rate"} value={team.rate != null ? `${team.rate}%` : "—"} />
            <Stat
              label="Avg score (30d vs prior)"
              value={team.avgNow != null ? String(team.avgNow) : "—"}
              extra={<Trend value={team.trend} />}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
        <Card className="card-soft lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Where the team needs coaching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Skill averages</p>
              {team.skills.length ? (
                team.skills.map((s) => (
                  <div key={s.key} className="mb-2">
                    <div className="flex justify-between text-xs">
                      <span>{s.label}</span>
                      <span className="font-medium">{s.avg}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-secondary">
                      <div
                        className={`h-1.5 rounded-full ${s.avg < 60 ? "bg-destructive" : s.avg < 75 ? "bg-accent" : "bg-success"}`}
                        style={{ width: `${s.avg}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No graded calls yet.</p>
              )}
            </div>
            {misses.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Recurring misses</p>
                <ul className="space-y-1">
                  {misses.map(([label, n]) => (
                    <li key={label} className="flex justify-between">
                      <span>{label}</span>
                      <Badge variant="secondary">{n}×</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {inactive.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">No practice in 7+ days</p>
                <p>{inactive.map((r) => r.agent.display_name ?? "Agent").join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort by</span>
            {(["avg", "rate", "trend", "calls", "name"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`rounded-full px-3 py-1 ring-1 ring-border ${sort === k ? "bg-primary text-primary-foreground" : "bg-card"}`}
              >
                {{ avg: "Avg score", rate: "Rate", trend: "Trend", calls: "Calls", name: "Name" }[k]}
              </button>
            ))}
          </div>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              No agents in this seat yet.
            </p>
          ) : (
            <ul className="card-soft divide-y divide-border overflow-hidden rounded-xl border border-border">
              {rows.map(({ agent, stats }) => {
                const idle = daysSince(stats.lastActive);
                return (
                  <li key={agent.id}>
                    <Link
                      to="/team/$agentId"
                      params={{ agentId: agent.id }}
                      className="grid grid-cols-2 items-center gap-3 bg-card px-4 py-3.5 transition-colors hover:bg-secondary sm:grid-cols-6"
                    >
                      <div className="col-span-2 min-w-0">
                        <p className="truncate text-sm font-semibold">{agent.display_name ?? "Agent"}</p>
                        <p className="text-xs text-muted-foreground">
                          {idle == null ? "Never practiced" : idle === 0 ? "Active today" : `Last active ${idle}d ago`}
                          {idle != null && idle >= 7 ? " · needs a nudge" : ""}
                        </p>
                      </div>
                      <Cell label="Calls" value={String(stats.calls)} />
                      <Cell label="Avg" value={stats.avgScore != null ? String(stats.avgScore) : "—"} />
                      <Cell label="Rate" value={stats.rate != null ? `${stats.rate}%` : "—"} />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Focus</p>
                        <p className="truncate text-xs">{stats.weakest?.label ?? "—"}</p>
                        <Trend value={stats.trend} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function Stat({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-widest opacity-75">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-display text-3xl font-semibold">{value}</p>
        {extra}
      </div>
    </div>
  );
}
