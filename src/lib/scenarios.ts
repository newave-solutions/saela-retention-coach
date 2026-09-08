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

/** Who is on the call, and what they are allowed to give away. */
export const AUTHORITY_ROLES = ["ces", "cem"] as const;
export type AuthorityRole = (typeof AUTHORITY_ROLES)[number];

export const AUTHORITY_ROLE_LABELS: Record<AuthorityRole, string> = {
  ces: "Specialist (CES)",
  cem: "Manager (CEM)",
};

export type AuthorityLimits = {
  role: AuthorityRole;
  label: string;
  priceFloor: string;
  discount: string;
  scheduling: string;
  contract: string;
  switchover: string;
  rescission: string;
};

export const AUTHORITY_LIMITS: Record<AuthorityRole, AuthorityLimits> = {
  ces: {
    role: "ces",
    label: "Specialist (CES)",
    priceFloor: "$124.99 minimum Protection Program price",
    discount: "Up to 30% off the next regular service",
    scheduling: "Up to a 2-week delay, staying inside the current month",
    contract: "Change frequency OR length — never both",
    switchover: "$109.99 minimum; $99.99 only to match a verified competitor offer",
    rescission: "$114.99 floor for 3-day window / pre-initial saves",
  },
  cem: {
    role: "cem",
    label: "Manager (CEM)",
    priceFloor: "$109.99 minimum Protection Program price",
    discount: "Up to 50% off, or a flat $80 off the next regular service",
    scheduling: "Any day within the current month",
    contract: "Change frequency OR length — never both",
    switchover: "$104.99 minimum; $80 flat match limit for a competitor offer",
    rescission: "$109.99 floor, plus free-service authority",
  },
};

export function limitsFor(role: string | undefined | null): AuthorityLimits {
  return AUTHORITY_LIMITS[(role as AuthorityRole) ?? "ces"] ?? AUTHORITY_LIMITS.ces;
}

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
  authorityRole: AuthorityRole;
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

/** GEOC pillars plus discovery — the standard the floor coaches to. */
export type ScoreBreakdown = {
  gratitude: number;
  empathy: number;
  ownership: number;
  clarity: number;
  discovery: number;
};

export const SCORE_LABELS: Record<keyof ScoreBreakdown, string> = {
  gratitude: "Gratitude",
  empathy: "Empathy",
  ownership: "Ownership",
  clarity: "Clarity",
  discovery: "Discovery / root cause",
};

/** Older calls were graded on the previous categories. Keep them readable. */
export const LEGACY_SCORE_LABELS: Record<string, string> = {
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
  /** Non-financial retention attempts made before the first money offer. */
  attemptsBeforeOffer?: number;
  /** Anything offered outside the agent's authority limits. */
  authorityBreaches?: string[];
  /** Whether the call warranted handing off to a manager. */
  escalationWarranted?: boolean;
};

export type Outcome = "saved" | "partial" | "cancelled";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  saved: "Saved",
  partial: "Partial save",
  cancelled: "Cancelled",
};

