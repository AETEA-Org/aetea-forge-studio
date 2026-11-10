/**
 * Metadata and Schema.org structured data for the public marketing pages.
 *
 * **The structured data is derived, never retyped.** Pricing offers, credit
 * rules and FAQs are read from `pricingData.ts`, and the Advisory description
 * from `advisoryData.ts`, the same objects the pages render. When a price
 * changes there, the JSON-LD, the prerendered HTML and `llms.txt` change with
 * it, and there is no second copy to forget.
 *
 * Nothing here may state something the visible page does not.
 */
import {
  ADVISORY_AUDIENCE,
  ADVISORY_BOOKING_URL,
  ADVISORY_HERO,
  ADVISORY_LINKS,
} from "@/components/landing/advisory/advisoryData";
import { AETEA_SOCIAL_URLS } from "@/components/landing/marketingBrandLinks";
import {
  ADDONS_FOOTNOTE,
  CREDIT_ACTIONS,
  CREDIT_RULES,
  PRICING_ADDONS,
  PRICING_FAQS,
  PRICING_PLANS,
  type PlanPrice,
  type PricingPlan,
} from "@/components/landing/pricing/pricingData";
import { absoluteUrl, SITE_ORIGIN, type HeadSpec } from "./head";

const ORG_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const APP_ID = `${SITE_ORIGIN}/#application`;

const AETEA_IMAGE = {
  path: "/og/aetea.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "AETEA wordmark",
};

const ADVISORY_IMAGE = {
  path: "/og/the-80-ones-advisory.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "The 80 Ones Advisory wordmark",
};

/** "https://x.com/AETEAstudio" -> "@AETEAstudio". */
const xHandle = (url: string | undefined) => {
  const handle = url?.match(/^https:\/\/(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/?$/)?.[1];
  return handle ? `@${handle}` : undefined;
};

const organization = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "AETEA",
  url: `${SITE_ORIGIN}/`,
  logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.png"), width: 1200, height: 1200 },
  slogan: "Intelligence at work",
  sameAs: [...AETEA_SOCIAL_URLS],
};

const website = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "AETEA",
  url: `${SITE_ORIGIN}/`,
  inLanguage: "en",
  publisher: { "@id": ORG_ID },
};

function webPage(path: string, title: string, description: string, extra: Record<string, unknown> = {}) {
  return {
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

const HOME_TITLE = "AETEA | Intelligence at work";
const HOME_DESCRIPTION =
  "AETEA connects research, strategy, creative, assets, channel deployment, and performance analysis from brief to market. Available by subscription.";

const application = {
  "@type": "WebApplication",
  "@id": APP_ID,
  name: "AETEA",
  url: `${SITE_ORIGIN}/`,
  description: HOME_DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web browser",
  publisher: { "@id": ORG_ID },
};

export const HOME_PAGE: HeadSpec = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  siteName: "AETEA",
  image: AETEA_IMAGE,
  twitterSite: xHandle(AETEA_SOCIAL_URLS.find((url) => url.startsWith("https://x.com/"))),
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      application,
      webPage("/", HOME_TITLE, HOME_DESCRIPTION, {
        about: { "@id": APP_ID },
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(AETEA_IMAGE.path) },
      }),
    ],
  },
};

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const PRICING_TITLE = "AETEA Pricing | Plans & Credits";
const PRICING_DESCRIPTION =
  "AETEA pricing for Start, Spark, Sprint, and Spire. Explore credits, monthly and annual subscriptions, add-ons, and usage rules.";

