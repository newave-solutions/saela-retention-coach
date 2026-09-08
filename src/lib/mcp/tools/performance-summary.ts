import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "performance_summary",
  title: "Retention performance summary",
  description:
    "Summarize the signed-in agent's retention practice: save rate, average score, average category scores and the most common cancellation reasons.",
  inputSchema: {
    lastDays: z.number().int().optional().describe("Only include calls from the last N days."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lastDays }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("training_sessions")
      .select("scenario, outcome, overall_score, scores, created_at")
      .eq("status", "completed");
    if (lastDays && lastDays > 0) {
      const since = new Date(Date.now() - lastDays * 86_400_000).toISOString();
      query = query.gte("created_at", since);
    }
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? []) as any[];
    const avg = (values: number[]) =>
      values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
    const keys = ["gratitude", "empathy", "ownership", "clarity", "discovery"] as const;
    const categoryAverages: Record<string, number | null> = {};
    for (const key of keys) {
      categoryAverages[key] = avg(
        rows.map((r) => Number(r.scores?.[key])).filter((n) => Number.isFinite(n)),
      );
    }
    const reasons: Record<string, number> = {};
    for (const row of rows) {
      const label = row.scenario?.reasonLabel ?? "Unknown";
      reasons[label] = (reasons[label] ?? 0) + 1;
    }
    const saved = rows.filter((r) => r.outcome === "saved").length;
    const summary = {
      calls: rows.length,
      saved,
      partial: rows.filter((r) => r.outcome === "partial").length,
      cancelled: rows.filter((r) => r.outcome === "cancelled").length,
      saveRatePercent: rows.length ? Math.round((saved / rows.length) * 100) : null,
      averageScore: avg(
        rows.map((r) => Number(r.overall_score)).filter((n) => Number.isFinite(n)),
      ),
      categoryAverages,
      reasonCounts: reasons,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: { summary },
    };
  },
});
