/**
 * Remembering what someone wanted to buy while they sign in.
 *
 * Checkout needs an authenticated caller, so an anonymous visitor pressing
 * *Choose Spark* has to sign in first. Without this they land in the app having
 * forgotten why they came, and the funnel leaks at its most expensive point.
 *
 * `sessionStorage`, not `localStorage`: an intent is worth minutes, not weeks,
 * and a stale one resurfacing days later would start a purchase nobody asked
 * for. Every read consumes it.
 */
import type { BillingPeriodChoice, PlanId } from "@/services/billing";

const KEY = "aetea.checkoutIntent";

export type CheckoutIntent =
  | { kind: "plan"; planId: PlanId; billingPeriod: BillingPeriodChoice }
  | { kind: "topup"; dollars: number };

type StoredIntent = CheckoutIntent & { at: number };

/**
 * How long an intent stays good.
 *
 * Long enough to sign in or create an account, short enough that an abandoned
 * one cannot come back. Without this an intent survives for the whole tab
 * session: someone presses a plan, changes their mind at the sign-in screen,
 * and a checkout starts on its own the next time they open the pricing page.
 * A purchase flow nobody just asked for is the worst failure mode this file
 * has.
 */
const MAX_AGE_MS = 15 * 60 * 1000;

export function rememberCheckoutIntent(intent: CheckoutIntent): void {
  try {
    const stored: StoredIntent = { ...intent, at: Date.now() };
    sessionStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // Private browsing, or storage disabled. The customer simply picks again.
  }
}

/** Read and clear. Returns null when there is nothing waiting. */
export function takeCheckoutIntent(): CheckoutIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as StoredIntent;
    if (!parsed?.at || Date.now() - parsed.at > MAX_AGE_MS) return null;
    if (parsed.kind === "plan" && parsed.planId) return parsed;
    if (parsed.kind === "topup" && typeof parsed.dollars === "number") return parsed;
    return null;
  } catch {
    return null;
  }
}
