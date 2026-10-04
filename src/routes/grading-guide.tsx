import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BookOpen, Calculator, ClipboardCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/grading-guide")({
  head: () => ({
    meta: [
      { title: "How grading works — Saela Way" },
      {
        name: "description",
        content:
          "A transparent guide to Saela Way practice grading, call-moment reviews, team trends, and the monthly master scorecard.",
      },
      { property: "og:title", content: "How grading works — Saela Way" },
      {
        property: "og:description",
        content:
          "Understand what each practice score and monthly operational score measures, how it is calculated, and where judgment is involved.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GradingGuide,
});

const sections = [
  { id: "practice", label: "Practice calls" },
  { id: "moments", label: "Call moments" },
  { id: "team", label: "Team trends" },
  { id: "master", label: "Master score" },
  { id: "definitions", label: "Definitions & limits" },
];

const retentionValues = [
  [
    "Help people",
    "Find the actual concern and the reason behind it; respond to the customer's need.",
  ],
  [
    "Build value",
    "Connect a relevant solution to the customer's circumstances, rather than defaulting to a discount.",
  ],
  [
    "Over-communicate",
    "Explain the next step, timing, owner, cost, and agreement implications; confirm understanding.",
  ],
  [
    "Trust & integrity",
    "Be honest about limits and terms; avoid pressure, false urgency, and promises the team cannot keep.",
  ],
  [
    "Hold the line together",
    "Own the outcome, follow-up, and any handoff instead of passing the customer along.",
  ],
];

const serviceValues = [
  ["Listening & recall", "Customer details heard and confirmed back.", "2×"],
  ["Discovery", "Questions that uncover the issue instead of box-ticking.", "1×"],
  ["Accuracy", "Correct service, date, location, and action.", "1.5×"],
  [
    "Value built",
    "A relevant explanation of the existing plan after understanding the need.",
    "1×",
  ],
  ["Clarity", "A specific close: who does what, when, and at what cost.", "1×"],
  ["Wording & tone", "Plain, comfortable language without pressure or over-explaining.", "1×"],
  [
    "Resign offer",
    "Only for eligible service-to-service callers without an agreement; resolve the original issue first, discover price point, build value, then make clear terms.",
    "2× if eligible",
  ],
  [
    "Sales handoff",
    "Only where a relevant opportunity exists; build value and connect to sales for a quote without quoting it yourself.",
    "1× if available",
  ],
];

const moments = [
  "Clear greeting",
  "Empathy",
  "Listening and confirming the real concern",
  "Relevant service value",
  "Fitting solution or mediation",
  "Clear terms and ownership",
  "Customer satisfaction",
  "Mutually acceptable arrangement",
  "Abrupt hangup",
  "Angry or disengaged exit",
];

const masterPillars = [
  {
    name: "Save rate",
    source: "FieldRoutes",
    points: "25",
    rule: "Saves ÷ cancellation requests × 100. Points = 25 × min(1, rate ÷ 33%). Full at 33% or more; unavailable when there are no cancellation requests or saves are missing.",
  },
  {
    name: "Coupons",
    source: "FieldRoutes",
    points: "25",
    rule: "Full 25 points at $3,000 or less. Above that: 25 × max(0, 1 − (coupons − 3,000) ÷ 3,000). Zero at $6,000 or more.",
  },
  {
    name: "Calls handled",
    source: "Talkdesk",
    points: "20",
    rule: "20 × min(1, calls ÷ 200). Full at 200 or more calls in the selected month.",
  },
  {
    name: "Average call length",
    source: "Talkdesk",
    points: "15",
    rule: "Total minutes ÷ calls. Full at 8–14 minutes inclusive. Below 8: 15 × (average ÷ 8). Above 14: 15 × max(0, 1 − (average − 14) ÷ 14); zero at 28 minutes or more.",
  },
  {
    name: "Schedule adherence",
    source: "Talkdesk",
    points: "15",
    rule: "15 × min(1, adherence % ÷ 90%). Full at 90% or above.",
  },
];

function SectionHeading({
  id,
  number,
  title,
  description,
}: {
  id: string;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div id={id} className="scroll-mt-8 border-t border-border pt-10">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{number}</span>
      <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function GradingGuide() {
  return (
    <main className="min-h-screen bg-background pb-20 text-foreground">
      <header className="brand-surface px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-7 text-inherit hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Saela Way
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-80">
            <BookOpen className="h-4 w-4" /> Scoring reference · Version 1.0 · October 2026
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">
            How grading works
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 opacity-85 sm:text-base">
            What each number means, where it comes from, and what it cannot tell you. Practice-call
            grades and monthly operational scores are separate measures, not one certified score.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        <nav
          aria-label="On this page"
          className="flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-6"
        >
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-w-0 space-y-12">
            <section aria-labelledby="practice">
              <SectionHeading
                id="practice"
                number="01 / AI judgment"
                title="Practice-call quality"
                description="Each completed roleplay is graded from the conversation held behind the scenes and the customer's scenario. The dialogue is not displayed during the call or on the scorecard."
              />

              <h3 className="mt-8 font-display text-lg font-semibold">CEM retention calls</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Five values receive a 0–100 AI judgment each. The coach looks for a curious opening,
                the underlying concern, a fitting resolution, specific commitments, and an honest
                outcome. A saved account does not automatically earn a high score, and a justified
                cancellation can still be handled well.
              </p>
              <div className="mt-4 divide-y divide-border border-y border-border">
                {retentionValues.map(([name, description]) => (
                  <div key={name} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-5">
                    <strong className="text-sm">{name}</strong>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">Displayed overall score:</strong> usually a
                separate 0–100 score supplied by the AI coach, not the arithmetic average of the
                five bars. If the AI does not supply a valid number, the app uses their rounded,
                equal-weight average instead. Scores are rounded and kept within 0–100.
              </p>

              <h3 className="mt-9 font-display text-lg font-semibold">CES service calls</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The AI coach prioritizes what the agent heard, whether the right action was taken,
                and whether the customer understood the next step. Each applicable category receives
                a 0–100 judgment.
              </p>
              <div className="mt-4 overflow-x-auto border-y border-border">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="py-3 pr-4 font-semibold">Category</th>
                      <th className="py-3 pr-4 font-semibold">What is assessed</th>
                      <th className="py-3 text-right font-semibold">Fallback weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {serviceValues.map(([name, description, weight]) => (
                      <tr key={name}>
                        <th scope="row" className="py-3 pr-4 align-top font-semibold">
                          {name}
                        </th>
                        <td className="py-3 pr-4 align-top leading-6 text-muted-foreground">
                          {description}
                        </td>
                        <td className="py-3 text-right align-top font-medium whitespace-nowrap">
                          {weight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The displayed overall is normally the AI's own 0–100 judgment. If it is invalid or
                absent, the app uses a rounded weighted average: the six core skills total 7.5
                weight units; eligible resign adds 2, and an available sales handoff adds 1.
                Inapplicable opportunity categories are stored as zero but excluded from that
                fallback calculation. The coach also checks customer details as confirmed back,
                heard but not confirmed, missed, or wrong; it marks relevant opportunities found,
                partially developed, or missed.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">Outcome is separate:</strong> retention uses
                saved, partial save, or cancelled; service uses resolved, partly resolved, or
                mishandled. These are AI classifications of what happened, not numeric cutoffs in
                normal grading. For service calls only, if the AI gives no valid outcome, the app
                defaults to resolved at 75+, partial at 50–74, and mishandled below 50.
              </p>
            </section>

            <section aria-labelledby="moments">
              <SectionHeading
                id="moments"
                number="02 / Evidence checks"
                title="Call moments"
                description="The post-call checklist makes individual observations visible without replaying a transcript."
              />
              <div className="mt-5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {moments.map((moment, i) => (
                  <div key={moment} className="flex gap-3 border-b border-border py-2 text-sm">
                    <span className="text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span>{moment}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Each answer is{" "}
                <strong className="text-foreground">yes, partly, no, or not observed</strong>, with
                a short explanation. These answers are AI assessments based on conversation
                evidence—not ten equally weighted points and not an independent formula for the
                overall score. If a call has no evidence on a question, it should say “not
                observed.” A normal ending is not an abrupt hangup; an unresolved issue alone does
                not prove the customer left angry.
              </p>
              <div className="mt-5 border-l-2 border-accent bg-accent/10 px-4 py-3 text-sm leading-6">
                <strong>Example:</strong> An agent acknowledges a missed appointment and asks where
                the activity is happening, but never repeats the location back. Empathy may be
                “yes”; listening may be “partly.” If the customer never comments on the proposed
                resolution, satisfaction should be “not observed,” not “no.”
              </div>
            </section>

            <section aria-labelledby="team">
              <SectionHeading
                id="team"
                number="03 / Practice history"
                title="Team lead trends"
                description="These summaries aggregate completed simulator calls. They are not measures from Talkdesk or FieldRoutes."
              />
              <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">Average score</dt>
                  <dd className="text-muted-foreground">
                    Rounded arithmetic mean of completed practice-call overall scores.
                  </dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">30-day trend</dt>
                  <dd className="text-muted-foreground">
                    Average score for the latest 30 days minus the preceding 30-day average; no
                    trend when either period has no completed calls.
                  </dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">Practice outcome rate</dt>
                  <dd className="text-muted-foreground">
                    (Saved or resolved calls + 0.5 × partial calls) ÷ completed calls × 100,
                    rounded. This is not the operational save rate.
                  </dd>
                </div>
                <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr]">
                  <dt className="font-semibold">Skill averages</dt>
                  <dd className="text-muted-foreground">
                    Average of recorded 0–100 category scores across completed practice calls; older
                    calls may use earlier labels or lack newer checks.
                  </dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="master">
              <SectionHeading
                id="master"
                number="04 / CSV-based calculation"
                title="Monthly master score"
                description="A separate 0–100 operational index for the selected month. It uses uploaded reports, not the AI practice grades."
              />
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Talkdesk reports supply handled calls, total talk/handle minutes, and schedule
                adherence. FieldRoutes reports supply cancellation requests, saves, coupons, and
                saved account value. The uploader suggests column matches; the importing lead can
                change them and preview rows before saving. Rows for a matching agent name within an
                upload are added together (adherence is averaged); names must match between sources
                for a combined result. Minutes are rounded when imported.
              </p>
              <div className="mt-5 divide-y divide-border border-y border-border">
                {masterPillars.map((pillar) => (
                  <div
                    key={pillar.name}
                    className="grid gap-2 py-4 sm:grid-cols-[10rem_1fr_3rem] sm:gap-5"
                  >
                    <div>
                      <h3 className="text-sm font-semibold">{pillar.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{pillar.source}</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{pillar.rule}</p>
                    <span className="text-sm font-semibold sm:text-right">{pillar.points} pts</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">Total:</strong> round the sum of available
                pillar points ÷ the sum of their available weights × 100. With all five, the weights
                total 100. If a source or field is missing, the score is labeled
                <em> partial</em> and the remaining points are rescaled rather than treating missing
                data as zero. With no scoreable pillars, no number is shown. A value of exactly
                $3,000 earns all coupon points but fails the “under $3,000” pass badge—the badge
                uses a strict less-than test.
              </p>
              <div className="mt-5 border-l-2 border-primary bg-secondary/50 px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Calculator className="h-4 w-4" /> Worked example · complete month
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  30 saves from 100 cancellation requests = 30% → 22.73/25; $3,600 in coupons →
                  20/25; 160 calls → 16/20; 1,600 total minutes ÷ 160 calls = 10 minutes → 15/15;
                  81% adherence → 13.5/15. Total: 87.23 points, displayed as{" "}
                  <strong className="text-foreground">87/100</strong>. If saved value is $12,000,
                  net retained is $12,000 − $3,600 ={" "}
                  <strong className="text-foreground">$8,400</strong>, shown separately.
                </p>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <strong className="text-foreground">Provisional settings:</strong> the 8–14 minute
                band, 90% adherence target, pillar weights, and penalty slopes are current app
                assumptions awaiting Saela confirmation—not approved policy. The 200-call,
                $3,000-coupon, and 33%-retention thresholds reflect the requested benchmarks; the
                current app gives full call points at 200 and full coupon points at $3,000.
              </p>
            </section>

            <section aria-labelledby="definitions">
              <SectionHeading
                id="definitions"
                number="05 / Interpretation"
                title="Definitions & limits"
                description="A score is a starting point for coaching, not proof that a customer was helped."
              />
              <dl className="mt-5 divide-y divide-border border-y border-border text-sm">
                <div className="py-3">
                  <dt className="font-semibold">Save rate</dt>
                  <dd className="mt-1 leading-6 text-muted-foreground">
                    FieldRoutes saves divided by cancellation requests for that agent and month;
                    different from the practice outcome rate.
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="font-semibold">Net retained</dt>
                  <dd className="mt-1 leading-6 text-muted-foreground">
                    Imported saved account value minus imported coupons; not included in the 0–100
                    score. If one imported value is absent, the app currently treats it as zero in
                    this difference.
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="font-semibold">Partial</dt>
                  <dd className="mt-1 leading-6 text-muted-foreground">
                    On a call, an AI-classified partly successful outcome. On the master scorecard,
                    a score calculated without all five operational pillars. These are different
                    meanings.
                  </dd>
                </div>
                <div className="py-3">
                  <dt className="font-semibold">Not observed</dt>
                  <dd className="mt-1 leading-6 text-muted-foreground">
                    No reliable evidence for a call-moment judgment; it does not mean the behavior
                    did not happen.
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex gap-3 border-l-2 border-warning bg-warning/10 px-4 py-4 text-sm leading-6">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p>
                  AI judgments can be inconsistent or mistaken. Average call length is only a proxy,
                  not a direct measure of care, listening, or root-cause resolution. CSV columns,
                  time units, duplicate reports, agent names, and monthly coverage require human
                  review; imported totals are not a certified source of operational truth until
                  reconciled with the original systems. The current guide documents how the app
                  behaves, not an official employment-performance policy.
                </p>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-6 border-l border-border pl-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" /> At a glance
              </div>
              <p className="mt-3 text-sm leading-6">
                AI rates practice calls. Imported reports calculate the monthly master score.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                No transcript is shown in this guide. Call-moment answers do not add up to the
                overall grade.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link to="/">
                  Go to Saela Way <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
