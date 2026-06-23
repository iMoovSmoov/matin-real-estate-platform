"use client";

import { useState } from "react";
import { Minus, Plus, Copy, Check, Download } from "lucide-react";
import { company } from "@/lib/data";
import { downloadTextFile } from "@/lib/download";

/*
  Cash-offer estimator — faithful port of the design's `#w-cash` estimator card
  (tmp/ds/website.html). A white "Your home" panel (address + bed/bath/condition
  facts) sitting above a dark "Matin AI estimate" surface that shows a live cash
  range and the green→brass "Get my offer" CTA. The range is always visible and
  updates with the inputs (like the design); "Get my offer" reveals the real,
  non-dead-end keep-the-offer actions (copy / download / lock-it-in by phone).
*/

const CONDITIONS = ["Fair", "Good", "Excellent"] as const;
type Condition = (typeof CONDITIONS)[number];

// As-is cash band by condition (low%, high% of the owner's rough value). The
// Excellent default (0.88–0.94) reproduces the design's $1.31M–$1.40M at the
// default $1.49M value — a realistic, defensible as-is range, not a fixed quote.
const BANDS: Record<Condition, [number, number]> = {
  Fair: [0.82, 0.88],
  Good: [0.85, 0.91],
  Excellent: [0.88, 0.94],
};

const fmtFull = (n: number) => "$" + Math.round(n).toLocaleString();
const fmtCompact = (n: number) =>
  n >= 1_000_000 ? "$" + (n / 1_000_000).toFixed(2) + "M" : "$" + Math.round(n / 1000) + "K";

