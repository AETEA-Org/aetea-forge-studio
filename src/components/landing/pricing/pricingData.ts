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

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "start",
    name: "Start",
    accent: "#04818f",
    tagline: "A low-cost, hands-on introduction to AETEA",
    oneTime: {
      price: "$2",
      priceUnit: "one time",
      priceUnitStacked: true,
    },
    specs: ["100 credits", "1 user", "Valid for 3 days", "No renewal"],
    bestFor:
      "First-time users who want to experience AETEA before choosing a subscription.",
    receives: [
      "Explore guided strategy, research, copy and creative thinking.",
      "Clarify a brief, challenge or early idea.",
      "Generate initial visual directions.",
      "Save the work created during the three-day experience.",
      "Upgrade without starting the work again.",
    ],
    exampleCredits:
      "5 completed guided tasks + 2 generated 2K images + 1 generated 4K image = 100 credits.",
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
    specs: ["1,000 credits every month", "1 user"],
    bestFor:
      "Students, early creators and users exploring AETEA regularly.",
    receives: [
      "Regular access to AETEA's guided strategy, research, copy and creative support.",
      "Enough room for one structured campaign build.",
      "Image generation for early concepts and visual exploration.",
      "Light video generation.",
      "Monthly credits that can move across different types of work.",
    ],
    exampleCredits:
      "50 completed guided tasks + 1 campaign build + 10 generated 2K images + 16 seconds of video-only, or 8 seconds of video with audio or music.",
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
    specs: ["4,000 credits every month", "1 user"],
    bestFor:
      "Freelancers, consultants and independent operators managing regular creative work.",
    receives: [
      "More guided research, strategy, copy and creative capacity.",
      "Multiple structured campaign builds each month.",
      "Regular image generation.",
      "Meaningful short-form video capacity.",
      "One flexible balance across the full workflow.",
    ],
    exampleCredits:
      "150 completed guided tasks + 4 campaign builds + 40 generated 2K images + 60 seconds of video-only, or 30 seconds of video with audio or music, with 350 credits still available.",
  },
  {
    id: "spire",
    name: "Spire",
    accent: "#007eff",
    tagline:
      "Higher creative capacity for lean teams and multiple campaigns",
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
    specs: ["8,000 credits every month", "3 users"],
    bestFor:
      "Small organisations and lean teams managing higher creative throughput.",
    receives: [
      "Shared access for three people.",
      "High-volume guided strategy, research, copy and creative work.",
      "Capacity for multiple active campaigns.",
      "Regular image and short-form video production.",
      "Team usage across one shared monthly credit balance.",
    ],
    exampleCredits:
      "300 completed guided tasks + 10 campaign builds + 100 generated 2K images + 120 seconds of video-only, or 60 seconds of video with audio or music.",
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

export const CREDIT_ACTIONS: PricingTableRow[] = [
  {
    action: "Completed guided task",
    cost: "5",
    meaning: "A completed strategy, research, copy or creative outcome.",
  },
  {
    action: "Campaign build",
    cost: "150",
    meaning:
      "A structured journey from brief and research towards strategy and creative direction. Generated media uses credits separately.",
  },
  {
    action: "2K image",
    cost: "20",
    meaning: "One completed 2K image.",
  },
  {
    action: "4K image",
    cost: "35",
    meaning:
      "One completed 4K image for sharper detail, flexible crops or print-oriented use.",
  },
  {
    action: "Video-only",
    cost: "25 per second",
    meaning: "Charged by the duration of the completed output.",
  },
  {
    action: "Video with AV",
    cost: "50 per second",
    meaning: "Charged by the duration of the completed output.",
  },
];

export const PRICING_ADDONS: PricingAddon[] = [
  {
    name: "500 extra credits",
    price: "$12",
    bestFor: "A quick extension",
  },
  {
    name: "2,000 extra credits",
    price: "$40",
    bestFor: "Continuing an active project",
  },
  {
    name: "4,000 extra credits",
    price: "$70",
    bestFor: "Additional production capacity",
  },
  {
    name: "1 additional user",
    price: "$19 / month",
    bestFor: "Adding team access without changing the credit balance",
  },
];

export const CREDIT_RULES: string[] = [
  "Start credits expire at the end of the three-day access period.",
  "Monthly subscription credits roll over for one additional billing cycle, up to the value of one full monthly allocation.",
  "Extra credits remain valid for 12 months from purchase.",
  "AETEA uses the credits that expire first.",
  "Credits are not cash, are not transferable and cannot be redeemed.",
  "If a subscription ends, included credits remain available until the end of the paid billing period.",
  "Annual-plan credits are deposited every month.",
  "AETEA never creates a negative credit balance or charges an action without showing the credit requirement first.",
];

export const PRICING_FAQS: PricingFaqItem[] = [
  {
    question: "What is an AETEA credit?",
    answer:
      "A credit is the flexible unit used for chargeable work across AETEA. Monthly-plan credits are structured around approximately US$0.02 per credit.",
  },
  {
    question: "What can I use credits for?",
    answer:
      "Credits can be used for completed guided tasks, campaign builds, image generation and video generation. The required amount is shown before the action runs.",
  },
  {
    question: "Do normal conversations use credits?",
    answer:
      "Clarifying questions, navigation, saving, reviewing and organising work do not use credits. Credits apply when AETEA completes a chargeable outcome.",
  },
  {
    question: "What happens if a generation fails?",
    answer:
      "Failed generations and AETEA's internal retries do not use your credits. Any temporary credit reservation is returned automatically.",
  },
  {
    question: "What happens when I need more credits?",
    answer:
      "You can add extra credits instantly and continue working without changing your plan. If your usage regularly exceeds the monthly allocation, AETEA will show the plan that provides stronger ongoing value.",
  },
  {
    question: "Does AETEA Start renew automatically?",
    answer:
      "No. Start is a one-time, three-day paid exploration experience. It does not become a subscription automatically.",
  },
  {
    question: "When does the three-day Start period begin?",
    answer:
      "The 72-hour period begins when you activate Start after payment.",
  },
  {
    question: "Can I purchase Start more than once?",
    answer:
      "Start is available once to each eligible new user. It is designed as an introduction to AETEA.",
  },
  {
    question: "What happens to my work after Start ends?",
    answer:
      "Your work remains saved. Upgrade to Spark, Sprint or Spire to continue editing, generating and building from it.",
  },
  {
    question: "Do unused subscription credits roll over?",
    answer:
      "Yes. Monthly subscription credits roll over for one additional billing cycle, up to one full monthly allocation for the plan.",
  },
  {
    question: "Do annual subscribers receive all credits at once?",
    answer:
      "No. Annual subscribers pay in advance but receive their credits every month.",
  },
  {
    question: "Can I add another user?",
    answer:
      "Yes. Additional users cost US$19 per month. Adding a user provides access but does not add more credits.",
  },
  {
    question: "Are all prices in US dollars?",
    answer:
      "Yes. Taxes and currency-conversion charges may apply according to the customer's location and payment method.",
  },
];

export const PACKAGE_VARIANTS_NOTE =
  "*All prices quoted are in USD.\n" +
  "**Monthly billing is the standard flexible rate, with no long-term discount (current Intro Price is discounted for a limited time period).\n" +
  "***Annual billing gives twelve months of access for the price of ten months, which is a 17% saving. Annual subscriptions are paid in advance. Credits are deposited monthly, not issued for the full year at once.";

export const ADDONS_FOOTNOTE =
  "Extra credits are available with Spark, Sprint and Spire. They are not available during the three-day Start experience.";
