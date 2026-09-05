// Shared, client-safe scenario model for the retention simulator.

export const CANCEL_REASONS = [
  "competitor_switch",
  "affordability",
  "persistent_activity",
  "poor_experience",
  "agreement_dispute",
  "product_concerns",
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export const REASON_LABELS: Record<CancelReason, string> = {
  competitor_switch: "Switching providers",
  affordability: "Price / affordability",
  persistent_activity: "Pests still active",
  poor_experience: "Poor service experience",
  agreement_dispute: "Agreement dispute",
  product_concerns: "Product safety concerns",
};

export const DIFFICULTIES = ["standard", "hard", "brutal"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  standard: "Standard — firm but reachable",
  hard: "Hard — guarded, deflects generic offers",
  brutal: "Brutal — one shot, low patience",
};

export function labelForDifficulty(value: string): string {
  return DIFFICULTY_LABELS[value as Difficulty] ?? "Hard";
}

export const PERSONALITIES = [
  "guarded",
  "irritated",
  "polite_firm",
  "fast_talker",
  "distracted",
] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const PERSONALITY_LABELS: Record<Personality, string> = {
  guarded: "Guarded — short answers",
  irritated: "Irritated — already fed up",
  polite_firm: "Polite but firm",
  fast_talker: "Fast talker — talks over you",
  distracted: "Distracted — half listening",
};

/** The public half of a scenario. Safe to show the trainee mid-call. */
export type PublicScenario = {
  customerName: string;
  accountSummary: string;
  reason: CancelReason;
  reasonLabel: string;
  difficulty: Difficulty;
  personality: Personality;
  personalityLabel: string;
  openingLine: string;
};

/** The full scenario, including the hidden motive. Server + post-call reveal only. */
export type FullScenario = PublicScenario & {
  statedReason: string;
  hiddenMotive: string;
  emotionalDriver: string;
  saveConditions: string[];
  dealBreakers: string[];
  acceptableResolutions: string[];
};

export type TranscriptTurn = {
  speaker: "agent" | "customer";
  text: string;
  at: number;
};

export type CustomerResult = {
  reply: string;
  mood: "hostile" | "cold" | "neutral" | "warming" | "open";
  motiveUncovered: boolean;
  saveLikelihood: number; // 0-100
  callShouldEnd: boolean;
  endReason: "saved" | "partial" | "cancelled" | null;
};

export type ScoreBreakdown = {
  discovery: number;
  empathy: number;
  objectionHandling: number;
  offerFit: number;
  control: number;
};

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  discovery: "Discovery",
  empathy: "Empathy & acknowledgment",
  objectionHandling: "Objection handling",
  offerFit: "Offer fit",
  control: "Call control & listening",
};

export type Coaching = {
  summary: string;
  didWell: string[];
  missed: string[];
  nextTime: string[];
  hiddenMotive: string;
};

export type Outcome = "saved" | "partial" | "cancelled";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  saved: "Saved",
  partial: "Partial save",
  cancelled: "Cancelled",
};
