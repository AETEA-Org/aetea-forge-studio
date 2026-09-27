import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBalance,
  getPlan,
  getUsage,
  openPortal,
  startCheckout,
  type BillingPeriodChoice,
  type ExpectedCost,
  type PlanId,
} from "@/services/billing";
import { useAuth } from "./useAuth";

/**
 * The customer's balance, plan and history.
 *
 * All three share one refresh path, so the pill in the header and the settings
 * pane cannot show different numbers — which is the sort of thing that makes
 * someone doubt every figure on the page, not just the wrong one.
 */
export function useBalance(enabled: boolean = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["billing", "balance", user?.email],
    queryFn: () => getBalance(),
    enabled: enabled && !!user?.email,
    // A balance changes while the customer watches a run spend it.
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}

export function usePlan(enabled: boolean = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["billing", "plan", user?.email],
    queryFn: () => getPlan(),
    enabled: enabled && !!user?.email,
    // Plans change when someone buys, which already forces a refresh.
    staleTime: 5 * 60_000,
  });
}

export function useUsage(limit = 50, enabled: boolean = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["billing", "usage", user?.email, limit],
    queryFn: () => getUsage(limit),
    enabled: enabled && !!user?.email,
    staleTime: 30_000,
  });
}

/** Refetch everything billing-related. Call after a purchase or a run. */
export function useRefreshBilling() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["billing"] });
  }, [queryClient]);
}

/**
 * Send the customer to Stripe.
 *
 * A full navigation rather than a new tab: Checkout is a destination, and
 * `window.open` here is what popup blockers eat.
 */
export function useCheckout() {
  return useMutation({
    mutationFn: (
      intent:
        | { planId: PlanId; billingPeriod?: BillingPeriodChoice }
        | { topupDollars: number },
    ) => startCheckout(intent),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: () => openPortal(),
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      }
    },
  });
}

/**
 * The expected range for one action at the tier the customer has chosen.
 *
 * `null` when the meter has not seen enough runs of that combination to say
 * anything. Showing nothing is the honest answer; a placeholder range would be
 * read as a quote.
 */
export function expectedFor(
  costs: ExpectedCost[] | undefined,
  actionCode: string,
  tier: string,
): ExpectedCost | null {
  if (!costs?.length) return null;
  return (
    costs.find((c) => c.action_code === actionCode && c.tier === tier) ?? null
  );
}
