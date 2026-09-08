// Server-only. Builds a hidden-motive cancellation scenario for a call.
import {
  CANCEL_REASONS,
  PERSONALITIES,
  PERSONALITY_LABELS,
  REASON_LABELS,
  type AuthorityRole,
  type CancelReason,
  type Difficulty,
  type FullScenario,
  type Personality,
} from "./scenarios";

/** Applies to every scenario — the company's value-first sequence. */
const PLAYBOOK_DEAL_BREAKERS = [
  "Leading with money before three genuine non-financial attempts",
  "Naming a price before asking the customer what their price point is",
  "Promising anything outside the treatment's real boundaries (crawlspaces under 3 feet, rodent exclusion without a Protection Program, results the cycle can't deliver)",
];

type Seed = {
  statedReason: string;
  hiddenMotive: string;
  emotionalDriver: string;
  saveConditions: string[];
  dealBreakers: string[];
  acceptableResolutions: string[];
  openings: string[];
};

const FIRST_NAMES = [
  "Dana",
  "Marcus",
  "Priya",
  "Ted",
  "Alicia",
  "Roy",
  "Jen",
  "Curtis",
  "Beth",
  "Omar",
  "Sandra",
  "Wes",
];
const LAST_NAMES = [
  "Whitaker",
  "Alvarez",
  "Doyle",
  "Nakamura",
  "Boone",
  "Ferrell",
  "Okafor",
  "Kaminski",
  "Reyes",
  "Salinas",
];
const PLANS = [
  "quarterly general pest plan",
  "bi-monthly perimeter plan",
  "termite monitoring + quarterly plan",
  "monthly mosquito & general pest plan",
  "annual rodent exclusion plan",
];

const SEEDS: Record<CancelReason, Seed[]> = {
  competitor_switch: [
    {
      statedReason: "A different company quoted them a cheaper rate, so they want out.",
      hiddenMotive:
        "The neighbor's provider gave a same-week callback guarantee. This customer waited nine days for a callback after the last wasp complaint and felt deprioritized. Price is the excuse; responsiveness is the wound.",
      emotionalDriver: "Feeling like a low-priority account.",
      saveConditions: [
        "Agent asks what the other company promised, not just what it costs",
        "Agent surfaces the delayed callback and owns it specifically",
        "Agent offers a concrete responsiveness commitment (named tech, callback window, priority flag)",
      ],
      dealBreakers: [
        "Leading with a discount before hearing the story",
        "Bad-mouthing the competitor",
        "Claiming 'we always respond in 24 hours' when the customer's experience says otherwise",
      ],
      acceptableResolutions: [
        "Priority service flag + guaranteed callback window in writing",
        "Assigned consistent technician",
        "A switchover price only AFTER the responsiveness issue is addressed and the competitor's offer has been verified",
      ],
      openings: [
        "Yeah, hi — I need to cancel my service. I got a better price from someone else.",
        "Hi. I'm going to go ahead and cancel. Another company's doing it cheaper.",
      ],
    },
  ],
  affordability: [
    {
      statedReason: "Money is tight and the plan is the easiest bill to cut.",
      hiddenMotive:
        "The last three visits were about fifteen minutes each and the tech skipped the garage and back fence line. They don't feel they're getting what they pay for. If value were visible, the money would be found.",
      emotionalDriver: "Feeling quietly ripped off, but too polite to accuse anyone.",
      saveConditions: [
        "Agent asks what the visits have actually looked like",
        "Agent connects price to value delivered rather than just shaving cost",
        "Agent acknowledges the short/incomplete visits without excuses",
      ],
      dealBreakers: [
        "Immediately offering a discount that keeps the same service quality",
        "Suggesting they 'just skip a visit' to save money",
        "Lecturing about pest risk to scare them",
      ],
      acceptableResolutions: [
        "Full-property walkthrough on next visit with a service report",
        "Right-size the plan to what they actually need, with the scope written out",
        "Meeting in the middle on the increase, or year-in-full at 5% off, once the value gap is fixed",
      ],
      openings: [
        "Hi, I need to cancel. Honestly it's just too expensive right now.",
        "I'm calling to cancel my plan — money's tight and this one has to go.",
      ],
    },
  ],
  persistent_activity: [
    {
      statedReason: "They're still seeing roaches after several treatments.",
      hiddenMotive:
        "Nobody ever explained the treatment cycle. They assumed one visit ends it, so normal die-off activity reads as total failure. Underneath is embarrassment — they think their home is being judged as dirty.",
      emotionalDriver: "Embarrassment and the fear that nothing will ever work.",
      saveConditions: [
        "Agent asks where exactly the activity is and whether a re-service has been used before",
        "Agent explains the treatment cycle — 28-day follow-up, then 10-12 week maintenance — in plain language without being condescending",
        "Agent removes the blame from the customer explicitly",
      ],
      dealBreakers: [
        "Implying sanitation or clutter is the customer's fault",
        "Saying 'that's normal' without explaining why",
        "Offering money off instead of a re-treatment",
      ],
      acceptableResolutions: [
        "A stand-alone spot re-service on the exact area, with a named technician and a firm date",
        "Written treatment timeline with what to expect week by week",
        "Escalation to a service manager with a direct number",
      ],
      openings: [
        "I want to cancel. I'm still seeing roaches — three treatments in.",
        "Cancel my account, please. The bugs are still here, so what am I paying for?",
      ],
    },
  ],
  poor_experience: [
    {
      statedReason: "The technician was late and left the gate open.",
      hiddenMotive:
        "The open gate let their dog out. The dog was found two hours later. Nobody from the company ever apologized. They want to be heard far more than they want to leave.",
      emotionalDriver: "An unacknowledged scare involving their pet.",
      saveConditions: [
        "Agent asks what happened rather than jumping to fix it",
        "Agent lets them tell the whole story without interrupting",
        "Agent gives a direct, unqualified apology for the incident itself",
      ],
      dealBreakers: [
        "A scripted 'I'm sorry you feel that way'",
        "Talking over them mid-story",
        "Jumping to a credit before the apology lands",
      ],
      acceptableResolutions: [
        "Direct apology + documented incident report + coaching for the tech",
        "Different technician assigned going forward, with gate protocol noted on the account",
        "Goodwill credit offered after the apology, not instead of it",
      ],
      openings: [
        "I'd like to cancel my service. Your tech was late and careless last visit.",
        "Yeah — cancel it. I've had it with how the last visit went.",
      ],
    },
  ],
  agreement_dispute: [
    {
      statedReason: "They say they never agreed to a 12-month term and want out with no fee.",
      hiddenMotive:
        "They did sign, but the sales rep verbally told them they could cancel any time. They feel lied to by a person, not wronged by a contract. Admitting the miscommunication matters more than the fee itself.",
      emotionalDriver: "Feeling deceived and slightly foolish for signing.",
      saveConditions: [
        "Agent asks exactly what the rep told them at signup",
        "Agent acknowledges the gap between what was said and what was signed",
        "Agent addresses the fee honestly instead of hiding behind policy language",
      ],
      dealBreakers: [
        "Reading contract terms back at them",
        "Saying 'you signed it' in any form",
        "Refusing to escalate when they push",
      ],
      acceptableResolutions: [
        "Waive or halve the early termination fee as a documented service-recovery exception",
        "Convert to a month-to-month plan at a fair rate",
        "Pause the account instead of cancelling, with the term restarted honestly",
      ],
      openings: [
        "I never agreed to a year. I want this cancelled and I'm not paying a fee.",
        "Hi — I'm cancelling, and I'll tell you right now I'm disputing this contract.",
      ],
    },
  ],
  product_concerns: [
    {
      statedReason: "They're worried the chemicals aren't safe around their kids.",
      hiddenMotive:
        "Their toddler was recently diagnosed with asthma and the pediatrician mentioned indoor irritants. They're scared, not anti-pesticide, and no one has ever explained what is actually applied or offered an alternative.",
      emotionalDriver: "Fear for a child's health.",
      saveConditions: [
        "Agent asks what specifically prompted the concern",
        "Agent treats the fear as legitimate rather than a myth to correct",
        "Agent offers a lower-exposure option or documentation (labels, re-entry times, exterior-only)",
      ],
      dealBreakers: [
        "Saying 'it's completely safe' with no detail",
        "Overwhelming them with chemistry jargon",
        "Offering a discount in response to a safety fear",
      ],
      acceptableResolutions: [
        "Switch to exterior-only or low-impact/botanical treatment plan",
        "Send product labels and safety sheets, plus re-entry guidance",
        "Schedule visits around the child's routine with the same tech each time",
      ],
      openings: [
        "I need to cancel — I'm not comfortable with these chemicals around my kids.",
        "Hi, I want to stop service. I've been reading about what you spray and I'm not okay with it.",
      ],
    },
  ],
};

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

