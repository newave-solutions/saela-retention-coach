# Saela Way — Retention Call Simulator

Rebrand the app, replace the coaching standard with Saela's real GEOC framework, and make the callers far more varied, emotional, and harder to save.

## 1. Rebrand

- Every "SaveLine" reference becomes **Saela Way — Retention Call Simulator** (dashboard header, auth screen, call setup, scorecard, page titles, descriptions, share/preview text).
- Subtitle stays "Saela Pest Control · customer experience training".
- No new metadata plumbing — only the titles/descriptions the pages already define.

## 2. The Saela Way (GEOC) replaces the current coaching language

Retire "protect the home first / tell the truth / honor the agreement". The customer's behavior and the post-call grading are both rebuilt around GEOC:

- **Gratitude** — sincere thanks for their business and tenure.
- **Empathy** — acknowledge and validate the frustration directly, no scripted "sorry you feel that way".
- **Ownership** — take personal responsibility for fixing it instead of passing it off.
- **Clarity** — confirm the real problem accurately and state the resolution in specific terms.

Negotiation standards layered on top:

- Ask "what's your price point?" and build the offer around their number instead of leading with a discount.
- Meet in the middle (for example, cover half of a price increase).
- Make at least three genuine retention attempts before any money moves.

Scorecard categories are re-labeled to Gratitude, Empathy, Ownership, Clarity, and Negotiation & Control, and the coach's written feedback references GEOC by name. Existing saved calls still display (old category values map onto the new labels in order).

## 3. Callers: American, varied, and emotionally real

- Name pool expanded to a wide, realistic American mix (regional and multi-ethnic surnames), so no two sessions feel like the same person.
- Voice pool expanded and matched to the persona so accents read as ordinary American residential customers, still stable per caller.
- Each cancellation reason gets **six to eight fully written scenarios** instead of one — different stories, hidden motives, account histories, and openings — randomly mixed with personality, mood, and difficulty so repeats are rare.

New caller archetypes on top of the current personalities:

- **Steamroller** — talks over the agent, won't let them finish a sentence.
- **Detonator** — furious from the first second, raised voice, occasional mild curse word.
- **Drive-by** — states the demand flatly and hangs up within a few turns unless the agent lands something immediately.
- **Stonewaller** — one-word answers, gives nothing away.
- **Bargain hunter** — instantly turns everything to price.

Profanity stays mild and realistic ("damn", "hell", the occasional stronger word under pressure) — never slurs, never abusive personal attacks.

## 4. One notch harder

- Fewer free openings: callers no longer volunteer helpful detail.
- Generic empathy, scripted lines, and early discounts actively cool the caller.
- Shorter patience windows on every difficulty; brutal callers can hang up early.
- A save now requires the hidden motive named *and* a GEOC-consistent, specific remedy.
- Grading is stricter: a discount-first or motive-missing call lands in the 20s-40s.

## Technical notes

- `src/lib/scenarios.ts` — new personality/archetype values and labels, renamed score keys.
- `src/lib/scenario-generator.server.ts` — expanded name/plan pools, 6-8 seeds per reason, richer randomization.
- `src/lib/customer-brain.server.ts` — GEOC-based system prompt and grading rubric, tighter difficulty and hang-up rules, profanity guardrails.
- `src/lib/voice-direction.ts` — larger voice pool, delivery settings for the new archetypes.
- Routes (`index`, `auth`, `call.new`, `call.$sessionId`, `session.$sessionId`) — rename, new score labels, GEOC copy.
