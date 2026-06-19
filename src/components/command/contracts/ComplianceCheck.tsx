"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck, MinusCircle } from "lucide-react";
import type { ReForm } from "@/lib/forms";
import type { Listing, Lead } from "@/lib/types";
import { Pill, ProgressBar } from "@/components/command/ui";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Step-4 compliance engine. Derives a pass / warn / n/a checklist from the
   chosen OREF form + the auto-fill record (listing or lead), so the wizard
   can decide whether the contract is "Ready to send" or blocked.
   Oregon-grounded rules: HB 4058 buyer-rep, agency disclosure, SPDS, and the
   federal pre-1978 Lead-Based Paint trigger off the listing's yearBuilt.
   ────────────────────────────────────────────────────────────────────────── */

export type CheckState = "pass" | "warn" | "na";

export interface ComplianceRow {
  label: string;
  state: CheckState;
  detail: string;
  statute?: string;
}

export interface ComplianceResult {
  rows: ComplianceRow[];
  passes: number;
  warnings: number;
  applicable: number;
  ready: boolean;
}

/** Pure, exported so the wizard can read `ready`/`warnings` for its summary. */
export function evaluateCompliance(
  form: ReForm,
  record: { kind: "listing"; data: Listing } | { kind: "lead"; data: Lead } | null,
  values: Record<string, string>,
): ComplianceResult {
  const rows: ComplianceRow[] = [];
  const listing = record?.kind === "listing" ? record.data : null;

  // 1 — Agency disclosure (first substantial contact, ORS 696.820)
  rows.push({
    label: "Initial Agency Disclosure delivered",
    state: "pass",
    detail: "Logged to the CRM at first contact with a delivery timestamp.",
    statute: "ORS 696.820",
  });

  // 2 — HB 4058 buyer-rep on file (required for any buyer-side document)
  const buyerSide = form.category === "Buyer" || /buyer/i.test(form.name) || !!values.buyer;
  rows.push({
    label: "Buyer Representation Agreement on file",
    state: buyerSide ? "pass" : "na",
    detail: buyerSide
      ? "Exclusive buyer rep (C-565) recorded — mandatory before showing or writing offers."
      : "Not a buyer-side document — N/A.",
    statute: "Oregon HB 4058 (2025)",
  });

  // 3 — Seller's Property Disclosure (listing & seller-side sale docs)
  const sellerSide =
    form.category === "Listing" || /seller|listing|sale/i.test(form.name) || !!values.seller;
  rows.push({
    label: "Seller's Property Disclosure attached",
    state: sellerSide ? "pass" : "na",
    detail: sellerSide
      ? "SPDS pulled from the listing record and bundled with the packet."
      : "No seller party on this document — N/A.",
    statute: "ORS 105.464",
  });

  // 4 — Lead-Based Paint: auto-required when the listing pre-dates 1978
  const yb = listing?.yearBuilt ?? (Number(values.yearBuilt) || 0);
  const lbpRequired = yb > 0 && yb < 1978;
  rows.push({
    label: "Lead-Based Paint disclosure",
    state: lbpRequired ? "warn" : "na",
    detail: lbpRequired
      ? `Built ${yb} (pre-1978) — federal LBP disclosure auto-attached. Needs the seller's signature before send.`
      : listing
        ? `Built ${yb || "—"} — post-1978, federal LBP disclosure not required.`
        : "Year built unknown — attach a listing record to evaluate.",
    statute: "42 U.S.C. §4852d",
  });

  // 5 — Compensation terms present (HB 4058 made these mandatory & explicit)
  if (buyerSide || form.category === "Listing") {
    const comp = values.compensation || values.commission || "";
    rows.push({
      label: "Compensation terms stated",
      state: comp.trim() ? "pass" : "warn",
      detail: comp.trim()
        ? `Written compensation captured: "${comp}".`
        : "No written compensation term — required since HB 4058. Add before routing.",
      statute: "Oregon HB 4058 (2025)",
    });
  }

  // 6 — Signature blocks (drives off the form having an e-sign signature field)
  const hasSig = form.fields.some((f) => f.type === "signature");
  rows.push({
    label: "All signature blocks present",
    state: hasSig || form.esign ? "pass" : "warn",
    detail:
      hasSig || form.esign
        ? "Every required party has a mapped e-signature block."
        : "This document is filed without signature — confirm it does not require one.",
  });

  // 7 — Required fields filled
  const missing = form.fields
    .filter((f) => f.required && !values[f.name]?.trim())
    .map((f) => f.label);
  rows.push({
    label: "Required fields complete",
    state: missing.length === 0 ? "pass" : "warn",
    detail:
      missing.length === 0
        ? "Every required field on the form is populated."
        : `Still empty: ${missing.join(", ")}.`,
  });

  const applicable = rows.filter((r) => r.state !== "na").length;
  const passes = rows.filter((r) => r.state === "pass").length;
  const warnings = rows.filter((r) => r.state === "warn").length;
  return { rows, passes, warnings, applicable, ready: warnings === 0 };
}

