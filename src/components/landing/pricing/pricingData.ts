/**
 * What AETEA sells, and what things cost.
 *
 * ## Three rules this file exists to enforce
 *
 * **1. Plan figures mirror the Stripe catalogue.** Prices and credit grants here
 * must match `AETEA-AI/app/services/stripe_catalog.py`, which is what a customer
 * is actually charged and actually granted. They disagreed until 2026-09-28 —
 * this page advertised Start at $2 for 100 credits while Stripe charged $5 and
 * granted 750 — so the catalogue values are repeated here with a pointer back,
 * and changing one without the other is the bug to look for first.
 *
 * **2. Published credit prices are the ones the system charges.** They are the
 * figures from the customer pricing document of 2026-10-16, and
 * `AETEA-AI/app/metering/meter.py` charges exactly these numbers, read from the
 * `action_prices` table. Until 2026-10-28 this file *derived* them with
 * `creditsFor()`, because six of eight had once been rounded by hand and one
 * rounded *down* — the page promising a figure below what the system charged.
 * That failure is now closed at the other end: the page and the meter read the
 * same published number, so they cannot disagree.
 *
 * **3. `creditsFor()` is still here, demoted to a consistency check.** It
 * computes what the formula would charge, and `assertPricesClearMargin()`
 * refuses to let this module load if any published figure falls below the 70%
 * direct margin floor. A figure a few percent under the formula is a decision —
 * it spends the 15% retry-and-variance buffer. A figure under the margin floor
 * is the 2026-09 defect returning, and this is what catches it.
 *
 * Provider costs are from `aetea-docs/engineering/billing-and-credits.md`. That
 * document is the source; this is a consumer of it.
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
// Checking a published credit price
// ---------------------------------------------------------------------------

/**
 * USD of provider cost carried by one credit, and the buffer added to measured
 * provider cost before it is converted. Both from
 * `aetea-docs/engineering/billing-and-credits.md`; they moved together on
 * 2026-10-28, from $0.0045 with no buffer.
 */
const CREDIT_COST_ALLOWANCE = 0.003;
const PROVIDER_COST_BUFFER = 1.15;

/** The direct gross margin a published price must clear. */
const MARGIN_FLOOR = 0.7;

/**
 * What the formula would charge for a given provider cost:
 * `ceil(cost x 1.15 / 0.003)`, the same arithmetic
 * `AETEA-AI/app/metering/pricing.py` applies to text and research.
 *
 * **No longer the authority for the figures below**, which come from the
 * customer pricing document. Kept as the yardstick the check uses.
 */
export function creditsFor(providerCostUsd: number): number {
  return Math.max(
    1,
    Math.ceil((providerCostUsd * PROVIDER_COST_BUFFER) / CREDIT_COST_ALLOWANCE),
  );
}

/** One credit is one cent, so the customer price is the credits as dollars. */
function dollars(credits: number): string {
  return `$${(credits / 100).toFixed(2)}`;
}

/**
 * Provider cost per finished item or per second, and the credits published
 * against it. The pairs sit together so the check below has both.
 */
const PUBLISHED = {
  image: { cost: 0.134, credits: 50 },
  image4k: { cost: 0.24, credits: 90 },
  video720: { cost: 0.084, credits: 30 },
  video720Audio: { cost: 0.112, credits: 45 },
  video1080: { cost: 0.112, credits: 40 },
  video1080Audio: { cost: 0.14, credits: 60 },
  video4k: { cost: 0.42, credits: 150 },
} as const;

/**
 * Refuse to load if a published price would sell below the margin floor.
 *
 * Deliberately a throw, and deliberately unconditional. The only way to reach
 * it is to type a credit figure that loses money against the provider cost
 * beside it, and a product that quotes that number is worse than one that does
 * not render. Measured on **raw** provider cost per credit, which is what the
 * ceiling is defined on.
 *
 * **Know the blast radius before changing a constant above.** This runs at
 * module import, and the module is imported by `videoCost.ts`, which is
 * imported by `ChatInput.tsx` — so a failing check takes down the whole app,
 * not only the marketing page. That is the intended trade and not an oversight:
 * every one of those paths quotes or charges a credit price, and the failure it
 * catches is one that loses money silently on every render. It fires at the
 * dev server and in `vite preview`, so it is seen long before a deploy.
 */
