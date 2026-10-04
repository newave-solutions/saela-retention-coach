export type Source = "talkdesk" | "fieldroutes";
export type Field = "agent" | "calls" | "minutes" | "adherence" | "cancel_requests" | "saves" | "coupons" | "saved_value";

export const FIELDS: Record<Source, { key: Field; label: string; match: RegExp }[]> = {
  talkdesk: [
    { key: "agent", label: "Agent name", match: /agent|user|employee|rep\b|name/i },
    { key: "calls", label: "Calls handled", match: /calls|interactions|contacts|handled/i },
    { key: "minutes", label: "Talk / handle time", match: /talk|handle|duration|minutes|aht/i },
    { key: "adherence", label: "Schedule adherence %", match: /adherence/i },
  ],
  fieldroutes: [
    { key: "agent", label: "Agent / employee", match: /agent|user|employee|rep\b|name|office ?staff/i },
    { key: "cancel_requests", label: "Cancel requests (WTC)", match: /cancel|wtc|request|attempt/i },
    { key: "saves", label: "Saves", match: /save|retain/i },
    { key: "coupons", label: "Coupons / discounts $", match: /coupon|discount|credit|concession/i },
    { key: "saved_value", label: "Saved account value $", match: /value|revenue|contract/i },
  ],
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}

export function guessMapping(source: Source, headers: string[]): Partial<Record<Field, number>> {
  const used = new Set<number>();
  const out: Partial<Record<Field, number>> = {};
  // match specific fields first so "agent" doesn't grab "Calls handled by agent"
  const order = [...FIELDS[source].filter((f) => f.key !== "agent"), ...FIELDS[source].filter((f) => f.key === "agent")];
  for (const f of order) {
    const idx = headers.findIndex((h, i) => !used.has(i) && f.match.test(h));
    if (idx >= 0) { out[f.key] = idx; used.add(idx); }
  }
  return out;
}

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  if (/^\d+:\d{1,2}(:\d{1,2})?$/.test(s)) {
    const p = s.split(":").map(Number);
    return p.length === 3 ? p[0] * 60 + p[1] + p[2] / 60 : p[0] + p[1] / 60;
  }
  const n = Number(s.replace(/[$,%\s]/g, "").replace(/^\((.*)\)$/, "-$1"));
  return Number.isFinite(n) ? n : null;
}

export type AgentRow = {
  agent_name: string;
  calls?: number | null;
  total_minutes?: number | null;
  adherence?: number | null;
  cancel_requests?: number | null;
  saves?: number | null;
  coupons?: number | null;
  saved_value?: number | null;
};

export function aggregate(source: Source, rows: string[][], map: Partial<Record<Field, number>>, minutesHeader: string): AgentRow[] {
  const by = new Map<string, AgentRow & { _n: number; _adh: number[] }>();
  const secs = /sec/i.test(minutesHeader);
  for (const r of rows) {
    const name = map.agent != null ? r[map.agent]?.trim() : "";
    if (!name || /^total/i.test(name)) continue;
    const key = name.toLowerCase();
    const a = by.get(key) ?? { agent_name: name, _n: 0, _adh: [] };
    a._n++;
    const add = (k: keyof AgentRow, f: Field, scale = 1) => {
      if (map[f] == null) return;
      const v = num(r[map[f]!]);
      if (v != null) (a as any)[k] = ((a as any)[k] ?? 0) + v * scale;
    };
    if (source === "talkdesk") {
      add("calls", "calls");
      add("total_minutes", "minutes", secs ? 1 / 60 : 1);
      if (map.adherence != null) {
        const v = num(r[map.adherence]);
        if (v != null) a._adh.push(v <= 1 ? v * 100 : v);
      }
    } else {
      add("cancel_requests", "cancel_requests");
      add("saves", "saves");
      add("coupons", "coupons");
      add("saved_value", "saved_value");
    }
    by.set(key, a);
  }
  return [...by.values()].map(({ _n, _adh, ...a }) => {
    if (source === "talkdesk") {
      if (map.calls == null) a.calls = _n; // one row per call
      if (_adh.length) a.adherence = Math.round((_adh.reduce((s, v) => s + v, 0) / _adh.length) * 10) / 10;
      if (a.total_minutes != null) a.total_minutes = Math.round(a.total_minutes);
    }
    return a;
  });
}