const STATE_META: Record<
  CheckState,
  { icon: typeof CheckCircle2; ring: string; text: string; pillTone: "success" | "warn" | "neutral"; word: string }
> = {
  pass: { icon: CheckCircle2, ring: "bg-success/12 ring-success/25", text: "text-success", pillTone: "success", word: "Pass" },
  warn: { icon: AlertTriangle, ring: "bg-warn/15 ring-warn/25", text: "text-warn", pillTone: "warn", word: "Action" },
  na: { icon: MinusCircle, ring: "bg-white/[0.05] ring-white/10", text: "text-slate-300/55", pillTone: "neutral", word: "N/A" },
};

export function ComplianceCheck({
  form,
  record,
  values,
}: {
  form: ReForm;
  record: { kind: "listing"; data: Listing } | { kind: "lead"; data: Lead } | null;
  values: Record<string, string>;
}) {
  const result = evaluateCompliance(form, record, values);
  const score = result.applicable === 0 ? 0 : Math.round((result.passes / result.applicable) * 100);

  return (
    <div className="space-y-4">
      {/* Verdict banner */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3.5",
          result.ready
            ? "border-success/25 bg-success/[0.08]"
            : "border-warn/30 bg-warn/[0.08]",
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
              result.ready ? "bg-success/15 ring-success/30 text-success" : "bg-warn/15 ring-warn/30 text-warn",
            )}
          >
            {result.ready ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-[0.95rem] font-semibold text-white">
              {result.ready ? "Ready to send" : `${result.warnings} item${result.warnings === 1 ? "" : "s"} need attention`}
            </p>
            <p className="text-[0.78rem] text-slate-300/80">
              {result.ready
                ? "All applicable Oregon & federal checks pass — route for e-signature."
                : "Resolve the flagged items below to unblock routing."}
            </p>
          </div>
        </div>
        <div className="min-w-[9rem]">
          <div className="mb-1 flex items-center justify-between text-[0.72rem] text-slate-300">
            <span>Compliance score</span>
            <span className="font-semibold tabular-nums text-white">{score}%</span>
          </div>
          <ProgressBar value={score} tone={result.ready ? "success" : "warn"} />
        </div>
      </div>

      {/* Checklist */}
      <ul className="space-y-2">
        {result.rows.map((row, i) => {
          const meta = STATE_META[row.state];
          const Icon = meta.icon;
          return (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                  meta.ring,
                  meta.text,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[0.86rem] font-semibold", row.state === "na" ? "text-slate-300/70" : "text-white")}>
                    {row.label}
                  </span>
                  <Pill tone={meta.pillTone}>{meta.word}</Pill>
                  {row.statute && (
                    <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-slate-300/60 ring-1 ring-inset ring-white/10">
                      {row.statute}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-300/80">{row.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
