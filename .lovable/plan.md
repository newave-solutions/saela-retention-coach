# Give every caller their own voice

Right now the voice is worked out on the fly from the caller's name, so callers can land on the same voice over and over and the voice never matches the caller's gender. This moves the choice to the backend: each new call gets a voice picked at random when the call is created, locked to that call, and different from the voices used in your recent calls.

## What changes for you

- Press "Take a call" and you hear a genuinely different person most times — different age, tone and gender.
- The voice matches the caller's name (a caller named Marcus won't sound like a woman).
- The voice stays the same for the whole call, and stays the same if you reload the page mid-call.
- Back-to-back calls won't repeat a voice you just heard; the last few voices are skipped.
- Nothing else about the call changes — mic, typing, mood, and scoring stay as they are.

## Technical notes

- `src/lib/scenario-generator.server.ts`: split `FIRST_NAMES` into male and female lists, pick a gender first, then the name. Add a `voiceId` to the generated scenario, chosen randomly from a gender-tagged ElevenLabs roster, excluding a list of recently used ids passed in by the caller.
- `src/lib/voice-direction.ts`: replace the flat `ELEVENLABS_VOICES` array with a gender-tagged roster (`{ id, gender }`) plus `pickVoice(gender, exclude[])`. Keep `settingsFor` and `shapeLine` unchanged. Keep `voiceForScenario` only as a fallback for old sessions that have no stored `voiceId`.
- `src/lib/scenarios.ts`: add optional `voiceId` to the scenario type and to `PublicScenario`, and `toPublicScenario` passes it through so the browser gets it.
- `src/lib/training.functions.ts` (`startCall`): before generating, read the `voiceId` of this user's last 3 sessions from `training_sessions` and pass them as the exclude list. The scenario is stored in the existing JSON column, so no database migration is needed.
- `src/routes/call.$sessionId.tsx`: use `scenario.voiceId` when speaking, falling back to `voiceForScenario(scenario)` when it's absent.
- `src/routes/api/speech.ts`: unchanged apart from widening the voice-id validation if any roster id needs it.
- Verification: start several calls in a row and confirm the returned scenarios carry different `voiceId` values, and play one line end-to-end to confirm audio still returns as MP3.
