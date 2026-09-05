// Client-safe mapping from scenario + live mood to a voice and spoken direction.
import type { CustomerResult, Difficulty, Personality, PublicScenario } from "./scenarios";

export type Mood = CustomerResult["mood"];

const VOICES = ["ash", "ballad", "coral", "sage", "verse", "alloy", "echo", "shimmer"] as const;

/** Stable voice for a given customer, so they sound like the same person all call. */
export function voiceForScenario(scenario: Pick<PublicScenario, "customerName">): string {
  let hash = 0;
  for (const char of scenario.customerName) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return VOICES[hash % VOICES.length];
}

const PERSONALITY_DIRECTION: Record<Personality, string> = {
  guarded: "Guarded and reserved. Short, flat sentences. You hold back.",
  irritated: "Irritated and fed up. Clipped, sharp, an audible sigh here and there.",
  polite_firm: "Polite and warm on the surface, but completely immovable underneath.",
  fast_talker: "Fast and restless. Words run together, you rush ahead of the other person.",
  distracted: "Half-distracted, doing something else. Trailing off, a little vague.",
};

const DIFFICULTY_DIRECTION: Record<Difficulty, string> = {
  standard: "Tone is firm but reachable.",
  hard: "Tone is skeptical and a little tired of being sold to.",
  brutal: "Tone is tense and impatient, like you're seconds from hanging up.",
};

const MOOD_DIRECTION: Record<Mood, string> = {
  hostile: "Right now you're angry — louder, faster, cutting.",
  cold: "Right now you're cold and closed off — quiet, clipped, unimpressed.",
  neutral: "Right now you're matter-of-fact and businesslike.",
  warming: "Right now you're softening slightly — a little slower, a little more human.",
  open: "Right now you're genuinely relieved and open — warmer, easier, more relaxed.",
};

export function directionFor(
  scenario: Pick<PublicScenario, "personality" | "difficulty">,
  mood: Mood,
): string {
  return [
    "You are a real person on a phone call with a customer service agent, calling to cancel your pest control service.",
    PERSONALITY_DIRECTION[scenario.personality] ?? PERSONALITY_DIRECTION.guarded,
    DIFFICULTY_DIRECTION[scenario.difficulty] ?? DIFFICULTY_DIRECTION.hard,
    MOOD_DIRECTION[mood] ?? MOOD_DIRECTION.neutral,
    "Speak naturally and conversationally with real emotion, breaths and hesitation — never like a narrator or announcer. Normal phone-call pace.",
  ].join(" ");
}