function assertPricesClearMargin(): void {
  for (const [name, { cost, credits }] of Object.entries(PUBLISHED)) {
    const margin = 1 - cost / (credits / 100);
    if (margin < MARGIN_FLOOR) {
      throw new Error(
        `Published price for ${name} is ${credits} credits against $${cost} of ` +
          `provider cost — a ${(margin * 100).toFixed(1)}% margin, under the ` +
          `${MARGIN_FLOOR * 100}% floor. The formula gives ${creditsFor(cost)}. ` +
          `Fix the price or the cost; do not ship this.`,
      );
    }
  }
}

assertPricesClearMargin();

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
      price: "$8",
      priceUnit: "one time",
      priceUnitStacked: true,
    },
    // No user count: AETEA has no team support, and the old "1 user" / "3 users"
    // lines implied a seat model that does not exist.
    specs: ["800 credits", "Open for 72 hours", "No renewal"],
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
      "Room for a campaign build, or a few hours of conversation and research. More extensive work or media production may need a subscription.",
  },
  {
    id: "spark",
    name: "Spark",
    accent: "#6c14ff",
    tagline:
      "A flexible starting plan for learning, thinking and lighter creative work",
    monthly: {
      price: "$29",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$290",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "save $58 | 16.7% annual saving",
    },
    specs: ["2,900 credits every month"],
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
      price: "$89",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$890",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "save $178 | 16.7% annual saving",
    },
    specs: ["8,900 credits every month"],
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
      "Four campaign builds, around 30 images, and twenty seconds of finished video.",
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
    specs: ["19,900 credits every month"],
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
      "Ten campaign builds, around 80 images, and a minute of finished video.",
  },
];

/**
 * The published credits per second of video, by resolution and audio.
 *
 * Exported because the in-app render quote (`src/components/app/billing/
 * videoCost.ts`) needs exactly these figures, and a second copy of them is a
 * second thing to get wrong — which is what it was until 2026-10-28, when it
 * derived its own from provider cost and quoted 43 a second where the meter
 * charged 45. One table, checked by `assertPricesClearMargin` above.
 *
 * 4K carries the same figure with and without sound because Kling charges the
 * same $0.42 a second for both; that is checked, not a copy error.
 */
export const PUBLISHED_VIDEO_CREDITS_PER_SECOND = {
  "720p": { silent: PUBLISHED.video720.credits, audio: PUBLISHED.video720Audio.credits },
  "1080p": { silent: PUBLISHED.video1080.credits, audio: PUBLISHED.video1080Audio.credits },
  "4k": { silent: PUBLISHED.video4k.credits, audio: PUBLISHED.video4k.credits },
} as const;

export type PublishedVideoResolution = keyof typeof PUBLISHED_VIDEO_CREDITS_PER_SECOND;

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
 * Every chargeable action, in the order and the wording of the customer
 * pricing document. The first two are ranges because a brainstorm and a
 * campaign build vary with the size of the job; the rest are firm, because a
 * finished image or a second of video costs the same every time.
 *
 * Resolution and audio each have their own row since 2026-10-28. A single
 * figure for "video" was wrong in both directions at once: it under-charged 4K
 * by five times and over-charged silent 720p.
 */
export const CREDIT_ACTIONS: PricingTableRow[] = [
  {
    action: "Brainstorm",
    cost: "100–500",
    meaning: "Thinking an idea, a challenge or a brief through with AETEA.",
  },
  {
    action: "Campaign Build",
    cost: "700–1,800",
    meaning:
      "Brief dissection, research, strategy, creative foundations and a deliverables plan. Any images or video you choose to generate are charged separately.",
  },
  {
    action: "Image — 1K or 2K",
    cost: `${PUBLISHED.image.credits}`,
    meaning: `One finished image. ${dollars(PUBLISHED.image.credits)}.`,
  },
  {
    action: "Image — 4K",
    cost: `${PUBLISHED.image4k.credits}`,
    meaning: `Sharper detail, flexible crops and print. ${dollars(
      PUBLISHED.image4k.credits,
    )}.`,
  },
  {
    action: "Video — 720p, no audio",
    cost: `${PUBLISHED.video720.credits} per second`,
    meaning: "Charged by the length of the finished clip.",
  },
  {
    action: "Video — 720p, native audio",
    cost: `${PUBLISHED.video720Audio.credits} per second`,
    meaning: "Sound generated with the picture, in the same pass.",
  },
  {
    action: "Video — 1080p, no audio",
    cost: `${PUBLISHED.video1080.credits} per second`,
    meaning: "Full HD, silent.",
  },
  {
    action: "Video — 1080p, native audio",
    cost: `${PUBLISHED.video1080Audio.credits} per second`,
    meaning: "Full HD with sound.",
  },
  {
    action: "Video — 4K, when supported",
    cost: `${PUBLISHED.video4k.credits} per second`,
    meaning: "The highest quality AETEA produces, where the model offers it.",
  },
];

