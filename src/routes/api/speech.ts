import { createFileRoute } from "@tanstack/react-router";

type SpeechBody = {
  text?: unknown;
  voice?: unknown;
  instructions?: unknown;
};

const VOICES = new Set([
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
]);

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Voice is not configured for this project.", { status: 401 });

        const body = (await request.json().catch(() => ({}))) as SpeechBody;
        const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
        if (!text) return new Response("Nothing to say.", { status: 400 });

        const voice = typeof body.voice === "string" && VOICES.has(body.voice) ? body.voice : "ash";
        const instructions =
          typeof body.instructions === "string" ? body.instructions.slice(0, 1500) : undefined;

        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o-mini-tts",
              input: text,
              voice,
              ...(instructions ? { instructions } : {}),
              stream_format: "sse",
              response_format: "pcm",
            }),
            signal: request.signal,
          });

          if (!upstream.ok || !upstream.body) {
            const detail = await upstream.text().catch(() => "");
            return new Response(detail || "The voice service is unavailable.", {
              status: upstream.status || 502,
            });
          }

          return new Response(upstream.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
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
