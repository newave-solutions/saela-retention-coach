// Server-only. CES service-call customer replies and listening-focused grading.
import type { CustomerResult, TranscriptTurn } from "./scenarios";
import type {
  DetailCheck,
  FullServiceScenario,
  ServiceCoaching,
  ServiceOutcome,
  ServiceScoreBreakdown,
} from "./service-scenarios";
import { GatewayError } from "./customer-brain.server";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const TURN_MODEL = "google/gemini-3.7-flash";
const GRADE_MODEL = "google/gemini-3.1-pro-preview";

const DIFFICULTY_RULES: Record<string, string> = {
  standard:
    "You are cooperative and reasonably clear, but you still only say each detail once unless the agent asks you to repeat it.",
  hard: "You bury details in ordinary chatter, change your mind once mid-call, and answer the question you thought they asked. You never volunteer a detail twice unless asked directly.",
  brutal:
    "You talk fast, pile two or three things into one breath, correct yourself, and get impatient if the agent makes you repeat anything. If they book the wrong thing you let them, and you get annoyed at the end.",
};

const PERSONALITY_RULES: Record<string, string> = {
  guarded: "Short answers. You don't elaborate unless asked directly.",
  irritated: "Clipped and a little sharp. You've had to call about this before.",
  polite_firm: "Warm, chatty, but you keep steering back to what you need.",
  fast_talker: "You run sentences together and put three facts in one breath.",
  distracted: "You are doing something else. You trail off and ask them to repeat.",
  steamroller: "You talk over the agent and finish their sentences.",
  detonator: "You are frustrated from the first second, though this is a service call, not a cancellation. Mild words at most ('damn', 'hell'), never abuse of the agent.",
  drive_by: "You are in a hurry. Short sentences. You want it booked and gone.",
  stonewaller: "One-word answers. You make the agent ask for everything.",
  bargain_hunter: "You bring money into it quickly and ask what things cost.",
};

