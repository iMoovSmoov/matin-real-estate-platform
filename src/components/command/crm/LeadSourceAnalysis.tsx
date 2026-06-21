import type { Lead } from "@/lib/types";
import { leadSourceAnalysis } from "./leadView";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads Workbench — "Lead source analysis" mini-chart

   Compact horizontal-bar breakdown of leads grouped by source, with a hot
   overlay (score ≥ 80). Light card, hairline rows, tabular numbers. Each row
   is a real provenance count; no decorative chart-for-vibes. The header count
   reconciles to the table (sum of bar values = total leads).
   ────────────────────────────────────────────────────────────────────────── */

export function LeadSourceAnalysis({ leads }: { leads: Lead[] }) {
  const rows = leadSourceAnalysis(leads);
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = leads.length;

  return (
    <div className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Lead source analysis
        </h3>
        <span className="text-[0.74rem] text-slate tabular-nums">
          {total} leads · {rows.length} sources
        </span>
      </div>
      <p className="mt-0.5 text-[0.74rem] text-slate">
        Volume by channel; the gold segment is hot leads (score ≥ 80).
      </p>

      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => {
          const pct = Math.round((r.count / max) * 100);
          const hotPct = r.count ? Math.round((r.hot / r.count) * 100) : 0;
          return (
            <li key={r.source} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
              <span className="truncate text-[0.78rem] font-medium text-ink" title={r.source}>
                {r.source}
              </span>
              <span className="relative h-3.5 overflow-hidden rounded-full bg-paper-200">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-ink/70"
                  style={{ width: `${pct}%` }}
                />
                {r.hot > 0 ? (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gold-bright"
                    style={{ width: `${Math.round((r.hot / max) * 100)}%` }}
                  />
                ) : null}
              </span>
              <span className="flex items-center gap-2 text-[0.76rem] tabular-nums">
                <span className="font-semibold text-ink">{r.count}</span>
                {r.hot > 0 ? (
                  <span className="text-gold-ink">
                    {r.hot} hot · {hotPct}%
                  </span>
                ) : (
                  <span className="text-slate/60">—</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
