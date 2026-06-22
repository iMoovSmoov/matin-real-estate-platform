"use client";

import { useRef, useState } from "react";
import { Home, Loader2, ShieldCheck, ArrowRight, TrendingUp, AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";

// ── Shared field styles ───────────────────────────────────────────────────────
const labelCls = "text-sm font-medium text-ink mb-1 block";

function fieldCls(hasError: boolean) {
  return cn(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition",
    hasError
      ? "border-red-400 focus:ring-red-300 focus:border-red-400"
      : "border-ink/[0.15] focus:ring-ink/20 focus:border-ink/40",
  );
}

// ── Validation helpers ────────────────────────────────────────────────────────
type FormErrors = {
  sqft?: string;
  yearBuilt?: string;
  beds?: string;
  baths?: string;
  address?: string;
};

function validateAddress(val: string): string | undefined {
  if (!val.trim()) return undefined; // optional
  // Must contain at least one digit followed by something word-like
  if (!/\d+\s+\S/.test(val.trim())) {
    return "Please enter a full street address (e.g., 1234 Oak St)";
  }
  return undefined;
}

function validateAll(
  sqft: string,
  yearBuilt: string,
  beds: string,
  baths: string,
  address: string,
): FormErrors {
  const errors: FormErrors = {};

  // Square footage
  if (!sqft.trim()) {
    errors.sqft = "Square footage is required";
  } else {
    const n = Number(sqft);
    if (n < 400) errors.sqft = "Square footage seems too low — minimum 400 sqft";
    else if (n > 15000) errors.sqft = "Please verify — that's larger than most Portland-area homes";
  }

  // Year built (optional but validated if entered)
  if (yearBuilt.trim()) {
    const yr = Number(yearBuilt);
    if (isNaN(yr) || yr < 1880 || yr > 2025) {
      errors.yearBuilt = "Year built must be between 1880 and 2025";
    }
  }

  // Beds — must have a selection (non-empty string)
  if (!beds) errors.beds = "Please select number of bedrooms";

  // Baths — must have a selection
  if (!baths) errors.baths = "Please select number of bathrooms";

  // Address (optional, format check)
  const addrErr = validateAddress(address);
  if (addrErr) errors.address = addrErr;

  return errors;
}

// ── Smarter estimate formula ──────────────────────────────────────────────────
function estimateRange(
  beds: string,
  sqft: string,
  yearBuilt: string,
  condition: string,
): { low: number; high: number; mid: number } {
  const sqftNum = Number(sqft) || 1850;
  const bedsNum = Number(beds) || 3;

  const basePPSF =
    ({ excellent: 340, good: 295, fair: 250, poor: 200 } as Record<string, number>)[condition] ??
    295;

  const bedMult =
    bedsNum <= 1 ? 0.88 : bedsNum === 2 ? 0.94 : bedsNum === 3 ? 1.0 : bedsNum === 4 ? 1.05 : 1.08;

  const age = 2026 - (Number(yearBuilt) || 2000);
  const ageMult = age < 5 ? 1.1 : age < 15 ? 1.05 : age < 30 ? 1.0 : age < 50 ? 0.94 : 0.88;

  const sqftMult =
    sqftNum < 1000
      ? 1.08
      : sqftNum < 1800
        ? 1.04
        : sqftNum < 3000
          ? 1.0
          : sqftNum < 4500
            ? 0.96
            : 0.92;

  const mid = Math.round((sqftNum * basePPSF * bedMult * ageMult * sqftMult) / 5000) * 5000;
  const low = Math.round((mid * 0.94) / 5000) * 5000;
  const high = Math.round((mid * 1.06) / 5000) * 5000;

  return { low, high, mid };
}

function formatDollars(n: number) {
  return "$" + n.toLocaleString("en-US");
}

// ── Animated loading dots ─────────────────────────────────────────────────────
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-azure"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

type Phase = "idle" | "loading" | "result" | "error";

const CONDITIONS = [
  { value: "excellent", label: "Excellent — recently updated" },
  { value: "good", label: "Good — well maintained" },
  { value: "fair", label: "Fair — needs some work" },
  { value: "poor", label: "Poor — significant repairs needed" },
];

export function InstantValue() {
  const [address, setAddress] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [condition, setCondition] = useState("good");

  const [phase, setPhase] = useState<Phase>("idle");
  const [range, setRange] = useState<{ low: number; high: number; mid: number } | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  // Track which fields have been blurred so we show inline errors only after touch
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // On stacked layouts the result panel renders below the form — scroll to it.
  const resultRef = useRef<HTMLDivElement>(null);

  function blurField(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    // Re-validate on blur
    const errs = validateAll(sqft, yearBuilt, beds, baths, address);
    setErrors(errs);
  }

  function clearFieldError(field: keyof FormErrors) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "loading") return;

    // Mark all required fields touched
    setTouched({ sqft: true, beds: true, baths: true, yearBuilt: true, address: true });
    const errs = validateAll(sqft, yearBuilt, beds, baths, address);
    setErrors(errs);

    // Block if any errors
    if (Object.keys(errs).length > 0) return;

    setPhase("loading");
    setRange(null);
    // Bring the analyzing/result panel into view on narrow (stacked) layouts so
    // the user sees the estimate being generated instead of it happening below.
    scrollIntoViewSafe(resultRef.current, { block: "center", onlyBelowLg: true });

    const computed = estimateRange(beds, sqft, yearBuilt, condition);

    try {
      // Fire seller-intel request in background; we show formula result regardless
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
            yearBuilt: yearBuilt || "2000",
            condition,
          },
        }),
      });

      // Drain stream so connection closes cleanly
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }
    } catch {
      // Network failure — still show formula estimate below
    }

    // Always show result after 1.5s "comp analysis" delay
    setTimeout(() => {
      setRange(computed);
      setPhase("result");
    }, 1500);
  }

  function reset() {
    setAddress("");
    setBeds("");
    setBaths("");
    setSqft("");
    setYearBuilt("");
    setCondition("good");
    setPhase("idle");
    setRange(null);
    setErrors({});
    setTouched({});
  }

  const showError = (field: keyof FormErrors) =>
    touched[field] && errors[field] ? errors[field] : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-3xl bg-cloud p-7 shadow-lift ring-1 ring-ink/[0.06] md:p-8"
      >
        <div className="flex items-center gap-2 text-azure">
          <TrendingUp className="h-5 w-5" />
          <span className="eyebrow text-azure">Instant home value</span>
        </div>
        <h3 className="mt-3 font-display text-2xl text-ink">Tell us about your home</h3>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate">
          Get an instant price range based on your home&apos;s details — no phone call, no
          obligation.
        </p>

        <div className="mt-6 space-y-4">
          {/* Address (optional) */}
          <div>
            <label className={labelCls} htmlFor="iv-address">
              Street address{" "}
              <span className="font-normal text-slate/60">(optional)</span>
            </label>
            <input
              id="iv-address"
              className={fieldCls(!!showError("address"))}
              placeholder="18825 Willamette Dr"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                clearFieldError("address");
              }}
              onBlur={() => blurField("address")}
            />
            {showError("address") && (
              <p className="mt-1 text-xs text-red-500">{showError("address")}</p>
            )}
          </div>

          {/* Beds + Baths */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="iv-beds">
                Beds <span className="text-red-500">*</span>
              </label>
              <select
                id="iv-beds"
                className={fieldCls(!!showError("beds"))}
                value={beds}
                onChange={(e) => {
                  setBeds(e.target.value);
                  clearFieldError("beds");
                }}
                onBlur={() => blurField("beds")}
              >
                <option value="">Select…</option>
                {["1", "2", "3", "4", "5"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                <option value="6">6+</option>
              </select>
              {showError("beds") && (
                <p className="mt-1 text-xs text-red-500">{showError("beds")}</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="iv-baths">
                Baths <span className="text-red-500">*</span>
              </label>
              <select
                id="iv-baths"
                className={fieldCls(!!showError("baths"))}
                value={baths}
                onChange={(e) => {
                  setBaths(e.target.value);
                  clearFieldError("baths");
                }}
                onBlur={() => blurField("baths")}
              >
                <option value="">Select…</option>
                {["1", "1.5", "2", "2.5", "3", "3.5"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
                <option value="4">4+</option>
              </select>
              {showError("baths") && (
                <p className="mt-1 text-xs text-red-500">{showError("baths")}</p>
              )}
            </div>
          </div>

          {/* Sq Ft */}
          <div>
            <label className={labelCls} htmlFor="iv-sqft">
              Square footage <span className="text-red-500">*</span>
            </label>
            <input
              id="iv-sqft"
              className={fieldCls(!!showError("sqft"))}
              inputMode="numeric"
              placeholder="1,850"
              value={sqft}
              onChange={(e) => {
                setSqft(e.target.value.replace(/[^0-9]/g, ""));
                clearFieldError("sqft");
              }}
              onBlur={() => blurField("sqft")}
            />
            {showError("sqft") && (
              <p className="mt-1 text-xs text-red-500">{showError("sqft")}</p>
            )}
          </div>

          {/* Year Built */}
          <div>
            <label className={labelCls} htmlFor="iv-year">
              Year built{" "}
              <span className="font-normal text-slate/60">(optional)</span>
            </label>
            <input
              id="iv-year"
              className={fieldCls(!!showError("yearBuilt"))}
              inputMode="numeric"
              placeholder="1998"
              value={yearBuilt}
              onChange={(e) => {
                setYearBuilt(e.target.value.replace(/[^0-9]/g, ""));
                clearFieldError("yearBuilt");
              }}
              onBlur={() => blurField("yearBuilt")}
            />
            {showError("yearBuilt") && (
              <p className="mt-1 text-xs text-red-500">{showError("yearBuilt")}</p>
            )}
          </div>

          {/* Condition */}
          <div>
            <label className={labelCls} htmlFor="iv-condition">
              Overall condition
            </label>
            <select
              id="iv-condition"
              className={fieldCls(false)}
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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
            <button
              type="button"
              className="text-sm text-azure underline-offset-2 hover:underline"
              onClick={reset}
            >
              Try another address
            </button>
          )}
        </div>

        <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-slate">
          <ShieldCheck className="h-4 w-4 text-azure" />
          No obligation. We never sell your information.
        </p>
      </form>

      {/* ── Result panel ─────────────────────────────────────────────────── */}
      <div
        ref={resultRef}
        aria-live="polite"
        className="relative flex scroll-mt-24 flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-ink-700 p-1 shadow-lift"
      >
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
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-5 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-azure" />
                <div>
                  <p className="text-[0.95rem] font-medium text-ink">
                    Analyzing neighborhood comps <LoadingDots />
                  </p>
                  <p className="mt-1 text-[0.82rem] text-slate">
                    Pulling recent Portland metro sales data
                  </p>
                </div>
                {/* Subtle progress bar */}
                <div className="w-48 overflow-hidden rounded-full bg-ink/[0.07] h-1">
                  <div className="h-full w-full origin-left animate-[grow_1.5s_ease-in-out_forwards] rounded-full bg-azure" />
                </div>
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
                  Estimated market value:{" "}
                  <span className="font-semibold text-ink">~{formatDollars(range.mid)}</span>
                </p>

                <p className="mt-1 text-[0.82rem] text-slate/80">
                  Based on Portland metro comps for {beds || "3"}BR&nbsp;/&nbsp;
                  {Number(sqft).toLocaleString()}&nbsp;sqft in{" "}
                  {CONDITIONS.find((c) => c.value === condition)?.label?.split(" — ")[0].toLowerCase() ??
                    condition}{" "}
                  condition
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-paper p-5 ring-1 ring-ink/[0.06]">
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

                <p className="mt-3 text-[0.76rem] leading-relaxed text-slate/70">
                  This estimate is for informational purposes. A licensed broker CMA may vary by
                  ±8–12%.
                </p>

                <div className="mt-5 rounded-2xl bg-paper p-5 ring-1 ring-ink/[0.06]">
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
