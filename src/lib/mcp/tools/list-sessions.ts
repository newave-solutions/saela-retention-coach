import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_sessions",
  title: "List retention calls",
  description:
    "List the signed-in agent's recent retention roleplay calls with outcome, score and scenario summary.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many calls to return (default 10, max 50)."),
    outcome: z
      .enum(["saved", "partial", "cancelled"])
      .optional()
      .describe("Only return calls with this outcome."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, outcome }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("training_sessions")
      .select("id, scenario, status, outcome, overall_score, duration_seconds, created_at")
      .order("created_at", { ascending: false })
      .limit(take);
    if (outcome) query = query.eq("outcome", outcome);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = (data ?? []).map((row: any) => ({
      id: row.id,
      customer: row.scenario?.customerName ?? "Customer",
      reason: row.scenario?.reasonLabel ?? null,
      difficulty: row.scenario?.difficultyLabel ?? null,
      status: row.status,
      outcome: row.outcome,
      score: row.overall_score,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { items },
    };
  },
});
