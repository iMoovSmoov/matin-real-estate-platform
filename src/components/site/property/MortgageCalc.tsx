"use client";

import { useState, useMemo, useId } from "react";
import { Calculator } from "lucide-react";
import { usd } from "@/lib/utils";

interface Props {
  listingPrice: number;
}

type Term = 30 | 15;

function calcMonthly(principal: number, annualRate: number, termYears: Term): number {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function MortgageCalc({ listingPrice }: Props) {
  const baseId = useId();
  const [homePrice, setHomePrice] = useState(listingPrice);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(7.0);
  const [term, setTerm] = useState<Term>(30);

  const parsed = useMemo(() => {
    const price = Math.max(0, homePrice);
    const down = price * (Math.min(100, Math.max(0, downPct)) / 100);
    const principal = price - down;
    const safeRate = Math.max(0, Math.min(25, rate));
    const pi = calcMonthly(principal, safeRate, term);
    const tax = (price * 0.011) / 12;          // 1.1% annual / 12
    const insurance = 150;                      // fixed estimate
    const total = pi + tax + insurance;
    return { price, down, principal, pi, tax, insurance, total };
  }, [homePrice, downPct, rate, term]);

  return (
    <div className="mortgage-calc rounded-2xl bg-paper ring-1 ring-ink/[0.08] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-ink/[0.07] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-paper">
          <Calculator className="h-4 w-4" />
        </div>
        <h3 className="font-display text-lg text-ink">Mortgage calculator</h3>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Home Price */}
        <div>
          <label htmlFor={`${baseId}-price`} className="block text-[0.75rem] font-semibold uppercase tracking-wide text-slate mb-1.5">
            Home price
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate text-sm">$</span>
            <input
              id={`${baseId}-price`}
              type="number"
              min={0}
              step={1000}
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full rounded-xl border border-ink/[0.12] bg-cloud pl-7 pr-3 py-2.5 text-sm text-ink placeholder:text-slate/50 focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
            />
          </div>
        </div>

        {/* Down Payment + Rate row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${baseId}-down`} className="block text-[0.75rem] font-semibold uppercase tracking-wide text-slate mb-1.5">
              Down payment
            </label>
            <div className="relative">
              <input
                id={`${baseId}-down`}
                type="number"
                min={0}
                max={100}
                step={1}
                value={downPct}
                onChange={(e) => setDownPct(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/[0.12] bg-cloud pl-3 pr-7 py-2.5 text-sm text-ink focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate text-sm">%</span>
            </div>
            <p className="mt-1 text-[0.72rem] text-slate">{usd(Math.round(parsed.down))}</p>
          </div>

          <div>
            <label htmlFor={`${baseId}-rate`} className="block text-[0.75rem] font-semibold uppercase tracking-wide text-slate mb-1.5">
              Interest rate
            </label>
            <div className="relative">
              <input
                id={`${baseId}-rate`}
                type="number"
                min={0}
                max={25}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full rounded-xl border border-ink/[0.12] bg-cloud pl-3 pr-7 py-2.5 text-sm text-ink focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Term toggle */}
        <div>
          <span className="block text-[0.75rem] font-semibold uppercase tracking-wide text-slate mb-1.5">Loan term</span>
          <div className="flex rounded-xl border border-ink/[0.12] overflow-hidden">
            {([30, 15] as Term[]).map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  term === t
                    ? "bg-ink text-paper"
                    : "bg-cloud text-slate hover:bg-paper-200"
                }`}
              >
                {t}-yr fixed
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="rounded-xl bg-ink px-4 py-4 text-paper">
          <div className="text-[0.72rem] font-semibold uppercase tracking-widest text-paper/60 mb-1">
            Est. monthly payment
          </div>
          <div className="font-display text-3xl text-paper tracking-tight">
            {usd(Math.round(parsed.total))}
            <span className="ml-1.5 font-sans text-sm font-normal text-paper/60">/mo</span>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-paper/10 pt-3">
            <Row label="Principal & interest" value={usd(Math.round(parsed.pi))} />
            <Row label="Property tax (est.)" value={usd(Math.round(parsed.tax))} />
            <Row label="Home insurance (est.)" value={`$${parsed.insurance}/mo`} />
          </div>
        </div>

        <p className="text-[0.7rem] leading-relaxed text-slate">
          Estimate only — 20% down, {rate.toFixed(1)}% rate, {term}-yr fixed. Taxes based on
          1.1% annual. Consult a lender for exact figures.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[0.8rem]">
      <span className="text-paper/60">{label}</span>
      <span className="font-medium text-paper">{value}</span>
    </div>
  );
}
