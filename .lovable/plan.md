# Bring the Saela retention playbook into the training app

The GEOC framework, the CES/CEM authority limits, and the trigger-specific tactics are now the standard the training should hold agents to. Today the simulator coaches on generic call skills (discovery, empathy, objection handling, offer fit, control) and has no idea what an agent is actually allowed to offer.

## Three suggested modifications

### 1. Score the call on GEOC, not generic call skills
Replace the five score categories with the four company pillars plus discovery:
Gratitude, Empathy, Ownership, Clarity, Discovery. The scorecard, the coaching
prompt, and the history/averages on the dashboard all use these names, so an
agent's practice numbers speak the same language as the floor coaching.
Ownership is graded hardest: blaming the branch, the billing system, or the
technician instead of owning the fix loses points even on a saved call.

### 2. Enforce the authority matrix during the call
Add a role to each practice call — Specialist (CES) or Manager (CEM) — chosen on
the setup screen. The live call screen shows a compact, always-visible authority
card for that role: price floor, discount ceiling, scheduling window, contract
change rule, switchover and rescission floors. The customer AI and the grader
both receive those limits: if the agent offers below their floor, the simulated
customer accepts it in the moment but the scorecard flags it as an unauthorized
concession and caps the offer-fit-related score. Same for stacking a frequency
change and a length change together.

### 3. Make the customer respond to the 3-Attempt Rule and value-first sequence
Teach the sequence, not just the outcome. The simulated customer becomes
noticeably colder when money is offered before the root cause is named, and
becomes negotiable only after three genuine, distinct non-financial attempts —
matching the mandate. Trigger-specific behavior is added so practice mirrors real
calls: "still seeing activity" callers only soften after a diagnostic question
and a stand-alone re-service offer; competitor callers expect a verified
competitor offer before a match; affordability callers respond to
meet-in-the-middle or year-in-full, and to being asked "what's your price point?"
before a number is thrown out. The scorecard reports how many attempts were made
before the first financial offer, and whether an escalation to a manager was
warranted.

## Technical notes

- `src/lib/scenarios.ts`: rename `ScoreBreakdown` keys to `gratitude`, `empathy`,
  `ownership`, `clarity`, `discovery`; add `AuthorityRole = "ces" | "cem"` with an
  `AUTHORITY_LIMITS` table (price floors, discount caps, scheduling, switchover,
  ROR/PTI) taken verbatim from the operations manual; add
  `attemptsBeforeOffer` and `authorityBreaches: string[]` to the coaching type.
- `src/lib/scenario-generator.server.ts`: seed `saveConditions`,
  `dealBreakers`, and `acceptableResolutions` from the trigger-specific tactics
  so generated scenarios stay inside real service boundaries (Protection Program
  cadence, stand-alone re-services, Premium Rodent thresholds, 3-foot crawlspace
  limit, resign ladder).
- `src/lib/customer-brain.server.ts`: extend the persona system prompt with the
  3-Attempt Rule, discount-fatigue behavior, and the agent's authority limits;
  extend the grading prompt to output the GEOC scores, `authorityBreaches`, and
  `attemptsBeforeOffer`.
- `src/routes/call.new.tsx`: role selector (Specialist / Manager) stored on the
  session scenario snapshot.
- `src/routes/call.$sessionId.tsx`: authority reference card in the sidebar.
- `src/routes/session.$sessionId.tsx` and `src/routes/index.tsx`: new score
  labels, an authority-compliance line, and the attempts-before-offer stat.
- Existing saved sessions keep their old score keys; the scorecard falls back to
  the old labels when the new keys are absent, so history does not break.
- Existing session records already store the full scenario as JSON, so no
  database migration is needed.
