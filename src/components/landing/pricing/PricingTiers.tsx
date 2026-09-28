import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getPlanPrice,
  type BillingPeriod,
  type PricingPlan,
} from "./pricingData";

type PricingTierProps = {
  plans: PricingPlan[];
  /** Start buying this plan. The page owns sign-in and Stripe; a card does not. */
  onChoose: (plan: PricingPlan, billingPeriod: BillingPeriod) => void;
  /** Which plan is mid-flight, so only its own button shows a spinner. */
  pendingPlanId?: string | null;
};

function PricingPlanCard({
  plan,
  billingPeriod,
  onChoose,
  pending,
}: {
  plan: PricingPlan;
  billingPeriod: BillingPeriod;
  onChoose: (plan: PricingPlan, billingPeriod: BillingPeriod) => void;
  pending: boolean;
}) {
  const activePrice = getPlanPrice(plan, billingPeriod);
  const unitLines = activePrice.priceUnitStacked
    ? activePrice.priceUnit.split(" ")
    : [activePrice.priceUnit];

  return (
    <article
      className={cn(
        "flex h-full w-full max-w-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] text-white shadow-[0_5px_22px_rgba(0,0,0,0.38)] sm:max-w-[260px]",
      )}
    >
      <div className="flex flex-col items-center bg-black px-4 pb-0 pt-5 text-center">
        <img
          src="/pricing/aetea-wordmark.png"
          alt="AETEA"
          className="mb-2 h-[78px] w-auto object-contain sm:h-[72px]"
        />
      </div>

      <h3
        className="font-brush relative z-10 mx-auto -mt-12 w-full -translate-x-2 self-center text-center text-[6.6rem] leading-none tracking-tight sm:-mt-11 sm:text-[6.3rem]"
        style={{
          color: "#FFFFFF",
          // Figma-like outline: white fill + colored stroke via shadow.
          textShadow: [
            `3px 0 0 ${plan.accent}`,
            `-3px 0 0 ${plan.accent}`,
            `0 3px 0 ${plan.accent}`,
            `0 -3px 0 ${plan.accent}`,
            `2px 2px 0 ${plan.accent}`,
            `-2px 2px 0 ${plan.accent}`,
            `2px -2px 0 ${plan.accent}`,
            `-2px -2px 0 ${plan.accent}`,
          ].join(", "),
        }}
      >
        {plan.name}
      </h3>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-1 sm:px-4 sm:pb-4">
        <p className="mb-2 text-center text-xs italic leading-snug text-white/85">
          {plan.tagline}
        </p>

        <div className="relative mb-1.5 flex items-center justify-center gap-1.5">
          <span className="leading-none">
            <span className="align-top text-2xl font-normal italic">
              {activePrice.price.startsWith("$") ? "$" : ""}
            </span>
            <span className="font-price text-[3.2rem] italic sm:text-[3rem]">
              {activePrice.price.replace(/^\$/, "")}
            </span>
          </span>
          <div className="relative -translate-y-px whitespace-nowrap">
            <div className="text-base font-bold italic leading-[0.72] text-white">
              {unitLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-2 space-y-0.5 text-center text-xs font-bold leading-snug">
          <p>{plan.specs.join(" | ")}</p>
          {billingPeriod === "annual" && activePrice.savingsNote ? (
            <p className="text-white/90">{activePrice.savingsNote}</p>
          ) : null}
        </div>

        <div className="mb-2.5 h-px w-full bg-white/35" />

        <div className="mb-4 flex-1 space-y-2 text-left text-[11px] leading-relaxed">
          <p>
            <span className="font-bold">Best for: </span>
            {plan.bestFor}
          </p>
          <div>
            <p className="mb-1 font-bold">What you receive</p>
            <ul className="space-y-0.5">
              {plan.receives.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-0.5 font-bold">Example use of the credits</p>
            <p className="text-white/90">{plan.exampleCredits}</p>
          </div>
        </div>

        <div className="mt-auto flex justify-center">
          <Button
            type="button"
            onClick={() => onChoose(plan, billingPeriod)}
            disabled={pending}
            aria-label={`Choose ${plan.name}`}
            className={cn(
              "h-11 w-[160px] min-w-0 rounded-full px-0 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_3px_4px_rgba(0,0,0,0.25)] sm:w-[150px]",
              "transition-transform hover:brightness-110 active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-70",
            )}
            style={{ backgroundColor: plan.accent }}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Choose ${plan.name}`
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

function BillingPeriodSwitcher({
  value,
  onChange,
}: {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}) {
  return (
    <div
      className="mx-auto mb-8 flex w-fit items-center rounded-full border border-white/15 bg-black/40 p-1 md:mb-5"
      role="group"
      aria-label="Billing period"
    >
      {(
        [
          { id: "annual", label: "Annual" },
          { id: "monthly", label: "Monthly" },
        ] as const
      ).map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              selected
                ? "bg-white text-black"
                : "text-white/70 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function PricingTiers({ plans, onChoose, pendingPlanId }: PricingTierProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");

  return (
    <section className="relative pb-16 pt-4 md:pb-24 md:pt-0">
      <div className="mx-auto w-full max-w-[1100px] px-6 xl:px-0">
        <BillingPeriodSwitcher
          value={billingPeriod}
          onChange={setBillingPeriod}
        />
        <div className="grid grid-cols-1 justify-items-center gap-y-6 sm:grid-cols-[repeat(2,minmax(0,260px))] sm:justify-center sm:gap-x-6 xl:grid-cols-[repeat(4,minmax(0,260px))] xl:gap-x-5">
          {plans.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              onChoose={onChoose}
              pending={pendingPlanId === plan.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
