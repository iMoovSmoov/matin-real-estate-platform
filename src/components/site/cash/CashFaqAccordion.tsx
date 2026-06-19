"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type FaqItem = { q: string; a: string };

export function CashFaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="mx-auto mt-10 max-w-3xl divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
      {faqs.map((f, i) => (
        <div key={f.q} className="bg-ink-900/60">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium text-white transition-colors hover:bg-white/[0.04]"
            aria-expanded={open === i}
          >
            <span>{f.q}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-emerald-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-[0.92rem] leading-relaxed text-slate-300">{f.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