/** "$1990" -> "1990.00". Throws rather than publish a price it cannot read. */
export function priceAmount(display: string): string {
  const amount = Number(display.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Cannot read a price from "${display}"`);
  }
  return amount.toFixed(2);
}

const seller = { "@id": ORG_ID };

function planOffer(plan: PricingPlan, period: "oneTime" | "monthly" | "annual", price: PlanPrice) {
  const periodLabel = { oneTime: "one time", monthly: "monthly", annual: "annual" }[period];
  const description = [...plan.specs, price.savingsNote, plan.tagline]
    .filter(Boolean)
    .join(". ");
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    "@id": `${absoluteUrl("/pricing")}#offer-${plan.id}-${period}`,
    name: period === "oneTime" ? `AETEA ${plan.name}` : `AETEA ${plan.name}, ${periodLabel}`,
    description,
    category: period === "oneTime" ? "One-time purchase" : "Subscription",
    price: priceAmount(price.price),
    priceCurrency: "USD",
    url: absoluteUrl("/pricing"),
    availability: "https://schema.org/InStock",
    seller,
  };
  // Start's 7-day window is in the description, from plan.specs. Schema.org
  // has no property for "access lasts N days after purchase"; eligibleDuration
  // means how long the offer itself stands, which is not the same thing.
  if (period !== "oneTime") {
    offer.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price: priceAmount(price.price),
      priceCurrency: "USD",
      billingDuration: 1,
      unitCode: period === "monthly" ? "MON" : "ANN",
      unitText: price.priceUnit,
    };
  }
  return offer;
}

const planOffers = PRICING_PLANS.flatMap((plan) => {
  const offers = [];
  if (plan.oneTime) offers.push(planOffer(plan, "oneTime", plan.oneTime));
  if (plan.monthly) offers.push(planOffer(plan, "monthly", plan.monthly));
  if (plan.annual) offers.push(planOffer(plan, "annual", plan.annual));
  return offers;
});

const addonOffers = PRICING_ADDONS.map((addon) => ({
  "@type": "Offer",
  "@id": `${absoluteUrl("/pricing")}#offer-addon-${addon.name.replace(/\D/g, "")}-credits`,
  name: `${addon.name} credit add-on`,
  description: `${addon.name} credits. ${addon.bestFor}. ${ADDONS_FOOTNOTE}`,
  category: "Add-on",
  price: priceAmount(addon.price),
  priceCurrency: "USD",
  url: absoluteUrl("/pricing"),
  availability: "https://schema.org/InStock",
  seller,
}));

const itemList = (id: string, name: string, items: { name: string; description?: string }[]) => ({
  "@type": "ItemList",
  "@id": `${absoluteUrl("/pricing")}#${id}`,
  name,
  numberOfItems: items.length,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
  })),
});

