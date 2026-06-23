"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function CashFaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="mx-auto mt-10 max-w-3xl divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-soft">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-q-${i}`;
        const panelId = `${baseId}-a-${i}`;
        return (
          <div key={f.q}>
            <button
              id={btnId}
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium text-ink transition-colors hover:bg-gold-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/50"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span>{f.q}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-gold transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {/* Smooth height reveal via grid-rows (no JS measurement); collapses
                instantly under prefers-reduced-motion. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0">
                <p className="px-6 pb-5 text-[0.92rem] leading-relaxed text-slate">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
