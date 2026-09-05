# Switch the customer's voice to ElevenLabs, and map the whole experience

Two parts: (1) replace the current voice engine with ElevenLabs so the caller sounds like a real, emotional person, and (2) a walkthrough of every screen in the app with the design intent for each, plus the order to build the improvements.

## Part 1 — ElevenLabs voice

Your ElevenLabs key is saved in the workspace, but that connection isn't attached to this app yet. First step is a one-click link (a card appears in chat); after that the app can use it.

What changes:

- Each customer keeps a fixed ElevenLabs voice chosen from their persona and gender, so they sound like the same person for the whole call.
- Delivery follows the live call: persona (guarded, irritated, polite but firm, fast talker, distracted), difficulty, and their current mood. An angry caller sounds angry; when you actually land the real reason, you hear them soften.
- Emotion is carried by voice settings rather than a written instruction: hostile and fast-talker lines get low stability and higher style for volatility; calm or warming lines get higher stability and a slower speed. Short pauses and hesitations are added to the text for natural phone rhythm.
- Speech streams, so the caller starts talking almost immediately instead of after a wait.
- The mic still pauses while the customer talks, typing still works, and if the voice service ever fails the call continues on the basic browser voice instead of breaking.

### Technical notes

- Link the ElevenLabs connector (direct API, not gateway) so `ELEVENLABS_API_KEY` is available server-side.
- Rewrite `src/routes/api/speech.ts`: POST to `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream?output_format=mp3_44100_128` with header `xi-api-key`, model `eleven_turbo_v2_5`, body `voice_settings` from the caller, and pass `request.signal` through for barge-in. Stream the MP3 body straight back with `Content-Type: audio/mpeg`; relay upstream status and body verbatim on failure.
- Rewrite `src/lib/voice-direction.ts`: replace the OpenAI voice ids with ElevenLabs ids from the approved list (Roger, Sarah, Laura, Charlie, George, Callum, Alice, Matilda, Will, Eric, Brian, Lily), keep the deterministic hash on `customerName` for stability, and export `settingsFor(scenario, mood)` returning `{ stability, similarity_boost, style, use_speaker_boost, speed }` instead of an instructions string.
- Rewrite `src/hooks/useCustomerVoice.ts`: stream MP3 through MediaSource where supported, otherwise buffer the response into a Blob and play via `Audio`; keep `say/stop/speaking`, abort on barge-in, and keep the `speechSynthesis` fallback.
- `src/routes/call.$sessionId.tsx` passes `settings` instead of `instructions`; `sendAgentTurn`'s `mood` still drives it. No backend/database changes.
- Verify by running a live call in the browser and confirming audio plays with no console errors.

## Part 2 — The experience, screen by screen

| Screen | Purpose | Design intent |
| --- | --- | --- |
| Landing / dashboard (`/`) | Start a call, see save rate and recent sessions | Calm control-room feel: score summary up top, one obvious "Start a call" action, session list below |
| Sign in (`/auth`) | Get in fast | Single card, Google first, email second, nothing else competing |
| Call setup (`/call/new`) | Pick reason, difficulty, persona | Three clear choices as cards, difficulty stated in plain terms, "Random" for realistic practice |
| Live call (`/call/:id`) | The actual roleplay | Phone-call feel, not chat: caller name and timer prominent, big mic button, transcript secondary, mood cue visible, typing available as fallback |
| Scorecard (`/session/:id`) | Debrief | Overall score first, category bars, the hidden motive revealed, then what went well / missed / next time; sharing to Teams and Linear at the bottom |

### Improvements proposed for these screens (after the voice work)

1. Live call: a speaking indicator and waveform while the customer talks, so it's obvious when to listen vs. talk.
2. Live call: a subtle mood band (cold → warming → open) so trainees can feel progress without seeing the hidden motive.
3. Scorecard: a "replay the moment" link on each coaching point that jumps to the transcript line it refers to.
4. Dashboard: save-rate trend over the last ten calls.

## Build order

1. Link ElevenLabs, rewrite the speech route, voice mapping, and playback hook; verify a live call.
2. Live-call speaking indicator and mood band.
3. Scorecard coaching-to-transcript links.
4. Dashboard trend.
