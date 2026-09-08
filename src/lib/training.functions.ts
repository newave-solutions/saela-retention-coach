import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type {
  AuthorityRole,
  CancelReason,
  Difficulty,
  FullScenario,
  Personality,
  PublicScenario,
  TranscriptTurn,
} from "@/lib/scenarios";

type StartInput = {
  reason: CancelReason | null;
  difficulty: Difficulty;
  personality: Personality | null;
  authorityRole?: AuthorityRole | null;
};

export const startCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StartInput) => input)
  .handler(async ({ data, context }) => {
    const { generateScenario } = await import("@/lib/scenario-generator.server");
    const scenario = generateScenario({
      reason: data.reason,
      difficulty: data.difficulty,
      personality: data.personality,
      authorityRole: data.authorityRole ?? "ces",
    });

    const opening: TranscriptTurn = {
      speaker: "customer",
      text: scenario.openingLine,
      at: Date.now(),
    };

    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .insert({
        user_id: context.userId,
        scenario: scenario as unknown as Json,
        transcript: [opening] as unknown as Json,
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { sessionId: row.id as string };
  });

export const getCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("id, scenario, transcript, status")
      .eq("id", data.sessionId)
      .single();

    if (error) throw new Error(error.message);
    const scenario = row.scenario as unknown as FullScenario;
    const { toPublicScenario } = await import("@/lib/scenario-generator.server");

    return {
      sessionId: row.id as string,
      status: row.status as string,
      scenario: toPublicScenario(scenario) as PublicScenario,
      transcript: (row.transcript as unknown as TranscriptTurn[]) ?? [],
    };
  });

export const sendAgentTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; text: string }) => input)
  .handler(async ({ data, context }) => {
    const said = data.text.trim();
    if (!said) throw new Error("Nothing was said.");

    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("scenario, transcript, status")
      .eq("id", data.sessionId)
      .single();
    if (error) throw new Error(error.message);
    if (row.status !== "active") throw new Error("This call has already ended.");

    const scenario = row.scenario as unknown as FullScenario;
    const transcript = ((row.transcript as unknown as TranscriptTurn[]) ?? []).concat({
      speaker: "agent",
      text: said,
      at: Date.now(),
    });

    const { nextCustomerTurn } = await import("@/lib/customer-brain.server");
    const result = await nextCustomerTurn(scenario, transcript);

    const updated = transcript.concat({
      speaker: "customer",
      text: result.reply,
      at: Date.now(),
    });

    const { error: saveError } = await context.supabase
      .from("training_sessions")
      .update({ transcript: updated as unknown as Json })
      .eq("id", data.sessionId);
    if (saveError) throw new Error(saveError.message);

    return {
      reply: result.reply,
      mood: result.mood,
      callShouldEnd: result.callShouldEnd,
      endReason: result.endReason,
      transcript: updated,
    };
  });

export const endCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string; endReason: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("scenario, transcript, status, started_at")
      .eq("id", data.sessionId)
      .single();
    if (error) throw new Error(error.message);
    if (row.status === "complete") return { sessionId: data.sessionId };

    const scenario = row.scenario as unknown as FullScenario;
    const transcript = (row.transcript as unknown as TranscriptTurn[]) ?? [];

    const { gradeCall } = await import("@/lib/customer-brain.server");
    const graded = await gradeCall(
      scenario,
      transcript,
      data.endReason === "saved" || data.endReason === "partial" || data.endReason === "cancelled"
        ? data.endReason
        : null,
    );

    const startedAt = new Date(row.started_at as string).getTime();
    const duration = Math.max(0, Math.round((Date.now() - startedAt) / 1000));

    const { error: saveError } = await context.supabase
      .from("training_sessions")
      .update({
        status: "complete",
        outcome: graded.outcome,
        overall_score: graded.overallScore,
        scores: graded.scores as unknown as Json,
        coaching: graded.coaching as unknown as Json,
        duration_seconds: duration,
        ended_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    if (saveError) throw new Error(saveError.message);

    return { sessionId: data.sessionId };
  });
