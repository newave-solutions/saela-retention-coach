// Server-only. Adaptive customer replies and post-call grading via Lovable AI.
import type {
  Coaching,
  CustomerResult,
  FullScenario,
  Outcome,
  ScoreBreakdown,
  TranscriptTurn,
} from "./scenarios";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TURN_MODEL = "google/gemini-3.7-flash";
const GRADE_MODEL = "google/gemini-3.1-pro-preview";

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GatewayError";
  }
}

const DIFFICULTY_RULES: Record<string, string> = {
  standard:
    "You are firm. Generic apologies and stock lines do nothing for you. You give ground only when the agent shows real, specific effort, and you may hint at the real motive after three or four good probing questions.",
  hard: "You never volunteer the real motive. You deflect the first three generic offers. Scripted empathy makes you shorter and colder. You only soften when the agent names something specific and true about your experience, thanks you like they mean it, and owns the failure personally. You give roughly eight exchanges before you start closing the call down.",
  brutal:
    "You are done. You interrupt. You give the agent about five or six exchanges before you hang up unless they land the real driver. Discounts insult you. Only a precise, specific acknowledgement plus a fitting remedy keeps you on the line, and even then you push once more before you agree to anything.",
};

const PERSONALITY_RULES: Record<string, string> = {
  guarded: "Short answers. One or two sentences. You do not elaborate unless asked directly.",
  irritated: "Clipped, sharp. You sigh. You cut off long-winded pitches.",
  polite_firm: "Warm tone, immovable position. You thank them and repeat your request.",
  fast_talker: "You run sentences together and jump ahead of the agent's point.",
  distracted: "You are doing something else. You ask them to repeat things. Short attention span.",
  steamroller:
    "You talk over the agent constantly. You start replies with 'No—', 'Nope—', 'Let me finish—'. You rarely let a question land before answering a different one.",
  detonator:
    "You are furious from the first second. Raised voice, short blasts, sarcasm. You may use mild profanity ('damn', 'hell', occasionally 'bullshit') when pushed — never slurs, never personal abuse of the agent. You only drop the volume if the agent owns the failure outright.",
  drive_by:
    "You are in a hurry and you have decided. You state your demand, answer at most a couple of questions in five words or less, and you hang up early unless the agent gives you something concrete and specific fast.",
  stonewaller:
    "One-word answers. 'Yep.' 'No.' 'Doesn't matter.' You make the agent work for every inch and you do not fill silence.",
  bargain_hunter:
    "Every topic becomes price within one sentence. You ask what they can do on the bill, then ask again. Value talk bores you until the agent asks you what your price point actually is.",
};

function systemPrompt(scenario: FullScenario) {
  return `You are role-playing a real pest control customer in the United States on a live phone call, calling to CANCEL your service. You are NOT an assistant. Never break character, never mention AI, never narrate stage directions. You speak like an ordinary American homeowner.

CUSTOMER
Name: ${scenario.customerName}
Account: ${scenario.accountSummary}
Stated reason (what you say out loud): ${scenario.statedReason}
HIDDEN real motive (never state it unprompted; the agent must earn it): ${scenario.hiddenMotive}
Emotional driver: ${scenario.emotionalDriver}

BEHAVIOR
${DIFFICULTY_RULES[scenario.difficulty] ?? DIFFICULTY_RULES["hard"]}
${PERSONALITY_RULES[scenario.personality] ?? PERSONALITY_RULES["guarded"]}

SAVE CONDITIONS — you only become negotiable once these are genuinely met:
${scenario.saveConditions.map((c) => `- ${c}`).join("\n")}

DEAL BREAKERS — these make you colder and reduce save likelihood:
${scenario.dealBreakers.map((c) => `- ${c}`).join("\n")}

RESOLUTIONS you would actually accept once heard:
${scenario.acceptableResolutions.map((c) => `- ${c}`).join("\n")}

WHAT ACTUALLY MOVES YOU (the agent is trained on the Saela Customer Resolution Playbook — resolution, not pressure)
- They start with curiosity, not defense: "Can I ask what's leading you to make the change?" before any policy, fee, or discount talk.
- They find the why behind the why — two layers: what is happening, and why it matters to you — instead of accepting your first reason.
- They build value that fits YOUR problem, not a generic pitch or a random discount.
- They over-communicate: what will happen, when, who owns it, what it costs, and when they'll follow up.
- Trust and integrity: honest about terms and about what pest control can and can't guarantee. Hiding things, false urgency, or making you feel trapped kills the call.
- They own the outcome: a named person, a follow-up date, no "you'll have to call another department".
- Asking what your price point is, then building around your number, lands far better than a thrown discount.
- A save that comes from pressure does not work on you. A save that comes from actually solving your problem does.

RULES
- Speak like a real person on the phone: contractions, filler, interruptions, 1-3 sentences typical. Never write paragraphs.
- Never list your own save conditions or coach the agent.
- Only set motiveUncovered true when the agent has actually named the real driver, not merely guessed near it.
- Only set callShouldEnd true when you would truly hang up: you are satisfied and staying (endReason "saved"), you accept a downgrade/pause (endReason "partial"), or you are done and cancelling (endReason "cancelled").
- If the agent says goodbye or confirms the cancellation, end the call.
- Be hard to save. Most calls like this end in cancellation. Saving you requires real work, not politeness.

Respond with ONLY strict JSON, no markdown fence:
{"reply":string,"mood":"hostile"|"cold"|"neutral"|"warming"|"open","motiveUncovered":boolean,"saveLikelihood":number,"callShouldEnd":boolean,"endReason":"saved"|"partial"|"cancelled"|null}`;
}

