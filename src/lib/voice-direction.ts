// Client-safe roster of caller voices plus mapping from scenario + live mood to delivery settings.
import type {
  CustomerResult,
  Difficulty,
  Personality,
  PublicScenario,
  VoiceAssignment,
} from "./scenarios";

export type Mood = CustomerResult["mood"];

export type VoiceSettings = {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
  speed: number;
};

export type NameGroup = "american" | "indian" | "arabic" | "british" | "australian";

export type RosterVoice = {
  id: string;
  provider: "elevenlabs" | "gateway";
  gender: "male" | "female";
  accentLabel: string;
  nameGroup: NameGroup;
  weight: number;
  /** Delivery direction for gateway voices, which carry the accent through instruction. */
  instructions?: string;
};

/**
 * ElevenLabs covers general American / British / Australian callers. The
 * regional-American, Indian and Arabic accents come from the built-in
 * expressive engine, which takes accent direction per line.
 */
export const VOICE_ROSTER: readonly RosterVoice[] = [
  // --- ElevenLabs: general American ---
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "N2lVS1w4EtoT3dr4eOWO",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "TX3LPaxmHKxFdv7VOQHJ",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "bIHbv24MWmeRgasZH58o",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "cgSgspJ2msm6clMCkdW9",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "cjVigY5qzO86Huf0OWal",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "hpp4J3VqNfWAUOO0d1Us",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "iP95p4xoKVk53GoZ742B",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 3,
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 2,
  },
  {
    id: "pqHfZKP75CvOlQylNhV4",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 2,
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "American",
    nameGroup: "american",
    weight: 2,
  },

  // --- ElevenLabs: British / Australian ---
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "British",
    nameGroup: "british",
    weight: 1,
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "British",
    nameGroup: "british",
    weight: 1,
  },
  {
    id: "onwK4e9ZLuTAKqWW03F9",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "British",
    nameGroup: "british",
    weight: 1,
  },
  {
    id: "pFZP5JQG7iQjIQuC4Bku",
    provider: "elevenlabs",
    gender: "female",
    accentLabel: "British",
    nameGroup: "british",
    weight: 1,
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    provider: "elevenlabs",
    gender: "male",
    accentLabel: "Australian",
    nameGroup: "australian",
    weight: 1,
  },

  // --- Gateway: regional American ---
  {
    id: "ash",
    provider: "gateway",
    gender: "male",
    accentLabel: "Southern US",
    nameGroup: "american",
    weight: 3,
    instructions:
      "Speak with a warm Deep South American accent (Alabama/Georgia), drawled vowels, unhurried.",
  },
  {
    id: "coral",
    provider: "gateway",
    gender: "female",
    accentLabel: "Southern US",
    nameGroup: "american",
    weight: 3,
    instructions:
      "Speak with a Southern American accent (Tennessee/Georgia), soft drawl, polite but pointed.",
  },
  {
    id: "echo",
    provider: "gateway",
    gender: "male",
    accentLabel: "Midwestern US",
    nameGroup: "american",
    weight: 3,
    instructions:
      "Speak with an Upper Midwest American accent (Minnesota/Wisconsin), flat vowels, plainspoken.",
  },
  {
    id: "nova",
    provider: "gateway",
    gender: "female",
    accentLabel: "Midwestern US",
    nameGroup: "american",
    weight: 3,
    instructions:
      "Speak with a Midwestern American accent (Ohio/Michigan), clipped friendly delivery.",
  },
  {
    id: "onyx",
    provider: "gateway",
    gender: "male",
    accentLabel: "New York / Northeast",
    nameGroup: "american",
    weight: 3,
    instructions: "Speak with a New York City accent, fast, direct, impatient rhythm.",
  },
  {
    id: "sage",
    provider: "gateway",
    gender: "female",
    accentLabel: "New York / Northeast",
    nameGroup: "american",
    weight: 2,
    instructions: "Speak with a Northeast US accent (Boston/New Jersey), quick and no-nonsense.",
  },
  {
    id: "ballad",
    provider: "gateway",
    gender: "male",
    accentLabel: "Texas / Southwest",
    nameGroup: "american",
    weight: 2,
    instructions: "Speak with a Texan American accent, slow and steady, dry delivery.",
  },
  {
    id: "shimmer",
    provider: "gateway",
    gender: "female",
    accentLabel: "Texas / Southwest",
    nameGroup: "american",
    weight: 2,
    instructions: "Speak with a Texan American accent, friendly twang, firm underneath.",
  },
  {
    id: "alloy",
    provider: "gateway",
    gender: "female",
    accentLabel: "West Coast US",
    nameGroup: "american",
    weight: 2,
    instructions: "Speak with a California West Coast American accent, relaxed and casual.",
  },
  {
    id: "verse",
    provider: "gateway",
    gender: "male",
    accentLabel: "West Coast US",
    nameGroup: "american",
    weight: 2,
    instructions: "Speak with a West Coast American accent, laid-back but losing patience.",
  },

  // --- Gateway: Indian English ---
  {
    id: "ash",
    provider: "gateway",
    gender: "male",
    accentLabel: "Indian English",
    nameGroup: "indian",
    weight: 3,
    instructions:
      "Speak English with a clear Indian accent (North Indian), precise consonants, rising sentence rhythm.",
  },
  {
    id: "verse",
    provider: "gateway",
    gender: "male",
    accentLabel: "Indian English",
    nameGroup: "indian",
    weight: 2,
    instructions: "Speak English with a South Indian accent, quick and articulate.",
  },
  {
    id: "nova",
    provider: "gateway",
    gender: "female",
    accentLabel: "Indian English",
    nameGroup: "indian",
    weight: 3,
    instructions: "Speak English with an Indian accent, crisp diction, polite but insistent.",
  },
  {
    id: "sage",
    provider: "gateway",
    gender: "female",
    accentLabel: "Indian English",
    nameGroup: "indian",
    weight: 2,
    instructions: "Speak English with an Indian accent, warm tone, fast when frustrated.",
  },

  // --- Gateway: Arabic-accented English ---
  {
    id: "onyx",
    provider: "gateway",
    gender: "male",
    accentLabel: "Arabic-accented English",
    nameGroup: "arabic",
    weight: 3,
    instructions:
      "Speak English with a Middle Eastern Arabic accent (Levantine), heavier consonants, measured pace.",
  },
  {
    id: "ballad",
    provider: "gateway",
    gender: "male",
    accentLabel: "Arabic-accented English",
    nameGroup: "arabic",
    weight: 2,
    instructions: "Speak English with a Gulf Arabic accent, formal and deliberate.",
  },
  {
    id: "shimmer",
    provider: "gateway",
    gender: "female",
    accentLabel: "Arabic-accented English",
    nameGroup: "arabic",
    weight: 3,
    instructions: "Speak English with an Arabic accent (Egyptian), expressive and emphatic.",
  },
  {
    id: "coral",
    provider: "gateway",
    gender: "female",
    accentLabel: "Arabic-accented English",
    nameGroup: "arabic",
    weight: 2,
    instructions: "Speak English with a Levantine Arabic accent, soft-spoken but firm.",
  },
] as const;

