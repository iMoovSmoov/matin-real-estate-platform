"use client";

import { Phone, Mail, MessageSquare, CalendarCheck } from "lucide-react";
import { num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — ActivityGauges  (S10 ticket 8, hero activity card)

   3–4 circular donut gauges (Calls / Emails / Texts / Appts set) rendered as
   pure SVG rings (crisp, themable, no chart-lib hydration cost). Each gauge
   shows a value vs a target as an arc + the count in the center + a label.
   Gold is reserved for AI affordances, so the rings use ink/success/info — the
   value-vs-target relationship (on-pace = success, behind = warn) carries the
   status, not decoration.

   Values are passed in from the page (derived from the real scorecard +
   automation-impact rows), so the gauges reconcile to the same data the rest of
   the report uses. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type ActivityGauge = {
  key: string;
  label: string;
  value: number;
  target: number;
  kind: "calls" | "emails" | "texts" | "appts";
};

const ICONS = {
  calls: Phone,
  emails: Mail,
  texts: MessageSquare,
  appts: CalendarCheck,
} as const;

function Ring({ pct, tone }: { pct: number; tone: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90">
      <circle cx={36} cy={36} r={r} fill="none" stroke="var(--color-paper-200)" strokeWidth={7} />
      <circle
        cx={36}
        cy={36}
        r={r}
        fill="none"
        stroke={tone}
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
      />
    </svg>
  );
}

export function ActivityGauges({ gauges }: { gauges: ActivityGauge[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[1.05rem] font-normal leading-none text-ink">
          Team activity
        </h2>
        <span className="text-[0.72rem] font-medium text-slate">vs daily targets · this period</span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {gauges.map((g) => {
          const Icon = ICONS[g.kind];
          const pct = g.target ? Math.round((g.value / g.target) * 100) : 0;
          const onPace = pct >= 90;
          const tone = onPace ? "var(--color-success)" : pct >= 60 ? "var(--color-info)" : "var(--color-warn)";
          return (
            <div key={g.key} className="flex flex-col items-center gap-2 text-center">
              <div className="relative">
                <Ring pct={pct} tone={tone} />
                <span className="absolute inset-0 flex flex-col items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-slate" aria-hidden />
                  <span className="mt-0.5 text-[0.92rem] font-bold leading-none text-ink tabular-nums">
                    {num(g.value)}
                  </span>
                </span>
              </div>
              <div>
                <p className="text-[0.78rem] font-semibold leading-none text-ink">{g.label}</p>
                <p className="mt-1 text-[0.68rem] leading-none text-slate tabular-nums">
                  {pct}% of {num(g.target)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
