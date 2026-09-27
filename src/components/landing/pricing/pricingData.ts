/**
 * What AETEA sells, and what things cost.
 *
 * ## Two rules this file exists to enforce
 *
 * **1. Plan figures mirror the Stripe catalogue.** Prices and credit grants here
 * must match `AETEA-AI/app/services/stripe_catalog.py`, which is what a customer
 * is actually charged and actually granted. They disagreed until 2026-09-28 —
 * this page advertised Start at $2 for 100 credits while Stripe charged $5 and
 * granted 750 — so the catalogue values are repeated here with a pointer back,
 * and changing one without the other is the bug to look for first.
 *
 * **2. Credit prices are derived, never typed.** `creditsFor()` applies the same
 * formula the meter charges by. Six of the eight published media prices were once
 * rounded to tidy numbers instead of computed, and one was rounded *down* — so
 * the page promised a figure below what the system charged. A typo now produces a
 * visibly wrong page rather than quiet margin loss.
 *
 * Provider costs are from `aetea-docs/09-billing-and-credits.md`, verified
 * 2026-09-26/27. That document is the source; this is a consumer of it.
 *
 * ## What belongs on this page
 *
 * What a customer needs to decide and to not feel misled later: what a plan
 * costs, what it grants, what things cost, and what expires when. Not how we
 * price internally, not our margin, and not a defensive essay about edge cases.
 */

export type PricingPlanId = "start" | "spark" | "sprint" | "spire";

export type BillingPeriod = "annual" | "monthly";

export type PlanPrice = {
  price: string;
  priceUnit: string;
  priceUnitStacked: boolean;
  savingsNote?: string;
};

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  accent: string;
  tagline: string;
  /** One-time plans only use `oneTime`; subscriptions use monthly + annual. */
  oneTime?: PlanPrice;
  monthly?: PlanPrice;
  annual?: PlanPrice;
  specs: string[];
  bestFor: string;
  receives: string[];
  exampleCredits: string;
};

export type PricingTableRow = {
  action: string;
  cost: string;
  meaning: string;
};

export type PricingAddon = {
  name: string;
  price: string;
  bestFor: string;
};

export type PricingFaqItem = {
  question: string;
  answer: string;
};

// ---------------------------------------------------------------------------
// Deriving a credit price
// ---------------------------------------------------------------------------

/**
 * USD of provider cost carried by one credit. The single constant the whole
 * model rests on — see `aetea-docs/09-billing-and-credits.md`.
 */
const CREDIT_COST_ALLOWANCE = 0.0045;

/** What the meter charges for a given provider cost. Always round up. */
export function creditsFor(providerCostUsd: number): number {
  return Math.max(1, Math.ceil(providerCostUsd / CREDIT_COST_ALLOWANCE));
}

/** One credit is one cent, so the customer price is the credits as dollars. */
function dollars(credits: number): string {
  return `$${(credits / 100).toFixed(2)}`;
}

/** Provider cost per finished item or per second. */
const PROVIDER_COST = {
  image: 0.134,
  image4k: 0.24,
  video720: 0.084,
  video720Audio: 0.112,
  video1080Audio: 0.14,
  video4k: 0.42,
} as const;