const keyOf = (voice: Pick<RosterVoice, "id" | "provider" | "accentLabel">) =>
  `${voice.provider}:${voice.id}:${voice.accentLabel}`;

export function voiceKey(voice: Pick<VoiceAssignment, "id" | "provider" | "accentLabel">): string {
  return keyOf(voice);
}

/** Weighted random pick, skipping voices used on the trainee's recent calls. */
export function pickVoice(options?: { exclude?: readonly string[] }): RosterVoice {
  const exclude = new Set(options?.exclude ?? []);
  let pool = VOICE_ROSTER.filter((voice) => !exclude.has(keyOf(voice)));
  if (pool.length === 0) pool = [...VOICE_ROSTER];

  const total = pool.reduce((sum, voice) => sum + voice.weight, 0);
  let ticket = Math.random() * total;
  for (const voice of pool) {
    ticket -= voice.weight;
    if (ticket <= 0) return voice;
  }
  return pool[pool.length - 1] as RosterVoice;
}

export function toAssignment(voice: RosterVoice): VoiceAssignment {
  return {
    id: voice.id,
    provider: voice.provider,
    gender: voice.gender,
    accentLabel: voice.accentLabel,
    ...(voice.instructions ? { instructions: voice.instructions } : {}),
  };
}

/** Fallback for older sessions saved before voices were assigned on the backend. */
export function voiceForScenario(scenario: Pick<PublicScenario, "customerName">): VoiceAssignment {
  let hash = 0;
  for (const char of scenario.customerName) hash = (hash * 31 + char.charCodeAt(0)) % 100000;
  const voice = VOICE_ROSTER[hash % VOICE_ROSTER.length] ?? VOICE_ROSTER[0];
  return toAssignment(voice as RosterVoice);
}

type Delta = { stability: number; style: number; speed: number };

const PERSONALITY_DELTA: Record<Personality, Delta> = {
  guarded: { stability: 0.15, style: -0.1, speed: -0.04 },
  irritated: { stability: -0.2, style: 0.2, speed: 0.05 },
  polite_firm: { stability: 0.2, style: 0.0, speed: 0.0 },
  fast_talker: { stability: -0.15, style: 0.15, speed: 0.14 },
  distracted: { stability: 0.05, style: -0.05, speed: -0.06 },
  steamroller: { stability: -0.22, style: 0.25, speed: 0.12 },
  detonator: { stability: -0.3, style: 0.35, speed: 0.1 },
  drive_by: { stability: 0.0, style: 0.05, speed: 0.12 },
  stonewaller: { stability: 0.25, style: -0.2, speed: -0.08 },
  bargain_hunter: { stability: -0.05, style: 0.12, speed: 0.06 },
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

const MOOD_DIRECTION: Record<Mood, string> = {
  hostile: "furious and loud, clipped, cutting the agent off",
  cold: "flat, guarded, unimpressed",
  neutral: "matter-of-fact, slightly impatient",
  warming: "softening, starting to listen",
  open: "relaxed, cooperative, relieved",
};

/** Accent direction plus live emotion, for the gateway voices. */
export function instructionsFor(
  voice: Pick<VoiceAssignment, "instructions">,
  scenario: Pick<PublicScenario, "personality" | "difficulty">,
  mood: Mood,
): string {
  const parts = [
    voice.instructions ?? "Speak with a natural American accent.",
    `Emotion: ${MOOD_DIRECTION[mood] ?? MOOD_DIRECTION.neutral}.`,
    "You are a residential pest control customer on the phone wanting to cancel. Sound like a real person on a phone call, not a narrator.",
  ];
  if (scenario.difficulty === "brutal") parts.push("Push hard; very little patience.");
  return parts.join(" ");
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
