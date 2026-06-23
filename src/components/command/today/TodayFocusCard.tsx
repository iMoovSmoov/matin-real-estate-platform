"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { Avatar, useAiSidecar } from "@/components/os";
import { sellerLeads, getAgent } from "@/lib/data";

/* ──────────────────────────────────────────────────────────────────────────
   Today — AI "today's focus" insight card (§5)

   One dark, green-edged .surface-ai card with the Matin mark, surfacing the
   single NEXT-BEST lead: the highest seller-intent record in the book (derived
   from seller-leads, sorted by sellerScore). Score, owner, city, timeline, and
   the real intent signals are all data-bound. The accent green is sanctioned
   here (an AI affordance + an intent score). Primary action asks Matin AI to
   prep the call; secondary opens the seller's record.
   ────────────────────────────────────────────────────────────────────────── */

export function TodayFocusCard() {
  const { openAi } = useAiSidecar();

  // Highest-intent seller = the single next-best lead to work right now.
  const lead = [...sellerLeads].sort((a, b) => (b.sellerScore ?? 0) - (a.sellerScore ?? 0))[0];
  if (!lead) return null;

  const agent = getAgent(lead.assignedAgent);
  const signals = (lead.signals ?? []).slice(0, 2);

  return (
    <section className="surface-ai accent-edge relative overflow-hidden rounded-2xl p-5 text-slate-300">
      <span aria-hidden className="ai-bloom -right-16 -top-16" />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-inset ring-gold/30">
            <MatinMark theme="white" className="h-3.5 w-3.5" />
          </span>
          <h3 className="font-display text-[1.02rem] font-normal leading-tight text-cloud">
            Today&rsquo;s focus
          </h3>
        </div>
        <p className="mt-1.5 text-[0.8rem] leading-snug text-slate-300/80">
          Your highest-intent seller right now — work this one first.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Avatar
            name={agent?.name ?? lead.sellerName}
            slug={lead.assignedAgent}
            size={40}
            ring
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.92rem] font-semibold text-cloud">{lead.sellerName}</p>
            <p className="truncate text-[0.76rem] text-slate-300/80">
              {lead.city} · {lead.timeline}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-sans text-[1.6rem] font-bold leading-none text-gold-bright tabular-nums">
              {lead.sellerScore}
            </p>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-300/70">
              intent
            </p>
          </div>
        </div>

        {signals.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <li
                key={s}
                className="rounded-full bg-ink-800 px-2.5 py-1 text-[0.7rem] font-medium text-slate-300 ring-1 ring-inset ring-ink-700"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() =>
              openAi(`Working on: Today / next-best lead — ${lead.sellerName} (seller-intent ${lead.sellerScore})`)
            }
            className="btn-accent inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            <MatinMark theme="white" className="h-3.5 w-3.5" />
            <span>Ask AI to prep the call</span>
          </button>
          <Link
            href="/hub/cash-offer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[0.8rem] font-semibold text-slate-300 ring-1 ring-inset ring-ink-700 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            Open record
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
