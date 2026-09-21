# Multi-provider customer voices (no more robotic fallback)

## Goal

Practice calls should always play a realistic, distinct customer voice, even when the ElevenLabs account has no credits. Today every line fails over to the browser's built-in robot voice.

## Approach

Give each caller a voice from a pool spread across three voice services, and pick automatically based on what is actually working:

1. **ElevenLabs** (current) — used when the account has credits.
2. **Google Cloud text-to-speech** — large set of natural US regional, Indian, Arabic-accented and British English voices. Needs a Google Cloud API key you provide.
3. **OpenAI voices through Lovable AI** — already available on this project, no extra account or key.

Order of use per call:
- Voice assigned to the session keeps its intended accent/gender.
- If its primary service fails (no credits, key missing, outage), the same persona is re-routed to the closest matching voice on the next available service, not a random one.
- Browser speech stays only as a last resort, and the call screen shows a small note when the realistic voice is unavailable so it is never silently degraded.

## Voice roster

Rebuild the roster so each persona entry lists an equivalent voice on each service (American regional, Indian, Arabic, British, Australian English; male/female). That way a caller sounds consistent no matter which service serves the audio.

## Health awareness

The server remembers for a short period when a service returned "out of credits" or "not configured" and skips it for later calls instead of retrying every single line. It re-tests periodically so voices come back automatically once you top up.

## What I need from you

- A Google Cloud text-to-speech API key, if you want that service in the mix. Without it, the app uses ElevenLabs when funded and the built-in Lovable voices otherwise — still natural, just a smaller accent range.
- Topping up ElevenLabs has to be done in your own ElevenLabs account; I cannot purchase credits from here.

## Technical notes

- `src/routes/api/speech.ts`: refactor into provider adapters (`elevenlabs`, `google`, `gateway`) with a shared `speak()` signature returning a streamed `audio/mpeg` response; ordered fallback chain with per-provider error classification (401/402/429 = mark unhealthy, cached in module memory with TTL).
- Google adapter: `texttospeech.googleapis.com/v1/text:synthesize` with `GOOGLE_TTS_API_KEY`, `audioConfig.audioEncoding: "MP3"`, speaking rate/pitch mapped from the existing mood settings; base64 body decoded to bytes.
- `src/lib/voice-direction.ts`: extend the roster entries with `{ elevenlabs, google, gateway }` voice ids plus accent/gender metadata; keep the existing weighted selection and recent-voice exclusion at session creation.
- `src/hooks/useCustomerVoice.ts`: read an `X-Voice-Provider` response header and expose a `degraded` flag for the UI notice; keep blob caching and abort behavior.
- Call screens (`src/routes/call.$sessionId.tsx`, `src/routes/service.$sessionId.tsx`): show the small "backup voice in use" note when degraded.
