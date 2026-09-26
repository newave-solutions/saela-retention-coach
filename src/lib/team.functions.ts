import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

export type LeadSeat = "ces" | "cem";

export type SessionLite = {
  id: string;
  user_id: string;
  track: string;
  status: string;
  outcome: string | null;
  overall_score: number | null;
  scores: Record<string, number> | null;
  coaching: { summary?: string; missed?: string[]; didWell?: string[] } | null;
  language_flags: unknown;
  scenario: { customerName?: string; reasonLabel?: string; callTypeLabel?: string; difficulty?: string } | null;
  created_at: string;
};

export type GrowPlan = {
  goals: { skill: string; current: number; target: number; byWeeks: number }[];
  reality: string[];
  options: string[];
  will: { step: string; owner: string; due: string }[];
  checkIn: string;
  talkingPoints: { openers: string[]; questions: string[]; praise: string[] };
  practice: { label: string; focus: string }[];
};

async function leadSeat(ctx: { supabase: any; userId: string }): Promise<LeadSeat> {
  const { data } = await ctx.supabase.from("user_roles").select("role").eq("user_id", ctx.userId);
  const roles = (data ?? []).map((r: { role: string }) => r.role);
  if (roles.includes("ces_lead")) return "ces";
  if (roles.includes("cem_lead")) return "cem";
  throw new Error("Forbidden");
}

const SESSION_COLS =
  "id, user_id, track, status, outcome, overall_score, scores, coaching, language_flags, scenario, created_at";

export const getMyLeadRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      return { seat: await leadSeat(context) };
    } catch {
      return { seat: null as LeadSeat | null };
    }
  });

export const getTeamOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const seat = await leadSeat(context);
    const { data: agents } = await context.supabase
      .from("profiles")
      .select("id, display_name, position")
      .eq("position", seat);
    const ids = (agents ?? []).map((a) => a.id);
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const { data: sessions } = ids.length
      ? await context.supabase
          .from("training_sessions")
          .select(SESSION_COLS)
          .in("user_id", ids)
          .eq("track", seat === "ces" ? "service" : "retention")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
      : { data: [] };
    return {
      seat,
      agents: agents ?? [],
      sessions: (sessions ?? []) as unknown as SessionLite[],
    };
  });

export const getAgentDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { agentId: string }) => input)
  .handler(async ({ data, context }) => {
    const seat = await leadSeat(context);
    const { data: agent } = await context.supabase
      .from("profiles")
      .select("id, display_name, position")
      .eq("id", data.agentId)
      .maybeSingle();
    if (!agent || agent.position !== seat) throw new Error("Agent not on your team");
    const { data: sessions } = await context.supabase
      .from("training_sessions")
      .select(SESSION_COLS)
      .eq("user_id", data.agentId)
      .eq("track", seat === "ces" ? "service" : "retention")
      .order("created_at", { ascending: false })
      .limit(60);
    const { data: plans } = await context.supabase
      .from("coaching_plans")
      .select("id, grow, steps, targets, created_at")
      .eq("agent_id", data.agentId)
      .order("created_at", { ascending: false })
      .limit(5);
    return {
      seat,
      agent,
      sessions: (sessions ?? []) as unknown as SessionLite[],
      plans: (plans ?? []) as unknown as {
        id: string;
        grow: GrowPlan;
        steps: { step: string; owner: string; due: string; done: boolean }[];
        targets: GrowPlan["goals"];
        created_at: string;
      }[],
    };
  });

