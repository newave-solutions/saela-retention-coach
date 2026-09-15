// Server-only. Builds a CES service-call scenario with hidden listening details.
import {
  PERSONALITIES,
  PERSONALITY_LABELS,
  type Difficulty,
  type Personality,
} from "./scenarios";
import {
  SERVICE_CALL_TYPES,
  SERVICE_TYPE_LABELS,
  type FullServiceScenario,
  type KeyDetail,
  type ResignTarget,
  type ServiceCallType,
} from "./service-scenarios";
import { nameForVoice, randomPlan } from "./scenario-generator.server";
import { pickVoice, toAssignment } from "./voice-direction";

type Seed = {
  situation: string;
  keyDetails: KeyDetail[];
  valueOpportunities: string[];
  frustrationTriggers: string[];
  openings: string[];
  resign?: ResignTarget;
};

const d = (id: string, label: string, value: string, restates = false): KeyDetail => ({
  id,
  label,
  value,
  restates,
});

const SEEDS: Record<ServiceCallType, Seed[]> = {
  reservice: [
    {
      situation:
        "Serviced 5 weeks ago. Ants are back along the kitchen baseboard and now in the upstairs bathroom. They have not asked for a reservice before and assume it costs money.",
      keyDetails: [
        d("where", "Where the activity is", "Kitchen baseboard by the dishwasher AND the upstairs bathroom"),
        d("when", "How long it's been happening", "Started about 8 days ago, worse after the rain"),
        d("tried", "What they already tried", "Store-bought spray from the hardware store", true),
        d("availability", "When they're home", "Works from home Mondays and Fridays only", true),
        d("pet", "Pets on site", "A cat that stays indoors — asks about safety"),
      ],
      valueOpportunities: [
        "Reservices between regular visits are included at no charge",
        "Rain drives ants indoors — normal, and exactly what the plan covers",
        "Interior spot treatment plus exterior perimeter attention",
      ],
      frustrationTriggers: [
        "Being told to wait for the next scheduled service",
        "Being quoted a charge for a reservice",
        "Booking without asking where the activity actually is",
      ],
      openings: [
        "Hi, yeah — the ants are back. It hasn't even been that long since the guy came out.",
        "So I'm seeing ants again in the kitchen. What do we do about that?",
      ],
    },
    {
      situation:
        "Spiders in the garage and webs under the back patio eaves. They're polite but skeptical the treatment is working.",
      keyDetails: [
        d("where", "Where the activity is", "Garage corners and under the back patio eaves"),
        d("when", "Last service", "Tech came about three weeks ago"),
        d("access", "Access", "Garage side door is usually unlocked; front gate sticks"),
        d("who", "Who to contact", "Wife handles the scheduling — her cell, not the house line", true),
        d("concern", "Underlying concern", "Wondering whether the service is doing anything at all"),
      ],
      valueOpportunities: [
        "Web knockdown and eave treatment are part of the exterior service",
        "Explain the 10-12 week cycle and what normal looks like between visits",
        "Reservice is free and can be stand-alone",
      ],
      frustrationTriggers: [
        "Defending the technician instead of listening",
        "Ignoring that the spouse is the contact",
        "Skipping the 'is it working' worry",
      ],
      openings: [
        "Morning. We've got webs all over the patio again — is that normal?",
        "Hi there, I've got spiders back in the garage. Not sure this stuff is working.",
      ],
    },
    {
      situation:
        "Wasps building a nest above the front door. They're a little anxious because a child was stung.",
      keyDetails: [
        d("where", "Nest location", "Above the front door frame, and maybe one at the shed"),
        d("urgency", "Why it's urgent", "Their 6-year-old was stung on Saturday"),
        d("height", "Access constraint", "Nest is high up — about 12 feet"),
        d("availability", "Availability", "Any day after 2pm; before that they're at school pickup", true),
        d("history", "History", "Same thing happened last spring in the same spot"),
      ],
      valueOpportunities: [
        "Stand-alone reservice at no charge, prioritized",
        "Preventive treatment on recurring nest spots at each regular visit",
        "Note the recurring location on the account so the tech checks it every time",
      ],
      frustrationTriggers: [
        "No acknowledgement that a child was stung",
        "Booking two weeks out without asking about urgency",
        "Missing that this is a repeat location",
      ],
      openings: [
        "Hi — we've got wasps over the front door and my daughter got stung this weekend.",
        "Yeah, hi. There's a wasp nest at my front door again. Same as last year.",
      ],
    },
  ],
  reschedule: [
    {
      situation:
        "Service is scheduled for Thursday. They want it later in the month. They change the day mid-sentence.",
      keyDetails: [
        d("original", "Currently scheduled", "This Thursday morning"),
        d("newday", "Day they actually want", "Tuesday — no, Tuesday they're out; they land on Thursday the following week"),
        d("why", "Reason", "Out of town for a work trip through the weekend"),
        d("window", "Time preference", "Afternoon only; mornings are meetings", true),
        d("note", "Extra ask", "Wants the tech to skip the side yard because it was just seeded"),
      ],
      valueOpportunities: [
        "Keeping the visit in the same month protects the treatment cycle",
        "Exterior can be completed even if nobody is home",
        "Note the seeded side yard so the tech adjusts",
      ],
      frustrationTriggers: [
        "Booking the first day they mentioned instead of the corrected one",
        "Losing the seeded-yard instruction",
        "Pushing the visit outside the month without explaining the impact",
      ],
      openings: [
        "Hey, I need to move my service. I'm going to be out of town.",
        "Hi, can we push my appointment? Something came up with work.",
      ],
    },
    {
      situation:
        "New baby in the house. They want to delay the interior portion but are fine with the exterior.",
      keyDetails: [
        d("why", "Reason", "Newborn at home, nap schedule and product concerns"),
        d("split", "What they want", "Exterior yes, interior delayed by a few weeks"),
        d("time", "Timing", "Anytime between 10am and noon while the baby naps upstairs"),
        d("contact", "Contact preference", "Text only — do not ring the doorbell", true),
        d("room", "Extra detail", "Seeing a few spiders in the nursery closet"),
      ],
      valueOpportunities: [
        "Exterior-only visit keeps the barrier intact",
        "Explain product safety and re-entry in plain terms",
        "The nursery spiders are a reason to keep, not delay, an interior spot treatment",
      ],
      frustrationTriggers: [
        "Ringing-the-doorbell instruction ignored",
        "Dismissing the safety question",
        "Missing the nursery mention entirely",
      ],
      openings: [
        "Hi, we just had a baby, so I need to push the inside part of the service.",
        "Yeah, can we delay my service? We've got a newborn now.",
      ],
    },
    {
      situation:
        "Hosting a big family event and does not want a truck in the driveway that week.",
      keyDetails: [
        d("why", "Reason", "Graduation party Saturday, family arriving Wednesday"),
        d("avoid", "Days to avoid", "Wednesday through Sunday"),
        d("prefer", "Preferred", "The Monday after, early morning"),
        d("gate", "Access", "Back gate will be padlocked that week; code is 2-4-8-0", true),
        d("ask", "Hidden ask", "Would actually love a treatment BEFORE the party for mosquitoes"),
      ],
      valueOpportunities: [
        "Perimeter Plus Mosquito ahead of an outdoor event",
        "Fit the regular service before the party instead of after",
        "Confirm gate access so the visit isn't wasted",
      ],
      frustrationTriggers: [
        "Only hearing 'move it later' and missing the mosquito opening",
        "Not capturing the gate code",
        "Rescheduling into the blocked days",
      ],
      openings: [
        "Hi — we've got a big party this weekend, so I need to move the service.",
        "Can you reschedule me? We've got family coming in all week.",
      ],
    },
  ],
  access_issue: [
    {
      situation:
        "The last two visits the tech couldn't get into the back yard. They're mildly annoyed but mostly want it fixed.",
      keyDetails: [
        d("problem", "Access problem", "New dog in the back yard — a reactive rescue"),
        d("fix", "Their proposed fix", "Call 20 minutes ahead so they can crate the dog"),
        d("phone", "Number to call", "Their cell, not the number on the account", true),
        d("missed", "History", "The last two visits only got the front done"),
        d("ask", "Expectation", "Wants the back yard caught up, not just next time"),
      ],
      valueOpportunities: [
        "Add a permanent call-ahead note to the account",
        "Stand-alone reservice to catch up the back yard now",
        "Explain what the missed back-yard visits mean for coverage",
      ],
      frustrationTriggers: [
        "No ownership of the two missed back yards",
        "Only fixing it going forward",
        "Keeping the old phone number on file",
      ],
      openings: [
        "Hi, your guy keeps not doing my back yard. We've got a dog now.",
        "Yeah — the tech skipped the back again. We need to figure this out.",
      ],
    },
    {
      situation:
        "Gated community. The tech has been turned away at the gate twice.",
      keyDetails: [
        d("gate", "Gate detail", "Guard gate needs the company on the visitor list — resident must call it in"),
        d("code", "Backup", "Vendor code 9-1-4-4 works after 5pm only"),
        d("unit", "Address nuance", "It's unit 12B, not 12 — mail keeps going to the wrong one", true),
        d("time", "Best window", "Weekday mornings before 11"),
        d("mood", "Underlying feeling", "Embarrassed and worried they'll be charged for missed visits"),
      ],
      valueOpportunities: [
        "Correct the address on the account so this stops",
        "Confirm no charge for the turned-away visits",
        "Reschedule inside the same cycle",
      ],
      frustrationTriggers: [
        "Missing the 12B correction",
        "Not addressing the billing worry",
        "Repeating back the wrong gate instructions",
      ],
      openings: [
        "Hi, your technician got turned away at my gate again.",
        "So nobody can get into my community, apparently. Can we fix that?",
      ],
    },
    {
      situation:
        "Works nights and sleeps during the day. The visits keep waking them up.",
      keyDetails: [
        d("schedule", "Their schedule", "Night shift nurse; sleeps 8am to 3pm"),
        d("pref", "What they want", "Exterior-only when they're asleep, interior on a day off"),
        d("off", "Days off", "Every other Wednesday — the next one is the 24th", true),
        d("knock", "Instruction", "Do not knock or ring, ever"),
        d("issue", "Quiet issue", "Mice heard in the attic at night"),
      ],
      valueOpportunities: [
        "Standing no-knock exterior note on the account",
        "Attic mouse activity is a reason for a rodent-focused visit",
        "Schedule the interior on the confirmed day off",
      ],
      frustrationTriggers: [
        "Scheduling during sleep hours anyway",
        "Letting the attic mice comment go by",
        "Making them repeat their shift schedule",
      ],
      openings: [
        "Hi. Your tech woke me up again — I work nights.",
        "Yeah, I need to change how my service happens. I sleep during the day.",
      ],
    },
  ],
  new_pest_issue: [
    {
      situation: "Mice in the garage and, they think, in the pantry.",
      keyDetails: [
        d("where", "Where", "Garage along the back wall, and droppings in the pantry"),
        d("evidence", "Evidence", "Droppings and a chewed dog food bag"),
        d("when", "When", "Noticed over the last week, mostly at night"),
        d("entry", "Possible entry", "A gap under the garage door they've mentioned before", true),
        d("worry", "Worry", "Grandkids visit on weekends"),
      ],
      valueOpportunities: [
        "Interior activity beyond the garage points to the Premium Rodent protocol",
        "Exclusion work must be bundled with the Protection Program",
        "Stand-alone reservice now while the plan is assessed",
      ],
      frustrationTriggers: [
        "Quoting a rodent price before understanding the extent",
        "Missing that activity is in two areas, not one",
        "Not acknowledging the grandkids concern",
      ],
      openings: [
        "Hi — I think we've got mice. There's droppings in my pantry.",
        "Yeah, something's getting into the garage. Chewed right through the dog food.",
      ],
    },
    {
      situation: "Mosquitoes have made the back yard unusable in the evenings.",
      keyDetails: [
        d("where", "Where", "Back yard, worst near a drainage ditch behind the fence"),
        d("when", "When", "Evenings, from about 6pm"),
        d("event", "Why now", "Kid's birthday party outdoors in three weeks", true),
        d("neighbor", "Detail", "Neighbor has a pond they suspect is the source"),
        d("budget", "Money comment", "Says it in passing: 'as long as it's not crazy expensive'"),
      ],
      valueOpportunities: [
        "Perimeter Plus Mosquito, April through September",
        "Harborage treatment along the fence line and ditch",
        "Time the first treatment before the party",
      ],
      frustrationTriggers: [
        "Pitching the add-on before understanding the yard",
        "Ignoring the party date",
        "Talking price without framing value",
      ],
      openings: [
        "Hi, we can't even sit outside anymore. The mosquitoes are awful.",
        "Do you guys do anything about mosquitoes? Our yard is unusable.",
      ],
    },
    {
      situation: "Something is in the crawlspace. They don't know what.",
      keyDetails: [
        d("where", "Where", "Crawlspace under the back bedroom"),
        d("sound", "What they notice", "Scratching at night, and a smell in the last few days"),
        d("clearance", "Clearance", "Crawlspace is tight — maybe two feet"),
        d("access", "Access", "Hatch is behind a shelving unit in the laundry room", true),
        d("home", "Availability", "Home all week except Friday"),
      ],
      valueOpportunities: [
        "Be honest: crawlspaces under three feet of clearance can't be treated",
        "Inspect what can be reached and set correct expectations",
        "Exterior rodent pressure work around the perimeter",
      ],
      frustrationTriggers: [
        "Promising a crawlspace treatment that can't be delivered",
        "Not asking about clearance at all",
        "Booking without noting the blocked hatch",
      ],
      openings: [
        "Hi, there's something living under my house. I can hear it at night.",
        "Yeah — scratching under the back bedroom, and now there's a smell.",
      ],
    },
  ],
  unclear_need: [
    {
      situation:
        "Rambles. Mentions three different things and never actually says what they want.",
      keyDetails: [
        d("bugs", "Pest mention", "Little black bugs in the window sills upstairs"),
        d("bill", "Billing mention", "Thinks last month's charge looked different"),
        d("sched", "Scheduling mention", "Not sure when the next visit is supposed to be"),
        d("real", "What they actually need", "Reassurance plus a reservice for the window sill bugs", true),
        d("aside", "Aside", "Mentions a neighbor who might want service too"),
      ],
      valueOpportunities: [
        "Sort the three threads out loud and confirm the priority",
        "Explain the service schedule so the next visit isn't a mystery",
        "Referral mention is worth acknowledging",
      ],
      frustrationTriggers: [
        "Answering only the last thing they said",
        "Letting the billing question go unanswered",
        "Ending without confirming what was actually booked",
      ],
      openings: [
        "Hi, so — I had a couple of questions, and also there's bugs, and I think my bill changed?",
        "Yeah hi, I'm not really sure who I need to talk to about all this.",
      ],
    },
    {
      situation:
        "An elderly customer who is a little confused about what plan they have.",
      keyDetails: [
        d("plan", "What they think they have", "Believes they pay monthly for 'the bug spray'"),
        d("real", "The real question", "Whether the wasps at the shed are covered"),
        d("hearing", "Communication need", "Asks the agent to slow down and speak up", true),
        d("family", "Family", "Daughter helps with the account and should be told what was set up"),
        d("time", "Availability", "Mornings only; naps in the afternoon"),
      ],
      valueOpportunities: [
        "Explain the plan slowly and confirm understanding",
        "Confirm the wasp reservice is covered and free",
        "Offer to note the daughter as a contact",
      ],
      frustrationTriggers: [
        "Talking fast or using program jargon",
        "Not confirming they understood",
        "Missing the daughter request",
      ],
      openings: [
        "Hello? Yes — I'm calling about the bugs. I'm not sure what it is I have with you folks.",
        "Hi dear, I had a question about my service. Can you speak up a bit?",
      ],
    },
    {
      situation:
        "Calling on behalf of a parent's house and does not have all the answers.",
      keyDetails: [
        d("who", "Who they are", "Son calling about his mother's account"),
        d("address", "Address", "Different from his own; mother's house on Bellview"),
        d("issue", "Issue", "Mother reported 'bugs in the laundry room'"),
        d("auth", "Account nuance", "He is not on the account and doesn't know the password", true),
        d("time", "Availability", "Mother is home all day; he can be there Saturday"),
      ],
      valueOpportunities: [
        "Handle the authorization honestly without stonewalling",
        "Get the right address and pest information captured",
        "Offer to add him as an authorized contact properly",
      ],
      frustrationTriggers: [
        "Hiding behind policy without offering a path",
        "Booking against the wrong address",
        "Not confirming who will be home",
      ],
      openings: [
        "Hi, I'm calling about my mom's house — she says there's bugs in the laundry room.",
        "Yeah, this is for my mother's account. I'm not sure what I'm allowed to do here.",
      ],
    },
  ],
  coverage_question: [
    {
      situation:
        "Wants to know what the protection program actually covers. They saw a wasp nest and a mouse dropping in the garage and aren't sure either is included, and they think the price is high for 'spraying outside'.",
      keyDetails: [
        d("question", "What they're asking", "What is and isn't covered by the plan they pay for"),
        d("wasp", "Thing they saw", "Wasp nest starting under the back eave"),
        d("mouse", "Second thing", "One mouse dropping in the garage, nothing since", true),
        d("price", "Price concern", "Feels the quarterly amount is high for exterior spraying"),
        d("yard", "Yard detail", "Kids play in the back yard most evenings in summer"),
      ],
      valueOpportunities: [
        "Explain interior and exterior coverage plainly, plus what falls outside the plan",
        "Reservices between visits cost them nothing",
        "The 28-day follow-up and the 10-12 week cycle explain what they're paying for",
      ],
      frustrationTriggers: [
        "Reciting a feature list instead of answering the question",
        "Dodging the price question",
        "Pitching an add-on before answering what's covered",
      ],
      openings: [
        "Hi — I just want to understand what I'm actually paying for here. What does this cover?",
        "Quick question: is a wasp nest covered under my plan, or is that extra?",
      ],
    },
    {
      situation:
        "Got their renewal notice and noticed the price went up over the last few services. They're not angry, just want it explained, and they're service-to-service now.",
      keyDetails: [
        d("increase", "What they noticed", "Price has crept up about $15 over the last three services"),
        d("status", "Account status", "No agreement in place — paying service to service", true),
        d("usage", "How they use it", "Mostly worried about ants and the crawlspace"),
        d("budget", "Money comment", "Says they're watching every bill this year"),
        d("contact", "Contact detail", "Prefers texts over calls for reminders"),
      ],
      valueOpportunities: [
        "Explain what the plan covers before talking about the number",
        "A resign locks a better ongoing price instead of drifting up service to service",
        "Coverage through their worst season is worth naming",
      ],
      frustrationTriggers: [
        "Defending the increase without explaining it",
        "Naming a new price before asking what works for them",
        "Ignoring the money comment",
      ],
      openings: [
        "Hey, I'm looking at my bill and it seems like this keeps going up. What's going on?",
        "Hi — my price has gone up a couple times now. Can you explain that to me?",
      ],
      resign: {
        budgetCeiling: "About $115 a service if it's locked in",
        acceptableTerms: [
          "4 or more services at a fixed price that won't drift",
          "Plain numbers: what each service costs and when it's billed",
          "A half-off or free service only if it's what closes it",
        ],
        dealBreakers: [
          "Being sold before the price question is answered",
          "Language that sounds like being tied down",
          "Any 'we'll see what we can do' without numbers",
        ],
      },
    },
  ],
  resign_out_of_agreement: [

    {
      situation:
        "Their agreement finished last month. They liked the service but want to 'stop for now' because money is tight after a job change.",
      keyDetails: [
        d("status", "Account status", "Agreement completed; currently out of agreement"),
        d("money", "Money situation", "Hours cut at work two months ago"),
        d("value", "What they liked", "The tech who always checked the shed"),
        d("fear", "Real fear", "Signing up for something they can't pay for", true),
        d("season", "Timing detail", "Says summer is when they see the most bugs"),
      ],
      valueOpportunities: [
        "Ask their price point before naming any number",
        "Resign with a reduced ongoing price they can actually carry",
        "Coverage through their worst season instead of stopping right before it",
      ],
      frustrationTriggers: [
        "Leading with a free service instead of understanding the budget",
        "Naming a price before asking theirs",
        "Signing them to a long commitment without explaining the terms",
      ],
      openings: [
        "Hi — I think my contract is up, and honestly I need to stop for a while. Money's tight.",
        "Yeah, my agreement ended and I can't really keep paying this right now.",
      ],
      resign: {
        budgetCeiling: "About $100 a service, and nothing at all for the next 30 days",
        acceptableTerms: [
          "4 or more services at a reduced ongoing price",
          "First service free or half off so nothing is due right now",
          "Clear statement of what each service costs after the free one",
        ],
        dealBreakers: [
          "Being asked to pay anything today",
          "A vague 'we'll work something out'",
          "Pressure to commit before hearing the numbers",
        ],
      },
    },
    {
      situation:
        "Out of agreement and shopping. A neighbor told them a cheaper company is going door to door.",
      keyDetails: [
        d("status", "Account status", "Out of agreement for three weeks"),
        d("competitor", "Competitor detail", "Door-to-door rep quoted $89 a service, no initial fee"),
        d("doubt", "Their doubt", "Not sure the cheaper company is any good", true),
        d("history", "History", "Four years with Saela, never a real problem"),
        d("spouse", "Decision maker", "Spouse wants to switch; caller doesn't"),
      ],
      valueOpportunities: [
        "Ask what the other offer actually includes before matching anything",
        "Resign at a fair ongoing price rather than chasing the quote to the floor",
        "Four years of history and a known technician is worth naming",
      ],
      frustrationTriggers: [
        "Immediately dropping to the lowest possible price",
        "Trashing the competitor",
        "Ignoring that the spouse is the one pushing",
      ],
      openings: [
        "Hi — somebody knocked on our door offering the same thing cheaper. What can you do?",
        "My agreement's done and my wife wants to switch companies. Talk me out of it.",
      ],
      resign: {
        budgetCeiling: "Around $105 a service if the value is clear",
        acceptableTerms: [
          "5+ service commitment with a free or half-off first service",
          "A price that is close, not necessarily identical, to the quote",
          "Plain terms: how many services, what each costs, when billing starts",
        ],
        dealBreakers: [
          "Matching a number without asking what the competitor includes",
          "Vague promises about 'looking into it'",
          "Insulting the other company",
        ],
      },
    },
    {
      situation:
        "Still in service but behind on bills after a medical expense. Wants to pause everything.",
      keyDetails: [
        d("status", "Account status", "Near the end of the agreement, one payment behind"),
        d("why", "Why", "Unexpected medical bill last month"),
        d("want", "What they ask for", "To pause for a few months"),
        d("real", "What they'd accept", "Keeping coverage if nothing is owed for a while", true),
        d("issue", "Live pest issue", "Mentions they've started seeing roaches again"),
      ],
      valueOpportunities: [
        "Ask their price point and build around the number they name",
        "Resign with free or half-off services up front so nothing is due while they recover",
        "Stopping now with roaches active makes the problem more expensive later",
      ],
      frustrationTriggers: [
        "Skipping past the medical hardship",
        "Demanding the past-due balance before discussing options",
        "Missing the roach mention entirely",
      ],
      openings: [
        "Hi, I need to pause my service. We had a big medical bill and I just can't right now.",
        "Yeah — I'm behind, I know. I think I need to stop the service for a few months.",
      ],
      resign: {
        budgetCeiling: "Nothing for 60 days, then about $110 a service",
        acceptableTerms: [
          "4+ services with the next one or two free",
          "A restart date for billing they can count on",
          "Honest handling of the past-due balance",
        ],
        dealBreakers: [
          "Any payment required today",
          "Being made to feel judged about the balance",
          "Terms that aren't stated in numbers",
        ],
      },
    },
  ],
};

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function pickSome<T>(list: readonly T[], count: number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0] as T);
  }
  return out;
}