async function callGateway(body: Record<string, unknown>): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(401, "AI is not configured for this project.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string }; message?: string };
      message = parsed.error?.message ?? parsed.message ?? text;
    } catch {
      /* keep raw text */
    }
    if (response.status === 402) {
      throw new GatewayError(402, message || "AI credits are exhausted for this workspace.");
    }
    if (response.status === 429) {
      throw new GatewayError(429, "Too many calls at once — wait a moment and try again.");
    }
    throw new GatewayError(response.status, message || "The customer line dropped.");
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJson<T>(raw: string): T | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

function clamp(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function nextCustomerTurn(
  scenario: FullScenario,
  transcript: TranscriptTurn[],
): Promise<CustomerResult> {
  const raw = await callGateway({
    model: TURN_MODEL,
    messages: [
      { role: "system", content: systemPrompt(scenario) },
      ...transcript.map((turn) => ({
        role: turn.speaker === "agent" ? "user" : "assistant",
        content: turn.text,
      })),
    ],
    temperature: 1,
  });

  const parsed = parseJson<Partial<CustomerResult>>(raw);
  if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    return {
      reply: "Sorry — can you say that again? I didn't catch it.",
      mood: "neutral",
      motiveUncovered: false,
      saveLikelihood: 20,
      callShouldEnd: false,
      endReason: null,
    };
  }

  const endReason =
    parsed.endReason === "saved" || parsed.endReason === "partial"
      ? parsed.endReason
      : parsed.endReason === "cancelled"
        ? "cancelled"
        : null;

  return {
    reply: parsed.reply.trim(),
    mood: (parsed.mood ?? "neutral") as CustomerResult["mood"],
    motiveUncovered: Boolean(parsed.motiveUncovered),
    saveLikelihood: clamp(parsed.saveLikelihood, 20),
    callShouldEnd: Boolean(parsed.callShouldEnd) || endReason !== null,
    endReason: (Boolean(parsed.callShouldEnd) && endReason === null ? "cancelled" : endReason) as
      | Outcome
      | null,
  };
}

export type GradeResult = {
  outcome: Outcome;
  overallScore: number;
  scores: ScoreBreakdown;
  coaching: Coaching;
};

