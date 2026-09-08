// Server-only. Adaptive customer replies and post-call grading via Lovable AI.
import { limitsFor } from "./scenarios";
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
    "You give ground when the agent shows genuine effort. You may hint at the real motive after two or three good probing questions.",
  hard: "You never volunteer the real motive. You deflect the first two generic offers. Scripted empathy makes you shorter and colder. You only soften when the agent names something specific and true about your experience.",
  brutal:
    "You are close to done. You interrupt. You give the agent roughly six exchanges before hanging up unless they land the real driver. Discounts insult you. Only a precise, specific acknowledgement plus a fitting remedy keeps you on the line.",
};

const PERSONALITY_RULES: Record<string, string> = {
  guarded: "Short answers. One or two sentences. You do not elaborate unless asked directly.",
  irritated: "Clipped, sharp. You sigh. You cut off long-winded pitches.",
  polite_firm: "Warm tone, immovable position. You thank them and repeat your request.",
  fast_talker: "You run sentences together and jump ahead of the agent's point.",
  distracted: "You are doing something else. You ask them to repeat things. Short attention span.",
};

const TRIGGER_RULES: Record<string, string> = {
  persistent_activity:
    "You only soften after the agent asks a real diagnostic question — where the activity is, when you see it, whether you have used a re-service before — and then offers a stand-alone spot re-service. Money off instead of action makes you angrier.",
  competitor_switch:
    "If the agent offers to match a price without first asking what the other company actually promised and verifying it, you get suspicious and colder.",
  affordability:
    "You respond well to being asked what your price point is, to meeting in the middle on an increase, or to a year-in-full option. A blind discount before anyone understands your situation feels cheap.",
  poor_experience:
    "You want the story heard and owned before any remedy. Any remedy offered before a real apology bounces off.",
  agreement_dispute:
    "You want the gap between what you were told and what you signed acknowledged out loud. Policy language ends the call.",
  product_concerns:
    "You want specifics and options — labels, re-entry times, exterior-only — not reassurance and never a discount.",
};