/** Openings the caller never announces — the agent has to surface them. */
const OPPORTUNITY_POOL: HiddenOpportunity[] = [
  {
    id: "yard_use",
    label: "Family uses the back yard in the evenings",
    signal: "Mentions kids, a dog, or sitting outside after work — mosquitoes come up as an aside",
    goodMove:
      "Ask how they use the yard, connect it to mosquito abatement, and offer a warm handoff to sales for a quote",
    kind: "sales_transfer",
  },
  {
    id: "outbuilding",
    label: "Shed, detached garage or crawlspace they never mention twice",
    signal: "Refers in passing to a shed, garage or crawlspace where they've seen droppings or nesting",
    goodMove: "Ask what they're seeing out there and build value toward rodent yard guard, then offer sales for a quote",
    kind: "sales_transfer",
  },
  {
    id: "coverage_gap",
    label: "They don't actually know what their plan covers",
    signal: "Asks whether something is 'extra', or assumes a reservice costs money",
    goodMove:
      "Explain interior/exterior coverage, the 28-day follow-up, the 10-12 week cycle, and that reservices between visits are free",
    kind: "coverage",
  },
  {
    id: "entry_points",
    label: "Gaps around doors, vents or the garage they've noticed",
    signal: "Says something about a gap under the door, a vent screen, or 'they're getting in somewhere'",
    goodMove: "Ask where they're getting in and explain that exclusion work is quoted by sales alongside the plan",
    kind: "sales_transfer",
  },
  {
    id: "price_drift",
    label: "Price has moved and they've noticed",
    signal: "A quiet remark about the bill, the last invoice, or things getting more expensive",
    goodMove:
      "Ask their price point before naming anything, then build a resign that locks a steady price instead of drifting",
    kind: "resign",
  },
  {
    id: "money_pressure",
    label: "Money is tighter than they're admitting",
    signal: "Hours cut, a big bill, a spouse watching the budget — said once, in passing",
    goodMove:
      "Resolve what they called about first, then ask what works for them and build a resign around that number",
    kind: "resign",
  },
  {
    id: "second_contact",
    label: "Someone else really handles the account",
    signal: "A spouse, parent or roommate is mentioned as the one who deals with this",
    goodMove: "Capture the right contact and confirm who will be home and who should be called",
    kind: "coverage",
  },
];