// ---------------------------------------------------------------------------
// Plans — mirror stripe_catalog.py
// ---------------------------------------------------------------------------

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "start",
    name: "Start",
    accent: "#04818f",
    tagline: "A low-cost, hands-on introduction to AETEA",
    oneTime: {
      price: "$5",
      priceUnit: "one time",
      priceUnitStacked: true,
    },
    // No user count: AETEA has no team support, and the old "1 user" / "3 users"
    // lines implied a seat model that does not exist.
    specs: ["750 credits", "Open for 72 hours", "No renewal"],
    bestFor:
      "First-time users who want to experience AETEA before choosing a subscription.",
    receives: [
      "Explore guided strategy, research, copy and creative thinking.",
      "Clarify a brief, challenge or early idea.",
      "Generate initial visual directions.",
      "Keep everything you make.",
      "Upgrade without starting the work again.",
    ],
    exampleCredits:
      "Room for a few hours of real work — conversation, a research question or two, and a first set of images.",
  },
  {
    id: "spark",
    name: "Spark",
    accent: "#6c14ff",
    tagline:
      "A flexible starting plan for learning, thinking and lighter creative work",
    monthly: {
      price: "$19",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$190",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "save $38 | 17% annual saving",
    },
    specs: ["2,200 credits every month"],
    bestFor: "Students, early creators and users exploring AETEA regularly.",
    receives: [
      "Regular access to AETEA's guided strategy, research, copy and creative support.",
      "Room for a structured campaign build.",
      "Image generation for early concepts and visual exploration.",
      "Light video generation.",
      "One balance that moves across every kind of work.",
    ],
    exampleCredits:
      "A campaign build, around 20 images, and everyday conversation through the month.",
  },
  {
    id: "sprint",
    name: "Sprint",
    accent: "#037f12",
    tagline:
      "Built for independent creators who need room to move from brief to build",
    monthly: {
      price: "$79",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$790",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "save $158 | 17% annual saving",
    },
    specs: ["10,000 credits every month"],
    bestFor:
      "Freelancers, consultants and independent operators managing regular creative work.",
    receives: [
      "More guided research, strategy, copy and creative capacity.",
      "Several structured campaign builds each month.",
      "Regular image generation.",
      "Meaningful short-form video capacity.",
      "One flexible balance across the full workflow.",
    ],
    exampleCredits:
      "Four campaign builds, around 60 images, and a minute of finished video.",
  },
  {
    id: "spire",
    name: "Spire",
    accent: "#007eff",
    tagline: "Higher creative capacity for sustained, multi-campaign work",
    monthly: {
      price: "$199",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$1,990",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "save $398 | 16.7% annual saving",
    },
    specs: ["27,000 credits every month"],
    bestFor:
      "Operators and studios running several campaigns at once.",
    receives: [
      "High-volume guided strategy, research, copy and creative work.",
      "Capacity for multiple active campaigns.",
      "Regular image and short-form video production.",
      "Room to work without watching the balance.",
      "One flexible balance across the full workflow.",
    ],
    exampleCredits:
      "Ten campaign builds, around 200 images, and five minutes of finished video.",
  },
];

export function getPlanPrice(
  plan: PricingPlan,
  billingPeriod: BillingPeriod,
): PlanPrice {
  if (plan.oneTime) {
    return plan.oneTime;
  }
  if (billingPeriod === "annual" && plan.annual) {
    return plan.annual;
  }
  if (plan.monthly) {
    return plan.monthly;
  }
  throw new Error(`No price available for plan ${plan.id}`);
}

// ---------------------------------------------------------------------------
// What things cost
// ---------------------------------------------------------------------------

/**
 * Firm prices. These are the actions whose cost is known before they run,
 * because a finished image or a second of video costs the same every time.
 */
export const CREDIT_ACTIONS: PricingTableRow[] = [
  {
    action: "Image",
    cost: `${creditsFor(PROVIDER_COST.image)}`,
    meaning: `One finished image. ${dollars(creditsFor(PROVIDER_COST.image))}.`,
  },
  {
    action: "Image in 4K",
    cost: `${creditsFor(PROVIDER_COST.image4k)}`,
    meaning: `Sharper detail, flexible crops and print. ${dollars(
      creditsFor(PROVIDER_COST.image4k),
    )}.`,
  },
  {
    action: "Video",
    cost: `${creditsFor(PROVIDER_COST.video720)} per second`,
    meaning: "Charged by the length of the finished clip.",
  },
  {
    action: "Video with sound",
    cost: `${creditsFor(PROVIDER_COST.video720Audio)} per second`,
    meaning: "Also covers higher-definition video without sound.",
  },
  {
    action: "Video in HD with sound",
    cost: `${creditsFor(PROVIDER_COST.video1080Audio)} per second`,
    meaning: "1080p with audio.",
  },
  {
    action: "Video in 4K",
    cost: `${creditsFor(PROVIDER_COST.video4k)} per second`,
    meaning: "The highest quality AETEA produces.",
  },
];

