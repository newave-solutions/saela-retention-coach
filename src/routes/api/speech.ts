import { createFileRoute } from "@tanstack/react-router";

type SpeechBody = {
  text?: unknown;
  voice?: unknown;
  provider?: unknown;
  google?: unknown;
  instructions?: unknown;
  settings?: unknown;
};

type ProviderName = "elevenlabs" | "google" | "gateway";

const DEFAULT_VOICE = "CwhRBWXzGAHq8TQ4Fs17"; // Roger

const GATEWAY_VOICE_LIST = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
] as const;

const GATEWAY_VOICES = new Set<string>(GATEWAY_VOICE_LIST);

const num = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;

/** Keep the same caller sounding like the same person across services. */
function hashOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

function gatewayVoiceFor(seed: string): string {
  return GATEWAY_VOICE_LIST[hashOf(seed) % GATEWAY_VOICE_LIST.length] as string;
}

/**
 * Short-lived memory of which voice services are out of credits, unconfigured
 * or rate limited, so we skip them instead of retrying on every single line.
 */
const unhealthyUntil = new Map<ProviderName, number>();
const UNHEALTHY_MS = 10 * 60 * 1000;

const isHealthy = (provider: ProviderName) => (unhealthyUntil.get(provider) ?? 0) < Date.now();

function markUnhealthy(provider: ProviderName, status: number) {
  // 401/402/403/429 are persistent account problems; transient 5xx is not cached.
  if ([401, 402, 403, 429].includes(status)) {
    unhealthyUntil.set(provider, Date.now() + UNHEALTHY_MS);
  }
}

type SpeakOptions = {
  text: string;
  seed: string;
  googleVoice?: string | undefined;
  elevenVoice: string;
  instructions?: string | undefined;
  settings: Record<string, unknown>;
  signal: AbortSignal;
};

type SpeakResult = { ok: true; response: Response } | { ok: false; status: number; detail: string };

function audioResponse(body: BodyInit, provider: ProviderName): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, no-store",
      "X-Voice-Provider": provider,
      "Access-Control-Expose-Headers": "X-Voice-Provider",
    },
  });
}

async function speakViaElevenLabs(options: SpeakOptions): Promise<SpeakResult> {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) return { ok: false, status: 401, detail: "ElevenLabs is not configured." };

  const raw = options.settings;
  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${options.elevenVoice}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: options.text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: num(raw["stability"], 0.45, 0, 1),
          similarity_boost: num(raw["similarity_boost"], 0.8, 0, 1),
          style: num(raw["style"], 0.35, 0, 1),
          use_speaker_boost: raw["use_speaker_boost"] !== false,
          speed: num(raw["speed"], 1, 0.7, 1.2),
        },
      }),
      signal: options.signal,
    },
  );

  if (upstream.ok && upstream.body)
    return { ok: true, response: audioResponse(upstream.body, "elevenlabs") };

  const detail = await upstream.text().catch(() => "");
  return { ok: false, status: upstream.status || 502, detail };
}

async function speakViaGoogle(options: SpeakOptions): Promise<SpeakResult> {
  const key = process.env["GOOGLE_TTS_API_KEY"];
  if (!key) return { ok: false, status: 401, detail: "Google text-to-speech is not configured." };

  // Only speak here when this caller has a matching Google voice of the right
  // accent and gender; otherwise skip so the persona is never re-gendered.
  const name = options.googleVoice;
  if (!name) return { ok: false, status: 501, detail: "No matching Google voice for this caller." };
  const languageCode = name.split("-").slice(0, 2).join("-");
  const speed = num(options.settings["speed"], 1, 0.7, 1.2);
  // Agitated callers read a little higher; calm ones a little lower.
  const pitch = (num(options.settings["style"], 0.35, 0, 1) - 0.35) * 4;

  const upstream = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text: options.text },
        voice: { languageCode, name },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: speed,
          pitch,
          effectsProfileId: ["telephony-class-application"],
        },
      }),
      signal: options.signal,
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return { ok: false, status: upstream.status || 502, detail };
  }

  const payload = (await upstream.json().catch(() => ({}))) as { audioContent?: string };
  if (!payload.audioContent) return { ok: false, status: 502, detail: "Google returned no audio." };

  const bytes = Buffer.from(payload.audioContent, "base64");
  return { ok: true, response: audioResponse(bytes, "google") };
}

async function speakViaGateway(options: SpeakOptions): Promise<SpeakResult> {
  const gatewayKey = process.env["LOVABLE_API_KEY"];
  if (!gatewayKey) return { ok: false, status: 401, detail: "Voice is not configured." };

  const voice = GATEWAY_VOICES.has(options.elevenVoice)
    ? options.elevenVoice
    : gatewayVoiceFor(options.seed);

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${gatewayKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      voice,
      input: options.text,
      response_format: "mp3",
      speed: num(options.settings["speed"], 1, 0.7, 1.2),
      ...(options.instructions ? { instructions: options.instructions } : {}),
    }),
    signal: options.signal,
  });

  if (upstream.ok && upstream.body)
    return { ok: true, response: audioResponse(upstream.body, "gateway") };

  const detail = await upstream.text().catch(() => "");
  return { ok: false, status: upstream.status || 502, detail };
}

const ADAPTERS: Record<ProviderName, (options: SpeakOptions) => Promise<SpeakResult>> = {
  elevenlabs: speakViaElevenLabs,
  google: speakViaGoogle,
  gateway: speakViaGateway,
};

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as SpeechBody;
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
        if (!text) return new Response("Nothing to say.", { status: 400 });

        const requested: ProviderName =
          body.provider === "gateway"
            ? "gateway"
            : body.provider === "google"
              ? "google"
              : "elevenlabs";

        const elevenVoice =
          typeof body.voice === "string" && /^[A-Za-z0-9]{3,32}$/.test(body.voice)
            ? body.voice
            : DEFAULT_VOICE;

        const options: SpeakOptions = {
          text,
          seed: elevenVoice,
          elevenVoice,
          googleVoice: typeof body.google === "string" ? body.google : undefined,
          instructions:
            typeof body.instructions === "string" ? body.instructions.slice(0, 800) : undefined,
          settings: (body.settings ?? {}) as Record<string, unknown>,
          signal: request.signal,
        };

        // Requested service first, then the closest available stand-in.
        const order: ProviderName[] = [
          requested,
          ...(["elevenlabs", "google", "gateway"] as ProviderName[]).filter((p) => p !== requested),
        ];
        const healthy = order.filter(isHealthy);
        const chain = healthy.length > 0 ? healthy : order;

        let lastStatus = 502;
        let lastDetail = "The voice service is unavailable.";

        try {
          for (const provider of chain) {
            const result = await ADAPTERS[provider](options);
            if (result.ok) return result.response;
            markUnhealthy(provider, result.status);
            lastStatus = result.status;
            lastDetail = result.detail;
            console.error(`${provider} TTS failed [${result.status}]: ${result.detail}`);
          }
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }

        return new Response(lastDetail || "The voice service is unavailable.", {
          status: lastStatus,
        });
      },
    },
  },
});
