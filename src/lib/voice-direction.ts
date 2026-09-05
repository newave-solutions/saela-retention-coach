// Client-safe mapping from scenario + live mood to an ElevenLabs voice and delivery settings.
import type { CustomerResult, Difficulty, Personality, PublicScenario } from "./scenarios";

export type Mood = CustomerResult["mood"];

export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
};

/** Curated ElevenLabs voices that read as ordinary residential customers. */
export const ELEVENLABS_VOICES = [
  "CwhRBWXzGAHq8TQ4Fs17", // Roger
  "EXAVITQu4vr4xnSDxMaL", // Sarah
  "FGY2WhTYpPnrIDTdsKH5", // Laura
  "IKne3meq5aSn9XLyUdCD", // Charlie
  "JBFqnCBsd6RMkjVDRZzb", // George
  "N2lVS1w4EtoT3dr4eOWO", // Callum
  "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "XrExE9yKIg1WjnnlVkGX", // Matilda
  "bIHbv24MWmeRgasZH58o", // Will
  "cjVigY5qzO86Huf0OWal", // Eric
  "nPczCjzI2devNBz1zQrb", // Brian
  "pFZP5JQG7iQjIQuC4Bku", // Lily
] as const;

/** Stable voice for a given customer, so they sound like the same person all call. */
export function voiceForScenario(scenario: Pick<PublicScenario, "customerName">): string {
  let hash = 0;
  for (const char of scenario.customerName) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  return ELEVENLABS_VOICES[hash % ELEVENLABS_VOICES.length] ?? ELEVENLABS_VOICES[0];
}

type Delta = { stability: number; style: number; speed: number };

const PERSONALITY_DELTA: Record<Personality, Delta> = {
  guarded: { stability: 0.15, style: -0.1, speed: -0.04 },
  irritated: { stability: -0.2, style: 0.2, speed: 0.05 },
  polite_firm: { stability: 0.2, style: 0.0, speed: 0.0 },
  fast_talker: { stability: -0.15, style: 0.15, speed: 0.14 },
  distracted: { stability: 0.05, style: -0.05, speed: -0.06 },
};

const DIFFICULTY_DELTA: Record<Difficulty, Delta> = {
  standard: { stability: 0.05, style: 0.0, speed: 0.0 },
  hard: { stability: -0.05, style: 0.08, speed: 0.02 },
  brutal: { stability: -0.15, style: 0.18, speed: 0.06 },
};

const MOOD_DELTA: Record<Mood, Delta> = {
  hostile: { stability: -0.25, style: 0.3, speed: 0.1 },
  cold: { stability: 0.1, style: -0.05, speed: -0.03 },
  neutral: { stability: 0.0, style: 0.0, speed: 0.0 },
  warming: { stability: 0.12, style: 0.05, speed: -0.04 },
  open: { stability: 0.2, style: 0.1, speed: -0.06 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Emotion is carried by the delivery settings rather than a written instruction. */
export function settingsFor(
  scenario: Pick<PublicScenario, "personality" | "difficulty">,
  mood: Mood,
): VoiceSettings {
  const parts = [
    PERSONALITY_DELTA[scenario.personality] ?? PERSONALITY_DELTA.guarded,
    DIFFICULTY_DELTA[scenario.difficulty] ?? DIFFICULTY_DELTA.hard,
    MOOD_DELTA[mood] ?? MOOD_DELTA.neutral,
  ];

  let stability = 0.45;
  let style = 0.35;
  let speed = 1.0;
  for (const part of parts) {
    stability += part.stability;
    style += part.style;
    speed += part.speed;
  }

  return {
    stability: clamp(stability, 0.1, 0.9),
    similarity_boost: 0.8,
    style: clamp(style, 0, 0.85),
    use_speaker_boost: true,
    speed: clamp(speed, 0.75, 1.18),
  };
}

/**
 * Light punctuation shaping so lines land with phone-call rhythm: an audible
 * beat before a pushback, a trailing-off feel when the caller is distracted.
 */
export function shapeLine(
  text: string,
  scenario: Pick<PublicScenario, "personality">,
  mood: Mood,
): string {
  let shaped = text.trim();
  if (mood === "hostile" || scenario.personality === "irritated") {
    shaped = shaped.replace(/^(Look|Listen|Honestly|No|Yeah)\b/i, "$1 —");
  }
  if (scenario.personality === "distracted") {
    shaped = shaped.replace(/^(\w+),\s/, "$1... ");
  }
  if (mood === "warming" || mood === "open") {
    shaped = shaped.replace(/^(Well|Okay|Alright|I mean)\b/i, "$1...");
  }
  return shaped;
}
