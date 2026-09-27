import { useEffect } from "react";
import { useRefreshBilling } from "@/hooks/useBilling";
import { useToast } from "@/hooks/use-toast";

/**
 * Pick up a customer returning from Stripe.
 *
 * Stripe sends them to `/app?checkout=success`, so this belongs in the app
 * layout rather than on the billing screen — they land in the product, not in
 * settings, and a balance that still shows the old number reads as a payment
 * that did not go through.
 *
 * A cancelled checkout is a decision, not a failure: the parameter is cleared
 * and nothing is said. Either way the parameter is removed, so a refresh does
 * not re-announce a purchase made ten minutes ago.
 */
export function useCheckoutReturn(): void {
  const refresh = useRefreshBilling();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get("checkout");
    if (!outcome) return;

    if (outcome === "success") {
      refresh();
      toast({
        title: "Payment received",
        description: "Your credits are ready.",
      });
    }

    params.delete("checkout");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}`,
    );
  }, [refresh, toast]);
}