export function generateScenario(input: {
  reason: CancelReason | null;
  difficulty: Difficulty;
  personality: Personality | null;
  authorityRole?: AuthorityRole | null;
}): FullScenario {
  const reason = input.reason ?? pick(CANCEL_REASONS);
  const seed = pick(SEEDS[reason]);
  const personality = input.personality ?? pick(PERSONALITIES);
  const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const tenure = 1 + Math.floor(Math.random() * 6);

  return {
    customerName,
    accountSummary: `${tenure}-year customer on a ${pick(PLANS)}. Balance current.`,
    reason,
    reasonLabel: REASON_LABELS[reason],
    difficulty: input.difficulty,
    personality,
    personalityLabel: PERSONALITY_LABELS[personality],
    authorityRole: input.authorityRole ?? "ces",
    openingLine: pick(seed.openings),
    statedReason: seed.statedReason,
    hiddenMotive: seed.hiddenMotive,
    emotionalDriver: seed.emotionalDriver,
    saveConditions: seed.saveConditions,
    dealBreakers: seed.dealBreakers.concat(PLAYBOOK_DEAL_BREAKERS),
    acceptableResolutions: seed.acceptableResolutions,
  };
}

/** Strip the hidden half before anything reaches the browser mid-call. */
export function toPublicScenario(scenario: FullScenario) {
  return {
    customerName: scenario.customerName,
    accountSummary: scenario.accountSummary,
    reason: scenario.reason,
    reasonLabel: scenario.reasonLabel,
    difficulty: scenario.difficulty,
    personality: scenario.personality,
    personalityLabel: scenario.personalityLabel,
    authorityRole: scenario.authorityRole ?? "ces",
    openingLine: scenario.openingLine,
  };
}
