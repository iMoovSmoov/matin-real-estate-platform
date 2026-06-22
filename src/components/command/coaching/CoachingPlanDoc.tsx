"use client";

import { BrandedDocument } from "@/components/os";
import { getAgent } from "@/lib/data";
import { roles } from "@/lib/data";
import {
  rubricRowsFor,
  COACHING_QUARTER,
  type CoachingStanding,
} from "./coachingData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching · branded coaching-plan document (S9 ticket 8)

   Renders the auto-created coaching plan as a real Matin-letterhead document
   via BrandedDocument: logo + agent + West Linn office + date + a structured
   field grid + a manager sign-off line. Printable/downloadable like every other
   client-/staff-facing artifact in MatinOS.
   ────────────────────────────────────────────────────────────────────────── */

const fmtDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function CoachingPlanDoc({
  standing,
  /** Optional AI-streamed plan body; falls back to a grounded static plan. */
  planText,
}: {
  standing: CoachingStanding;
  planText?: string;
}) {
  const agent = getAgent(standing.slug);
  const manager = getAgent(roles.principalBroker);
  const today = fmtDate.format(new Date());
  const rubric = rubricRowsFor(standing);

  const body = planText?.trim()
    ? planText
    : `Focus this ${COACHING_QUARTER} cycle on ${standing.weakest.toLowerCase()}, ${standing.name.split(" ")[0]}'s ` +
      `weakest rubric dimension (${rubricLowValue(standing)} / 100). Assigned: three practice calls on ${standing.weakest.toLowerCase()}, ` +
      `one recorded manager review, and a CRM task to call two active sellers today. ` +
      `Target: lift the ${standing.weakest.toLowerCase()} score above 75 and conversion above target by quarter end.`;

  return (
    <BrandedDocument
      variant="report"
      formId="COACH-PLAN"
      title={`Coaching Plan — ${standing.name}`}
      recipient={standing.name}
      completion={Math.round((standing.practiceSessions / standing.goal) * 100)}
      page={1}
      pages={1}
      agent={
        manager
          ? {
              name: manager.name,
              title: manager.title,
              license: manager.licenseNumbers?.OR ?? undefined,
              phone: manager.phone,
              email: manager.email,
              slug: manager.slug,
              photo: manager.photo,
            }
          : undefined
      }
      fields={[
        { label: "Agent", value: `${standing.name} · ${standing.title}` },
        { label: "Quarter", value: COACHING_QUARTER },
        { label: "Prepared", value: today },
        { label: "Practice sessions", value: `${standing.practiceSessions} of ${standing.goal}` },
        { label: "Average scorecard", value: `${standing.avgScore} / 100` },
        { label: "Conversion rate", value: `${standing.conversionPct.toFixed(1)}%` },
        { label: "Closings (qtr)", value: standing.closingsQtr },
        { label: "Focus skill", value: standing.weakest },
      ]}
      body={
        <div className="space-y-4">
          <p className="text-[0.84rem] leading-relaxed text-ink/90">{body}</p>

          <div>
            <p className="eyebrow text-slate">Skill rubric ({COACHING_QUARTER})</p>
            <ul className="mt-2 space-y-1.5">
              {rubric.map((r) => (
                <li
                  key={r.label}
                  className="flex items-center justify-between gap-3 text-[0.82rem]"
                >
                  <span className="text-ink/80">{r.label}</span>
                  <span className="font-semibold tabular-nums text-ink">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-mist bg-paper-200/40 px-3.5 py-3">
            <p className="text-[0.78rem] leading-relaxed text-ink/80">
              Manager sign-off:{" "}
              <span className="font-semibold text-ink">
                {manager?.name ?? "Principal Broker"}
              </span>{" "}
              · {manager?.title ?? "Principal Broker"} · reviewed {today}
            </p>
          </div>
        </div>
      }
    />
  );

  function rubricLowValue(s: CoachingStanding): number {
    const rows = rubricRowsFor(s);
    const match = rows.find((r) => r.label === s.weakest);
    return match?.value ?? s.avgScore;
  }
}
