// Client-safe model for the CES service-call training track.
import type { Difficulty, Personality, TranscriptTurn, VoiceAssignment } from "./scenarios";

export type { Difficulty, Personality, TranscriptTurn };

export const SERVICE_CALL_TYPES = [
  "reservice",
  "reschedule",
  "access_issue",
  "new_pest_issue",
  "coverage_question",
  "unclear_need",
  "resign_out_of_agreement",
] as const;
export type ServiceCallType = (typeof SERVICE_CALL_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceCallType, string> = {
  reservice: "Reservice — still seeing activity",
  reschedule: "Reschedule a regular service",
  access_issue: "Reschedule — access problem",
  new_pest_issue: "Reservice — new pest issue",
  coverage_question: "Coverage & pricing question",
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

/** An opening the agent can only surface by engaging — never shown mid-call. */
export type HiddenOpportunity = {
  id: string;
  label: string;
  /** The thing the customer says or implies that hints at it. */
  signal: string;
  /** What a strong CES agent does with it. */
  goodMove: string;
  /** Where this leads if handled well. */
  kind: "coverage" | "resign" | "sales_transfer";
};

export type OpportunityStatus = "found" | "partial" | "missed";

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  found: "Found and worked",
  partial: "Noticed, not developed",
  missed: "Missed",
};

export type OpportunityCheck = {
  id: string;
  label: string;
  kind: HiddenOpportunity["kind"];
  status: OpportunityStatus;
  note: string;
};

/** Hidden: whether this caller could be resigned, and how hard they are to win. */
export type ResignEligibility = {
  /** Paying service to service with no agreement in place. */
  serviceToService: boolean;
  /** Signals the agent can pick up on. */
  signals: string[];
  /** What they can genuinely carry per service. */
  budgetCeiling: string;
  acceptableTerms: string[];
  dealBreakers: string[];
  /** How many things the agent must get right before they'll even consider it. */
  requiredSteps: number;
};

export type ResignTarget = {
  /** What the customer can genuinely afford per service. */
  budgetCeiling: string;
  /** Terms they would say yes to if the agent builds them. */
  acceptableTerms: string[];
  /** What makes them shut the conversation down. */
  dealBreakers: string[];
};

export type LanguageFlag = {
  phrase: string;
  turn: number;
  why: string;
  rewrite: string;
  severity: "low" | "medium" | "high";
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
  hiddenOpportunities?: HiddenOpportunity[];
  resignEligibility?: ResignEligibility;
  resign?: ResignTarget;
};

export type ServiceScoreBreakdown = {
  listening: number;
  discovery: number;
  accuracy: number;
  valueBuilt: number;
  clarity: number;
  resignOffer: number;
  salesTransfer: number;
  languageTone: number;
};

export const SERVICE_SCORE_LABELS: Record<keyof ServiceScoreBreakdown, string> = {
  listening: "Listening & recall",
  discovery: "Questions that opened them up",
  accuracy: "Accuracy of what was booked",
  valueBuilt: "Value built on their plan",
  clarity: "Clarity of the confirmation",
  resignOffer: "Resign offer",
  salesTransfer: "Warm handoff to sales",
  languageTone: "Wording & tone",
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
  salesNotes?: string[];
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
    salesTransfer: value("salesTransfer"),
    languageTone: value("languageTone"),
  };
}
