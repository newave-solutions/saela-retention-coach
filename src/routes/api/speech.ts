import { createFileRoute } from "@tanstack/react-router";

type SpeechBody = {
  text?: unknown;
  voice?: unknown;
  provider?: unknown;
  instructions?: unknown;
  settings?: unknown;
};

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

/** Keep the same caller sounding like the same person when we fall back to the gateway. */
function gatewayVoiceFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GATEWAY_VOICE_LIST[hash % GATEWAY_VOICE_LIST.length] as string;
}

async function speakViaGateway(options: {
  text: string;
  voice: string;
  instructions?: string | undefined;
  speed: number;
  signal: AbortSignal;
}): Promise<Response> {
  const gatewayKey = process.env["LOVABLE_API_KEY"];
  if (!gatewayKey)
    return new Response("Voice is not configured for this project.", { status: 401 });

  const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${gatewayKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      voice: options.voice,
      input: options.text,
      response_format: "mp3",
      speed: options.speed,
      ...(options.instructions ? { instructions: options.instructions } : {}),
    }),
    signal: options.signal,
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`Gateway TTS failed [${upstream.status}]: ${detail}`);
    return new Response(detail || "The voice service is unavailable.", {
      status: upstream.status || 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, no-store",
    },
  });
}


export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as SpeechBody;
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
        if (!text) return new Response("Nothing to say.", { status: 400 });

        const provider = body.provider === "gateway" ? "gateway" : "elevenlabs";
        const instructions =
          typeof body.instructions === "string" ? body.instructions.slice(0, 800) : undefined;
        const raw = (body.settings ?? {}) as Record<string, unknown>;
        const speed = num(raw["speed"], 1, 0.7, 1.2);

        try {
          if (provider === "gateway") {
            const voice =
              typeof body.voice === "string" && GATEWAY_VOICES.has(body.voice)
                ? body.voice
                : "alloy";
            return await speakViaGateway({
              text,
              voice,
              instructions,
              speed,
              signal: request.signal,
            });
          }

          const voiceId =
            typeof body.voice === "string" && /^[A-Za-z0-9]{16,32}$/.test(body.voice)
              ? body.voice
              : DEFAULT_VOICE;

          const key = process.env["ELEVENLABS_API_KEY"];

          if (key) {
            const voice_settings = {
              stability: num(raw["stability"], 0.45, 0, 1),
              similarity_boost: num(raw["similarity_boost"], 0.8, 0, 1),
              style: num(raw["style"], 0.35, 0, 1),
              use_speaker_boost: raw["use_speaker_boost"] !== false,
              speed,
            };

            const upstream = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
              {
                method: "POST",
                headers: {
                  "xi-api-key": key,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  text,
                  model_id: "eleven_turbo_v2_5",
                  voice_settings,
                }),
                signal: request.signal,
              },
            );

            if (upstream.ok && upstream.body) {
              return new Response(upstream.body, {
                headers: {
                  "Content-Type": "audio/mpeg",
                  "Cache-Control": "private, no-store",
                },
              });
            }

            const detail = await upstream.text().catch(() => "");
            console.error(
              `ElevenLabs TTS failed [${upstream.status}]: ${detail} — falling back to gateway voice`,
            );
          } else {
            console.error("ElevenLabs key missing — using gateway voice");
          }

          // Quota exhausted, bad key, or provider outage: keep a real voice by using the gateway.
          return await speakViaGateway({
            text,
            voice: gatewayVoiceFor(voiceId),
            instructions,
            speed,
            signal: request.signal,
          });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }
      },
    },
  },
});
