"use client";

import { BrandedDocument } from "@/components/os";
import { roles, getAgent, company } from "@/lib/data";
import type {
  CompanyScorecard,
  ReportAgentLeaderboardRow,
  ReportSourceRoi,
} from "@/lib/types";
import { compactUsd, num } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — ReportExport  (S10 ticket 4, branded export via G-B)

   "Export report" produces a REAL Matin-letterhead PDF through the shared
   BrandedDocument `report` variant: wordmark + West Linn office line + phone
   (the letterhead handles this), the date-range / team / source scope as the
   field grid, then a scorecard summary + agent leaderboard + source-ROI table
   in the body, with a principal-broker signature block. The BrandedDocument's
   own `@media print` stylesheet makes the Download/Print action emit only this
   branded artifact. All values resolve from the live scoped data passed in.
   ────────────────────────────────────────────────────────────────────────── */

const GCI_BASIS = 0.025;
function displaySource(s: string): string {
  return /facebook/i.test(s) ? "Meta" : s;
}
function roiLabel(s: ReportSourceRoi): string {
  if (s.spend === 0) return "∞";
  return `${num(Math.round(((s.revenue * GCI_BASIS) / s.spend) * 100))}%`;
}

export function ReportExport({
  rangeLabel,
  team,
  source,
  scorecard,
  leaderboard,
  sourceRoi,
}: {
  rangeLabel: string;
  team: string;
  source: string;
  scorecard: CompanyScorecard;
  leaderboard: ReportAgentLeaderboardRow[];
  sourceRoi: ReportSourceRoi[];
}) {
  const broker = getAgent(roles.principalBroker);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalGci = leaderboard.reduce((s, a) => s + a.gci, 0);
  const totalSigned = leaderboard.reduce((s, a) => s + a.signed, 0);

  return (
    <BrandedDocument
      variant="report"
      title="Brokerage Accountability Report"
      recipient={`Leadership · ${team}`}
      formId="MATIN-RPT"
      page={1}
      pages={1}
      agent={{
        name: broker?.name ?? "Jordan Matin",
        title: broker?.title ?? "Principal Broker",
        phone: broker?.phone ?? company.phone,
        email: broker?.email ?? company.email,
        slug: roles.principalBroker,
        photo: broker?.photo,
      }}
      fields={[
        { label: "Reporting period", value: rangeLabel },
        { label: "Team / office", value: team },
        { label: "Lead source scope", value: source },
        { label: "Generated", value: today },
      ]}
      body={
        <div className="space-y-5">
          {/* Scorecard summary */}
          <section>
            <p className="eyebrow mb-2 text-slate">Company scorecard</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { k: "Volume", v: compactUsd(scorecard.annualVolume) },
                { k: "Closings", v: num(scorecard.propertiesSold) },
                { k: "GCI", v: compactUsd(scorecard.gci) },
                { k: "Avg price", v: compactUsd(scorecard.avgSalePrice) },
              ].map((c) => (
                <div key={c.k} className="rounded-md border border-mist bg-paper-200/40 px-3 py-2">
                  <p className="text-[0.62rem] uppercase tracking-[0.12em] text-slate">{c.k}</p>
                  <p className="mt-0.5 text-[0.92rem] font-bold tabular-nums text-ink">{c.v}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Leaderboard table */}
          <section>
            <p className="eyebrow mb-2 text-slate">
              Agent leaderboard · {num(totalSigned)} signed · {compactUsd(totalGci)} GCI
            </p>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-mist">
                  <th className="py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Agent</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Leads</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Appts</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Signed</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">GCI</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((a) => (
                  <tr key={a.slug} className="border-b border-mist/60">
                    <td className="py-1.5 text-[0.78rem] font-medium text-ink">{a.agent}</td>
                    <td className="py-1.5 text-right text-[0.78rem] tabular-nums text-ink">{num(a.leads)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] tabular-nums text-ink">{num(a.appts)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] tabular-nums text-ink">{num(a.signed)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] font-semibold tabular-nums text-ink">{compactUsd(a.gci)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Source ROI table */}
          <section>
            <p className="eyebrow mb-2 text-slate">Marketing ROI by lead source</p>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-mist">
                  <th className="py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Source</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Leads</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">ROI</th>
                  <th className="py-1.5 text-right text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-slate">Cost / lead</th>
                </tr>
              </thead>
              <tbody>
                {sourceRoi.map((s) => (
                  <tr key={s.source} className="border-b border-mist/60">
                    <td className="py-1.5 text-[0.78rem] font-medium text-ink">{displaySource(s.source)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] tabular-nums text-ink">{num(s.leads)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] font-semibold tabular-nums text-success">{roiLabel(s)}</td>
                    <td className="py-1.5 text-right text-[0.78rem] font-semibold tabular-nums text-danger">
                      {s.cpl === 0 ? "$0" : `$${num(s.cpl)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <p className="text-[0.68rem] leading-snug text-slate">
            Figures are scoped to the reporting period and team/source filters above and reconcile to
            the brokerage&rsquo;s metrics, listings, and transaction records. Prepared by{" "}
            {company.name} for internal accountability review.
          </p>
        </div>
      }
    />
  );
}
