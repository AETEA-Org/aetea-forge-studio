import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getPlanPrice,
  type BillingPeriod,
  type PricingPlan,
} from "./pricingData";

type PricingTierProps = {
  plans: PricingPlan[];
};

function PricingPlanCard({
  plan,
  billingPeriod,
}: {
  plan: PricingPlan;
  billingPeriod: BillingPeriod;
}) {
  const activePrice = getPlanPrice(plan, billingPeriod);
  const unitLines = activePrice.priceUnitStacked
    ? activePrice.priceUnit.split(" ")
    : [activePrice.priceUnit];

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#1a1a1a] text-white shadow-[0_8px_40px_rgba(0,0,0,0.45)]",
      )}
    >
      <div className="flex flex-col items-center bg-black px-6 pb-0 pt-8 text-center">
        <img
          src="/pricing/aetea-wordmark.png"
          alt="AETEA"
          className="mb-4 h-[107px] w-auto object-contain"
        />
      </div>

      <h3
        className="font-brush mx-auto -mt-[52px] w-[90%] text-center text-[6.25rem] leading-none tracking-tight sm:text-[7.5rem]"
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

      <div className="flex flex-1 flex-col px-5 pb-5 pt-2 sm:px-6">
        <p className="mb-2 text-center text-[14px] italic text-white/85 sm:text-base">
          {plan.tagline}
        </p>

        <div className="relative mb-3 flex items-end justify-center gap-3">
          <span className="leading-none">
            <span className="align-top text-[2.25rem] font-normal italic sm:text-[2.75rem]">
              {activePrice.price.startsWith("$") ? "$" : ""}
            </span>
            <span className="font-price italic text-[4.25rem] sm:text-[5.25rem]">
              {activePrice.price.replace(/^\$/, "")}
            </span>
          </span>
          <div className="relative pb-2">
            <div className="text-[1.55rem] font-bold italic leading-tight text-white sm:text-[2rem]">
              {unitLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-2 space-y-1 text-center text-[15px] font-bold sm:text-base">
          <p>{plan.specs.join(" | ")}</p>
          {billingPeriod === "annual" && activePrice.savingsNote ? (
            <p className="text-white/90">{activePrice.savingsNote}</p>
          ) : null}
        </div>

        <div className="mb-4 h-px w-full bg-white/35" />

        <div className="mb-5 flex-1 space-y-3 text-left text-sm leading-relaxed sm:text-[15px]">
          <p>
            <span className="font-bold">Best for: </span>
            {plan.bestFor}
          </p>
          <div>
            <p className="mb-2 font-bold">What you receive</p>
            <ul className="space-y-1.5">
              {plan.receives.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-bold">Example use of the credits</p>
            <p className="text-white/90">{plan.exampleCredits}</p>
          </div>
        </div>

        <div className="mt-auto flex justify-center">
          <Button
            type="button"
            disabled
            className={cn(
              "h-[35px] w-[162px] min-w-0 rounded-full px-0 text-[13px] font-bold uppercase tracking-wide text-white shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
              "disabled:pointer-events-none disabled:opacity-100",
            )}
            style={{ backgroundColor: plan.accent }}
          >
            Coming soon
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
      className="mx-auto mb-8 flex w-fit items-center rounded-full border border-white/15 bg-black/40 p-1"
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

export function PricingTiers({ plans }: PricingTierProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");

  return (
    <section className="relative pb-16 pt-4 md:pb-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-6 xl:px-0">
        <BillingPeriodSwitcher
          value={billingPeriod}
          onChange={setBillingPeriod}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-3">
          {plans.map((plan) => (
            <PricingPlanCard
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
