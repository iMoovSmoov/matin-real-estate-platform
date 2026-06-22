"use client";

import { Users } from "lucide-react";
import { num } from "@/lib/utils";
import { audienceComposition } from "./marketing-branding";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — AudiencePanel  (S8 ticket 10, real audience binding)

   Ties the studio's audience to REAL CRM rows: the segment-composition list is
   computed from the actual leads + seller-leads counts by recorded source
   (audienceComposition()), so "who this campaign can reach" is a real segment,
   not a literal. "Facebook Ad" is normalized to "Meta" upstream. Each row shows
   the source + count + a proportion bar. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export function AudiencePanel() {
  const { segments, total } = audienceComposition();
  const max = Math.max(1, ...segments.map((s) => s.count));

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-paper-200 text-slate ring-1 ring-inset ring-mist">
            <Users className="h-3.5 w-3.5" aria-hidden />
          </span>
          <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
            Audience composition
          </h2>
        </div>
        <span className="tabular-nums text-[0.72rem] text-slate">
          {num(total)} contacts
        </span>
      </div>
      <p className="text-[0.72rem] leading-snug text-slate">
        Live CRM segments by lead source — campaign reach is drawn from these real
        records, not a fixed number.
      </p>

      <ul className="flex flex-col gap-2">
        {segments.map((s) => {
          const pct = Math.max(4, Math.round((s.count / max) * 100));
          return (
            <li key={s.source} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-[0.78rem] font-medium text-ink">
                {s.source}
              </span>
              <span className="block h-2 flex-1 overflow-hidden rounded-full bg-paper-200">
                <span
                  className="block h-full rounded-full bg-ink/80"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-[0.76rem] font-semibold tabular-nums text-ink">
                {num(s.count)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
