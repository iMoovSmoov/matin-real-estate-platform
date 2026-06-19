"use client";

import { useState } from "react";
import { Sparkles, Home, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/site/marketing/AiMarkdown";

type FormState = {
  address: string;
  city: string;
  beds: string;
  baths: string;
  sqft: string;
  yearBuilt: string;
  target: string;
};

const EMPTY: FormState = {
  address: "",
  city: "",
  beds: "3",
  baths: "2",
  sqft: "1850",
  yearBuilt: "1998",
  target: "",
};

const field =
  "h-11 w-full rounded-xl border border-ink/15 bg-cloud px-3.5 text-[0.92rem] text-ink placeholder:text-slate/70 transition focus:border-azure focus:outline-none focus:ring-2 focus:ring-azure/25";
const label = "mb-1.5 block text-[0.78rem] font-semibold uppercase tracking-wide text-slate";

export function InstantValue() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setDone(false);
    setOutput("");
    await streamAi(
      {
        tool: "cma",
        input: {
          address: form.address || "Subject property",
          city: form.city,
          beds: form.beds,
          baths: form.baths,
          sqft: form.sqft,
          yearBuilt: form.yearBuilt,
          notes: "Owner-reported condition; standard finishes unless noted.",
          target: form.target,
        },
      },
      (_chunk, full) => setOutput(full),
    );
    setLoading(false);
    setDone(true);
  }

  function reset() {
    setForm(EMPTY);
    setOutput("");
    setDone(false);
  }

  const showPanel = loading || output.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
      {/* ----- form ----- */}
      <form
        onSubmit={onSubmit}
        className="rounded-3xl bg-cloud p-7 shadow-lift ring-1 ring-ink/[0.06] md:p-8"
      >
        <div className="flex items-center gap-2 text-azure">
          <Sparkles className="h-5 w-5" />
          <span className="eyebrow text-azure">Instant home value · AI</span>
        </div>
        <h3 className="mt-3 font-display text-2xl text-ink">Tell us about your home</h3>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-slate">
          Our market analyst drafts a real pricing opinion in seconds — no phone call, no obligation.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className={label} htmlFor="iv-address">
              Street address
            </label>
            <input
              id="iv-address"
              className={field}
              placeholder="18825 Willamette Dr"
              value={form.address}
              onChange={set("address")}
            />
          </div>
          <div>
            <label className={label} htmlFor="iv-city">
              City
            </label>
            <input
              id="iv-city"
              className={field}
              placeholder="West Linn, OR"
              value={form.city}
              onChange={set("city")}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label} htmlFor="iv-beds">
                Beds
              </label>
              <input id="iv-beds" className={field} inputMode="numeric" value={form.beds} onChange={set("beds")} />
            </div>
            <div>
              <label className={label} htmlFor="iv-baths">
                Baths
              </label>
              <input id="iv-baths" className={field} inputMode="decimal" value={form.baths} onChange={set("baths")} />
            </div>
            <div>
              <label className={label} htmlFor="iv-sqft">
                Sq ft
              </label>
              <input id="iv-sqft" className={field} inputMode="numeric" value={form.sqft} onChange={set("sqft")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} htmlFor="iv-year">
                Year built
              </label>
              <input id="iv-year" className={field} inputMode="numeric" value={form.yearBuilt} onChange={set("yearBuilt")} />
            </div>
            <div>
              <label className={label} htmlFor="iv-target">
                Target price <span className="font-normal normal-case text-slate/70">(optional)</span>
              </label>
              <input id="iv-target" className={field} placeholder="$750,000" value={form.target} onChange={set("target")} />
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Home className="h-4 w-4" /> Get my value
              </>
            )}
          </Button>
          {done && (
            <Button type="button" variant="ghost" size="lg" onClick={reset}>
              Start over
            </Button>
          )}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-slate">
          <ShieldCheck className="h-4 w-4 text-azure" />
          No obligation. We never sell your information.
        </p>
      </form>

      {/* ----- result panel ----- */}
      <div className="relative flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-ink-700 p-1 shadow-lift">
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative flex flex-1 flex-col rounded-[1.35rem] bg-cloud p-7 md:p-8">
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.07] pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-azure/10 text-azure">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <div>
                <div className="text-[0.92rem] font-semibold text-ink">Matin Market Analyst</div>
                <div className="text-[0.74rem] text-slate">Powered by live AI</div>
              </div>
            </div>
            {loading && (
              <span className="flex items-center gap-1.5 text-[0.78rem] font-medium text-azure">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing…
              </span>
            )}
          </div>

          <div className="mt-5 flex-1">
            {!showPanel && (
              <div className="flex h-full min-h-[18rem] flex-col items-center justify-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-azure/10 text-azure">
                  <Home className="h-7 w-7" />
                </div>
                <p className="mt-5 max-w-xs text-[0.95rem] leading-relaxed text-slate">
                  Fill in a few details and your personalized pricing opinion will appear here, written
                  line by line in real time.
                </p>
              </div>
            )}

            {showPanel && (
              <div className="min-h-[18rem]">
                <AiMarkdown text={output} />
                {loading && (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-azure align-middle" />
                )}
              </div>
            )}
          </div>

          {done && (
            <div className="mt-6 rounded-2xl bg-paper p-5 ring-1 ring-ink/[0.06]">
              <p className="text-[0.9rem] leading-relaxed text-ink/80">
                Want the comp-by-comp version? A Matin broker will hand-build your full CMA and walk the
                pricing strategy with you.
              </p>
              <ButtonLink href="/contact" variant="primary" className="mt-4">
                Get my full market analysis <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
