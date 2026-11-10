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
      price: "$12",
      priceUnit: "one time",
      priceUnitStacked: true,
    },
    // No user count: AETEA has no team support, and the old "1 user" / "3 users"
    // lines implied a seat model that does not exist.
    // The grant is one figure in the catalogue, 2,200 (`credits=2200` on
    // `start_one_time`), with one expiry. "Bonus" is how the offer is worded,
    // not a second kind of credit, so the two numbers here must add up to it.
    specs: ["1,200 credits + 1,000 bonus credits", "Valid for 7 days", "No renewal"],
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
      "Base plan for research, strategy, and lighter creative work",
    monthly: {
      price: "$29",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$290",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "Save $58 | 16.7% annual saving",
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
      "For regular campaigns and a growing volume of research, strategy, and creative work",
    monthly: {
      price: "$89",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$890",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "Save $178 | 16.7% annual saving",
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
    tagline: "Higher capacity for delivering sustained, multi-campaign work",
    monthly: {
      price: "$199",
      priceUnit: "per month",
      priceUnitStacked: true,
    },
    annual: {
      price: "$1990",
      priceUnit: "per year",
      priceUnitStacked: true,
      savingsNote: "Save $398 | 16.7% annual saving",
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
 * pricing document — except for the two text rows, which carry no figure.
 *
 * **Brainstorm and Campaign Build deliberately publish no number**, on Abdur's
 * instruction of 2026-10-28: *"if you mention anywhere in our sort of pricing
 * pages that brainstorm costs this much or campaign costs this much, remove it.
 * No need to tell them, because we can't guarantee."*
 *
 * The code already agreed with him. Text work is charged from measured tokens,
 * not from a flat figure, so a range is a prediction rather than a price — and
 * the observed top end of a campaign build is about 1,880 credits against the
 * 1,800 the document prints. A published ceiling the system can exceed is worse
 * than no ceiling: it reads as a promise and breaks quietly.
 *
 * **So this table differs from the supplied customer document in exactly these
 * two rows, on purpose.** The developer document's acceptance check 1 says
 * "Displayed plan and action prices exactly match the customer section", and
 * for the other fifteen figures it does. Anyone reconciling the two will find
 * this mismatch; it is an override, not a defect, and the numbers must not be
 * put back. The customer document itself still lists both ranges, which is the
 * operator's to change there.
 *
 * The rest are firm, because a finished image or a second of video costs the
 * same every time and the meter charges exactly these figures. Resolution and
 * audio each have their own row since 2026-10-28: a single figure for "video"
 * was wrong in both directions at once, under-charging 4K by five times and
 * over-charging silent 720p.
 */
export const CREDIT_ACTIONS: PricingTableRow[] = [
  {
    action: "Brainstorm",
    cost: "Varies by work",
    meaning: "Explore an idea, challenge, or brief",
  },
  {
    action: "Campaign Build",
    cost: "Varies by work",
    meaning:
      "Brief dissection, research, strategy, creative foundations, and a deliverables or task plan (media additional)",
  },
  {
    action: "Image — 1K or 2K",
    cost: `${PUBLISHED.image.credits} per image`,
    meaning: "One generated image",
  },
  {
    action: "Image — 4K",
    cost: `${PUBLISHED.image4k.credits} per image`,
    meaning: "Higher-resolution image",
  },
  {
    action: "Video — 720p, no audio",
    cost: `${PUBLISHED.video720.credits} per second`,
    meaning: "Video without generated audio",
  },
  {
    action: "Video — 720p, native audio",
    cost: `${PUBLISHED.video720Audio.credits} per second`,
    meaning: "Video with generated audio",
  },
  {
    action: "Video — 1080p, no audio",
    cost: `${PUBLISHED.video1080.credits} per second`,
    meaning: "Full HD without generated audio",
  },
  {
    action: "Video — 1080p, native audio",
    cost: `${PUBLISHED.video1080Audio.credits} per second`,
    meaning: "Full HD with generated audio",
  },
  {
    action: "Video — 4K, native audio",
    cost: `${PUBLISHED.video4k.credits} per second`,
    meaning: "Available only where supported",
  },
];

/**
 * How the two ranges above actually behave. Deliberately short: the detail
 * belongs in the FAQ, and the thing a customer most needs here is that nothing
 * stops to ask them for approval.
 */
export const VARIABLE_ACTIONS_NOTE =
  "Credits are used as the work is generated, and consumption is visible in your account. There is no separate credit-approval step.\n\nBrainstorm and Campaign Build use credits based on the work performed. Image generation is charged per image, based on resolution. Video generation is charged per generated second, with rates varying by resolution and whether native audio is included. Videos assembled from generated clips are charged for all generated seconds. Interrupted or incomplete generations may still use credits.";

// ---------------------------------------------------------------------------
// Top-ups
// ---------------------------------------------------------------------------

/** Quick amounts in the top-up dialog. One credit is one cent. */
export const TOPUP_QUICK_DOLLARS = [5, 10, 25, 50] as const;
export const TOPUP_MIN_DOLLARS = 5;
export const TOPUP_CREDITS_PER_DOLLAR = 100;

export const PRICING_ADDONS: PricingAddon[] = TOPUP_QUICK_DOLLARS.map(
  (amount) => ({
    name: (amount * TOPUP_CREDITS_PER_DOLLAR).toLocaleString(),
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
  "For monthly subscriptions, unused credits expire at the next renewal and do not roll over.",
  "Annual subscriptions release one allocation on each monthly anniversary of purchase; unused credits from the previous allocation expire and do not roll over.",
  "Start credits, including bonus credits, last 7 days from payment and do not renew. Add-ons are not available in Start.",
  "Add-ons are available only with an active subscription. They expire 30 days after purchase or at the end of the paid subscription period, whichever comes first, and do not roll over.",
  "Credits measure work performed and have a stated expiry. They are not cash or transferable value."
];

export const PRICING_FAQS: PricingFaqItem[] = [
  {
    "question": "What is an AETEA credit?",
    "answer": "A credit is AETEA's unit for measuring chargeable work. At standard pricing, $1 purchases 100 credits. Credits are non-transferable and have no cash value."
  },
  {
    "question": "What uses credits?",
    "answer": "The work AETEA does for you: answering, researching, writing, building a campaign, and generating images and video. Opening, saving, reviewing, and organizing your work does not."
  },
  {
    "question": "How can I track what I spend?",
    "answer": "AETEA shows credit consumption while your work is being generated, and your usage stays visible in your account afterwards."
  },
  {
    "question": "Do unused monthly credits roll over?",
    "answer": "No. Unused credits expire when the next monthly allocation is released. AETEA uses the credits expiring soonest first."
  },
  {
    "question": "Do annual subscribers receive all credits at once?",
    "answer": "No. Annual subscribers pay upfront for 10 months and receive 12 monthly allocations: the first at purchase and one on each subsequent monthly anniversary. Each allocation expires when the next one is released."
  },
  {
    "question": "What happens if I run out mid-way?",
    "answer": "AETEA stops and saves the work generated up to that point. Subscribers can top up and continue. Start users must move to Spark, Sprint, or Spire to continue."
  },
  {
    "question": "Can I buy add-ons with Start?",
    "answer": "No. Add-ons are available only to Spark, Sprint, and Spire subscribers."
  },
  {
    "question": "What happens when I need more credits?",
    "answer": "Active subscribers can add credits at any time from Settings without changing plans. If you regularly need more credits, consider moving to a larger plan."
  },
  {
    "question": "Does Start renew automatically?",
    "answer": "No. Start is a one-time, 7-day introduction. It does not renew or convert into a subscription."
  },
  {
    "question": "When does the 7-day Start window begin?",
    "answer": "At payment. The 7-day window begins when you purchase Start, and unused credits expire when it ends."
  },
  {
    "question": "What happens to my work after Start ends?",
    "answer": "Your work stays saved. Move to Spark, Sprint, or Spire to keep building on it."
  },
  {
    "question": "Can I make a video longer than 15 seconds?",
    "answer": "Yes. AETEA can combine shorter generated clips into a finished video of up to 60 seconds, charged for the total generated seconds."
  },
  {
    "question": "Are all prices in US dollars?",
    "answer": "Yes. Applicable sales taxes are shown at checkout based on your location, and any other mandatory charge is disclosed before purchase. Your payment method may also apply currency-conversion charges."
  },
  {
    "question": "What happens if I cancel my subscription?",
    "answer": "Cancellation does not end the paid period early. You can continue generating work until your credits run out or your paid subscription period ends, whichever comes first. Your work remains saved after the subscription ends."
  }
];

export const PACKAGE_VARIANTS_NOTE =
  "The same AETEA capabilities are available across Start, Spark, Sprint, and Spire, subject to feature availability and the credits in your balance. Explore ideas and briefs; work through research, strategy, and copy; develop campaign foundations and deliverables; and generate images and videos.";

export const ADDONS_FOOTNOTE =
  "Add-ons are available only with an active Spark, Sprint, or Spire subscription. See credit rules for details.";
