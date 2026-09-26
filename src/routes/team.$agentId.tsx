import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, PhoneCall, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  generateGrowPlan,
  getAgentDetail,
  saveCoachingPlan,
  updatePlanStep,
  type GrowPlan,
} from "@/lib/team.functions";
import { recurringMisses, summarize } from "@/lib/team-stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trend } from "@/components/Trend";

export const Route = createFileRoute("/team/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent coaching plan — Saela Way Team Lead View" },
      { name: "description", content: "Detailed agent skill breakdown and GROW coaching plan." },
      { property: "og:title", content: "Agent coaching plan — Saela Way" },
      { property: "og:description", content: "Skill breakdown, trends and GROW next steps for one agent." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgentPage,
});

function AgentPage() {
  const { agentId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const fetchDetail = useServerFn(getAgentDetail);
  const genPlan = useServerFn(generateGrowPlan);
  const savePlan = useServerFn(saveCoachingPlan);
  const toggleStep = useServerFn(updatePlanStep);
  const [draft, setDraft] = useState<GrowPlan | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data, error, isLoading } = useQuery({
    queryKey: ["agent-detail", agentId],
    enabled: Boolean(user),
    queryFn: () => fetchDetail({ data: { agentId } }),
    retry: false,
  });

  if (loading || isLoading) return <div className="min-h-screen bg-background" />;
  if (error || !data)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="font-semibold">You can't view this agent.</p>
          <Link to="/team" className="mt-3 inline-block text-sm underline">
            Back to team
          </Link>
        </div>
      </main>
    );

  const stats = summarize(data.sessions);
  const misses = recurringMisses(stats.graded);
  const chart = [...stats.graded].reverse().slice(-20);
  const isCes = data.seat === "ces";
  const latestPlan = data.plans[0];
  const plan = draft ?? latestPlan?.grow ?? null;

  async function generate() {
    setBusy(true);
    try {
      const res = await genPlan({ data: { agentId } });
      setDraft(res.plan);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build a plan.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft) return;
    try {
      await savePlan({ data: { agentId, plan: draft } });
      setDraft(null);
      toast.success("Coaching plan saved.");
      await qc.invalidateQueries({ queryKey: ["agent-detail", agentId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  const skillNow = (name: string) =>
    stats.skills.find((s) => s.label.toLowerCase() === name.toLowerCase() || s.key === name)?.avg;

  return (
    <main className="min-h-screen bg-background">
      <header className="brand-surface">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link to="/team" className="mb-4 inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> Team
          </Link>
          <h1 className="font-display text-2xl font-semibold">{data.agent.display_name ?? "Agent"}</h1>
          <p className="text-xs opacity-80">{isCes ? "Customer Experience Specialist" : "Customer Experience Manager"}</p>
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <span>Calls graded <b className="ml-1 text-lg">{stats.calls}</b></span>
            <span>Avg score <b className="ml-1 text-lg">{stats.avgScore ?? "—"}</b></span>
            <span>{isCes ? "Resolution" : "Save"} rate <b className="ml-1 text-lg">{stats.rate != null ? `${stats.rate}%` : "—"}</b></span>
            <span className="flex items-center gap-1">30-day trend <Trend value={stats.trend} /></span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card className="card-soft">
            <CardHeader><CardTitle className="text-base">Skill breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {stats.skills.length ? stats.skills.map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between text-xs"><span>{s.label}</span><span className="font-medium">{s.avg}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary">
                    <div className={`h-1.5 rounded-full ${s.avg < 60 ? "bg-destructive" : s.avg < 75 ? "bg-accent" : "bg-success"}`} style={{ width: `${s.avg}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No graded calls yet.</p>}
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader><CardTitle className="text-base">Score over time</CardTitle></CardHeader>
            <CardContent>
              {chart.length ? (
                <div className="flex h-28 items-end gap-1">
                  {chart.map((s) => (
                    <div key={s.id} title={`${s.overall_score ?? 0}`} className="flex-1 rounded-t bg-primary/70" style={{ height: `${Math.max(4, s.overall_score ?? 0)}%` }} />
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Nothing to chart yet.</p>}
            </CardContent>
          </Card>

          {misses.length > 0 && (
            <Card className="card-soft">
              <CardHeader><CardTitle className="text-base">Repeating patterns</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {misses.map(([l, n]) => (
                    <li key={l} className="flex justify-between"><span>{l}</span><Badge variant="secondary">{n}×</Badge></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="card-soft">
            <CardHeader><CardTitle className="text-base">Recent calls</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {data.sessions.slice(0, 10).map((s) => (
                <Link key={s.id} to={isCes ? "/service-session/$sessionId" : "/session/$sessionId"} params={{ sessionId: s.id }}
                  className="flex justify-between rounded px-2 py-1.5 text-sm hover:bg-secondary">
                  <span className="truncate">{s.scenario?.reasonLabel ?? s.scenario?.callTypeLabel ?? "Call"}</span>
                  <span className="text-muted-foreground">{s.status === "complete" ? s.overall_score ?? 0 : "unfinished"}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">GROW coaching plan</CardTitle>
              <div className="flex gap-2">
                {draft && <Button size="sm" onClick={() => void save()}>Save plan</Button>}
                <Button size="sm" variant="outline" disabled={busy || !stats.calls} onClick={() => void generate()}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {plan ? "Refresh from latest calls" : "Build plan from calls"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {!plan ? (
                <p className="text-muted-foreground">
                  {stats.calls ? "Build a plan to get measurable goals, evidence, drills, next steps and 1:1 talking points." : "This agent needs at least one graded call first."}
                </p>
              ) : (
                <>
                  {draft && <Badge variant="outline">Draft — not saved yet</Badge>}
                  <Section title="G — Goals">
                    {plan.goals.map((g, i) => {
                      const now = skillNow(g.skill);
                      const pct = now != null ? Math.min(100, Math.round(((now - g.current) / Math.max(1, g.target - g.current)) * 100)) : 0;
                      return (
                        <div key={i} className="rounded-lg bg-secondary p-3">
                          <p className="font-medium">{g.skill}: {g.current} → {g.target} in {g.byWeeks} weeks</p>
                          <p className="text-xs text-muted-foreground">Now: {now ?? "—"} · progress {Math.max(0, pct)}%</p>
                        </div>
                      );
                    })}
                  </Section>
                  <Section title="R — Reality (evidence)"><List items={plan.reality} /></Section>
                  <Section title="O — Options (techniques & drills)"><List items={plan.options} /></Section>
                  <Section title="W — Will (next steps)">
                    {(latestPlan && !draft ? latestPlan.steps : plan.will.map((w) => ({ ...w, done: false }))).map((w, i) => (
                      <label key={i} className="flex items-start gap-2">
                        <Checkbox
                          checked={w.done}
                          disabled={Boolean(draft) || !latestPlan}
                          onCheckedChange={async (v) => {
                            if (!latestPlan) return;
                            await toggleStep({ data: { planId: latestPlan.id, index: i, done: Boolean(v) } });
                            await qc.invalidateQueries({ queryKey: ["agent-detail", agentId] });
                          }}
                        />
                        <span className={w.done ? "line-through opacity-60" : ""}>
                          {w.step} <span className="text-xs text-muted-foreground">· {w.owner} · {w.due}</span>
                        </span>
                      </label>
                    ))}
                    <p className="text-xs text-muted-foreground">Check-in: {plan.checkIn}</p>
                  </Section>
                  <Section title="Next 1:1 conversation">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Open with</p>
                    <List items={plan.talkingPoints.openers} />
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Ask</p>
                    <List items={plan.talkingPoints.questions} />
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Recognize</p>
                    <List items={plan.talkingPoints.praise} />
                  </Section>
                  <Section title="Practice together">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {plan.practice.map((p, i) => (
                        <Link key={i} to={isCes ? "/service/new" : "/call/new"} search={{ quick: false }}
                          className="rounded-lg border border-border p-3 hover:bg-secondary">
                          <p className="flex items-center gap-2 font-medium"><PhoneCall className="h-4 w-4 text-accent" />{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.focus}</p>
                        </Link>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((t, i) => <li key={i}>{t}</li>)}
    </ul>
  );
}