/**
 * How the two ranges above actually behave. Deliberately short: the detail
 * belongs in the FAQ, and the thing a customer most needs here is that nothing
 * stops to ask them for approval.
 */
export const VARIABLE_ACTIONS_NOTE =
  "Brainstorm and Campaign Build are charged by the work they take, so the cost varies with the size of the job. AETEA deducts credits in real time as the work is generated and your live credit consumption stays visible, with no separate approval step before it starts. Longer finished videos are assembled from generated clips and charged for the total generated seconds.";

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
  "Monthly credits run from your purchase or renewal date to the next renewal date, and do not carry over.",
  "Annual plans release credits on each monthly anniversary of the purchase date. Each allocation expires when the next one is released.",
  "Start credits are available for the 72-hour window.",
  "Top-ups are for active subscribers, and each expires one month from purchase or when the subscription ends, whichever comes first.",
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
    question: "How can I track what I spend?",
    answer:
      "AETEA shows credit consumption in real time while your work is being generated, and your usage stays visible in your account afterwards.",
  },
  {
    question: "Does AETEA ask before it spends credits?",
    answer:
      "No. Brainstorm and Campaign Build credits are deducted in real time as the work is generated, and there is no separate credit-approval step. Images are charged when generation starts, and video by the generated second at the resolution and audio option you chose.",
  },
  {
    question: "Are OpenAI text tokens charged separately?",
    answer:
      "No. AETEA translates the underlying text-generation cost into AETEA credits automatically. You only see your AETEA credits being used in real time during Brainstorm and Campaign Build — there is no separate input-token or output-token bill.",
  },
  {
    question: "Do unused monthly credits roll over?",
    answer:
      "No. Each month's credits are valid from your purchase or renewal date until the next renewal date, and unused credits expire at renewal. AETEA always spends the ones expiring soonest first.",
  },
  {
    question: "Do annual subscribers receive all credits at once?",
    answer:
      "No. Annual subscribers pay in advance and receive one monthly allocation on each monthly anniversary of the purchase date. Each allocation expires when the next one is released and does not roll over.",
  },
  {
    question: "What happens if I run out mid-way?",
    answer:
      "AETEA stops cleanly and keeps everything produced up to that point. Top up and carry on from where you were.",
  },
  {
    question: "What happens when I need more credits?",
    answer:
      "Active subscribers can add credits at any time from Settings, without changing plan. Each top-up is valid for one month from its purchase date, or until the subscription ends if that comes first, and top-up credits do not roll over. If you find you need them often, a larger plan gives you more for the money.",
  },
  {
    question: "Can I buy top-ups on the Start plan?",
    answer:
      "No. Top-ups are available only to active subscribers. Start is a one-time 72-hour introduction; move to Spark, Sprint or Spire to add credits.",
  },
  {
    question: "Does AETEA Start renew automatically?",
    answer:
      "No. Start is a one-time, 72-hour introduction. It does not renew or convert into a subscription.",
  },
  {
    question: "When does the 72-hour Start window begin?",
    answer:
      "At payment. The 72 hours run from the moment you buy it, so start when you have time to use it, and the 800 credits expire when the window ends.",
  },
  {
    question: "What happens to my work after Start ends?",
    answer:
      "Your work stays saved. Move to Spark, Sprint or Spire to keep building on it.",
  },
  {
    question: "Can I make a video longer than 15 seconds?",
    answer:
      "Yes. AETEA can combine shorter generated clips into a finished video of up to 60 seconds, charged for the total generated seconds.",
  },
  {
    question: "Are all prices in US dollars?",
    answer:
      "Yes. Applicable sales taxes are shown at checkout based on your location, and any other mandatory charge is disclosed before purchase. Your payment method may also apply currency-conversion charges.",
  },
  {
    question: "Are there discounts for bigger purchases?",
    answer:
      "Discounts are not based on how much you use or can afford. The one discount is loyalty-based: annual subscriptions are twelve months for the price of ten.",
  },
];

export const PACKAGE_VARIANTS_NOTE =
  "*All prices quoted are in USD.\n" +
  "**Annual billing gives twelve months for the price of ten, a 16.7% saving. Annual subscriptions are paid in advance, and credits are released on each monthly anniversary of the purchase date rather than all at once.";

export const ADDONS_FOOTNOTE =
  "Available to active subscribers, from $5. Each top-up is valid for one month from its purchase date, or until the subscription ends if that comes first, and does not roll over.";
