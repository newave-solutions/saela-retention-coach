import type { SessionLite } from "./team.functions";

export const SKILL_LABELS: Record<string, string> = {
  helpPeople: "Help people",
  buildValue: "Build value",
  overCommunicate: "Over-communicate",
  trustIntegrity: "Trust & integrity",
  ownOutcome: "Hold the line / ownership",
  gratitude: "Gratitude",
  empathy: "Empathy",
  ownership: "Ownership",
  clarity: "Clarity",
  negotiation: "Negotiation",
};

export function skillLabel(key: string) {
  return SKILL_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

export function isWin(s: SessionLite) {
  return s.outcome === "saved" || s.outcome === "resolved";
}

export function summarize(sessions: SessionLite[]) {
  const graded = sessions.filter((s) => s.status === "complete");
  const now = Date.now();
  const inWindow = (s: SessionLite, from: number, to: number) => {
    const t = new Date(s.created_at).getTime();
    return t >= now - from * 864e5 && t < now - to * 864e5;
  };
  const avg = (list: SessionLite[]) =>
    list.length ? Math.round(list.reduce((a, s) => a + (s.overall_score ?? 0), 0) / list.length) : null;
  const rate = (list: SessionLite[]) =>
    list.length
      ? Math.round(
          ((list.filter(isWin).length + list.filter((s) => s.outcome === "partial").length * 0.5) /
            list.length) *
            100,
        )
      : null;
  const last30 = graded.filter((s) => inWindow(s, 30, 0));
  const prev30 = graded.filter((s) => inWindow(s, 60, 30));

  const skillTotals: Record<string, { sum: number; n: number }> = {};
  for (const s of graded) {
    for (const [k, v] of Object.entries(s.scores ?? {})) {
      if (typeof v !== "number") continue;
      skillTotals[k] ??= { sum: 0, n: 0 };
      skillTotals[k].sum += v;
      skillTotals[k].n += 1;
    }
  }
  const skills = Object.entries(skillTotals)
    .map(([key, { sum, n }]) => ({ key, label: skillLabel(key), avg: Math.round(sum / n) }))
    .sort((a, b) => a.avg - b.avg);

  const avgNow = avg(last30);
  const avgPrev = avg(prev30);
  return {
    graded,
    calls: graded.length,
    avgScore: avg(graded),
    rate: rate(graded),
    avgNow,
    avgPrev,
    trend: avgNow != null && avgPrev != null ? avgNow - avgPrev : null,
    skills,
    weakest: skills[0] ?? null,
    strongest: skills[skills.length - 1] ?? null,
    lastActive: sessions[0]?.created_at ?? null,
  };
}

export function daysSince(iso: string | null) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
}

/** Missed items that recur across coaching notes. */
export function recurringMisses(sessions: SessionLite[]) {
  const counts = new Map<string, number>();
  const patterns: [RegExp, string][] = [
    [/price point/i, "Skipped price-point discovery"],
    [/discount/i, "Led with a discount"],
    [/contract/i, 'Used "contract" style wording'],
    [/(why behind|root cause|discover)/i, "Shallow discovery / missed root cause"],
    [/(confirm|next step|recap)/i, "Weak confirmation of next steps"],
    [/(thank|gratitude)/i, "Missed gratitude"],
    [/(empath|acknowledg)/i, "Empathy felt scripted or missing"],
    [/(own|accountab)/i, "Didn't take ownership"],
    [/(resign|agreement)/i, "Resign runway / offer issues"],
    [/(detail|listen)/i, "Missed customer details"],
  ];
  for (const s of sessions) {
    const text = (s.coaching?.missed ?? []).join(" ");
    for (const [re, label] of patterns) if (re.test(text)) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
}
