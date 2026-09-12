# Second coach: CES service-call practice

Today the app only trains retention (cancellation) calls. This adds a second training track for Tier 1 CES agents, where the caller is a normal customer asking to schedule a reservice or move their regular service — and the coaching grades how well the agent listened, confirmed the details, and built value.

## What the agent will see

**Dashboard** gets two clearly separated practice tracks:
- Retention calls (existing, unchanged)
- Service calls — CES (new)

Each track shows its own recent calls and its own stats, so a save rate never gets mixed with a listening score.

**Starting a CES call**: same simple setup as today — pick a call type or let it pick randomly, pick how demanding the caller is, then dial. Call types:
- Reservice request (still seeing activity between services)
- Reschedule a regular service to a later date
- Reschedule because of access problems (gate, dog, work hours, travel)
- Reservice for a specific new pest issue (wasps, rodents in the garage, ants indoors)
- Vague request where the customer does not actually know what they need

**The live call** works exactly like the retention call: real voice, accents, personalities, talk or type.

The difference is that these callers bury real, checkable details in ordinary chatter — the room where they see activity, when they are home, a new puppy in the back yard, an upcoming trip, a gate code, a spouse who handles the account, whether they already tried a reservice. Some details are stated once, quickly, or contradicted later ("Tuesday — no wait, Tuesday I'm out, make it Thursday"). If the agent never confirms them back, the caller will not repeat them, and the call ends with something wrong booked.

**The scorecard** after the call gives:
- A listening comprehension score built from a detail checklist: every key fact the caller gave, marked captured / confirmed back / missed / got wrong. This is the centrepiece and is shown as an explicit list, so the agent sees the exact sentence they skipped past.
- Category scores: listening and recall, questions that opened the customer up, accuracy of what was booked, value built on the existing plan, clarity of the confirmation (what happens, when, who, cost).
- Written feedback: what went well, what was missed, what to do next time, plus the customer-experience impact of the misses.
- Full transcript.

Value-building is graded as part of the call, not a bolt-on: using the reservice conversation to explain the 28-day follow-up and the 10–12 week cycle, why activity between services is normal and covered, that stand-alone reservices cost them nothing, and — where it genuinely fits the call — seasonal coverage such as mosquito or rodent protection. Pitching where it does not fit, or pitching before the customer's problem is understood, loses points.

## Technical outline

- Add a `track` column (`retention` | `service`) to `training_sessions`, defaulting to `retention` so existing rows and dashboards keep working. Add a nullable `detail_checks` JSON column for the listening breakdown.
- New `src/lib/service-scenarios.ts`: call types, CES score categories, and a `ServiceScenario` type carrying a `keyDetails[]` array — each detail with an id, what it is, how it surfaces in conversation, and whether the caller will restate it if asked.
- New `src/lib/service-scenario-generator.server.ts`: seeded scenarios per call type (several each), reusing the existing caller name pools, personalities, and `pickVoice` voice assignment so callers keep sounding different.
- New `src/lib/service-brain.server.ts`: the in-call caller prompt (cooperative but naturally messy, volunteers details only once, never re-offers a missed detail unprompted) and the grader, which walks `keyDetails` one by one against the transcript and returns per-detail status plus category scores and coaching.
- New server functions in `src/lib/service-training.functions.ts` (`startServiceCall`, `getServiceCall`, `sendServiceTurn`, `endServiceCall`), following the existing `requireSupabaseAuth` pattern.
- New routes: `src/routes/service.new.tsx` (setup), `src/routes/service.$sessionId.tsx` (live call, reusing the existing voice hooks and call layout), `src/routes/service-session.$sessionId.tsx` (scorecard with the detail checklist).
- Dashboard split into the two tracks; existing retention routes and grading untouched.
- Each new route gets its own title/description metadata.

## Out of scope

Non-cancellation query types beyond scheduling and reservices (billing disputes, sales, new-customer setup) are not included — easy to add later as extra call types.