function systemPrompt(scenario: FullScenario) {
  const limits = limitsFor(scenario.authorityRole);
  return `You are role-playing a real pest control customer on a live phone call, calling to CANCEL your service. You are NOT an assistant. Never break character, never mention AI, never narrate stage directions.

CUSTOMER
Name: ${scenario.customerName}
Account: ${scenario.accountSummary}
Stated reason (what you say out loud): ${scenario.statedReason}
HIDDEN real motive (never state it unprompted; the agent must earn it): ${scenario.hiddenMotive}
Emotional driver: ${scenario.emotionalDriver}

BEHAVIOR
${DIFFICULTY_RULES[scenario.difficulty] ?? DIFFICULTY_RULES["hard"]}
${PERSONALITY_RULES[scenario.personality] ?? PERSONALITY_RULES["guarded"]}
${TRIGGER_RULES[scenario.reason] ?? ""}

SEQUENCE YOU REACT TO (the company's 3-attempt rule)
- Money is the LAST resort. If the agent offers a discount, credit, free service, or price match before the real driver has been named, you get noticeably colder and shorter, and you say something like "so your answer is money?".
- You only become negotiable after the agent has made at least three distinct, genuine non-financial attempts — listening, owning the failure, diagnosing, offering a concrete service remedy.
- Repeated or stacked discounts insult you; each extra one lowers saveLikelihood.

WHAT THIS AGENT CAN ACTUALLY OFFER (${limits.label})
- Price floor: ${limits.priceFloor}
- Discount ceiling: ${limits.discount}
- Scheduling: ${limits.scheduling}
- Contract: ${limits.contract}
- Switchover: ${limits.switchover}
- Rescission / pre-initial: ${limits.rescission}
If they offer something beyond those limits, accept it in the moment as a customer would — do not police it, do not mention limits. It gets flagged after the call.

SAVE CONDITIONS — you only become negotiable once these are genuinely met:
${scenario.saveConditions.map((c) => `- ${c}`).join("\n")}

DEAL BREAKERS — these make you colder and reduce save likelihood:
${scenario.dealBreakers.map((c) => `- ${c}`).join("\n")}

RESOLUTIONS you would actually accept once heard:
${scenario.acceptableResolutions.map((c) => `- ${c}`).join("\n")}

RULES
- Speak like a real person on the phone: contractions, filler, interruptions, 1-3 sentences typical. Never write paragraphs.
- Never list your own save conditions or coach the agent.
- Only set motiveUncovered true when the agent has actually named the real driver, not merely guessed near it.
- Only set callShouldEnd true when you would truly hang up: you are satisfied and staying (endReason "saved"), you accept a downgrade/pause (endReason "partial"), or you are done and cancelling (endReason "cancelled").
- If the agent says goodbye or confirms the cancellation, end the call.

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
    temperature: 0.9,
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

  const limits = limitsFor(scenario.authorityRole);

  const prompt = `Grade this retention call for a Saela Pest Control customer experience agent against the company's GEOC standard. Be a demanding but fair coach — a generic, discount-first call should score in the 30s-50s.

HIDDEN MOTIVE the agent had to uncover: ${scenario.hiddenMotive}
Save conditions: ${scenario.saveConditions.join(" | ")}
Deal breakers: ${scenario.dealBreakers.join(" | ")}
${endedOutcome ? `The customer ended the call as: ${endedOutcome}.` : "The agent ended the call."}

THE AGENT'S AUTHORITY (${limits.label})
- Price floor: ${limits.priceFloor}
- Discount ceiling: ${limits.discount}
- Scheduling: ${limits.scheduling}
- Contract: ${limits.contract}
- Switchover: ${limits.switchover}
- Rescission / pre-initial: ${limits.rescission}

TRANSCRIPT
${dialogue || "(no conversation took place)"}

SCORING (0-100 each)
- gratitude: sincere appreciation for the customer's tenure, early and genuine.
- empathy: validating the customer's perspective without defensiveness or scripted lines.
- ownership: this is graded hardest. Total accountability. Blaming the branch, billing, the technician, "the system", or the customer loses heavy points even on a saved call.
- clarity: the resolution is stated in specific terms — what happens, who does it, when.
- discovery: real diagnostic questions that reach the root cause before any offer.

ALSO REPORT
- attemptsBeforeOffer: how many distinct non-financial retention attempts the agent made before the first money offer (discount, credit, free service, price match). 0 if money came first. The mandate is at least 3.
- authorityBreaches: anything offered outside the limits above — below the price floor, over the discount ceiling, scheduling outside the current month, changing frequency AND length together, an unverified competitor match, or free-service authority the role does not have. Empty array if clean. Quote what was offered.
- escalationWarranted: true if the agent exhausted their authority and should have flagged the account pending cancel for a manager instead of conceding further.

Return ONLY strict JSON:
{"outcome":"saved"|"partial"|"cancelled","overallScore":number,"scores":{"gratitude":number,"empathy":number,"ownership":number,"clarity":number,"discovery":number},"coaching":{"summary":string,"didWell":string[],"missed":string[],"nextTime":string[],"attemptsBeforeOffer":number,"authorityBreaches":string[],"escalationWarranted":boolean}}
didWell/missed/nextTime: 2-4 short, specific items each, quoting or referencing real moments from the call.

Coach in the voice of Saela's service standards: protect the customer's home and family first, tell the truth about what treatment can and cannot do, honor the agreement as written, exhaust three genuine non-financial attempts before touching price, and re-earn trust with responsiveness (a stand-alone re-service, a named technician, a firm date) rather than money. Penalize discount-first saves, over-promising, unauthorized concessions, and anything that misleads the customer — even when the call ended as saved.`;

  const raw = await callGateway({
    model: GRADE_MODEL,
    messages: [
      {
        role: "system",
        content: "You are a retention coach for Saela Pest Control. You return strict JSON only.",
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
    gratitude: clamp(parsed?.scores?.gratitude, 0),
    empathy: clamp(parsed?.scores?.empathy, 0),
    ownership: clamp(parsed?.scores?.ownership, 0),
    clarity: clamp(parsed?.scores?.clarity, 0),
    discovery: clamp(parsed?.scores?.discovery, 0),
  };

  const average = Math.round(
    (scores.gratitude + scores.empathy + scores.ownership + scores.clarity + scores.discovery) / 5,
  );

  const outcome: Outcome =
    parsed?.outcome === "saved" || parsed?.outcome === "partial" || parsed?.outcome === "cancelled"
      ? parsed.outcome
      : (endedOutcome ?? "cancelled");

  const breaches = Array.isArray(parsed?.coaching?.authorityBreaches)
    ? parsed.coaching.authorityBreaches.filter((b): b is string => typeof b === "string")
    : [];

  const attempts = Number(parsed?.coaching?.attemptsBeforeOffer);

  // An unauthorized concession cannot be a clean top score, however the call ended.
  const overall = clamp(parsed?.overallScore, average);

  return {
    outcome,
    overallScore: breaches.length ? Math.min(overall, 69) : overall,
    scores,
    coaching: {
      summary: parsed?.coaching?.summary ?? "The call ended before enough happened to grade deeply.",
      didWell: parsed?.coaching?.didWell ?? [],
      missed: parsed?.coaching?.missed ?? [],
      nextTime: parsed?.coaching?.nextTime ?? [],
      hiddenMotive: scenario.hiddenMotive,
      attemptsBeforeOffer: Number.isFinite(attempts) ? Math.max(0, Math.round(attempts)) : 0,
      authorityBreaches: breaches,
      escalationWarranted: Boolean(parsed?.coaching?.escalationWarranted),
    },
  };
}
