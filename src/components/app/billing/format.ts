/**
 * Shared formatting for anything that shows money, credits or dates.
 *
 * In one place because a balance shown as "1240" in the header and "1,240" in
 * settings reads as two different numbers, and the customer has no way to know
 * which to believe.
 */
import { TOPUP_CREDITS_PER_DOLLAR } from "@/components/landing/pricing/pricingData";

export function formatCredits(credits: number | null | undefined): string {
  return (credits ?? 0).toLocaleString();
}

export function creditsToDollars(credits: number): string {
  return `$${(credits / TOPUP_CREDITS_PER_DOLLAR).toFixed(2)}`;
}

export function dollarsToCredits(dollars: number): number {
  return Math.round(dollars * TOPUP_CREDITS_PER_DOLLAR);
}

/** "28 Oct 2026". Absolute, never "in 12 days" — an expiry date is a fact. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "28 Oct, 14:32" for a usage row, where the time distinguishes two runs. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * What to call a tier on screen.
 *
 * The backend sends codes; these are the customer-facing names, and they are
 * AETEA's own. No model or vendor name appears here or anywhere near it.
 */
export function tierLabel(tier: string | null | undefined): string | null {
  switch (tier) {
    case "aetea-lite":
      return "Lite";
    case "aetea":
      return "AETEA";
    case "aetea-max":
      return "Max";
    default:
      return null;
  }
}
