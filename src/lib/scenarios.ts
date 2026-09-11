// Shared, client-safe scenario model for the Saela Way retention simulator.

export const CANCEL_REASONS = [
  "competitor_switch",
  "affordability",
  "persistent_activity",
  "poor_experience",
  "agreement_dispute",
  "product_concerns",
  "moved_moving",
  "no_activity",
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export const REASON_LABELS: Record<CancelReason, string> = {
  competitor_switch: "Switchover",
  affordability: "Price / affordability",
  persistent_activity: "Still seeing activity",
  poor_experience: "Poor experience",
  agreement_dispute: "Agreement dispute",
  product_concerns: "Product safety concerns",
  moved_moving: "Moved / moving",
  no_activity: "No longer seeing activity",
};

export const DIFFICULTIES = ["standard", "hard", "brutal"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  standard: "Standard — firm, deflects the easy stuff",
  hard: "Hard — guarded, punishes scripted lines",
  brutal: "Brutal — one shot, hangs up fast",
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
  "steamroller",
  "detonator",
  "drive_by",
  "stonewaller",
  "bargain_hunter",
] as const;
export type Personality = (typeof PERSONALITIES)[number];

export const PERSONALITY_LABELS: Record<Personality, string> = {
  guarded: "Guarded — short answers",
  irritated: "Irritated — already fed up",
  polite_firm: "Polite but immovable",
  fast_talker: "Fast talker — jumps ahead",
  distracted: "Distracted — half listening",
  steamroller: "Steamroller — talks over you",
  detonator: "Detonator — furious from hello",
  drive_by: "Drive-by — states it and goes",
  stonewaller: "Stonewaller — gives you nothing",
  bargain_hunter: "Bargain hunter — it's all price",
};

export function labelForPersonality(value: string): string {
  return PERSONALITY_LABELS[value as Personality] ?? "Guarded";
}

/** The voice this caller speaks with, chosen on the backend when the call starts. */
export type VoiceAssignment = {
  id: string;
  provider: "elevenlabs" | "gateway";
  gender: "male" | "female";
  accentLabel: string;
  instructions?: string;
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
  voice?: VoiceAssignment;
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

/** Scored against the Saela Way: Gratitude, Empathy, Ownership, Clarity — plus negotiation. */
export type ScoreBreakdown = {
  gratitude: number;
  empathy: number;
  ownership: number;
  clarity: number;
  negotiation: number;
};

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  gratitude: "Gratitude",
  empathy: "Empathy",
  ownership: "Ownership",
  clarity: "Clarity",
  negotiation: "Negotiation & control",
};

/** Older calls were stored with the previous category keys — map them in order. */
export function normalizeScores(raw: unknown): ScoreBreakdown | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, number | undefined>;
  const value = (...keys: string[]) => {
    for (const key of keys) {
      const n = record[key];
      if (typeof n === "number") return n;
    }
    return 0;
  };
  return {
    gratitude: value("gratitude", "discovery"),
    empathy: value("empathy"),
    ownership: value("ownership", "objectionHandling"),
    clarity: value("clarity", "offerFit"),
    negotiation: value("negotiation", "control"),
  };
}

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