const RESIGN_SIGNALS = [
  "Says the price has gone up over the last few services",
  "Mentions money being tight without asking for anything",
  "Refers to their plan being finished or 'just going service to service now'",
];

function eligibilityFor(seed: Seed, callType: ServiceCallType): ResignEligibility | null {
  if (callType === "resign_out_of_agreement") {
    const target = seed.resign;
    if (!target) return null;
    return {
      serviceToService: true,
      signals: RESIGN_SIGNALS,
      budgetCeiling: target.budgetCeiling,
      acceptableTerms: target.acceptableTerms,
      dealBreakers: target.dealBreakers,
      requiredSteps: 3 + Math.floor(Math.random() * 2),
    };
  }

  // Roughly half of ordinary callers are quietly service-to-service and resignable.
  if (Math.random() > 0.5) return null;

  const ceiling = pick(["about $105 a service", "around $110 a service", "no more than $115 a service"]);
  return {
    serviceToService: true,
    signals: pickSome(RESIGN_SIGNALS, 2),
    budgetCeiling: ceiling,
    acceptableTerms: [
      "At least 4 more services at a price that stays put",
      "The numbers said plainly: cost per service and when billing happens",
      "A half-off or free service only if that is what finally closes it",
    ],
    dealBreakers: [
      "Being pitched before the reason they called is actually handled",
      "Wording that makes it sound like being tied into something",
      "A giveaway offered before any price is discussed",
    ],
    requiredSteps: 4,
  };
}

