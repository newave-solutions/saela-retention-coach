# Give every caller their own voice and accent

Right now the voice is worked out on the fly from the caller's name, so callers can land on the same voice over and over, the voice never matches the caller's gender, and every caller sounds like the same generic American. This moves the choice to the backend: each new call gets a voice and accent picked at random when the call is created, locked to that call, and different from the ones used in your recent calls.

## What changes for you

- Press "Take a call" and you hear a genuinely different person most times — different age, tone, gender and accent.
- Accents lean the way real customers sound: mostly American, spread across regions (general American, Southern, Midwest, New York/Northeast, Texas/Southwest, West Coast), plus a regular share of Indian and Arabic-accented English, and occasional British or other English accents.
- The caller's name matches their voice — gender and background line up, so a caller named Marcus won't sound like a woman and an Indian-accented caller gets a fitting name.
- The voice stays the same for the whole call, and stays the same if you reload the page mid-call.
- Back-to-back calls won't repeat a voice you just heard.
- The accent is shown on the call screen next to the caller's name, so you know who you're talking to.
- Nothing else about the call changes — mic, typing, mood, and scoring stay as they are.

## Technical notes

- `src/lib/voice-direction.ts`: replace the flat `ELEVENLABS_VOICES` array with a roster of `{ id, name, gender, accent, weight }` entries covering the accent groups above (ElevenLabs voices selected for each accent, verified against the ElevenLabs voice list before use). Add `pickVoice({ exclude })` doing weighted random selection so American accents dominate and Indian/Arabic appear regularly. Keep `settingsFor` and `shapeLine` unchanged; keep `voiceForScenario` only as a fallback for old sessions with no stored voice.
- `src/lib/scenario-generator.server.ts`: pick the voice first, then generate a name that fits its gender and accent — separate first/last name pools per background (American male/female, Indian, Arabic, British) so name and voice agree. Store `voiceId` and `accentLabel` on the generated scenario.
- `src/lib/scenarios.ts`: add optional `voiceId` and `accentLabel` to the scenario type and `PublicScenario`; `toPublicScenario` passes both through.
- `src/lib/training.functions.ts` (`startCall`): read the `voiceId` of this user's last 3 sessions from `training_sessions` and pass them as the exclude list. The scenario lives in the existing JSON column, so no database migration is needed.
- `src/routes/call.$sessionId.tsx`: speak with `scenario.voiceId`, falling back to `voiceForScenario(scenario)` when absent; show `accentLabel` in the caller header.
- `src/routes/api/speech.ts`: unchanged apart from widening voice-id validation if any roster id needs it.
- Verification: start several calls in a row and confirm distinct `voiceId`/accent values, then play a line end-to-end to confirm audio still returns as MP3.
