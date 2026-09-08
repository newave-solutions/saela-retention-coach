import { createFileRoute } from "@tanstack/react-router";

type SpeechBody = {
  text?: unknown;
  voice?: unknown;
  settings?: unknown;
};

const DEFAULT_VOICE = "CwhRBWXzGAHq8TQ4Fs17"; // Roger

const num = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export const Route = createFileRoute("/api/speech")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["ELEVENLABS_API_KEY"];
        if (!key) return new Response("Voice is not configured for this project.", { status: 401 });

        const body = (await request.json().catch(() => ({}))) as SpeechBody;
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
        if (!text) return new Response("Nothing to say.", { status: 400 });

        const voiceId =
          typeof body.voice === "string" && /^[A-Za-z0-9]{16,32}$/.test(body.voice)
            ? body.voice
            : DEFAULT_VOICE;

        const raw = (body.settings ?? {}) as Record<string, unknown>;
        const voice_settings = {
          stability: num(raw["stability"], 0.45, 0, 1),
          similarity_boost: num(raw["similarity_boost"], 0.8, 0, 1),
          style: num(raw["style"], 0.35, 0, 1),
          use_speaker_boost: raw["use_speaker_boost"] !== false,
          speed: num(raw["speed"], 1, 0.7, 1.2),
        };

        try {
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

          if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text().catch(() => "");
            console.error(`ElevenLabs TTS failed [${upstream.status}]: ${detail}`);
            return new Response(detail || "The voice service is unavailable.", {
              status: upstream.status || 502,
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          throw error;
        }
      },
    },
  },
});
