// Server-only. Builds a hidden-motive cancellation scenario for a call.
import {
  CANCEL_REASONS,
  PERSONALITIES,
  PERSONALITY_LABELS,
  REASON_LABELS,
  type CancelReason,
  type Difficulty,
  type FullScenario,
  type Personality,
} from "./scenarios";

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
  "Dana","Marcus","Ashley","Ted","Alicia","Roy","Jen","Curtis","Beth","Omar","Sandra","Wes",
  "Tyler","Megan","Darnell","Kristin","Brandon","Shauna","Vince","Lori","Chad","Denise","Hector",
  "Kayla","Randy","Monique","Grant","Paula","Dustin","Tasha","Bill","Carmen","Nate","Rhonda",
];
const LAST_NAMES = [
  "Whitaker","Alvarez","Doyle","Nakamura","Boone","Ferrell","Okafor","Kaminski","Reyes","Salinas",
  "Mercer","Hutchins","Vaughn","Delgado","Braddock","Sizemore","Lindquist","Pruitt","Cavanaugh",
  "Escobedo","Tolliver","Ridgeway","Barlowe","McKinney",
];
const PLANS = [
  "quarterly Protection Program",
  "Protection Program with Perimeter Plus Mosquito",
  "Protection Program with Rodent Yard Guard",
  "Protection Program plus Premium Rodent follow-ups",
  "bi-monthly Protection Program",
  "Protection Program with exclusion work",
];