export const PRICING_PAGE: HeadSpec = {
  title: PRICING_TITLE,
  description: PRICING_DESCRIPTION,
  path: "/pricing",
  siteName: "AETEA",
  image: AETEA_IMAGE,
  twitterSite: HOME_PAGE.twitterSite,
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      { ...application, offers: [...planOffers, ...addonOffers] },
      webPage("/pricing", PRICING_TITLE, PRICING_DESCRIPTION, {
        about: { "@id": APP_ID },
        mainEntity: { "@id": APP_ID },
        hasPart: [
          { "@id": `${absoluteUrl("/pricing")}#credit-costs` },
          { "@id": `${absoluteUrl("/pricing")}#credit-rules` },
          { "@id": `${absoluteUrl("/pricing")}#faq` },
        ],
      }),
      itemList(
        "credit-costs",
        "What things cost in credits",
        CREDIT_ACTIONS.map((row) => ({ name: `${row.action}: ${row.cost}`, description: row.meaning })),
      ),
      itemList("credit-rules", "Credit rules", CREDIT_RULES.map((rule) => ({ name: rule }))),
      {
        "@type": "FAQPage",
        "@id": `${absoluteUrl("/pricing")}#faq`,
        url: absoluteUrl("/pricing"),
        mainEntity: PRICING_FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// The 80 Ones Advisory
// ---------------------------------------------------------------------------

const ADVISORY_TITLE = "THE 80 ONES ADVISORY | Wisdom at play";
const ADVISORY_DESCRIPTION =
  "The 80 Ones Advisory with Ash Tal for decision-makers facing consequential uncertainty. Diagnosis, judgment, and direction when the path is unclear.";

const ADVISORY_SOCIAL_URLS = [
  import.meta.env.VITE_ADVISORY_SOCIAL_LINKEDIN,
  import.meta.env.VITE_ADVISORY_SOCIAL_INSTAGRAM,
  import.meta.env.VITE_ADVISORY_SOCIAL_FACEBOOK,
  import.meta.env.VITE_ADVISORY_SOCIAL_X,
].filter((url): url is string => typeof url === "string" && url.startsWith("https://"));

const ADVISORY_ORG_ID = `${absoluteUrl("/advisory")}#organization`;

export const ADVISORY_PAGE: HeadSpec = {
  title: ADVISORY_TITLE,
  description: ADVISORY_DESCRIPTION,
  path: "/advisory",
  siteName: ADVISORY_HERO.title,
  image: ADVISORY_IMAGE,
  twitterSite: xHandle(import.meta.env.VITE_ADVISORY_SOCIAL_X),
  jsonLd: {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      website,
      {
        "@type": "Organization",
        "@id": ADVISORY_ORG_ID,
        name: ADVISORY_HERO.title,
        url: absoluteUrl("/advisory"),
        slogan: ADVISORY_HERO.wisdomTagline,
        logo: absoluteUrl("/advisory/the-80-ones-wordmark.png"),
        founder: [
          {
            "@type": "Person",
            name: "Ash",
            jobTitle: "Executive creative director",
            sameAs: [ADVISORY_LINKS.ashLinkedIn, ADVISORY_LINKS.ashPortfolio],
          },
          {
            "@type": "Person",
            name: "Tal",
            jobTitle: "C-suite strategist",
            sameAs: [ADVISORY_LINKS.talLinkedIn],
          },
        ],
        ...(ADVISORY_SOCIAL_URLS.length ? { sameAs: ADVISORY_SOCIAL_URLS } : {}),
      },
      {
        "@type": "Service",
        "@id": `${absoluteUrl("/advisory")}#service`,
        name: ADVISORY_HERO.title,
        serviceType: "Advisory",
        description: ADVISORY_HERO.distinction,
        url: absoluteUrl("/advisory"),
        provider: { "@id": ADVISORY_ORG_ID },
        audience: { "@type": "Audience", audienceType: ADVISORY_AUDIENCE.primary.replace(/^The Advisory is for |\.$/g, "") },
        availableChannel: {
          "@type": "ServiceChannel",
          name: "Book time with Ash Tal",
          serviceUrl: ADVISORY_BOOKING_URL,
        },
      },
      webPage("/advisory", ADVISORY_TITLE, ADVISORY_DESCRIPTION, {
        about: { "@id": `${absoluteUrl("/advisory")}#service` },
        primaryImageOfPage: { "@type": "ImageObject", url: absoluteUrl(ADVISORY_IMAGE.path) },
      }),
    ],
  },
};

/**
 * Every other route: the app, sign-in and policy pages. The values are the
 * ones `index.html` carried before this module existed, unchanged, and there
 * is no canonical because these routes are not marketing pages.
 */
export const DEFAULT_PAGE: HeadSpec = {
  title: "AETEA | All you need. Create → Launch → Grow.",
  description:
    "AETEA is your end-to-end creative OS/partner for strategy, creative direction, production, distribution, and growth.",
  ogTitle: "AETEA | Creative OS for Campaigns & Content",
  ogDescription: "AETEA is your creative intelligence—everything required to envision, execute, and excel.",
};

/** The pages that are prerendered, listed in the sitemap and in llms.txt. */
export const MARKETING_PAGES = [
  { path: "/", file: "index.html", head: HOME_PAGE },
  { path: "/pricing", file: "pricing.html", head: PRICING_PAGE },
  { path: "/advisory", file: "advisory.html", head: ADVISORY_PAGE },
] as const;
