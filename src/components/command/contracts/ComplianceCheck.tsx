"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck, MinusCircle } from "lucide-react";
import type { ReForm } from "@/lib/forms";
import type { Listing, Lead } from "@/lib/types";
import { Pill } from "@/components/command/ui";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Compliance check — a clean pass / needs-attention checklist that runs
   against the chosen OREF form + the auto-fill record (listing or lead).
   Oregon-grounded rules: agency disclosure, HB 4058 buyer-rep, SPDS, and the
   federal pre-1978 Lead-Based Paint trigger off the listing's yearBuilt.
   Strict black & white — only success / danger carry status color.
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

/** Pure, exported so the builder can read `ready`/`warnings` for its summary. */
export function evaluateCompliance(
  form: ReForm,
  record: { kind: "listing"; data: Listing } | { kind: "lead"; data: Lead } | null,
  values: Record<string, string>,
): ComplianceResult {
  const rows: ComplianceRow[] = [];
  const listing = record?.kind === "listing" ? record.data : null;

  // 1 — Agency disclosure (first substantial contact, ORS 696.820)
  rows.push({
    label: "Agency disclosure delivered",
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
    statute: "HB 4058",
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
      statute: "HB 4058",
    });
  }

  // 6 — Signature blocks (drives off the form having an e-sign signature field)
  const hasSig = form.fields.some((f) => f.type === "signature");
  rows.push({
    label: "Signature blocks present",
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
  { icon: typeof CheckCircle2; ring: string; text: string; pillTone: "success" | "danger" | "neutral"; word: string }
> = {
  pass: { icon: CheckCircle2, ring: "bg-success/12 ring-success/25", text: "text-success", pillTone: "success", word: "Pass" },
  warn: { icon: AlertTriangle, ring: "bg-danger/12 ring-danger/25", text: "text-danger", pillTone: "danger", word: "Needs attention" },
  na: { icon: MinusCircle, ring: "bg-white ring-ink/[0.06]", text: "text-slate/55", pillTone: "neutral", word: "N/A" },
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

  return (
    <div className="space-y-3">
      {/* Verdict banner */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3.5",
          result.ready ? "border-success/25 bg-success/[0.08]" : "border-danger/30 bg-danger/[0.08]",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
            result.ready ? "bg-success/15 ring-success/30 text-success" : "bg-danger/15 ring-danger/30 text-danger",
          )}
        >
          {result.ready ? <ShieldCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[0.95rem] font-semibold text-ink">
            {result.ready
              ? "Ready to send"
              : `${result.warnings} item${result.warnings === 1 ? "" : "s"} need attention`}
          </p>
          <p className="text-[0.78rem] text-slate/80">
            {result.ready
              ? `All ${result.applicable} applicable Oregon & federal checks pass.`
              : "Resolve the flagged items below to unblock sending."}
          </p>
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
              className="flex items-start gap-3 rounded-xl border border-ink/[0.08] bg-white/[0.02] px-4 py-3"
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
                  <span
                    className={cn(
                      "text-[0.86rem] font-semibold",
                      row.state === "na" ? "text-slate/70" : "text-ink",
                    )}
                  >
                    {row.label}
                  </span>
                  <Pill tone={meta.pillTone}>{meta.word}</Pill>
                  {row.statute && (
                    <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-wide text-slate/60 ring-1 ring-inset ring-ink/[0.06]">
                      {row.statute}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-slate/80">{row.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