/**
 * Everything else. Deliberately a range and deliberately short: a chat turn and
 * a campaign build vary with how much work they actually take, and quoting a
 * single figure would be a promise the product cannot keep.
 */
export const VARIABLE_ACTIONS_NOTE =
  "Conversation, research, strategy and campaign builds are charged by the work they take, so the cost varies with the size of the job and the intelligence setting you choose. AETEA shows you the expected range before anything substantial runs, and Lite settings cost meaningfully less.";

// ---------------------------------------------------------------------------
// Top-ups
// ---------------------------------------------------------------------------

/** Quick amounts in the top-up dialog. One credit is one cent. */
export const TOPUP_QUICK_DOLLARS = [5, 10, 25, 50] as const;
export const TOPUP_MIN_DOLLARS = 5;
export const TOPUP_CREDITS_PER_DOLLAR = 100;

export const PRICING_ADDONS: PricingAddon[] = TOPUP_QUICK_DOLLARS.map(
  (amount) => ({
    name: `${(amount * TOPUP_CREDITS_PER_DOLLAR).toLocaleString()} credits`,
    price: `$${amount}`,
    bestFor:
      amount <= 5
        ? "A quick extension"
        : amount <= 10
          ? "Finishing something off"
          : amount <= 25
            ? "Continuing an active project"
            : "Extra production capacity",
  }),
);

export const CREDIT_RULES: string[] = [
  "Monthly credits are for that month and do not carry over.",
  "Extra credits you buy stay valid for three months.",
  "Start credits are available for the 72-hour window.",
  "AETEA always uses the credits that expire soonest.",
  "Credits are not cash, are not transferable and cannot be redeemed.",
];

export const PRICING_FAQS: PricingFaqItem[] = [
  {
    question: "What is an AETEA credit?",
    answer:
      "A credit is the unit AETEA uses for chargeable work. One credit is one cent, so $1 is 100 credits.",
  },
  {
    question: "What uses credits?",
    answer:
      "The work AETEA does for you: answering, researching, writing, building a campaign, and generating images and video. Moving around the app — opening, saving, reviewing and organising your work — does not.",
  },
  {
    question: "How do I know what something will cost?",
    answer:
      "AETEA shows what to expect before it starts something substantial, and asks first before generating an image or a video. Choosing a lighter intelligence setting costs less.",
  },
  {
    question: "Do unused monthly credits roll over?",
    answer:
      "No. Each month's credits are for that month. Credits you buy as a top-up stay valid for three months, and AETEA always spends the ones expiring soonest first.",
  },
  {
    question: "What happens if I run out mid-way?",
    answer:
      "AETEA stops cleanly and keeps everything produced up to that point. Top up and carry on from where you were.",
  },
  {
    question: "What happens when I need more credits?",
    answer:
      "Add credits at any time from Settings, without changing your plan. If you find you need them often, a larger plan gives you more for the money.",
  },
  {
    question: "Does AETEA Start renew automatically?",
    answer:
      "No. Start is a one-time, 72-hour introduction. It does not become a subscription.",
  },
  {
    question: "When does the 72-hour Start window begin?",
    answer:
      "At purchase. The 72 hours run from the moment you buy it, so start when you have time to use it.",
  },
  {
    question: "What happens to my work after Start ends?",
    answer:
      "Your work stays saved. Move to Spark, Sprint or Spire to keep building on it.",
  },
  {
    question: "Do annual subscribers receive all credits at once?",
    answer:
      "No. Annual subscribers pay in advance and receive their credits every month.",
  },
  {
    question: "Are all prices in US dollars?",
    answer:
      "Yes. Taxes and currency-conversion charges may apply depending on your location and payment method.",
  },
];

export const PACKAGE_VARIANTS_NOTE =
  "*All prices quoted are in USD.\n" +
  "**Annual billing gives twelve months for the price of ten, a 17% saving. Annual subscriptions are paid in advance, and credits arrive monthly rather than all at once.";

export const ADDONS_FOOTNOTE =
  "Add credits at any time, from $5. They stay valid for three months.";
