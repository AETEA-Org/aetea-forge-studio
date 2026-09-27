/**
 * Billing: what the customer has, what things cost, and how to buy more.
 *
 * Every figure here comes from the backend. Nothing in the UI computes a
 * balance, decrements one after an action, or predicts a charge — the ledger is
 * the only thing that knows, and a number we invented would be wrong the moment
 * a run cost more than we guessed.
 *
 * `402` is the one status this layer treats specially. It is not an error in the
 * usual sense: the request was valid and the caller is who they say they are,
 * they are simply out of credits. It gets its own type so the UI can offer a way
 * forward instead of a red banner.
 */
import { API_BASE_URL } from "@/services/config";
import { backendHeaders } from "@/services/authHeaders";

function buildUrl(path: string): string {
  return new URL(path, API_BASE_URL).toString();
}

/** Out of credits. Carries no technical detail — there is nothing to debug. */
export class OutOfCreditsError extends Error {
  constructor(message?: string) {
    super(message || "You're out of credits.");
    this.name = "OutOfCreditsError";
  }
}

async function readError(response: Response, fallback: string): Promise<never> {
  if (response.status === 402) {
    let detail: string | undefined;
    try {
      detail = (await response.json())?.detail;
    } catch {
      /* a 402 with no body is still a 402 */
    }
    throw new OutOfCreditsError(detail);
  }
  let detail: string | undefined;
  try {
    detail = (await response.json())?.detail;
  } catch {
    /* fall through to the generic message */
  }
  throw new Error(detail || fallback);
}

/** What a piece of work usually costs, for one action at one tier. */
export interface ExpectedCost {
  action_code: string;
  display_name: string;
  tier: string;
  typical_credits: number;
  high_credits: number;
}

export interface PlanSummary {
  plan_id: string | null;
  billing_period: string | null;
  status: string | null;
  current_period_end: string | null;
  expected_costs: ExpectedCost[];
}

export interface BalanceSummary {
  credits: number;
  /** How many of those credits expire next, and when. */
  expiring_next: number;
  next_expiry_at: string | null;
}

/** One thing the customer asked for, not one provider call. */
export interface UsageEvent {
  id: string;
  action_code: string;
  /** Already human-readable. Never render `action_code`. */
  display_name: string;
  /** AETEA's own tier name, or null for work done before tiers. */
  tier: string | null;
  units: number;
  credits_charged: number;
  created_at: string;
  status: string | null;
}

/** GET /billing/plan */
export async function getPlan(): Promise<PlanSummary> {
  const response = await fetch(buildUrl("/billing/plan"), {
    headers: await backendHeaders(),
  });
  if (!response.ok) {
    return readError(response, "Could not load your plan");
  }
  return response.json();
}

/** GET /billing/balance */
export async function getBalance(): Promise<BalanceSummary> {
  const response = await fetch(buildUrl("/billing/balance"), {
    headers: await backendHeaders(),
  });
  if (!response.ok) {
    return readError(response, "Could not load your balance");
  }
  return response.json();
}

/** GET /billing/usage */
export async function getUsage(limit = 50): Promise<UsageEvent[]> {
  const response = await fetch(buildUrl(`/billing/usage?limit=${limit}`), {
    headers: await backendHeaders(),
  });
  if (!response.ok) {
    return readError(response, "Could not load your usage history");
  }
  const data = await response.json();
  return (data.events ?? []) as UsageEvent[];
}

export type PlanId = "start" | "spark" | "sprint" | "spire";
export type BillingPeriodChoice = "monthly" | "annual";

/**
 * Buy a plan, or buy credits. Returns the hosted Stripe Checkout URL.
 *
 * `topupDollars` is **dollars**, not credits. The Stripe line item's quantity is
 * a number of dollars at 100 credits each, and passing credits here would
 * charge a hundred times too much.
 */
export async function startCheckout(
  intent:
    | { planId: PlanId; billingPeriod?: BillingPeriodChoice }
    | { topupDollars: number },
): Promise<string> {
  const body =
    "topupDollars" in intent
      ? { topup_dollars: intent.topupDollars }
      : { plan_id: intent.planId, billing_period: intent.billingPeriod ?? "monthly" };

  const response = await fetch(buildUrl("/billing/checkout"), {
    method: "POST",
    headers: { ...(await backendHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return readError(response, "Could not start checkout");
  }
  return (await response.json()).url as string;
}

/**
 * Stripe's Customer Portal, for changing or cancelling a subscription.
 *
 * 404 means there is nothing to manage yet, which is an ordinary state for
 * someone who has only ever bought top-ups — not a failure worth alarming them
 * about.
 */
export async function openPortal(): Promise<string | null> {
  const response = await fetch(buildUrl("/billing/portal"), {
    method: "POST",
    headers: await backendHeaders(),
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    return readError(response, "Could not open the billing portal");
  }
  return (await response.json()).url as string;
}