function turnPrompt(scenario: FullServiceScenario) {
  const eligibility = scenario.resignEligibility;
  const money = eligibility
    ? `
YOUR AGREEMENT AND MONEY SITUATION (never state any of this outright; make them earn it)
- You have no agreement in place. You pay service to service, and you do not bring that up unprompted.
- Signals you may let slip once, in passing: ${eligibility.signals.join(" | ")}
- Most you could really carry: ${eligibility.budgetCeiling}
- Terms you would eventually say yes to: ${eligibility.acceptableTerms.join(" | ")}
- What makes you shut it down: ${eligibility.dealBreakers.join(" | ")}

HOW YOU HANDLE A RESIGN OFFER — BE HARD TO WIN
- Your first reaction to any offer of a new agreement is to decline. "I'd rather just keep it as is", "I don't want to be locked into anything", "let me think about it".
- You only start to consider it after the agent has done at least ${eligibility.requiredSteps} of these well: fully handled the reason you actually called; explained what your plan covers in a way that helped; asked what price point works for you BEFORE naming any number; gave you real numbers (how many services, cost each, when billing happens); treated you like a person instead of running a pitch.
- If they ask your price point, give a number a little below your ceiling and see what they build.
- If they lead with a freebie, push, repeat the pitch, or use words that feel like being tied down (contract, locked in, obligated, sign up), you get cooler and say no again.
- Only accept when the numbers clear your ceiling AND the terms were stated plainly. If they do all of that, accept warmly — it should feel earned.
`
    : "";

  const opportunities = scenario.hiddenOpportunities?.length
    ? `
THINGS THAT ARE TRUE ABOUT YOU BUT YOU WILL NOT VOLUNTEER
${scenario.hiddenOpportunities.map((o) => `- ${o.label}. It only comes up if: ${o.signal}. You mention it once, in passing, and never again on your own.`).join("\n")}
- If the agent asks a real, curious question near one of these, open up about it.
- If the agent suggests a service you don't have (mosquito, rodent yard guard, sealing up entry points) AFTER genuinely understanding your situation, you're open to hearing more and may agree to be transferred to someone for a quote. If they pitch it cold, you decline.
`
    : "";

  return `You are role-playing a real residential pest control customer in the United States calling your provider's customer service line. You are NOT cancelling. You are NOT an assistant. Never break character, never narrate, never mention AI.

YOU
Name: ${scenario.customerName}
Account: ${scenario.accountSummary}
Why you're calling: ${scenario.situation}

DETAILS YOU WILL MENTION (these are the things the agent must catch)
${scenario.keyDetails.map((detail) => `- ${detail.label}: ${detail.value}${detail.restates ? "" : " — you say this ONCE, in passing, and you never bring it up again on your own"}`).join("\n")}
${opportunities}
HOW YOU TALK
${DIFFICULTY_RULES[scenario.difficulty] ?? DIFFICULTY_RULES["hard"]}
${PERSONALITY_RULES[scenario.personality] ?? PERSONALITY_RULES["guarded"]}
${money}
RULES
- Speak like a real person on the phone: contractions, filler, 1-3 sentences. Never paragraphs.
- Drop your details naturally inside normal sentences, not as a tidy list.
- If the agent never asks about a detail, it never gets handled — and you only find out later. Don't rescue them.
- If the agent repeats a detail back correctly, confirm it warmly. If they repeat it back wrong, correct them only if you happen to notice — sometimes you don't.
- If the agent explains something genuinely useful about your service or plan, you appreciate it. A pitch before they understand your problem annoys you.
- End the call when the reason you called has been handled (or when you give up on it being handled). Set callShouldEnd true then, with endReason "saved" if you're satisfied, "partial" if it's half-handled, "cancelled" if you're hanging up unhappy or nothing got booked.
- Typical calls run 6-12 exchanges, longer if the agent is genuinely working a resign or a referral.

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
      /* keep raw */
    }
    if (response.status === 402) {
      throw new GatewayError(402, message || "AI credits are exhausted for this workspace.");
    }
    if (response.status === 429) {
      throw new GatewayError(429, "Too many calls at once — wait a moment and try again.");
    }
    throw new GatewayError(response.status, message || "The customer line dropped.");
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
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

export async function nextServiceTurn(
  scenario: FullServiceScenario,
  transcript: TranscriptTurn[],
): Promise<CustomerResult> {
  const raw = await callGateway({
    model: TURN_MODEL,
    messages: [
      { role: "system", content: turnPrompt(scenario) },
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
      reply: "Sorry — say that again? I didn't catch it.",
      mood: "neutral",
      motiveUncovered: false,
      saveLikelihood: 50,
      callShouldEnd: false,
      endReason: null,
    };
  }

  const endReason =
    parsed.endReason === "saved" || parsed.endReason === "partial" || parsed.endReason === "cancelled"
      ? parsed.endReason
      : null;

  return {
    reply: parsed.reply.trim(),
    mood: (parsed.mood ?? "neutral") as CustomerResult["mood"],
    motiveUncovered: Boolean(parsed.motiveUncovered),
    saveLikelihood: clamp(parsed.saveLikelihood, 50),
    callShouldEnd: Boolean(parsed.callShouldEnd) || endReason !== null,
    endReason: Boolean(parsed.callShouldEnd) && endReason === null ? "partial" : endReason,
  };
}

export type ServiceGradeResult = {
  outcome: ServiceOutcome;
  overallScore: number;
  scores: ServiceScoreBreakdown;
  coaching: ServiceCoaching;
  detailChecks: DetailCheck[];
};

export async function gradeServiceCall(
  scenario: FullServiceScenario,
  transcript: TranscriptTurn[],
): Promise<ServiceGradeResult> {
  const dialogue = transcript
    .map((t) => `${t.speaker === "agent" ? "AGENT" : "CUSTOMER"}: ${t.text}`)
    .join("\n");

  const resignBlock = scenario.resign
    ? `
RESIGN SITUATION — this caller is out of agreement or financially stuck, and the agent was supposed to practice offering a RESIGN.
Customer's real ceiling: ${scenario.resign.budgetCeiling}
Terms they would have accepted: ${scenario.resign.acceptableTerms.join(" | ")}
Deal breakers: ${scenario.resign.dealBreakers.join(" | ")}

Score "resignOffer" on: did the agent ask the customer's price point BEFORE naming a number; did they offer a resign at all; was it a real commitment of at least 4 services; did they lock the ongoing price before giving anything away; did they use 50% off or a free service only as the closer if it was needed; and did they state the full terms in numbers (how many services, cost each, what's free, when billing resumes). Leading with a giveaway, or closing without confirming service count and ongoing price, scores low. Put concrete notes in coaching.resignNotes.
`
    : `
This call had no resign component. Set "resignOffer" to 0 and leave coaching.resignNotes as an empty array.
`;

  const prompt = `You are coaching a Saela Pest Control Customer Experience Specialist (CES) on a NON-cancellation service call. The focus of this grading is LISTENING COMPREHENSION: did the agent actually hear what the customer said, confirm it back, and act on it correctly? Be demanding. A pleasant call that missed half the details is a mediocre call.

CUSTOMER SITUATION: ${scenario.situation}

DETAILS THE CUSTOMER GAVE (grade each one):
${scenario.keyDetails.map((detail) => `- id "${detail.id}" | ${detail.label}: ${detail.value}`).join("\n")}

