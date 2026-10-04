import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Upload, CheckCircle2, XCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getMyLeadRole } from "@/lib/team.functions";
import {
  FIELDS,
  aggregate,
  coachingNote,
  guessMapping,
  parseCsv,
  scoreAgent,
  type AgentRow,
  type Field,
  type Source,
} from "@/lib/scorecard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/team/scorecard")({
  head: () => ({
    meta: [
      { title: "Master scorecard — Saela Way Team Lead View" },
      {
        name: "description",
        content:
          "Upload Talkdesk and FieldRoutes CSV exports to build each agent's balanced monthly score.",
      },
      { property: "og:title", content: "Master scorecard — Saela Way" },
      {
        property: "og:description",
        content: "Balanced agent scores from Talkdesk and FieldRoutes exports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScorecardPage,
});

const thisMonth = () => new Date().toISOString().slice(0, 7);

type Parsed = {
  source: Source;
  fileName: string;
  headers: string[];
  rows: string[][];
  map: Partial<Record<Field, number>>;
};

function ScorecardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchRole = useServerFn(getMyLeadRole);
  const [month, setMonth] = useState(thisMonth());
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: role, isLoading } = useQuery({
    queryKey: ["lead-role", user?.id],
    enabled: !!user,
    queryFn: () => fetchRole(),
  });
  const seat = role?.seat ?? null;

  const { data: metrics = [] } = useQuery({
    queryKey: ["metrics", seat, month],
    enabled: !!seat,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_monthly_metrics")
        .select("*")
        .eq("seat", seat!)
        .eq("month", month);
      if (error) throw error;
      return data as (AgentRow & { id: string; updated_at: string })[];
    },
  });

  async function onFile(source: Source, file: File) {
    const rows = parseCsv(await file.text());
    if (rows.length < 2 || !rows[0]) {
      toast.error("That file has no data rows.");
      return;
    }
    const headers = rows[0].map((h) => h.trim());
    setParsed({
      source,
      fileName: file.name,
      headers,
      rows: rows.slice(1),
      map: guessMapping(source, headers),
    });
  }

  const preview = parsed
    ? aggregate(
        parsed.source,
        parsed.rows,
        parsed.map,
        parsed.map.minutes != null ? (parsed.headers[parsed.map.minutes] ?? "") : "",
      )
    : [];

  async function save() {
    if (!parsed || !seat || !user) return;
    if (parsed.map.agent == null) {
      toast.error("Pick which column holds the agent name.");
      return;
    }
    setSaving(true);
    const payload = preview.map((r) => ({
      ...r,
      seat,
      month,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("agent_monthly_metrics")
      .upsert(payload, { onConflict: "seat,month,agent_name" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Saved ${payload.length} agents for ${month}.`);
    setParsed(null);
    void qc.invalidateQueries({ queryKey: ["metrics", seat, month] });
  }

  if (isLoading || !user) return <div className="min-h-screen bg-background" />;
  if (!seat)
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div>
          <p className="font-display text-lg font-semibold">Team leads only</p>
          <Link to="/" className="mt-4 inline-block text-sm underline">
            Back to dashboard
          </Link>
        </div>
      </main>
    );

  const scored = metrics
    .map((m) => ({ m, s: scoreAgent(m) }))
    .sort((a, b) => (b.s.score ?? -1) - (a.s.score ?? -1));

  return (
    <main className="min-h-screen bg-background">
      <header className="brand-surface">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link
            to="/team"
            className="mb-4 inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100"
          >
            <ArrowLeft className="h-4 w-4" /> Team
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-semibold">Master scorecard</h1>
              <p className="text-xs opacity-80">
                {seat.toUpperCase()} · Talkdesk + FieldRoutes · balanced 0–100 score
              </p>
            </div>
            <label className="text-xs">
              Month{" "}
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="ml-2 rounded-md bg-card px-2 py-1 text-sm text-foreground"
              />
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Dropzone
            title="Talkdesk export"
            hint="Calls, talk/handle time, schedule adherence"
            onFile={(f) => onFile("talkdesk", f)}
          />
          <Dropzone
            title="FieldRoutes export"
            hint="Cancel requests, saves, coupons, saved value"
            onFile={(f) => onFile("fieldroutes", f)}
          />
        </div>

        {parsed && (
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4" /> {parsed.fileName} — check the columns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {FIELDS[parsed.source].map((f) => (
                  <label key={f.key} className="text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <select
                      className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-sm"
                      value={parsed.map[f.key] ?? ""}
                      onChange={(e) =>
                        setParsed({
                          ...parsed,
                          map: {
                            ...parsed.map,
                            [f.key]: e.target.value === "" ? undefined : Number(e.target.value),
                          },
                        })
                      }
                    >
                      <option value="">— not in this file —</option>
                      {parsed.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {preview.length} agents found from {parsed.rows.length} rows. Rows for the same
                agent are added together.
                {parsed.source === "talkdesk" &&
                  parsed.map.calls == null &&
                  " No calls column, so each row counts as one call."}
              </p>
              <div className="max-h-64 overflow-auto rounded-md border border-border text-xs">
                <table className="w-full">
                  <tbody>
                    {preview.slice(0, 50).map((r) => (
                      <tr key={r.agent_name} className="border-b border-border">
                        <td className="px-2 py-1 font-medium">{r.agent_name}</td>
                        {Object.entries(r)
                          .filter(([k]) => k !== "agent_name")
                          .map(([k, v]) => (
                            <td key={k} className="px-2 py-1 text-muted-foreground">
                              {k.replace("_", " ")}: {String(v ?? "—")}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? "Saving…" : `Save to ${month}`}
                </Button>
                <Button variant="outline" onClick={() => setParsed(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="card-soft">
          <CardHeader>
            <CardTitle className="text-base">Agent scores — {month}</CardTitle>
          </CardHeader>
          <CardContent>
            {scored.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Upload a Talkdesk or FieldRoutes export to see scores for this month.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {scored.map(({ m, s }) => {
                  const note = coachingNote(m, s.pillars);
                  return (
                    <li key={m.agent_name} className="py-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-14 text-center">
                          <p
                            className={`font-display text-2xl font-semibold ${s.score == null ? "" : s.score >= 85 ? "text-success" : s.score >= 70 ? "text-accent-foreground" : "text-destructive"}`}
                          >
                            {s.score ?? "—"}
                          </p>
                          {!s.complete && (
                            <p className="text-[10px] text-muted-foreground">partial</p>
                          )}
                        </div>
                        <div className="min-w-40 flex-1">
                          <p className="font-semibold">{m.agent_name}</p>
                          {s.net != null && (
                            <p className="text-xs text-muted-foreground">
                              Net retained: ${Math.round(s.net).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.pillars.map((p) => (
                            <span
                              key={p.key}
                              title={p.label}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ring-1 ring-border ${p.pass == null ? "text-muted-foreground" : p.pass ? "bg-success/10" : "bg-destructive/10"}`}
                            >
                              {p.pass == null ? null : p.pass ? (
                                <CheckCircle2 className="h-3 w-3 text-success" />
                              ) : (
                                <XCircle className="h-3 w-3 text-destructive" />
                              )}
                              {p.label.split(" ")[0]} {p.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      {note && (
                        <p className="mt-2 pl-[4.5rem] text-xs text-muted-foreground">
                          Coaching: {note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-4 text-[11px] text-muted-foreground">
              Weights: save % 25 · coupons 25 · calls 20 · avg call length 15 · adherence 15.
              "Partial" means one source hasn't been uploaded yet; the score uses what's available.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Dropzone({
  title,
  hint,
  onFile,
}: {
  title: string;
  hint: string;
  onFile: (f: File) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${over ? "border-primary bg-secondary" : "border-border bg-card"}`}
    >
      <Upload className="h-6 w-6 text-muted-foreground" />
      <p className="font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <p className="text-xs underline">Drop a CSV or click to choose</p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
