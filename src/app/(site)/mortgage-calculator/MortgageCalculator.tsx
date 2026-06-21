"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtUSD(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtUSD2(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.85rem] font-medium text-ink">
        {label}
        {hint && (
          <span className="ml-2 text-[0.8rem] font-normal text-slate/60">
            {hint}
          </span>
        )}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 text-[0.9rem] font-medium text-ink/50">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step ?? 1}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          className={cn(
            "h-11 w-full rounded-xl border border-ink/15 bg-paper text-[0.92rem] text-ink outline-none transition",
            "focus:border-ink/40 focus:ring-2 focus:ring-ink/10",
            prefix ? "pl-8 pr-4" : suffix ? "pl-4 pr-8" : "px-4",
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3.5 text-[0.9rem] font-medium text-ink/50">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

const TERM_OPTIONS = [10, 15, 20, 30] as const;

export function MortgageCalculator() {
  const [homePrice, setHomePrice] = useState(500000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(6.75);
  const [termYears, setTermYears] = useState<number>(30);

  const downPayment = Math.round((homePrice * downPct) / 100);
  const principal = Math.max(0, homePrice - downPayment);

  // M = P[r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPI = useMemo(() => {
    if (principal <= 0 || rate <= 0 || termYears <= 0) return 0;
    const r = rate / 100 / 12;
    const n = termYears * 12;
    return (principal * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  }, [principal, rate, termYears]);

  // Estimates: 1.2% annual property tax, 0.5% annual insurance
  const monthlyTax = (homePrice * 0.012) / 12;
  const monthlyInsurance = (homePrice * 0.005) / 12;
  const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance;

  const totalPIPayments = monthlyPI * termYears * 12;
  const totalInterest = Math.max(0, totalPIPayments - principal);
  const ltvPct = homePrice > 0 ? Math.round((principal / homePrice) * 100) : 0;

  // Proportions for breakdown bar
  const piPct = totalMonthly > 0 ? (monthlyPI / totalMonthly) * 100 : 0;
  const taxPct = totalMonthly > 0 ? (monthlyTax / totalMonthly) * 100 : 0;
  const insPct = Math.max(0, 100 - piPct - taxPct);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
      {/* ---- INPUTS ---- */}
      <div className="rounded-2xl bg-cloud p-8 shadow-soft ring-1 ring-ink/[0.06]">
        <h2 className="font-display text-xl text-ink">Your loan details</h2>
        <p className="mt-1.5 text-[0.9rem] text-slate">
          Adjust the fields below to estimate your monthly payment.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <NumInput
            label="Home price"
            prefix="$"
            value={homePrice}
            onChange={setHomePrice}
            min={50000}
            max={5000000}
            step={5000}
          />
          <NumInput
            label="Down payment"
            suffix="%"
            value={downPct}
            onChange={setDownPct}
            min={3}
            max={100}
            step={0.5}
            hint={`≈ ${fmtUSD(downPayment)}`}
          />
          <NumInput
            label="Interest rate"
            suffix="%"
            value={rate}
            onChange={setRate}
            min={0.5}
            max={20}
            step={0.05}
          />

          {/* Loan term — segmented buttons */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-medium text-ink">Loan term</label>
            <div className="flex gap-2">
              {TERM_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setTermYears(y)}
                  className={cn(
                    "h-11 flex-1 rounded-xl border text-[0.88rem] font-medium transition",
                    termYears === y
                      ? "border-ink bg-ink text-white"
                      : "border-ink/15 bg-paper text-ink/60 hover:border-ink/40 hover:text-ink",
                  )}
                >
                  {y}yr
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assumptions note */}
        <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-ink/[0.04] p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
          <p className="text-[0.82rem] leading-relaxed text-slate">
            Property tax is estimated at 1.2% per year. Home insurance is estimated at 0.5%
            per year. Both are approximations — your actual costs will vary by location and
            coverage.
          </p>
        </div>
      </div>

      {/* ---- RESULTS ---- */}
      <div className="flex flex-col gap-5">
        {/* Monthly total */}
        <div className="rounded-2xl bg-ink p-8 text-white shadow-glow">
          <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-white/50">
            Estimated monthly payment
          </p>
          <p className="mt-3 font-display text-[3.25rem] font-light leading-none tracking-tight text-white">
            {fmtUSD2(totalMonthly)}
          </p>
          <p className="mt-1.5 text-[0.82rem] text-white/50">per month</p>

          {/* Stacked breakdown bar */}
          <div
            className="mt-7 flex h-2 overflow-hidden rounded-full bg-white/10"
            aria-hidden="true"
          >
            <div
              className="bg-azure transition-all duration-500"
              style={{ width: `${piPct}%` }}
            />
            <div
              className="bg-white/40 transition-all duration-500"
              style={{ width: `${taxPct}%` }}
            />
            <div
              className="bg-white/20 transition-all duration-500"
              style={{ width: `${insPct}%` }}
            />
          </div>

          <div className="mt-5 space-y-3">
            {[
              {
                dot: "bg-azure",
                label: "Principal & interest",
                value: fmtUSD2(monthlyPI),
              },
              {
                dot: "bg-white/40",
                label: "Property tax (est.)",
                value: fmtUSD2(monthlyTax),
              },
              {
                dot: "bg-white/20",
                label: "Home insurance (est.)",
                value: fmtUSD2(monthlyInsurance),
              },
            ].map(({ dot, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between text-[0.88rem]"
              >
                <span className="flex items-center gap-2.5 text-white/75">
                  <span className={cn("inline-block h-2.5 w-2.5 rounded-full", dot)} />
                  {label}
                </span>
                <span className="font-medium tabular-nums text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loan summary */}
        <div className="rounded-2xl bg-cloud p-7 shadow-soft ring-1 ring-ink/[0.06]">
          <p className="text-[0.78rem] font-semibold uppercase tracking-widest text-ink/40">
            Loan summary
          </p>
          <div className="mt-4 divide-y divide-ink/[0.06]">
            {[
              ["Loan amount", fmtUSD(principal)],
              ["Down payment", `${fmtUSD(downPayment)} (${downPct}%)`],
              ["Total interest paid", fmtUSD(Math.round(totalInterest))],
              ["Total of all payments", fmtUSD(Math.round(totalPIPayments))],
              ["Loan-to-value (LTV)", `${ltvPct}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <span className="text-[0.88rem] text-slate">{label}</span>
                <span className="text-[0.88rem] font-medium tabular-nums text-ink">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div className="rounded-2xl bg-paper-200/70 p-6 ring-1 ring-ink/[0.06]">
          <p className="font-display text-[1.05rem] text-ink">
            Ready to get pre-approved?
          </p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate">
            A Matin broker can connect you with a trusted Portland lender and help you move
            fast — often within one business day.
          </p>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-ink/90 active:scale-[0.98]"
          >
            Connect with a broker →
          </a>
        </div>
      </div>
    </div>
  );
}
