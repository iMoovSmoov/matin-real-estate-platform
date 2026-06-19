"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeCheck, Clock } from "lucide-react";

const fmt = (n: number) => "$" + Math.round(n).toLocaleString();

export function CashOfferEstimator() {
  const [value, setValue] = useState(650000);
  const [revealed, setRevealed] = useState(false);
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  const low = value * 0.9;
  const high = value * 0.94;

  function getOffer() {
    setRevealed(true);
    const start = performance.now();
    const from = 0;
    const to = high;
    const dur = 1100;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (to - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <div className="mx-auto grid max-w-4xl gap-6 rounded-3xl border border-white/10 bg-ink-900/80 p-6 shadow-lift backdrop-blur md:grid-cols-2 md:p-8">
      {/* Input */}
      <div className="flex flex-col justify-center">
        <label className="eyebrow-light">Estimate in seconds</label>
        <h3 className="mt-2 font-display text-2xl text-white">What&apos;s your home worth?</h3>
        <p className="mt-1 text-[0.9rem] text-slate-300">Drag to your home&apos;s rough value — we&apos;ll show your no-obligation cash range.</p>

        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.78rem] font-medium text-slate-300">Estimated value</span>
            <span className="font-display text-xl text-white">{fmt(value)}</span>
          </div>
          <input
            type="range"
            min={250000}
            max={2500000}
            step={10000}
            value={value}
            onChange={(e) => { setValue(Number(e.target.value)); setRevealed(false); }}
            className="mt-2 w-full accent-emerald-500"
          />
          <div className="mt-1 flex justify-between text-[0.66rem] text-slate-300/50">
            <span>$250k</span><span>$2.5M</span>
          </div>
        </div>

        <button
          onClick={getOffer}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-[0_10px_30px_rgba(16,122,80,.4)] transition hover:bg-emerald-500"
        >
          Get my cash offer <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Result */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-900/40 to-ink-900/40 p-6 text-center">
        {revealed ? (
          <>
            <span className="eyebrow-light text-emerald-300/80">Your cash offer range</span>
            <div className="mt-2 font-display text-4xl text-white tabular-nums [animation:countup-glow_2.4s_ease-in-out_infinite] md:text-5xl">
              {fmt(shown)}
            </div>
            <div className="mt-1 text-[0.86rem] text-slate-300">
              between <span className="font-semibold text-emerald-300">{fmt(low)}</span> and{" "}
              <span className="font-semibold text-emerald-300">{fmt(high)}</span>
            </div>
            <div className="mt-5 space-y-2 text-left text-[0.82rem] text-slate-300">
              <p className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-400" /> No repairs, no showings, no fees</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-emerald-400" /> Close in as little as 7 days</p>
            </div>
            <a href="tel:+15036229624" className="mt-5 text-[0.82rem] font-semibold text-emerald-300 hover:text-emerald-200">
              Lock it in → (503) 622-9624
            </a>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-300/70">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 font-display text-2xl text-emerald-300">$</span>
            <p className="mt-4 max-w-[16rem] text-[0.88rem]">Set your value and hit <span className="font-semibold text-white">Get my cash offer</span> to see your number.</p>
          </div>
        )}
      </div>
    </div>
  );
}