export function generateServiceScenario(input: {
  callType: ServiceCallType | null;
  difficulty: Difficulty;
  personality: Personality | null;
  excludeVoices?: readonly string[];
}): FullServiceScenario {
  const callType = input.callType ?? pick(SERVICE_CALL_TYPES);
  const seed = pick(SEEDS[callType]);
  const personality = input.personality ?? pick(PERSONALITIES);

  const rosterVoice = pickVoice({ exclude: input.excludeVoices ?? [] });
  const customerName = nameForVoice(rosterVoice);
  const tenure = 1 + Math.floor(Math.random() * 6);
  const eligibility = eligibilityFor(seed, callType);

  const pool = eligibility
    ? OPPORTUNITY_POOL
    : OPPORTUNITY_POOL.filter((item) => item.kind !== "resign");
  const hiddenOpportunities = pickSome(pool, 2 + Math.floor(Math.random() * 2));
  if (eligibility && !hiddenOpportunities.some((item) => item.kind === "resign")) {
    hiddenOpportunities.push(
      OPPORTUNITY_POOL.find((item) => item.id === "price_drift") as HiddenOpportunity,
    );
  }

  return {
    customerName,
    voice: toAssignment(rosterVoice),
    accountSummary: `${tenure}-year customer on a ${randomPlan()}${eligibility ? ", currently paying service to service" : ""}.`,
    callType,
    callTypeLabel: SERVICE_TYPE_LABELS[callType],
    difficulty: input.difficulty,
    personality,
    personalityLabel: PERSONALITY_LABELS[personality],
    openingLine: pick(seed.openings),
    situation: seed.situation,
    keyDetails: seed.keyDetails,
    valueOpportunities: seed.valueOpportunities,
    frustrationTriggers: seed.frustrationTriggers,
    hiddenOpportunities,
    ...(eligibility ? { resignEligibility: eligibility } : {}),
    ...(seed.resign ? { resign: seed.resign } : {}),
  };
}


/** Strip the hidden half before anything reaches the browser mid-call. */
export function toPublicServiceScenario(scenario: FullServiceScenario) {
  return {
    customerName: scenario.customerName,
    accountSummary: scenario.accountSummary,
    callType: scenario.callType,
    callTypeLabel: scenario.callTypeLabel,
    difficulty: scenario.difficulty,
    personality: scenario.personality,
    personalityLabel: scenario.personalityLabel,
    openingLine: scenario.openingLine,
    ...(scenario.voice ? { voice: scenario.voice } : {}),
  };
}
