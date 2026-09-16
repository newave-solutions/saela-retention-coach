# CES calls: hidden opportunities, resign practice, and language tone

Service calls become less "handle the request, hang up" and more "find the opening". Every caller now carries things they will only reveal if the agent engages well, and most out-of-agreement callers can be resigned no matter why they called.

## 1. Hidden opportunities inside every caller

Each scenario gets a set of hidden openings the agent can only surface by asking and listening. Examples:

- A caller with a new puppy and a back yard — mosquito coverage fits, but only if the agent notices the yard use.
- A caller mentioning a shed or detached garage — rodent yard guard fits going into winter.
- A caller confused about what their plan covers — the right move is a plain explanation of what is and isn't included, and what the price actually buys.
- A caller whose spouse handles the account, or who is planning a trip — scheduling and coverage opportunities.

These stay hidden from the agent during the call. On the scorecard each one is listed as found / partly found / missed, with the exact moment in the conversation where it was available.

A new call type is added: **Coverage and pricing question** — the customer wants to know what the protection program actually covers, why they pay what they pay, or what happens between services. Handling it well means explaining coverage clearly (interior/exterior, the 28-day follow-up, the 10–12 week cycle, free reservices between visits, what falls outside the plan) and connecting it to price before pitching anything.

## 2. Resign practice on any call — and it is meant to be hard

Resigns apply only to customers who are now paying service to service, with no ongoing agreement in place. Any such caller can be flagged, invisibly, including callers who phoned about something completely unrelated. Some arrive having noticed their price creeping up over the last few services, or quietly struggling to pay.

The agent's job is to notice the opening and offer a resign. The customer is deliberately hard to win: a first ask is almost always declined, and they only come around if the agent resolved what they actually called about, built real value on the service, asked their price point before naming a number, and put honest numbers on the table. Leading with a freebie, pushing, or pivoting over an unsolved problem gets a firm no.

Each caller carries a hidden acceptance threshold and a required number of well-handled steps, so the same offer lands with one customer and is turned down by another.

## 3. Building value toward a sales transfer

Separately from resigns, some callers have a genuine fit for a service they don't have — mosquito coverage, rodent yard guard, exclusion work. CES agents don't quote these. The win is building enough value that the customer agrees to be transferred to sales for a quote.

Graded on: spotting the fit, building value in the customer's own terms rather than reciting features, asking for the transfer rather than hinting at it, and setting the expectation of what sales will do. A customer who wasn't warmed up will decline the transfer.

## 4. Grading the whole runway to the offer

The resign section of the scorecard is expanded to grade the full sequence, not just the offer:

- Was the original reason for the call resolved before pivoting?
- Did the agent spot the eligibility signal (price increase comment, affordability hint, no agreement in place)?
- Did they ask the customer's price point before naming any number?
- Did they lock the ongoing price before offering half-off or a free service?
- Was the commitment real (minimum four services) and stated in numbers?
- Did they confirm terms clearly — how many services, what each costs, what's free, when billing resumes?
- Did they stop explaining once it was clear, instead of over-explaining?
- Did they keep going after the first no, or give up?

Coaching calls out the specific turn where the opening appeared and what should have been said there.

## 5. Language and tone check

The transcript is run through a language pass that flags wording that makes customers feel tied down — "contract", "locked in", "obligated", "sign up for", "terms and conditions", "commit to" — along with over-explaining, hedging, and anything that reads defensive.

The scorecard gets a **Wording** panel: each flagged phrase, the turn it appeared in, why it lands badly, and a warmer replacement ("agreement", "your plan", "we'd keep you covered for the next four services"). Clean, plainly-worded calls are credited here too.

## Technical outline

- `src/lib/service-scenarios.ts`: add `HiddenOpportunity` (id, label, trigger signal, what a good agent does, whether it is a resign fit or a sales-transfer fit), `OpportunityCheck` with found/partial/missed status, `resignEligibility` (service-to-service flag, price-increase signal, affordability signal, hidden acceptance threshold, minimum well-handled steps before acceptance), `LanguageFlag` (phrase, turn index, why, suggested rewrite), and `languageTone` + `salesTransfer` in `ServiceScoreBreakdown`. Add `coverage_question` to `SERVICE_CALL_TYPES`.
- `src/lib/service-scenario-generator.server.ts`: attach 2–4 hidden opportunities to every seed; add coverage-question seeds; attach resign eligibility only to service-to-service callers, with hidden thresholds skewed hard.
- `src/lib/service-brain.server.ts`: the in-call prompt gets rules for revealing opportunity signals only when asked, declining the first resign ask by default, accepting only once the original issue is resolved, value was built, price point was asked, and numbers clear the hidden threshold — plus agreeing to a sales transfer only when genuinely warmed up. The grader gains opportunity checks, the expanded resign runway rubric, sales-transfer scoring, and a language/tone pass returning flagged phrases with rewrites.

- `src/lib/service-training.functions.ts`: persist `opportunity_checks` and `language_flags` alongside `detail_checks`.
- Migration: two nullable JSON columns on `training_sessions`.
- `src/routes/service-session.$sessionId.tsx`: new Opportunities and Wording panels, expanded resign section.
- `src/routes/service.new.tsx`: coverage-question call type in the picker.