export const generateGrowPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { agentId: string }) => input)
  .handler(async ({ data, context }) => {
    const seat = await leadSeat(context);
    const { data: agent } = await context.supabase
      .from("profiles")
      .select("display_name, position")
      .eq("id", data.agentId)
      .maybeSingle();
    if (!agent || agent.position !== seat) throw new Error("Agent not on your team");
    const { data: rows } = await context.supabase
      .from("training_sessions")
      .select("outcome, overall_score, scores, coaching, language_flags, scenario, created_at")
      .eq("user_id", data.agentId)
      .eq("status", "complete")
      .eq("track", seat === "ces" ? "service" : "retention")
      .order("created_at", { ascending: false })
      .limit(15);
    if (!rows?.length) throw new Error("This agent has no graded calls yet.");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured.");

    const framework =
      seat === "cem"
        ? "Saela CEM retention seat: GEOC framework (Gratitude, Empathy, Ownership, Clarity), 3-attempt rule before financial concessions, price-point discovery ('What is your price point?'), CES/CEM authority limits (CEM: $109.99 min PP, up to 50% or $80 off next REG), Resolution Playbook values: help people, build value, over-communicate, trust & integrity, hold the line together."
        : "Saela CES service seat: listening comprehension (catch every detail), discovery of the why behind the why, accurate booking, building value on existing services, spotting hidden opportunities (bundles, sales transfer for a quote), resign offers for service-to-service customers (min 4 REG, lock price before incentives, 4 REG = 50% off initial, 5+ = free initial), clear but not over-explained terms, avoid words like 'contract'.";

    const prompt = `You are a Saela Pest Control team lead coach. Build a GROW coaching plan for agent "${agent.display_name ?? "Agent"}" from their recent graded practice calls.
Framework: ${framework}
Calls (newest first, JSON): ${JSON.stringify(rows).slice(0, 24000)}

Return ONLY strict JSON of this shape:
{"goals":[{"skill":string,"current":number,"target":number,"byWeeks":number}],"reality":[string],"options":[string],"will":[{"step":string,"owner":"Agent"|"Team lead","due":string}],"checkIn":string,"talkingPoints":{"openers":[string],"questions":[string],"praise":[string]},"practice":[{"label":string,"focus":string}]}
Rules: 1-2 measurable goals using 0-100 skill averages from the data. Reality: 3-4 evidence bullets citing real call moments. Options: 3 concrete techniques/drills. Will: 3-5 steps with relative due dates like "in 1 week". Talking points: 2-3 each, warm and specific. Practice: 2-3 practice calls to run together, each label naming a cancel reason or call type and a difficulty.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        reasoning: { effort: "low" },
        store: false,
        stream: true,
      }),
    });
    if (res.status === 429) throw new Error("AI is busy right now. Try again in a minute.");
    if (res.status === 402) throw new Error("AI credits are used up. Add credits in Settings → Plans & credits.");
    if (!res.ok || !res.body) throw new Error(`AI request failed (${res.status}).`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta") text += evt.delta ?? "";
        } catch {
          /* ignore partial */
        }
      }
    }
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("The coach returned an empty plan. Try again.");
    const plan = JSON.parse(match[0]) as GrowPlan;
    return { plan };
  });

export const saveCoachingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { agentId: string; plan: GrowPlan }) => input)
  .handler(async ({ data, context }) => {
    const seat = await leadSeat(context);
    const steps = data.plan.will.map((w) => ({ ...w, done: false }));
    const { error } = await context.supabase.from("coaching_plans").insert({
      lead_id: context.userId,
      agent_id: data.agentId,
      track: seat,
      grow: data.plan as unknown as Json,
      steps: steps as unknown as Json,
      targets: data.plan.goals as unknown as Json,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updatePlanStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planId: string; index: number; done: boolean }) => input)
  .handler(async ({ data, context }) => {
    await leadSeat(context);
    const { data: plan, error } = await context.supabase
      .from("coaching_plans")
      .select("steps")
      .eq("id", data.planId)
      .single();
    if (error) throw new Error(error.message);
    const steps = (plan.steps as unknown as { done: boolean }[]) ?? [];
    if (steps[data.index]) steps[data.index]!.done = data.done;
    const { error: upErr } = await context.supabase
      .from("coaching_plans")
      .update({ steps: steps as unknown as Json })
      .eq("id", data.planId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