export async function gradeCall(
  scenario: FullScenario,
  transcript: TranscriptTurn[],
  endedOutcome: Outcome | null,
): Promise<GradeResult> {
  const dialogue = transcript
    .map((t) => `${t.speaker === "agent" ? "AGENT" : "CUSTOMER"}: ${t.text}`)
    .join("\n");

  const prompt = `Grade this call against the Saela Customer Resolution Playbook. The agent's job is not to stop a cancellation — it is to help the customer and provide a resolution. Retention is the outcome; resolution is the work. Be a demanding coach: a generic, discount-first, pressure-based call belongs in the 20s-40s, and a genuinely excellent call is rare. An honest, well-handled call that still ends in cancellation because cancelling was right for the customer can still score well.

HIDDEN MOTIVE the agent had to uncover: ${scenario.hiddenMotive}
Save conditions: ${scenario.saveConditions.join(" | ")}
Deal breakers: ${scenario.dealBreakers.join(" | ")}
${endedOutcome ? `The customer ended the call as: ${endedOutcome}.` : "The agent ended the call."}

TRANSCRIPT
${dialogue || "(no conversation took place)"}

THE CALL FLOW the agent was supposed to run:
1. CONNECT — start with curiosity, not defense: "Can I ask what's leading you to make the change?" Listen before explaining agreements, fees or discounts.
2. DISCOVER — find the why behind the why: what is happening, and why does it matter to this customer.
3. RESOLVE — match the solution to the actual problem instead of giving every customer the same offer.
4. CONFIRM — over-communicate what happens, when, who owns it, pricing/agreement implications, and follow-up. Then confirm: "Does that address the concern you called about today?"
5. DO WHAT IS RIGHT — no short-term save at the expense of long-term trust.
6. OWN THE OUTCOME — document root cause, commitments, next action, owner and follow-up date; no cold handoffs.

THE FIVE VALUES you score:
- Help people: understood what the customer actually needed; asked the two-layer discovery questions; got past the stated reason to the root cause.
- Build value: connected the solution to what matters to THIS customer (better pest results, lower financial burden, convenience, confidence, prevention, service recovery, a smooth transfer) rather than a canned pitch or a reflex discount.
- Over-communicate: stated exactly what will happen, when, who owns it, what it costs, and confirmed the customer understood.
- Trust & integrity: honest about terms and limits, no hidden information, no false urgency, no promises Operations can't deliver, no making the customer feel trapped. Recommending cancellation when that is genuinely right scores HIGH here.
- Hold the line together: took personal ownership, named the next step and owner, and set up a real handoff and follow-up instead of passing the customer off.

Empowerment context: Level 1 Own It (discovery, education, scheduling/payment options, retreatments), Level 2 Resolve It (approved credits, pricing accommodations, service enhancements), Level 3 Elevate It (contract exceptions, large credits, repeated failures) — an agent who elevates should still keep ownership, not transfer and disappear.

Penalize: jumping to discounts, defending the company, talking too much, script-reading, pressuring, focusing on the cancellation instead of the concern, over-promising, and cold transfers. Reward: curiosity first, two-layer discovery, a solution matched to the root cause, and clear commitments with an owner and a date.

Score each 0-100. Return ONLY strict JSON:
{"outcome":"saved"|"partial"|"cancelled","overallScore":number,"scores":{"helpPeople":number,"buildValue":number,"overCommunicate":number,"trustIntegrity":number,"ownOutcome":number},"coaching":{"summary":string,"didWell":string[],"missed":string[],"nextTime":string[]}}
didWell/missed/nextTime: 2-4 short, specific items each, quoting or referencing real moments from the call and naming the playbook step or value involved.`;

  const raw = await callGateway({
    model: GRADE_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a retention coach for Saela Pest Control who grades strictly against the Saela Customer Resolution Playbook (Help People, Build Value, Over-Communicate, Trust & Integrity, Hold the Line Together). You return strict JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const parsed = parseJson<{
    outcome?: string;
    overallScore?: number;
    scores?: Partial<ScoreBreakdown>;
    coaching?: Partial<Coaching>;
  }>(raw);

  const scores: ScoreBreakdown = {
    helpPeople: clamp(parsed?.scores?.helpPeople, 0),
    buildValue: clamp(parsed?.scores?.buildValue, 0),
    overCommunicate: clamp(parsed?.scores?.overCommunicate, 0),
    trustIntegrity: clamp(parsed?.scores?.trustIntegrity, 0),
    ownOutcome: clamp(parsed?.scores?.ownOutcome, 0),
  };

  const average = Math.round(
    (scores.helpPeople +
      scores.buildValue +
      scores.overCommunicate +
      scores.trustIntegrity +
      scores.ownOutcome) /
      5,
  );

  const outcome: Outcome =
    parsed?.outcome === "saved" || parsed?.outcome === "partial" || parsed?.outcome === "cancelled"
      ? parsed.outcome
      : (endedOutcome ?? "cancelled");

  return {
    outcome,
    overallScore: clamp(parsed?.overallScore, average),
    scores,
    coaching: {
      summary: parsed?.coaching?.summary ?? "The call ended before enough happened to grade deeply.",
      didWell: parsed?.coaching?.didWell ?? [],
      missed: parsed?.coaching?.missed ?? [],
      nextTime: parsed?.coaching?.nextTime ?? [],
      hiddenMotive: scenario.hiddenMotive,
    },
  };
}