export const TARGETS = { calls: 200, coupons: 3000, retention: 33, minAvg: 8, maxAvg: 14, adherence: 90 };

export type Pillar = { key: string; label: string; weight: number; pts: number | null; value: string; pass: boolean | null };

export function scoreAgent(m: AgentRow): { score: number | null; complete: boolean; pillars: Pillar[]; net: number | null } {
  const T = TARGETS;
  const rate = m.cancel_requests && m.saves != null ? (m.saves / m.cancel_requests) * 100 : null;
  const avg = m.calls && m.total_minutes != null ? m.total_minutes / m.calls : null;
  const pillars: Pillar[] = [
    { key: "retention", label: `Save % ≥ ${T.retention}%`, weight: 25,
      pts: rate == null ? null : 25 * Math.min(1, rate / T.retention),
      value: rate == null ? "—" : `${rate.toFixed(1)}%`, pass: rate == null ? null : rate >= T.retention },
    { key: "coupons", label: `Coupons < $${T.coupons.toLocaleString()}`, weight: 25,
      pts: m.coupons == null ? null : m.coupons <= T.coupons ? 25 : 25 * Math.max(0, 1 - (m.coupons - T.coupons) / T.coupons),
      value: m.coupons == null ? "—" : `$${Math.round(m.coupons).toLocaleString()}`, pass: m.coupons == null ? null : m.coupons < T.coupons },
    { key: "calls", label: `Calls ≥ ${T.calls}`, weight: 20,
      pts: m.calls == null ? null : 20 * Math.min(1, m.calls / T.calls),
      value: m.calls == null ? "—" : String(m.calls), pass: m.calls == null ? null : m.calls >= T.calls },
    { key: "duration", label: `Avg call ${T.minAvg}–${T.maxAvg} min`, weight: 15,
      pts: avg == null ? null : avg < T.minAvg ? 15 * (avg / T.minAvg) : avg > T.maxAvg ? 15 * Math.max(0, 1 - (avg - T.maxAvg) / T.maxAvg) : 15,
      value: avg == null ? "—" : `${avg.toFixed(1)} min · ${Math.round(m.total_minutes!).toLocaleString()} total`,
      pass: avg == null ? null : avg >= T.minAvg && avg <= T.maxAvg },
    { key: "adherence", label: `Adherence ≥ ${T.adherence}%`, weight: 15,
      pts: m.adherence == null ? null : 15 * Math.min(1, m.adherence / T.adherence),
      value: m.adherence == null ? "—" : `${m.adherence}%`, pass: m.adherence == null ? null : m.adherence >= T.adherence },
  ];
  const have = pillars.filter((p) => p.pts != null);
  const w = have.reduce((s, p) => s + p.weight, 0);
  const score = w ? Math.round((have.reduce((s, p) => s + p.pts!, 0) / w) * 100) : null;
  const net = m.saved_value != null || m.coupons != null ? (m.saved_value ?? 0) - (m.coupons ?? 0) : null;
  return { score, complete: have.length === pillars.length, pillars, net };
}

export function coachingNote(m: AgentRow, pillars: Pillar[]): string | null {
  const p = Object.fromEntries(pillars.map((x) => [x.key, x.pass]));
  if (p.retention && p.coupons === false) return "Saves are coming with heavy discounts. Coach the 3-attempt rule and price-point discovery before any coupon.";
  if (p.retention === false && p.duration === false) return "Low saves on short calls. Slow down: find the root cause before accepting the cancel.";
  if (p.retention === false) return "Save rate under target. Practice GEOC and root-cause questions on retention calls.";
  if (p.calls === false && p.adherence === false) return "Low volume and adherence. Review schedule and time in available status.";
  if (p.duration === false) return "Call length is outside the target range. Review a few recordings for rushed or drawn-out calls.";
  return null;
}