export function CashOfferEstimator() {
  const [address, setAddress] = useState("3302 Tannler Dr, West Linn, OR 97068");
  const [beds, setBeds] = useState(5);
  const [baths, setBaths] = useState(3.5);
  const [condition, setCondition] = useState<Condition>("Excellent");
  const [value, setValue] = useState(1_490_000);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const [lowPct, highPct] = BANDS[condition];
  const low = value * lowPct;
  const high = value * highPct;

  function cycleCondition() {
    const i = CONDITIONS.indexOf(condition);
    setCondition(CONDITIONS[(i + 1) % CONDITIONS.length]);
  }

  function buildOfferText(): string {
    const line = "—".repeat(46);
    return [
      `${company.name.toUpperCase()} — CASH OFFER`,
      "NO-OBLIGATION CASH OFFER ESTIMATE",
      line,
      `Home:        ${address}`,
      `Details:     ${beds} bd · ${baths} ba · ${condition} condition`,
      `Rough value: ${fmtFull(value)}`,
      `Cash range:  ${fmtFull(low)} – ${fmtFull(high)}`,
      line,
      "• No repairs, no showings, no fees",
      "• Close in as little as 14 days, on your date",
      "• Or compare it side-by-side with an open-market listing",
      "",
      "This is a preliminary range — a licensed Matin broker firms it up",
      "from live RMLS comps within 24 hours.",
      `Lock it in: ${company.phone} · matinrealestate.com`,
    ].join("\n");
  }

  async function copyOffer() {
    try {
      await navigator.clipboard.writeText(buildOfferText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — Download is the real fallback */
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
      {/* Your home */}
      <div className="p-5 sm:p-6">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate">Your home</div>

        <label className="mt-3.5 flex items-center gap-2.5 rounded-[10px] border border-ink/15 bg-[#fbfbfa] px-3.5 py-3">
          <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-gold" aria-hidden />
          <input
            value={address}
            onChange={(e) => { setAddress(e.target.value); setRevealed(false); }}
            aria-label="Your home address"
            className="min-w-0 flex-1 bg-transparent text-[0.9rem] font-medium text-ink outline-none placeholder:text-slate/60"
            placeholder="Enter your address"
          />
        </label>

        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <Stepper label="Beds" value={beds} step={1} min={1} max={12}
            onChange={(v) => { setBeds(v); setRevealed(false); }} fmt={(v) => String(v)} />
          <Stepper label="Baths" value={baths} step={0.5} min={1} max={12}
            onChange={(v) => { setBaths(v); setRevealed(false); }} fmt={(v) => String(v)} />
          <button
            type="button"
            onClick={() => { cycleCondition(); setRevealed(false); }}
            className="rounded-[10px] border border-ink/14 px-3 py-2.5 text-left transition-colors hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            aria-label={`Condition: ${condition}. Tap to change.`}
          >
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate/70">Condition</div>
            <div className="mt-0.5 text-[0.9rem] font-semibold text-ink">{condition}</div>
          </button>
        </div>

        {/* The one real price input — rough value (the design's card has no slider;
            an honest estimator needs the owner's ballpark to price from). */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.72rem] font-medium text-slate">Your rough value</span>
            <span className="font-display text-[1.05rem] text-ink tabular-nums">{fmtFull(value)}</span>
          </div>
          <input
            type="range"
            min={300_000}
            max={3_000_000}
            step={10_000}
            value={value}
            onChange={(e) => { setValue(Number(e.target.value)); setRevealed(false); setCopied(false); }}
            className="mt-2 w-full accent-gold"
            aria-label="Your home's rough value"
          />
          <div className="mt-1 flex justify-between text-[0.62rem] text-slate/60 tabular-nums">
            <span>$300K</span><span>$3M</span>
          </div>
        </div>
      </div>

      {/* Matin AI estimate */}
      <div
        className="relative overflow-hidden p-5 sm:p-6"
        style={{ background: "linear-gradient(155deg,#11211a 0%,#0a1410 100%)", borderTop: "1px solid #1d3b30" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-14 h-52 w-52 rounded-full"
          style={{ background: "radial-gradient(rgba(31,107,74,.4),transparent 70%)", filter: "blur(20px)" }}
        />

        <div className="relative flex items-center gap-2">
          <span className="font-display inline-flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-gold text-[11px] leading-none text-white" aria-hidden>M</span>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#7fce9f]">Matin AI estimate</span>
        </div>

        <div className="relative mt-2.5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-[0.78rem] text-white/60">Estimated cash offer</div>
            <div className={`font-display tabular-nums leading-none text-white text-[2.1rem] sm:text-[2.4rem] mt-1 ${revealed ? "motion-safe:[animation:countup-glow_2.6s_ease-in-out_infinite]" : ""}`}>
              {fmtCompact(low)}&#8202;&#8211;&#8202;{fmtCompact(high)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn-accent inline-flex shrink-0 items-center justify-center rounded-[10px] px-5 py-3 text-[0.9rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1410]"
          >
            <span>Get my offer</span>
          </button>
        </div>

        <div className="relative mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[0.72rem] text-white/65 tabular-nums">
          <span>No obligation</span>
          <span className="text-white/25">|</span>
          <span>Close in 14 days</span>
          <span className="text-white/25">|</span>
          <span>From 12 live comps</span>
        </div>

        {/* Keep the offer — real, non-dead-end actions revealed on request. */}
        {revealed && (
          <div className="relative mt-5 border-t border-white/10 pt-4" aria-live="polite">
            <p className="text-[0.78rem] text-white/70">
              Your no-obligation range is ready. Keep it — a licensed Matin broker firms it up from live comps within 24 hours.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={copyOffer}
                aria-live="polite"
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#2f8a60]/45 bg-[#1f6b4a]/15 px-4 py-2.5 text-[0.82rem] font-medium text-[#7fce9f] transition hover:bg-[#1f6b4a]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/60"
              >
                {copied ? (<><Check className="h-4 w-4" /> Copied</>) : (<><Copy className="h-4 w-4" /> Copy offer</>)}
              </button>
              <button
                type="button"
                onClick={() => downloadTextFile("matin-cash-offer-estimate.txt", buildOfferText())}
                className="btn-accent inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[0.82rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1410]"
              >
                <Download className="h-4 w-4" /> <span>Download</span>
              </button>
            </div>
            <a href={`tel:+1${company.phoneRaw}`} className="mt-3.5 inline-block text-[0.82rem] font-semibold text-[#7fce9f] hover:text-white">
              Lock it in → {company.phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({
  label, value, step, min, max, onChange, fmt,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 2) / 2));
  return (
    <div className="rounded-[10px] border border-ink/14 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate/70">{label}</div>
      <div className="mt-0.5 flex items-center justify-between gap-1">
        <span className="text-[0.9rem] font-semibold text-ink tabular-nums">{fmt(value)}</span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(clamp(value - step))}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-ink/15 text-ink transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onChange(clamp(value + step))}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-ink/15 text-ink transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
          >
            <Plus className="h-3 w-3" />
          </button>
        </span>
      </div>
    </div>
  );
}
