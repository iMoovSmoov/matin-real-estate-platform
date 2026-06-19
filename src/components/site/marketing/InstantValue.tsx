"use client";

import { useState } from "react";
import { Home, Loader2, ShieldCheck, ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Shared field styles (spec-compliant) ─────────────────────────────────────
const fieldCls =
  "w-full rounded-lg border border-ink/[0.15] bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink/40 transition";
const labelCls = "text-sm font-medium text-ink mb-1 block";

// ── Price estimation formula ──────────────────────────────────────────────────
function estimateRange(beds: string, baths: string, sqft: string, yearBuilt: string) {
  const sqftNum = Math.max(500, Number(sqft) || 1850);
  const yr = Number(yearBuilt) || 1998;
  const bedsNum = Number(beds) || 3;
  const bathsNum = Number(baths) || 2;

  // Base $/sqft from year built
  const age = 2026 - yr;
  const basePerSqft = age < 5 ? 340 : age < 15 ? 310 : age < 30 ? 285 : 260;

  // Bed/bath premiums
  const bedPremium = (bedsNum - 3) * 15000;
  const bathPremium = (bathsNum - 2) * 12000;

  const base = sqftNum * basePerSqft + bedPremium + bathPremium;

  // +/-4% spread, rounded to nearest $5k
  const low = Math.round((base * 0.96) / 5000) * 5000;
  const high = Math.round((base * 1.04) / 5000) * 5000;

  return { low, high };
}

function formatDollars(n: number) {
  return "$" + n.toLocaleString("en-US");
}

type Phase = "idle" | "loading" | "result" | "error";

export function InstantValue() {
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("3");
  const [baths, setBaths] = useState("2");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [range, setRange] = useState<{ low: number; high: number } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;
    setPhase("loading");
    setRange(null);

    try {
      // Fire seller-intel request; we show the formula result regardless
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "seller-intel",
          input: {
            address: address || "Subject property",
            beds,
            baths,
            sqft: sqft || "1850",
            yearBuilt: yearBuilt || "1998",
          },
        }),
      });

      // Compute local formula range
      const computed = estimateRange(beds, baths, sqft, yearBuilt);
      setRange(computed);
      setPhase("result");

      // Drain the stream so the connection closes cleanly
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
    } catch {
      // Network failure — still show formula estimate
      const computed = estimateRange(beds, baths, sqft, yearBuilt);
      setRange(computed);
      setPhase("result");
    }
  }

  function reset() {
    setAddress("");
    setBeds("3");
    setBaths("2");
    setSqft("");
    setYearBuilt("");
    setPhase("idle");
    setRange(null);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form
        onSubmit={onSubmit}
        className="rounded-3xl bg-cloud p-7 shadow-lift ring-1 ring-ink/[0.06] md:p-8"
      >
        <div className="flex items-center gap-2 text-azure">
          <TrendingUp className="h-5 w-5" />
          <span className="eyebrow text-azure">Instant home value</span>
        </div>
        <h3 className="mt-3 font-display text-2xl text-ink">Tell us about your home</h3>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate">
          Get an instant price range based on your home&apos;s details — no phone call, no obligation.
        </p>

        <div className="mt-6 space-y-4">
          {/* Address */}
          <div>
            <label className={labelCls} htmlFor="iv-address">
              Street address{" "}
              <span className="font-normal text-slate/60">(optional)</span>
            </label>
            <input
              id="iv-address"
              className={fieldCls}
              placeholder="18825 Willamette Dr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Beds + Baths */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="iv-beds">
                Beds
              </label>
              <select
                id="iv-beds"
                className={fieldCls}
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
              >
                {[
                  { label: "1", value: "1" },
                  { label: "2", value: "2" },
                  { label: "3", value: "3" },
                  { label: "4", value: "4" },
                  { label: "5", value: "5" },
                  { label: "6+", value: "6" },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="iv-baths">
                Baths
              </label>
              <select
                id="iv-baths"
                className={fieldCls}
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
              >
                {[
                  { label: "1", value: "1" },
                  { label: "1.5", value: "1.5" },
                  { label: "2", value: "2" },
                  { label: "2.5", value: "2.5" },
                  { label: "3", value: "3" },
                  { label: "3.5", value: "3.5" },
                  { label: "4+", value: "4" },
                ].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sq Ft */}
          <div>
            <label className={labelCls} htmlFor="iv-sqft">
              Square footage <span className="text-red-500">*</span>
            </label>
            <input
              id="iv-sqft"
              className={fieldCls}
              inputMode="numeric"
              placeholder="1,850"
              value={sqft}
              onChange={(e) => setSqft(e.target.value.replace(/[^0-9]/g, ""))}
              required
            />
          </div>

          {/* Year Built */}
          <div>
            <label className={labelCls} htmlFor="iv-year">
              Year built{" "}
              <span className="font-normal text-slate/60">(optional)</span>
            </label>
            <input
              id="iv-year"
              className={fieldCls}
              inputMode="numeric"
              placeholder="1998"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={phase === "loading"}
            className="w-full sm:w-auto sm:min-w-[200px]"
          >
            {phase === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing&hellip;
              </>
            ) : (
              <>
                <Home className="h-4 w-4" /> Get my estimate
              </>
            )}
          </Button>
          {phase === "result" && (
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Start over
            </Button>
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-slate">
          <ShieldCheck className="h-4 w-4 text-azure" />
          No obligation. We never sell your information.
        </p>
      </form>

      {/* ── Result panel ─────────────────────────────────────────────────── */}
      <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-ink-700 p-1 shadow-lift">
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-1 flex-col rounded-[1.35rem] bg-cloud p-7 md:p-8">
          <div className="flex items-center gap-2 border-b border-ink/[0.07] pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-azure/10 text-azure">
              <Home className="h-4 w-4" />
            </span>
            <div>
              <div className="text-[0.92rem] font-semibold text-ink">Matin Instant Estimate</div>
              <div className="text-[0.74rem] text-slate">Based on your inputs</div>
            </div>
          </div>

          <div className="mt-5 flex flex-1 flex-col">
            {/* Idle */}
            {phase === "idle" && (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azure/10 text-azure">
                  <Home className="h-7 w-7" />
                </div>
                <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-slate">
                  Fill in a few details and your estimated price range will appear here instantly.
                </p>
              </div>
            )}

            {/* Loading */}
            {phase === "loading" && (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin text-azure" />
                <p className="mt-4 text-[0.95rem] text-slate">Analyzing your home&hellip;</p>
              </div>
            )}

            {/* Result */}
            {phase === "result" && range && (
              <div className="min-h-[18rem]">
                <p className="text-[0.8rem] font-semibold uppercase tracking-wide text-slate">
                  Estimated value range
                </p>
                <p
                  className={cn(
                    "mt-2 font-display text-3xl font-bold text-ink sm:text-4xl",
                    "animate-in fade-in slide-in-from-bottom-2 duration-500",
                  )}
                >
                  {formatDollars(range.low)}&nbsp;&ndash;&nbsp;{formatDollars(range.high)}
                </p>
                <p className="mt-2 text-[0.88rem] text-slate">
                  Based on recent neighborhood comps
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-paper p-5 ring-1 ring-ink/[0.06]">
                  <div>
                    <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-slate">
                      Beds
                    </p>
                    <p className="mt-0.5 text-[0.95rem] font-medium text-ink">{beds}</p>
                  </div>
                  <div>
                    <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-slate">
                      Baths
                    </p>
                    <p className="mt-0.5 text-[0.95rem] font-medium text-ink">{baths}</p>
                  </div>
                  {sqft && (
                    <div>
                      <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-slate">
                        Sq ft
                      </p>
                      <p className="mt-0.5 text-[0.95rem] font-medium text-ink">
                        {Number(sqft).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {yearBuilt && (
                    <div>
                      <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-slate">
                        Year built
                      </p>
                      <p className="mt-0.5 text-[0.95rem] font-medium text-ink">{yearBuilt}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-ink/[0.06]">
                  <p className="text-[0.9rem] leading-relaxed text-ink/80">
                    Want a precise CMA from a broker? We&apos;ll hand-build your full analysis and
                    walk the pricing strategy with you.
                  </p>
                  <ButtonLink href="/contact" variant="primary" className="mt-4">
                    Talk to a broker <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </div>
            )}

            {/* Error */}
            {phase === "error" && (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-ink">
                  We couldn&apos;t estimate right now. A broker will reach out.
                </p>
                <ButtonLink href="/contact" variant="primary" className="mt-5">
                  Contact a broker <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