VALUE OPPORTUNITIES available on this call (building value on the existing plan, only where it genuinely fits):
${scenario.valueOpportunities.map((v) => `- ${v}`).join("\n")}

THINGS THAT DAMAGE THE EXPERIENCE:
${scenario.frustrationTriggers.map((v) => `- ${v}`).join("\n")}
${resignBlock}
TRANSCRIPT
${dialogue || "(no conversation took place)"}

For every detail id above, return a status:
- "confirmed" — the agent heard it AND repeated/confirmed it back to the customer
- "captured" — the agent clearly heard and used it, but never confirmed it back
- "missed" — never acknowledged or acted on
- "wrong" — the agent restated or booked it incorrectly
Each detail gets a short note quoting or referencing the moment in the call.

Score 0-100 each:
- listening: how much of what the customer said was actually caught and confirmed
- discovery: questions that opened the customer up rather than closed-ended box-ticking
- accuracy: was the right thing booked/arranged for the right day, place, and person
- valueBuilt: genuine value built on their existing services where it fit (coverage explained, reservices are free, seasonal protection when relevant). Pitching before understanding the problem loses points
- clarity: the close — exactly what happens, when, who, what it costs, and confirming the customer understood
- resignOffer: as described above

Return ONLY strict JSON:
{"outcome":"resolved"|"partial"|"mishandled","overallScore":number,"scores":{"listening":number,"discovery":number,"accuracy":number,"valueBuilt":number,"clarity":number,"resignOffer":number},"detailChecks":[{"id":string,"status":"confirmed"|"captured"|"missed"|"wrong","note":string}],"coaching":{"summary":string,"didWell":string[],"missed":string[],"nextTime":string[],"experienceImpact":string[],"resignNotes":string[]}}
didWell/missed/nextTime: 2-4 short specific items each, referencing real moments. experienceImpact: 1-3 items describing what the customer will actually experience because of what was missed.`;

  const raw = await callGateway({
    model: GRADE_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a Saela Pest Control customer experience coach grading CES service calls on listening comprehension, accuracy, value building, and resign offers. You return strict JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const parsed = parseJson<{
    outcome?: string;
    overallScore?: number;
    scores?: Partial<ServiceScoreBreakdown>;
    detailChecks?: { id?: string; status?: string; note?: string }[];
    coaching?: Partial<ServiceCoaching>;
  }>(raw);

  const hasResign = Boolean(scenario.resign);
  const scores: ServiceScoreBreakdown = {
    listening: clamp(parsed?.scores?.listening, 0),
    discovery: clamp(parsed?.scores?.discovery, 0),
    accuracy: clamp(parsed?.scores?.accuracy, 0),
    valueBuilt: clamp(parsed?.scores?.valueBuilt, 0),
    clarity: clamp(parsed?.scores?.clarity, 0),
    resignOffer: hasResign ? clamp(parsed?.scores?.resignOffer, 0) : 0,
  };

  const weighted = hasResign
    ? (scores.listening * 2 +
        scores.discovery +
        scores.accuracy * 1.5 +
        scores.valueBuilt +
        scores.clarity +
        scores.resignOffer * 2) /
      8.5
    : (scores.listening * 2 + scores.discovery + scores.accuracy * 1.5 + scores.valueBuilt + scores.clarity) /
      6.5;

  const overallScore = clamp(parsed?.overallScore, Math.round(weighted));

  const byId = new Map(
    (parsed?.detailChecks ?? []).map((check) => [String(check.id ?? ""), check] as const),
  );
  const detailChecks: DetailCheck[] = scenario.keyDetails.map((detail) => {
    const found = byId.get(detail.id);
    const status = found?.status;
    return {
      id: detail.id,
      label: detail.label,
      value: detail.value,
      status:
        status === "confirmed" || status === "captured" || status === "wrong" ? status : "missed",
      note: found?.note ?? "Never came up in the call.",
    };
  });

  const outcome: ServiceOutcome =
    parsed?.outcome === "resolved" || parsed?.outcome === "partial"
      ? parsed.outcome
      : parsed?.outcome === "mishandled"
        ? "mishandled"
        : overallScore >= 75
          ? "resolved"
          : overallScore >= 50
            ? "partial"
            : "mishandled";

  const coaching: ServiceCoaching = {
    summary: parsed?.coaching?.summary ?? "The call ended before there was much to grade.",
    didWell: parsed?.coaching?.didWell ?? [],
    missed: parsed?.coaching?.missed ?? [],
    nextTime: parsed?.coaching?.nextTime ?? [],
    experienceImpact: parsed?.coaching?.experienceImpact ?? [],
    resignNotes: hasResign ? (parsed?.coaching?.resignNotes ?? []) : [],
  };

  return { outcome, overallScore, scores, coaching, detailChecks };
}
