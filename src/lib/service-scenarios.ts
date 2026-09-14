// Client-safe model for the CES service-call training track.
import type { Difficulty, Personality, TranscriptTurn, VoiceAssignment } from "./scenarios";

export type { Difficulty, Personality, TranscriptTurn };

export const SERVICE_CALL_TYPES = [
  "reservice",
  "reschedule",
  "access_issue",
  "new_pest_issue",
  "unclear_need",
  "resign_out_of_agreement",
] as const;
export type ServiceCallType = (typeof SERVICE_CALL_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceCallType, string> = {
  reservice: "Reservice — still seeing activity",
  reschedule: "Reschedule a regular service",
  access_issue: "Reschedule — access problem",
  new_pest_issue: "Reservice — new pest issue",
  unclear_need: "Customer isn't sure what they need",
  resign_out_of_agreement: "Out of agreement — resign offer",
};

export function labelForServiceType(value: string): string {
  return SERVICE_TYPE_LABELS[value as ServiceCallType] ?? "Service call";
}

/** One checkable fact the caller drops into the conversation. */
export type KeyDetail = {
  id: string;
  label: string;
  value: string;
  /** Will the caller repeat it if the agent asks? Some details are said once and never again. */
  restates: boolean;
};

export type ResignTarget = {
  /** What the customer can genuinely afford per service. */
  budgetCeiling: string;
  /** Terms they would say yes to if the agent builds them. */
  acceptableTerms: string[];
  /** What makes them shut the conversation down. */
  dealBreakers: string[];
};

export type PublicServiceScenario = {
  customerName: string;
  accountSummary: string;
  callType: ServiceCallType;
  callTypeLabel: string;
  difficulty: Difficulty;
  personality: Personality;
  personalityLabel: string;
  openingLine: string;
  voice?: VoiceAssignment;
};

export type FullServiceScenario = PublicServiceScenario & {
  situation: string;
  keyDetails: KeyDetail[];
  valueOpportunities: string[];
  frustrationTriggers: string[];
  resign?: ResignTarget;
};

export type ServiceScoreBreakdown = {
  listening: number;
  discovery: number;
  accuracy: number;
  valueBuilt: number;
  clarity: number;
  resignOffer: number;
};

export const SERVICE_SCORE_LABELS: Record<keyof ServiceScoreBreakdown, string> = {
  listening: "Listening & recall",
  discovery: "Questions that opened them up",
  accuracy: "Accuracy of what was booked",
  valueBuilt: "Value built on their plan",
  clarity: "Clarity of the confirmation",
  resignOffer: "Resign offer",
};

export type DetailStatus = "confirmed" | "captured" | "missed" | "wrong";

export const DETAIL_STATUS_LABELS: Record<DetailStatus, string> = {
  confirmed: "Confirmed back",
  captured: "Heard, not confirmed",
  missed: "Missed",
  wrong: "Got it wrong",
};

export type DetailCheck = {
  id: string;
  label: string;
  value: string;
  status: DetailStatus;
  note: string;
};

export type ServiceCoaching = {
  summary: string;
  didWell: string[];
  missed: string[];
  nextTime: string[];
  experienceImpact: string[];
  resignNotes: string[];
};

export type ServiceOutcome = "resolved" | "partial" | "mishandled";

export const SERVICE_OUTCOME_LABELS: Record<ServiceOutcome, string> = {
  resolved: "Resolved",
  partial: "Partly resolved",
  mishandled: "Mishandled",
};

export function normalizeServiceScores(raw: unknown): ServiceScoreBreakdown | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, number | undefined>;
  const value = (key: keyof ServiceScoreBreakdown) =>
    typeof record[key] === "number" ? (record[key] as number) : 0;
  return {
    listening: value("listening"),
    discovery: value("discovery"),
    accuracy: value("accuracy"),
    valueBuilt: value("valueBuilt"),
    clarity: value("clarity"),
    resignOffer: value("resignOffer"),
  };
}
