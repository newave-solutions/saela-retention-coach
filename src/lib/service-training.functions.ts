import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";
import type { Difficulty, Personality, TranscriptTurn } from "@/lib/scenarios";
import type {
  FullServiceScenario,
  PublicServiceScenario,
  ServiceCallType,
} from "@/lib/service-scenarios";

type StartInput = {
  callType: ServiceCallType | null;
  difficulty: Difficulty;
  personality: Personality | null;
};

export const startServiceCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StartInput) => input)
  .handler(async ({ data, context }) => {
    const { generateServiceScenario } = await import("@/lib/service-scenario-generator.server");
    const { voiceKey } = await import("@/lib/voice-direction");

    const { data: recent } = await context.supabase
      .from("training_sessions")
      .select("scenario")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(3);

    const excludeVoices = (recent ?? [])
      .map((row) => (row.scenario as unknown as FullServiceScenario | null)?.voice)
      .filter((voice): voice is NonNullable<FullServiceScenario["voice"]> => Boolean(voice))
      .map((voice) => voiceKey(voice));

    const scenario = generateServiceScenario({
      callType: data.callType,
      difficulty: data.difficulty,
      personality: data.personality,
      excludeVoices,
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
        track: "service",
        scenario: scenario as unknown as Json,
        transcript: [opening] as unknown as Json,
        status: "active",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { sessionId: row.id as string };
  });

export const getServiceCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("id, scenario, transcript, status")
      .eq("id", data.sessionId)
      .single();

    if (error) throw new Error(error.message);
    const scenario = row.scenario as unknown as FullServiceScenario;
    const { toPublicServiceScenario } = await import("@/lib/service-scenario-generator.server");

    return {
      sessionId: row.id as string,
      status: row.status as string,
      scenario: toPublicServiceScenario(scenario) as PublicServiceScenario,
      transcript: (row.transcript as unknown as TranscriptTurn[]) ?? [],
    };
  });

export const sendServiceTurn = createServerFn({ method: "POST" })
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

    const scenario = row.scenario as unknown as FullServiceScenario;
    const transcript = ((row.transcript as unknown as TranscriptTurn[]) ?? []).concat({
      speaker: "agent",
      text: said,
      at: Date.now(),
    });

    const { nextServiceTurn } = await import("@/lib/service-brain.server");
    const result = await nextServiceTurn(scenario, transcript);

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
      transcript: updated,
    };
  });

export const endServiceCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sessionId: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("training_sessions")
      .select("scenario, transcript, status, started_at")
      .eq("id", data.sessionId)
      .single();
    if (error) throw new Error(error.message);
    if (row.status === "complete") return { sessionId: data.sessionId };

    const scenario = row.scenario as unknown as FullServiceScenario;
    const transcript = (row.transcript as unknown as TranscriptTurn[]) ?? [];

    const { gradeServiceCall } = await import("@/lib/service-brain.server");
    const graded = await gradeServiceCall(scenario, transcript);

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
        detail_checks: graded.detailChecks as unknown as Json,
        opportunity_checks: graded.opportunityChecks as unknown as Json,
        language_flags: graded.languageFlags as unknown as Json,
        duration_seconds: duration,
        ended_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    if (saveError) throw new Error(saveError.message);

    return { sessionId: data.sessionId };
  });
