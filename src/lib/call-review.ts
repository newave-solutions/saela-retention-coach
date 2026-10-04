export type ReviewAnswer = "yes" | "partial" | "no" | "not_observed";

export type CallReviewItem = {
  id: string;
  answer: ReviewAnswer;
  note: string;
};

export const REVIEW_QUESTIONS = [
  { id: "greeting", label: "Did the agent open with a clear, welcoming greeting?" },
  { id: "empathy", label: "Did the agent acknowledge how the customer felt?" },
  { id: "listening", label: "Did the agent listen, ask, and confirm the real concern?" },
  { id: "value", label: "Did the agent connect service value to this customer's needs?" },
  { id: "resolution", label: "Did the agent offer a fitting solution or mediate the concern?" },
  { id: "terms", label: "Were next steps, pricing, and ownership made clear?" },
  { id: "satisfied", label: "Did the customer indicate the resolution was satisfactory?" },
  { id: "agreement", label: "Was a mutually acceptable arrangement reached?" },
  { id: "hangup", label: "Did the customer end the call abruptly?" },
  { id: "angry_exit", label: "Did the customer leave angry or disengage?" },
] as const;

export function normalizeCallReview(raw: unknown): CallReviewItem[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<string, CallReviewItem>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    if (typeof entry['id'] !== "string" || !REVIEW_QUESTIONS.some((q) => q.id === entry['id'])) continue;
    const answer = entry['answer'];
    if (answer !== "yes" && answer !== "partial" && answer !== "no" && answer !== "not_observed") continue;
    byId.set(entry['id'], {
      id: entry['id'],
      answer,
      note: typeof entry['note'] === "string" ? entry['note'].slice(0, 400) : "",
    });
  }
  return REVIEW_QUESTIONS.map(({ id }) => byId.get(id) ?? { id, answer: "not_observed", note: "Not enough evidence from this call." });
}