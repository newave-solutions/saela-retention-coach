# Transparent grading specification

## Goal

Publish a plain-language, shareable reference explaining every number people see in Saela Way: retention practice, CES service practice, team summaries, and the monthly master scorecard. The specification will describe **what the app currently does**, not present proposed scoring targets as approved Saela policy.

## Deliverable

- Add a versioned grading guide within the app, reachable from both post-call scorecards and the team lead's master scorecard. Keep it readable without exposing any customer's dialogue or hidden scenario details.
- Structure it by score type: source of evidence, rubric, calculation, examples, interpretation, missing-data behavior, and limitations. Clearly distinguish practice scores from real operational metrics; they are not a combined certified score.
- Include a compact worked example for the master score, an example of a call-moment assessment, definitions of each outcome, and a glossary for terms such as save rate, net retained, partial, and not observed.

## Accuracy rules the guide must disclose

- **Retention practice:** AI reviews the server-held conversation and scenario against five 0–100 values: help people, build value, over-communicate, trust and integrity, and ownership/hold the line. The app calculates an equal-weight mean only as a fallback; normally the displayed overall number is the AI's separate 0–100 judgment, clamped to range. Cancellation can still earn a strong service-quality score. A save outcome is not the grade.
- **CES service practice:** AI reviews listening, discovery, booking accuracy, value built, clarity, wording/tone, and situational resign and sales-transfer skills. The fallback weighted calculation uses listening ×2, accuracy ×1.5, four other core skills ×1, resign ×2 only when eligible, and sales transfer ×1 only when available; normally the AI's separate overall judgment is displayed. Inapplicable skills show zero but are excluded from fallback weighting. AI also marks whether specific customer details were confirmed, captured, missed, or wrong and whether hidden opportunities were found.
- **Call moments:** greeting, empathy, listening, value, resolution, clear terms, satisfaction, agreement, abrupt hangup, and angry exit are AI evidence-based yes/partly/no/not-observed annotations. They are **not** themselves a percentage formula. Explain that missing evidence should be marked not observed, and that these judgments may be imperfect.
- **Team practice summaries:** average completed-call overall scores; 30-day versus preceding 30-day trend; outcome rate counts saved/resolved as 1 and partial as 0.5, and is not the same as FieldRoutes save rate.
- **Master scorecard:** Talkdesk supplies calls, minutes and adherence; FieldRoutes supplies cancellation requests, saves, coupons and saved value, through uploaded CSVs and confirmed column mappings. Disclose the five weighted pillars and exact formulas: save rate saves ÷ cancellation requests (25 points, target 33%); coupons (25, full points at or below $3,000, decreasing linearly to zero at $6,000); call count (20, full at 200); average minutes total minutes ÷ calls (15, full at 8–14 minutes, tapered outside); adherence (15, full at 90%). Partial scores rescale the points from available pillars to 0–100, not zero-fill. Net retained = saved value minus coupons; it is separate from the 0–100 score. Explain the target-boundary distinction where a coupon value of exactly $3,000 gets full points but fails the strict “under $3,000” pass badge.
- Label the 8–14-minute range, 90% adherence threshold, weights, and penalty slopes as **current app assumptions pending Saela confirmation**, not official standards. Note that call length is a proxy and cannot independently measure customer care or root-cause resolution; CSV totals and agent matching require review, and imports are not certified operational truth without reconciliation.

## Technical approach

Create one content route with its own metadata; use existing typography, navigation, and design components. Link it from the relevant scorecards, without altering grading formulas, uploading, authorization, or stored conversations. Check that examples reproduce the code's rounding and missing-data handling; verify links and readability in the browser on desktop and mobile.
