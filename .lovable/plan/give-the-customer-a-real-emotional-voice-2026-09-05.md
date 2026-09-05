# Give the customer a real, emotional voice

Right now the customer talks through the browser's built-in robotic voice. This replaces it with a studio-quality voice that actually carries emotion — irritation, exhaustion, warming up — and reacts to how the call is going.

## Which voice to use

**Recommendation: the built-in expressive voice engine (OpenAI's steerable speech model, already included with your app — no account, no API key, billed with your existing credits).**

Why this one over the alternatives:

- It accepts plain-English direction for every line ("clipped and annoyed, sighing, talking fast") — which is exactly what this app needs, because the customer's mood already changes turn by turn.
- It streams, so the customer starts talking almost immediately instead of after a pause.
- Nothing to set up, nothing extra to pay for.

ElevenLabs has slightly richer voice character, but it needs your own ElevenLabs account and key, and it can't be re-directed per line the same way. Google's voices are natural but less emotionally steerable. If you later want a specific ElevenLabs voice for a specific persona, we can add it as an option on top of what's built here.

## What changes for you

- Each customer gets a fixed voice that matches them (a different one per persona and gender), so the same customer sounds like the same person across the call.
- Every line is spoken with direction pulled from the live call: the persona (guarded, irritated, polite but firm, fast talker, distracted), the difficulty, and their current mood as the call progresses. A hostile customer sounds hostile; once you actually land the real reason, you hear them soften.
- Speech begins while the line is still being generated, so it feels like a phone call rather than a chat app.
- The mic keeps working the way it does today, and typing still works as a fallback.
- If the voice service is ever unavailable, the call keeps going on the old browser voice instead of breaking.

## Technical notes

- New server route `src/routes/api/speech.ts` (POST) that calls the Lovable AI Gateway `/v1/audio/speech` with `model: openai/gpt-4o-mini-tts`, `stream_format: "sse"`, `response_format: "pcm"`, and passes the request's abort signal through so barge-in cancels cleanly. Gateway errors (401/402/429/5xx) are surfaced verbatim per gateway error semantics.
- New `src/lib/voice-direction.ts` (client-safe): maps `personality` + `difficulty` + returned `mood` to a `voice` id and an `instructions` string.
- `sendAgentTurn` already returns `mood`; the call route passes `mood` along with the reply text to the speech route. The customer's voice id is derived deterministically from the scenario so it stays stable.
- `src/hooks/useCustomerVoice.ts` is rewritten to stream PCM chunks into an `AudioContext` (resume on first user gesture, schedule chunks sequentially, carry split samples between chunks), expose `say/stop/speaking`, and fall back to `speechSynthesis` if the stream fails.
- Mic input is paused while the customer speaks to avoid the mic hearing the customer.
- Verification: run a live call in the browser, confirm audio plays, confirm the SSE stream completes, and confirm no console errors.
