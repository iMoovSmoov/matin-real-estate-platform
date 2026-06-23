"use client";

import Link from "next/link";
import { Medal, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/os";
import { reportMetrics, getAgent } from "@/lib/data";
import { compactUsd, num, cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Today — Agent leaderboard (§4)

   Ranked rows from reportMetrics.agentLeaderboard (the weekly board, pre-sorted
   by production). Each row resolves its real headshot + weekly scorecard by
   slug. Columns Leads / Appts / Signed / GCI are real; the thin per-agent bar
   is the agent's weekly activity (scorecardWeek call/text/appt/showing/offer/
   agreement volume) relative to the team's busiest week — an honest ratio, not
   a fabricated trend. #1 carries the LONE green medal (the rationed accent);
   every other rank is neutral. Phone shows the top 3 + "View all".
   ────────────────────────────────────────────────────────────────────────── */

function weeklyActivity(slug: string): number {
  const w = getAgent(slug)?.scorecardWeek;
  if (!w) return 0;
  return w.calls + w.texts + w.appts + w.showings + w.offers + w.agreements;
}

const BOARD = reportMetrics.agentLeaderboard;
const MAX_ACTIVITY = Math.max(1, ...BOARD.map((r) => weeklyActivity(r.slug)));

function Stat({
  label,
  value,
  className,
  strong,
}: {
  label: string;
  value: string;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={cn("text-right", className)}>
      <p
        className={cn(
          "text-[0.82rem] leading-none tabular-nums",
          strong ? "font-bold text-ink" : "font-semibold text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-slate">
        {label}
      </p>
    </div>
  );
}

export function AgentLeaderboard() {
  return (
    <section className="card-elevated p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
            Agent leaderboard
          </h3>
          <p className="mt-0.5 text-[0.78rem] text-slate">Team production this week</p>
        </div>
        <Link
          href="/hub/reporting"
          className="hidden shrink-0 items-center gap-1 text-[0.74rem] font-semibold text-slate transition-colors hover:text-ink sm:inline-flex"
        >
          Full report
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-mist">
        {BOARD.map((r, i) => {
          const rank = i + 1;
          const isTop = rank === 1;
          const agent = getAgent(r.slug);
          const pct = Math.max(0, Math.min(100, (weeklyActivity(r.slug) / MAX_ACTIVITY) * 100));
          return (
            <li
              key={r.slug}
              className={cn(
                "flex items-center gap-3 py-2.5",
                // Phone: only top 3; everyone shows from sm up.
                i >= 3 && "hidden sm:flex",
              )}
            >
              {/* Rank — #1 alone gets the green medal (accent ration) */}
              <span className="flex w-6 shrink-0 justify-center">
                {isTop ? (
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-cloud ring-1 ring-inset ring-gold/60"
                    title="Top producer"
                  >
                    <Medal className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : (
                  <span className="text-[0.82rem] font-semibold text-slate tabular-nums">{rank}</span>
                )}
              </span>

              <Avatar name={agent?.name ?? r.agent} slug={r.slug} size={32} ring />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.84rem] font-semibold leading-tight text-ink">
                  {r.agent}
                </p>
                {/* Weekly-activity bar — real scorecardWeek ratio vs busiest agent */}
                <span
                  className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-paper-200"
                  role="img"
                  aria-label={`Weekly activity ${Math.round(pct)}% of the team's busiest week`}
                >
                  <span
                    className={cn("block h-full rounded-full", isTop ? "bg-gold-bright" : "bg-ink/30")}
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </div>

              <Stat label="Leads" value={num(r.leads)} className="hidden w-12 lg:block" />
              <Stat label="Appts" value={num(r.appts)} className="hidden w-12 lg:block" />
              <Stat label="Signed" value={num(r.signed)} className="hidden w-12 sm:block" />
              <Stat label="GCI" value={compactUsd(r.gci)} className="w-16" strong />
            </li>
          );
        })}
      </ul>

      {/* Phone-only expander to the full board */}
      <Link
        href="/hub/reporting"
        className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-mist py-2 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-paper-200 sm:hidden"
      >
        View all {BOARD.length}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </section>
  );
}
