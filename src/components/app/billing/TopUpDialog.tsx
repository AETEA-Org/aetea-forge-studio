import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  TOPUP_MIN_DOLLARS,
  TOPUP_QUICK_DOLLARS,
} from "@/components/landing/pricing/pricingData";
import { useCheckout } from "@/hooks/useBilling";
import { useToast } from "@/hooks/use-toast";
import { dollarsToCredits, formatCredits } from "./format";

/**
 * Buy more credits.
 *
 * The customer chooses **dollars**, and the credits are shown as a consequence.
 * That ordering is deliberate: the amount they are about to be charged is the
 * decision, and the credit figure is the reassurance. It also keeps the code on
 * the right side of the one arithmetic trap in this system — the API takes a
 * number of dollars, and sending credits would charge a hundred times too much.
 */
export function TopUpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [dollars, setDollars] = useState<number>(TOPUP_QUICK_DOLLARS[1]);
  const [custom, setCustom] = useState("");
  const checkout = useCheckout();
  const { toast } = useToast();

  const customValue = custom.trim() === "" ? null : Number(custom);
  const amount = customValue !== null && !Number.isNaN(customValue)
    ? Math.floor(customValue)
    : dollars;
  const tooSmall = amount < TOPUP_MIN_DOLLARS;

  const buy = () => {
    if (tooSmall) return;
    checkout.mutate(
      { topupDollars: amount },
      {
        onError: (error) =>
          toast({
            title: "Could not start checkout",
            description:
              error instanceof Error
                ? error.message
                : "Please try again shortly.",
            variant: "destructive",
          }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add credits</DialogTitle>
          <DialogDescription>
            Credits you buy stay valid for three months, and AETEA always spends
            the ones expiring soonest first.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOPUP_QUICK_DOLLARS.map((option) => {
            const active = custom.trim() === "" && dollars === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setDollars(option);
                  setCustom("");
                }}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-3 py-3 text-center transition-colors",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-foreground/30 hover:bg-muted/40",
                )}
              >
                <span className="block text-lg font-semibold">${option}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatCredits(dollarsToCredits(option))} credits
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="topup-custom" className="text-sm text-muted-foreground">
            Or enter an amount
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              id="topup-custom"
              inputMode="numeric"
              placeholder={`${TOPUP_MIN_DOLLARS} or more`}
              value={custom}
              onChange={(event) =>
                setCustom(event.target.value.replace(/[^0-9]/g, ""))
              }
              className="pl-7"
            />
          </div>
          {custom.trim() !== "" && tooSmall ? (
            <p className="text-xs text-destructive">
              The smallest top-up is ${TOPUP_MIN_DOLLARS}.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {formatCredits(dollarsToCredits(amount))} credits
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={checkout.isPending}
          >
            Cancel
          </Button>
          <Button onClick={buy} disabled={tooSmall || checkout.isPending}>
            {checkout.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {tooSmall ? `Minimum $${TOPUP_MIN_DOLLARS}` : `Continue to payment`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
