# Retention Training Simulator — Voice Roleplay for Pest Control Cancellations

A voice-call trainer where a customer experience agent talks live with an AI customer who wants to cancel their pest control service. The AI has a hidden underlying motive; it only becomes savable if the agent actually uncovers and addresses it.

## Core experience

1. **Sign in** — each trainee has an account so their call history and progress follow them.
2. **Start a call** — either "Quick call" (app secretly picks the scenario) or "Custom call" (pick cancel reason, difficulty, customer personality).
3. **Live voice conversation** — press call, speak, the customer answers out loud with a real voice, interruptions and all. A live transcript scrolls alongside so nothing is lost.
4. **End call** — hang up any time, or the customer hangs up if handled badly.
5. **Scorecard + coaching** — outcome (saved / partially saved / cancelled), scores, what was missed, and specific coaching tips.

## The customer AI

Every call is built from a hidden scenario the agent cannot see:

- **Stated reason** (what they say first): switching to another provider, price/affordability, pests still active, poor service experience, contract/agreement dispute, product safety or effectiveness concerns.
- **Hidden motive** (the real driver): e.g. says "too expensive" but really feels the last three visits were rushed; says "switching" but really a neighbor got a lower rate; says "contract dispute" but really a technician no-showed twice.
- **Personality and resistance**: guarded, irritated, polite-but-firm, fast-talking, distracted.
- **Save conditions**: a short list of things the agent must do — surface the real driver, acknowledge it specifically, and offer a fit-for-purpose resolution — before the customer will even entertain staying.

Difficulty is tuned to hard-but-fair by default: the customer never volunteers the hidden motive, deflects the first one or two generic offers, resists discount-first tactics, and reacts badly to scripted empathy. Discounts alone never save a call whose motive is service quality. If the agent genuinely lands the motive, the customer softens realistically and negotiation opens up — a save is achievable but must be earned.

The AI adapts live: it tracks whether the agent is probing, listening, or pitching, and shifts tone accordingly (warmer on good discovery, shorter and colder on pressure tactics).

## Scoring and coaching

After each call, the transcript is analyzed for:

- Outcome: saved, partial save (downgrade/pause), or cancelled
- Discovery: did the agent uncover the hidden motive, and how fast
- Empathy and acknowledgment quality
- Objection handling and rebuttal fit
- Offer appropriateness (right remedy vs. reflex discount)
- Talk/listen balance and interruptions

Output is a scorecard with per-category scores, an overall grade, 2-4 concrete coaching points tied to moments in the call, and a reveal of the hidden motive so the trainee sees what they were up against.

## History and progress

A dashboard lists past calls with date, scenario, outcome, and score, plus trend lines (save rate, average discovery speed) so improvement over time is visible. Each past call opens to its full transcript and scorecard.

## Design direction

Calm, focused "call console" feel — not a chat toy. Dark, low-glare workspace for long training sessions; a prominent live call orb with speaking/listening state, timer, and transcript rail; scorecards presented as clean report cards with restrained accent color for scores. No generic AI sparkle branding.

## Technical approach

- **Voice**: ElevenLabs Conversational AI agent (WebRTC via `@elevenlabs/react`), which gives real-time speech-to-speech with barge-in. Each session passes the hidden scenario into the agent through per-conversation prompt/first-message overrides, so one agent covers all scenarios. Session tokens are minted in a TanStack server function so the API key stays server-side. Requires linking the ElevenLabs connector.
- **Backend**: Lovable Cloud for auth (email/password), and tables for `scenarios`, `sessions` (scenario snapshot, outcome, scores, transcript), and `profiles`, all with row-level security scoped to the signed-in trainee.
- **Scoring**: transcript sent to a Lovable AI server function after hangup, returning structured scores plus coaching notes, saved to the session row.
- **Routes**: `/` dashboard, `/auth`, `/call/new` setup, `/call/$sessionId` live console, `/session/$sessionId` scorecard review.

## Build order

1. Cloud auth + schema + dashboard shell
2. Scenario generator and call setup screen
3. ElevenLabs connector, token server function, live call console with transcript
4. Post-call scoring function and scorecard page
5. History, trends, and design polish
