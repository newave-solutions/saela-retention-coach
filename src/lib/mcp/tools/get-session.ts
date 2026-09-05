import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_session",
  title: "Get call scorecard",
  description:
    "Get one retention call in full: scenario, outcome, category scores, hidden motive, coaching and transcript.",
  inputSchema: {
    sessionId: z.string().describe("The id of the call, from list_sessions."),
    includeTranscript: z
      .boolean()
      .optional()
      .describe("Include the full transcript (default true)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sessionId, includeTranscript }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("training_sessions")
      .select(
        "id, scenario, status, outcome, overall_score, scores, coaching, transcript, duration_seconds, created_at",
      )
      .eq("id", sessionId)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text", text: "No such call for this account." }], isError: true };

    const row = data as any;
    const session = {
      id: row.id,
      customer: row.scenario?.customerName ?? "Customer",
      reason: row.scenario?.reasonLabel ?? null,
      personality: row.scenario?.personalityLabel ?? null,
      difficulty: row.scenario?.difficultyLabel ?? null,
      accountSummary: row.scenario?.accountSummary ?? null,
      status: row.status,
      outcome: row.outcome,
      score: row.overall_score,
      scores: row.scores,
      coaching: row.coaching,
      durationSeconds: row.duration_seconds,
      createdAt: row.created_at,
      transcript: includeTranscript === false ? undefined : (row.transcript ?? []),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(session, null, 2) }],
      structuredContent: { session },
    };
  },
});