const SEEDS: Record<CancelReason, Seed[]> = {
  competitor_switch: [
    {
      statedReason: "A different company quoted them a cheaper rate, so they want out.",
      hiddenMotive:
        "The neighbor's provider guarantees a same-week callback. This customer waited nine days after a wasp complaint and felt deprioritized. Price is the excuse; responsiveness is the wound.",
      emotionalDriver: "Feeling like a low-priority account.",
      saveConditions: [
        "Agent asks what the other company promised, not just what it costs",
        "Agent surfaces the delayed callback and owns it personally",
        "Agent commits to a named tech and a callback window",
      ],
      dealBreakers: [
        "Leading with a discount before hearing the story",
        "Bad-mouthing the competitor",
        "Claiming 'we always respond in 24 hours'",
      ],
      acceptableResolutions: [
        "Priority flag plus a guaranteed callback window",
        "Assigned consistent technician",
        "Price built around their stated number after responsiveness is fixed",
      ],
      openings: [
        "Yeah, hi — I need to cancel my service. I got a better price from someone else.",
        "Hi. I'm going ahead and cancelling. Another company's doing it cheaper.",
      ],
    },
    {
      statedReason: "A door-to-door rep from another company signed them up on the porch yesterday.",
      hiddenMotive:
        "They never see their own technician. The other rep knocked, looked them in the eye, and remembered their dog's name. It's about being treated like a person, not a route stop.",
      emotionalDriver: "Feeling anonymous to their own provider.",
      saveConditions: [
        "Agent thanks them specifically for their years on the account",
        "Agent asks what the other rep actually promised in person",
        "Agent offers a real human point of contact by name",
      ],
      dealBreakers: [
        "Mocking door-to-door sales",
        "Reciting service features they've never seen delivered",
        "Rushing them to a decision on the call",
      ],
      acceptableResolutions: [
        "Direct line to a named service manager",
        "Same technician every visit with a text before arrival",
        "Meet-in-the-middle on price after the relationship gap is owned",
      ],
      openings: [
        "So a guy came by yesterday and I signed with them. I need to cancel you all.",
        "Hey — I've already switched. Just calling to shut this one off.",
      ],
    },
    {
      statedReason: "The competitor bundled termite coverage and Saela didn't.",
      hiddenMotive:
        "Nobody ever reviewed their coverage with them. They assumed they had termite protection this whole time and only found out they didn't when the other company asked.",
      emotionalDriver: "Feeling misled about what they've been paying for.",
      saveConditions: [
        "Agent asks what coverage they believed they had",
        "Agent owns that nobody reviewed the plan with them",
        "Agent lays out exactly what's covered and what isn't, plainly",
      ],
      dealBreakers: [
        "Telling them it's in the agreement they signed",
        "Vague 'we can look into that' answers",
        "Upselling before the confusion is acknowledged",
      ],
      acceptableResolutions: [
        "Written coverage review and a clear add-on quote",
        "Right-size the program around their real risk",
        "Honest comparison against the competitor's bundle",
      ],
      openings: [
        "Cancel it. Turns out I've never even had termite coverage with you people.",
        "I want out. The other company covers termites and apparently you don't.",
      ],
    },
    {
      statedReason: "Their new provider is half the price for 'the same thing'.",
      hiddenMotive:
        "They're testing whether Saela will fight for them at all. If the agent folds instantly to the price, it confirms they were overpaying and they leave anyway.",
      emotionalDriver: "Suspicion that they've been overcharged for years.",
      saveConditions: [
        "Agent asks what their price point actually is",
        "Agent builds an offer around that number instead of guessing",
        "Agent explains the difference in scope honestly, without spin",
      ],
      dealBreakers: [
        "Dropping straight to floor pricing",
        "Refusing to talk numbers at all",
        "Claiming the competitor is a scam",
      ],
      acceptableResolutions: [
        "Meet-in-the-middle price tied to a specific service commitment",
        "Year-in-full discount if they pay upfront",
        "Verified competitor match with the scope spelled out",
      ],
      openings: [
        "What can you do on the price? Because I'm paying double what my brother pays.",
        "I'll be straight with you — match it or I'm gone.",
      ],
    },
    {
      statedReason: "Their HOA switched to a preferred vendor and they're following it.",
      hiddenMotive:
        "They don't actually care about the HOA. The last two visits were rescheduled on them with no notice and the HOA switch is a convenient, conflict-free exit.",
      emotionalDriver: "Avoiding confrontation about being messed around.",
      saveConditions: [
        "Agent gently probes whether anything else has been going wrong",
        "Agent names the reschedules before the customer has to",
        "Agent takes ownership of the scheduling failures",
      ],
      dealBreakers: [
        "Accepting the HOA reason at face value and processing the cancel",
        "Arguing about the HOA",
        "Blaming route scheduling on 'the system'",
      ],
      acceptableResolutions: [
        "Locked appointment window they choose",
        "Personal confirmation call before each visit",
        "Service manager review of the account",
      ],
      openings: [
        "Our HOA went with a different company, so I need to cancel.",
        "Hi — nothing personal, the neighborhood switched vendors. Please cancel me.",
      ],
    },
    {
      statedReason: "A friend in the industry told them they could do it for free.",
      hiddenMotive:
        "The friend offer is real but unreliable. What actually pushed them was a billing charge they didn't expect last month that nobody explained.",
      emotionalDriver: "Irritation at a surprise charge.",
      saveConditions: [
        "Agent asks about the account and finds the unexpected charge",
        "Agent explains the charge plainly and owns the lack of notice",
        "Agent asks what would make staying worth it",
      ],
      dealBreakers: [
        "Ignoring the billing question",
        "Insisting the charge was disclosed",
        "Guilt-tripping about the friend",
      ],
      acceptableResolutions: [
        "Credit or correct the charge and confirm it in writing",
        "Billing walkthrough with future charges laid out",
        "Modest loyalty adjustment once billing trust is restored",
      ],
      openings: [
        "My buddy does pest control, he'll do mine for nothing. Cancel me out.",
        "Yeah, cancel it. I've got somebody who'll take care of it for free.",
      ],
    },
  ],
  affordability: [
    {
      statedReason: "Money is tight and the plan is the easiest bill to cut.",
      hiddenMotive:
        "The last three visits were fifteen minutes and skipped the garage and back fence. They don't feel they're getting what they pay for. If value were visible, the money would be found.",
      emotionalDriver: "Feeling quietly ripped off, but too polite to accuse anyone.",
      saveConditions: [
        "Agent asks what the visits have actually looked like",
        "Agent connects price to value delivered rather than just shaving cost",
        "Agent acknowledges the short visits without excuses",
      ],
      dealBreakers: [
        "Immediately offering a discount that keeps the same service quality",
        "Suggesting they 'just skip a visit' to save money",
        "Lecturing about pest risk to scare them",
      ],
      acceptableResolutions: [
        "Full-property walkthrough next visit with a written service report",
        "Right-size the program to what they actually need",
        "Loyalty credit paired with a service-quality fix",
      ],
      openings: [
        "Hi, I need to cancel. Honestly it's just too expensive right now.",
        "I'm calling to cancel my plan — money's tight and this one has to go.",
      ],
    },
    {
      statedReason: "Their price went up this year and nobody warned them.",
      hiddenMotive:
        "They could absorb the increase. What burns is finding it on the card statement instead of hearing it from someone. It reads as sneaky.",
      emotionalDriver: "Feeling like something was slipped past them.",
      saveConditions: [
        "Agent owns the missing notice directly, no policy language",
        "Agent states the old price, the new price, and the reason clearly",
        "Agent asks what number works for them",
      ],
      dealBreakers: [
        "Saying increases are standard across the industry",
        "Claiming notice was sent when they never saw it",
        "Skipping the apology and going straight to an offer",
      ],
      acceptableResolutions: [
        "Cover half the increase as a meet-in-the-middle",
        "Hold last year's rate for the remaining term",
        "Year-in-full discount if they prepay",
      ],
      openings: [
        "My bill jumped twenty bucks with no heads up. I'm done — cancel it.",
        "Why is this more than last time? Actually, don't bother. Just cancel it.",
      ],
    },
    {
      statedReason: "They just lost a job and are cutting every non-essential.",
      hiddenMotive:
        "They genuinely want the service and are embarrassed to say the real situation out loud. A pause, not a cancel, is what they actually need — but they won't ask for it.",
      emotionalDriver: "Embarrassment about money.",
      saveConditions: [
        "Agent treats them with dignity and doesn't pry",
        "Agent thanks them sincerely for their years on the account",
        "Agent offers a pause or reduced frequency before offering money off",
      ],
      dealBreakers: [
        "Pushing hard for a sale",
        "Making them explain their finances",
        "Fear-selling about infestations",
      ],
      acceptableResolutions: [
        "Seasonal pause with the account held open",
        "Step down to exterior-only at a lower rate",
        "Restart date set with a callback reminder",
      ],
      openings: [
        "I hate to do this, but I have to cancel. I lost my job last month.",
        "I need to stop service for a while. Things are... tight.",
      ],
    },
    {
      statedReason: "They only see bugs a few months a year and refuse to pay year-round.",
      hiddenMotive:
        "Nobody ever explained that the off-season visits are what prevent the season. They think they're paying for nothing half the year.",
      emotionalDriver: "Feeling like the plan is padded.",
      saveConditions: [
        "Agent asks what they think the winter visits do",
        "Agent explains the cycle plainly, without condescension",
        "Agent offers a frequency change instead of arguing",
      ],
      dealBreakers: [
        "Talking down to them",
        "Insisting nothing can change about frequency",
        "Jargon about product residuals",
      ],
      acceptableResolutions: [
        "Change frequency to fit their real risk window",
        "Show a season-by-season plan of what each visit does",
        "Adjust price to match the reduced schedule",
      ],
      openings: [
        "I'm not paying you in January for bugs I see in July. Cancel it.",
        "Why am I being charged in the winter? Forget it — cancel the whole thing.",
      ],
    },
    {
      statedReason: "Two payments came out in one month and they're furious.",
      hiddenMotive:
        "One was a legitimate catch-up from a skipped card. Nobody called. The overdraft fee is the real damage and nobody has offered to fix it.",
      emotionalDriver: "Anger about being hit financially with no warning.",
      saveConditions: [
        "Agent finds and explains both charges exactly",
        "Agent owns the failure to call before running the second one",
        "Agent addresses the overdraft consequence, not just the charge",
      ],
      dealBreakers: [
        "Saying the charges are valid and leaving it there",
        "Passing them to billing",
        "Any hint that it's their fault for the card issue",
      ],
      acceptableResolutions: [
        "Refund or credit one charge and document it",
        "Move the billing date to after payday",
        "Goodwill credit toward the overdraft",
      ],
      openings: [
        "You people took two payments out of my account. That's it — cancel it.",
        "You overdrafted my account. Why should I keep paying you? Just cancel.",
      ],
    },
    {
      statedReason: "They want to switch to calling only when they see something.",
      hiddenMotive:
        "They're actually satisfied with the service. They just want control over the spend and have never been told what a one-off costs versus the plan.",
      emotionalDriver: "Wanting control over their own money.",
      saveConditions: [
        "Agent asks what their price point per year looks like",
        "Agent gives honest one-off versus plan math",
        "Agent doesn't pressure them into the bigger plan",
      ],
      dealBreakers: [
        "Refusing to give one-off pricing",
        "Exaggerating the risk of going on-demand",
        "Repeating the same offer three times",
      ],
      acceptableResolutions: [
        "Lower-frequency plan priced around their number",
        "Prepaid annual with a discount for the certainty",
        "Keep the account active with reduced scope",
      ],
      openings: [
        "I'd rather just call you when I need you. Cancel the plan.",
        "What's it cost to just have you come out once? Because I'm cancelling the subscription.",
      ],
    },
  ],
  persistent_activity: [
    {
      statedReason: "They're still seeing roaches after several treatments.",
      hiddenMotive:
        "Nobody explained the treatment cycle. They assumed one visit ends it, so normal die-off reads as failure. Underneath is embarrassment — they think their home is being judged as dirty.",
      emotionalDriver: "Embarrassment and the fear that nothing will ever work.",
      saveConditions: [
        "Agent asks what they're seeing, where, and when",
        "Agent explains the treatment cycle plainly without condescension",
        "Agent removes blame from the customer explicitly",
      ],
      dealBreakers: [
        "Implying clutter or sanitation is their fault",
        "Saying 'that's normal' with no explanation",
        "Offering money off instead of a re-service",
      ],
      acceptableResolutions: [
        "Stand-alone re-service with a senior technician",
        "Written treatment timeline of what to expect week by week",
        "Escalation to a service manager with a direct number",
      ],
      openings: [
        "I want to cancel. I'm still seeing roaches — three treatments in.",
        "Cancel my account. The bugs are still here, so what am I paying for?",
      ],
    },
    {
      statedReason: "Mice are back in the garage for the third winter running.",
      hiddenMotive:
        "The entry point was never sealed. They've been told 'we'll keep baiting' every year and nobody has ever inspected for exclusion work.",
      emotionalDriver: "Feeling like they're on a treadmill that goes nowhere.",
      saveConditions: [
        "Agent asks where exactly the activity is and what's been tried",
        "Agent recognizes this is an exclusion problem, not a baiting problem",
        "Agent owns that three winters is a service failure",
      ],
      dealBreakers: [
        "Suggesting more of the same baiting",
        "Blaming an old house",
        "Discount instead of a real fix",
      ],
      acceptableResolutions: [
        "Exclusion inspection bundled with the Protection Program",
        "Premium Rodent protocol with scheduled follow-ups",
        "Named technician who owns the outcome",
      ],
      openings: [
        "Third year in a row with mice in my garage. I'm done. Cancel it.",
        "You keep putting out bait and they keep coming back. Cancel my service.",
      ],
    },
    {
      statedReason: "Wasps built a nest right after a scheduled visit.",
      hiddenMotive:
        "Their kid got stung. Nobody at the company knows that yet, and they're waiting to see if the agent asks a single question before offering something.",
      emotionalDriver: "Protective anger about their child getting hurt.",
      saveConditions: [
        "Agent asks what happened rather than jumping to a fix",
        "Agent hears the sting story and responds to it as a person",
        "Agent takes personal ownership of getting someone out fast",
      ],
      dealBreakers: [
        "Rushing to a resolution before asking",
        "Explaining wasp biology at them",
        "A generic apology with no ownership",
      ],
      acceptableResolutions: [
        "Same-week stand-alone re-service with nest removal",
        "Direct callback from the agent after the visit",
        "Documented account note so it never repeats",
      ],
      openings: [
        "You were here Tuesday and there's a nest by my back door. Cancel my service.",
        "Look — I need this cancelled. Your treatment did nothing about the wasps.",
      ],
    },
    {
      statedReason: "Ants are back inside within a week of every treatment.",
      hiddenMotive:
        "The tech only ever treats outside because the customer is usually at work. Nobody has offered an appointment time when they'd actually be home to let them in.",
      emotionalDriver: "Frustration at a fixable thing nobody has fixed.",
      saveConditions: [
        "Agent asks whether the inside is being treated at all",
        "Agent finds the access problem and names it",
        "Agent solves scheduling, not just product",
      ],
      dealBreakers: [
        "Assuming the tech did interior work",
        "Telling them ants are seasonal and moving on",
        "Offering a credit for a scheduling problem",
      ],
      acceptableResolutions: [
        "Evening or Saturday appointment they can be home for",
        "Interior treatment with the 28-day follow-up explained",
        "Direct scheduling contact",
      ],
      openings: [
        "Ants are all over my kitchen counter again. A week after you came. Cancel it.",
        "I'm cancelling. Same ants, same spot, every single month.",
      ],
    },
    {
      statedReason: "Spiders everywhere in the basement and they say nothing's changed.",
      hiddenMotive:
        "The basement has never been treated — there's a crawlspace access the tech skipped and never mentioned. The customer has no idea part of their home is being left out.",
      emotionalDriver: "Feeling that corners are being cut on them.",
      saveConditions: [
        "Agent asks specifically which areas get treated",
        "Agent discovers and admits the skipped area",
        "Agent commits to a full-property service with a report",
      ],
      dealBreakers: [
        "Defending the tech before checking",
        "Telling them spiders are harmless",
        "Vague promises with no date",
      ],
      acceptableResolutions: [
        "Full-property re-service including the crawlspace where clearance allows",
        "Written service report after each visit",
        "Senior technician assigned",
      ],
      openings: [
        "My basement is full of webs. What exactly am I paying for? Cancel it.",
        "I want to cancel. The spiders are worse than before you started.",
      ],
    },
    {
      statedReason: "They've called for re-services twice and nobody came.",
      hiddenMotive:
        "Both requests were logged but never dispatched. They're not really about the pests anymore — they want proof the company can do what it says once.",
      emotionalDriver: "Loss of faith that any promise will be kept.",
      saveConditions: [
        "Agent verifies the missed re-services and says so out loud",
        "Agent takes personal ownership of dispatching this one",
        "Agent gives a specific date and a personal follow-up commitment",
      ],
      dealBreakers: [
        "Asking them to call back to schedule",
        "Transferring them to another department",
        "Any promise without a date attached",
      ],
      acceptableResolutions: [
        "Booked re-service on the call with a confirmation",
        "Agent's own callback after the visit happens",
        "Manager escalation documented on the account",
      ],
      openings: [
        "I've called twice for a re-service and nobody showed up. Cancel it.",
        "Second time I'm calling about this. Nobody came. I want out.",
      ],
    },
  ],
  poor_experience: [
    {
      statedReason: "The technician was late and left the gate open.",
      hiddenMotive:
        "The open gate let their dog out. The dog was found two hours later. Nobody ever apologized. They want to be heard far more than they want to leave.",
      emotionalDriver: "An unacknowledged scare involving their pet.",
      saveConditions: [
        "Agent asks what happened rather than jumping to fix it",
        "Agent lets them tell the whole story without interrupting",
        "Agent gives a direct, unqualified apology for the incident",
      ],
      dealBreakers: [
        "A scripted 'I'm sorry you feel that way'",
        "Talking over them mid-story",
        "Jumping to a credit before the apology lands",
      ],
      acceptableResolutions: [
        "Direct apology, documented incident report, coaching for the tech",
        "Different technician with gate protocol noted on the account",
        "Goodwill credit after the apology, not instead of it",
      ],
      openings: [
        "I'd like to cancel my service. Your tech was late and careless last visit.",
        "Yeah — cancel it. I've had it with how the last visit went.",
      ],
    },
    {
      statedReason: "A technician was rude to their elderly mother at the door.",
      hiddenMotive:
        "Their mother has dementia and was frightened. This is about protecting her, and no amount of money will touch it — only accountability will.",
      emotionalDriver: "Protective fury on behalf of a vulnerable parent.",
      saveConditions: [
        "Agent listens fully and does not interrupt",
        "Agent apologizes for the person, not the policy",
        "Agent commits to a named follow-up with the branch",
      ],
      dealBreakers: [
        "Defending the technician",
        "Asking if there might be a misunderstanding",
        "Offering a discount at any point before accountability",
      ],
      acceptableResolutions: [
        "Formal complaint filed with the branch manager and a callback",
        "That technician removed from the account permanently",
        "Written confirmation of what will change",
      ],
      openings: [
        "Your guy snapped at my mother yesterday. She's eighty-one. Cancel my service.",
        "I want this cancelled today and I want to talk to somebody about your technician.",
      ],
    },
    {
      statedReason: "Nobody shows up in the window they're given.",
      hiddenMotive:
        "They've taken unpaid time off work twice for missed windows. The cost of the missed shifts is more than the service costs.",
      emotionalDriver: "Real financial loss caused by the company's schedule.",
      saveConditions: [
        "Agent asks what the missed windows actually cost them",
        "Agent owns the scheduling failures specifically",
        "Agent offers a hard appointment, not a window",
      ],
      dealBreakers: [
        "Explaining how routing works",
        "Offering another vague window",
        "Treating it as a minor inconvenience",
      ],
      acceptableResolutions: [
        "Fixed appointment time they choose",
        "Text-ahead confirmation from the technician",
        "Credit for the missed visits",
      ],
      openings: [
        "I've taken two days off work waiting on you. Cancel it.",
        "Nobody showed up. Again. I'm cancelling — save the speech.",
      ],
    },
    {
      statedReason: "Something in the yard was damaged during a treatment.",
      hiddenMotive:
        "It was a garden their late spouse planted. The damage is small in dollars and enormous to them, and no one has taken it seriously.",
      emotionalDriver: "Grief attached to something that was broken carelessly.",
      saveConditions: [
        "Agent asks about the garden and actually listens",
        "Agent treats it as significant regardless of dollar value",
        "Agent takes personal ownership of making it right",
      ],
      dealBreakers: [
        "Asking for a receipt or proof of value first",
        "Calling it minor",
        "Routing them to a claims process and ending there",
      ],
      acceptableResolutions: [
        "Personal apology plus replacement arranged by the agent",
        "Technician coached and reassigned",
        "Follow-up call from the agent once it's resolved",
      ],
      openings: [
        "Your technician trampled my flower beds. I want to cancel.",
        "Cancel my account. Whoever came out did damage and nobody's called me back.",
      ],
    },
    {
      statedReason: "They can never get a human being on the phone.",
      hiddenMotive:
        "They've been trying for three weeks to report a real problem. The cancel request is the only thing that got them a live person, and they know it.",
      emotionalDriver: "Feeling ignored until they threatened to leave.",
      saveConditions: [
        "Agent acknowledges how hard it was to reach someone",
        "Agent asks about the original problem they were calling about",
        "Agent gives them a direct way to reach a person next time",
      ],
      dealBreakers: [
        "Explaining call volumes",
        "Only addressing the cancellation and not the original issue",
        "Putting them on hold again",
      ],
      acceptableResolutions: [
        "Original issue resolved on this call with a date",
        "Direct line or named contact",
        "Manager escalation with a callback commitment",
      ],
      openings: [
        "It took me three weeks to get a person. Cancel my service.",
        "Finally. A human. Okay — I'm cancelling.",
      ],
    },
    {
      statedReason: "They keep getting a different technician who doesn't know the property.",
      hiddenMotive:
        "The original technician knew about the wasp issue over the porch. Every new person misses it, so they re-explain their own home every visit and feel like a stranger to their own account.",
      emotionalDriver: "Exhaustion from repeating themselves.",
      saveConditions: [
        "Agent asks how many different techs they've had",
        "Agent owns the inconsistency instead of explaining routing",
        "Agent commits to one assigned technician",
      ],
      dealBreakers: [
        "Saying all technicians are trained the same",
        "Promising consistency without naming anyone",
        "Discount instead of continuity",
      ],
      acceptableResolutions: [
        "Named technician assigned to the account",
        "Property notes documented so nothing gets missed",
        "Service manager review before the next visit",
      ],
      openings: [
        "Five different guys in a year and I explain my house to every one of them. Cancel it.",
        "I'm cancelling. Nobody who comes here knows anything about my property.",
      ],
    },
  ],
  agreement_dispute: [
    {
      statedReason: "They say they never agreed to a 12-month term and want out with no fee.",
      hiddenMotive:
        "They did sign, but the sales rep verbally said they could cancel any time. They feel lied to by a person, not wronged by a contract. Admitting the miscommunication matters more than the fee.",
      emotionalDriver: "Feeling deceived and slightly foolish for signing.",
      saveConditions: [
        "Agent asks exactly what the rep told them at signup",
        "Agent acknowledges the gap between what was said and what was signed",
        "Agent addresses the fee honestly instead of hiding behind policy",
      ],
      dealBreakers: [
        "Reading contract terms back at them",
        "Saying 'you signed it' in any form",
        "Refusing to escalate when they push",
      ],
      acceptableResolutions: [
        "Waive or halve the early termination fee as a documented exception",
        "Convert to month-to-month at a fair rate",
        "Pause the account with the term handled honestly",
      ],
      openings: [
        "I never agreed to a year. I want this cancelled and I'm not paying a fee.",
        "Hi — I'm cancelling, and I'll tell you right now I'm disputing this contract.",
      ],
    },
    {
      statedReason: "They're being billed after they already cancelled once.",
      hiddenMotive:
        "Their first cancellation request was taken by someone who never processed it. They're now convinced the company does this on purpose.",
      emotionalDriver: "Believing they're being deliberately trapped.",
      saveConditions: [
        "Agent verifies the earlier request and confirms it out loud",
        "Agent owns the failure with no hedging",
        "Agent states exactly what will happen next and by when",
      ],
      dealBreakers: [
        "Saying there's no record of it",
        "Any suggestion they didn't follow the right process",
        "A save attempt before the billing is made right",
      ],
      acceptableResolutions: [
        "Refund of the charges since the original request",
        "Written confirmation of account status",
        "If they stay, a documented restart on fair terms",
      ],
      openings: [
        "I cancelled in March. You're still charging me. What the hell is this?",
        "I already cancelled once. Why am I still being billed?",
      ],
    },
    {
      statedReason: "The initial service price was double what they were quoted.",
      hiddenMotive:
        "The quote was for the plan, not the initial. That was never explained. They feel baited, and they're mostly angry at themselves for not asking.",
      emotionalDriver: "Feeling tricked and defensive about it.",
      saveConditions: [
        "Agent asks what number they were quoted and by whom",
        "Agent explains initial versus recurring clearly and without blame",
        "Agent owns that it should have been made obvious upfront",
      ],
      dealBreakers: [
        "Implying they misunderstood",
        "Reciting the pricing structure as if it's obvious",
        "Refusing to adjust anything",
      ],
      acceptableResolutions: [
        "Reduce or split the initial charge",
        "Apply a credit toward the next regular service",
        "Written breakdown of every future charge",
      ],
      openings: [
        "I was quoted one price and charged double. Cancel it and refund me.",
        "This is a bait and switch. I want out.",
      ],
    },
    {
      statedReason: "They signed three days ago and want to rescind before the initial.",
      hiddenMotive:
        "Their spouse was upset they committed without discussing it. This is a household argument, not a service objection.",
      emotionalDriver: "Pressure from their partner and wanting to undo a mistake.",
      saveConditions: [
        "Agent asks what changed since they signed",
        "Agent respects the household decision without pushing",
        "Agent offers something concrete enough to bring back to the spouse",
      ],
      dealBreakers: [
        "Pressuring them to decide alone on the call",
        "Dismissing the spouse's concern",
        "Making them feel trapped by the paperwork",
      ],
      acceptableResolutions: [
        "Adjust the initial price so it clears the household bar",
        "Push the start date so they can talk it over",
        "Reduce scope to a smaller commitment",
      ],
      openings: [
        "I signed up Saturday and I need to cancel before anybody comes out.",
        "My husband and I talked it over. We need to rescind this.",
      ],
    },
    {
      statedReason: "They were told the price was locked and it went up anyway.",
      hiddenMotive:
        "The lock applied to the first term only. They're not unreasonable — they just want someone to admit the promise was made loosely instead of pretending it never was.",
      emotionalDriver: "Needing the company to be honest with them.",
      saveConditions: [
        "Agent asks what they were promised and by whom",
        "Agent concedes the promise was made without qualification",
        "Agent negotiates around the customer's stated number",
      ],
      dealBreakers: [
        "Insisting no such promise was made",
        "Legalistic reading of the terms",
        "A take-it-or-leave-it offer",
      ],
      acceptableResolutions: [
        "Hold the locked rate through the current term",
        "Cover half the increase",
        "Prepay discount to close the gap",
      ],
      openings: [
        "I was told my rate was locked. It went up. Explain that or cancel me.",
        "Somebody lied to me about my price. I want this closed out.",
      ],
    },
    {
      statedReason: "They're moving and being told they owe a cancellation fee.",
      hiddenMotive:
        "They'd happily keep service at the new address. Nobody offered a transfer — they were quoted a fee before anyone asked where they were going.",
      emotionalDriver: "Feeling penalized for something out of their control.",
      saveConditions: [
        "Agent asks where they're moving and when",
        "Agent explores a transfer before ever mentioning a fee",
        "Agent owns that the fee was raised too soon",
      ],
      dealBreakers: [
        "Leading with the termination fee",
        "Not asking about the new address",
        "Treating a move as a lost cause",
      ],
      acceptableResolutions: [
        "Transfer the agreement to the new address in-territory",
        "Waive the fee if the area isn't serviced",
        "Pause the account until they're settled",
      ],
      openings: [
        "We're moving next month and now you want a fee? Cancel it.",
        "I'm relocating. Somebody told me I owe two hundred dollars. That's not happening.",
      ],
    },
  ],
  product_concerns: [
    {
      statedReason: "They're worried the chemicals aren't safe around their kids.",
      hiddenMotive:
        "Their toddler was recently diagnosed with asthma and the pediatrician mentioned indoor irritants. They're scared, not anti-pesticide, and nobody has ever explained what's applied or offered an alternative.",
      emotionalDriver: "Fear for a child's health.",
      saveConditions: [
        "Agent asks what specifically prompted the concern",
        "Agent treats the fear as legitimate rather than a myth to correct",
        "Agent offers a lower-exposure option or documentation",
      ],
      dealBreakers: [
        "Saying 'it's completely safe' with no detail",
        "Overwhelming them with chemistry jargon",
        "Offering a discount in response to a safety fear",
      ],
      acceptableResolutions: [
        "Switch to exterior-only or low-impact treatment",
        "Send product labels, safety sheets, and re-entry guidance",
        "Schedule around the child's routine with the same tech",
      ],
      openings: [
        "I need to cancel — I'm not comfortable with these chemicals around my kids.",
        "Hi, I want to stop service. I've been reading about what you spray and I'm not okay with it.",
      ],
    },
    {
      statedReason: "Their dog got sick the day after a treatment.",
      hiddenMotive:
        "The vet found no link, but nobody from the company ever called back after they reported it. The silence is what convinced them the company doesn't care.",
      emotionalDriver: "Fear for their pet plus anger at being ignored.",
      saveConditions: [
        "Agent asks how the dog is now, first",
        "Agent owns the missing callback directly",
        "Agent provides specific product and re-entry information",
      ],
      dealBreakers: [
        "Dismissing the connection immediately",
        "Explaining liability",
        "Any offer before asking about the animal",
      ],
      acceptableResolutions: [
        "Product labels and pet-safety guidance sent same day",
        "Exterior-only or pet-conscious treatment going forward",
        "Manager callback documented",
      ],
      openings: [
        "My dog was throwing up the night after you sprayed. Cancel my service.",
        "Nobody called me back about my dog. So I'm cancelling.",
      ],
    },
    {
      statedReason: "The smell inside the house lingers for days and gives them headaches.",
      hiddenMotive:
        "The tech applied an interior product they didn't need because nobody asked about sensitivities. A simple scope change would fix everything.",
      emotionalDriver: "Physical discomfort in their own home.",
      saveConditions: [
        "Agent asks what was applied and where",
        "Agent takes the physical reaction seriously",
        "Agent offers a scope or product change, not reassurance",
      ],
      dealBreakers: [
        "Telling them the odor is harmless",
        "Suggesting they open windows and move on",
        "Discount instead of a treatment change",
      ],
      acceptableResolutions: [
        "Exterior-only plan with interior only on request",
        "Low-odor product noted permanently on the account",
        "Re-service scheduled with the new approach",
      ],
      openings: [
        "Whatever you sprayed inside gave me a headache for two days. Cancel it.",
        "I can still smell it a week later. I'm done.",
      ],
    },
    {
      statedReason: "They saw something online about the product being harmful.",
      hiddenMotive:
        "They're not really convinced by the article — they're testing whether the company will be straight with them or get defensive. Honesty keeps them; spin loses them.",
      emotionalDriver: "Wanting to find out if they can trust this company.",
      saveConditions: [
        "Agent asks what they read and engages with it seriously",
        "Agent is honest about what the product does and doesn't do",
        "Agent offers documentation rather than reassurance",
      ],
      dealBreakers: [
        "Laughing off internet research",
        "Blanket safety claims",
        "Changing the subject to price",
      ],
      acceptableResolutions: [
        "Labels and safety data sent with a plain-language summary",
        "Alternative product option offered",
        "A specialist callback to answer technical questions",
      ],
      openings: [
        "I read what's in this stuff. Why would I keep paying for that? Cancel it.",
        "Is this the same chemical they banned? Because if so, I'm out.",
      ],
    },
    {
      statedReason: "They started a vegetable garden and don't want spray near it.",
      hiddenMotive:
        "They want to keep the service. They just assume it's all-or-nothing because nobody has ever offered to treat around a garden.",
      emotionalDriver: "Protecting something they've put work into.",
      saveConditions: [
        "Agent asks where the garden is on the property",
        "Agent offers a treatment plan that works around it",
        "Agent confirms the exclusion zone will be documented",
      ],
      dealBreakers: [
        "Saying it's fine to spray near food crops",
        "Not offering any adjustment",
        "Sending them away to 'think about it'",
      ],
      acceptableResolutions: [
        "Documented no-treat zone around the garden",
        "Bait or targeted application instead of broadcast spray",
        "Same technician who knows the layout",
      ],
      openings: [
        "I put in raised beds this spring so I need to cancel the spraying.",
        "I'm growing food back there now. Cancel my service.",
      ],
    },
    {
      statedReason: "They're pregnant and want nothing applied in the house at all.",
      hiddenMotive:
        "They've had one miscarriage before and are terrified of any risk. This is emotional and non-negotiable — but an exterior-only plan would completely satisfy them if anyone offered it.",
      emotionalDriver: "Deep fear tied to a past loss.",
      saveConditions: [
        "Agent responds gently and doesn't push for the reason",
        "Agent offers an exterior-only plan unprompted",
        "Agent puts the restriction on the account permanently",
      ],
      dealBreakers: [
        "Arguing about exposure levels",
        "Requiring a doctor's note or explanation",
        "Any pressure to keep interior service",
      ],
      acceptableResolutions: [
        "Exterior-only service with the account flagged",
        "Pause interior work until after the birth",
        "Written confirmation of what will and won't be applied",
      ],
      openings: [
        "I'm pregnant. I don't want anything sprayed in my house. I think I just need to cancel.",
        "We're expecting, so I need to stop the service. Sorry.",
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
}): FullScenario {
  const reason = input.reason ?? pick(CANCEL_REASONS);
  const seed = pick(SEEDS[reason]);
  const personality = input.personality ?? pick(PERSONALITIES);
  const customerName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
  const tenure = 1 + Math.floor(Math.random() * 8);

  return {
    customerName,
    accountSummary: `${tenure}-year customer on a ${pick(PLANS)}. Balance current.`,
    reason,
    reasonLabel: REASON_LABELS[reason],
    difficulty: input.difficulty,
    personality,
    personalityLabel: PERSONALITY_LABELS[personality],
    openingLine: pick(seed.openings),
    statedReason: seed.statedReason,
    hiddenMotive: seed.hiddenMotive,
    emotionalDriver: seed.emotionalDriver,
    saveConditions: seed.saveConditions,
    dealBreakers: seed.dealBreakers,
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
    openingLine: scenario.openingLine,
  };
}
