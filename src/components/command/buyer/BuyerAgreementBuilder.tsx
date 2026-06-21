"use client";

import { useMemo, useState } from "react";
import {
  FileSignature,
  Send,
  Clock,
  CalendarClock,
  AlertCircle,
  ChevronRight,
  Save,
  Sparkles,
  Loader2,
  Database,
  ShieldCheck,
} from "lucide-react";
import {
  KpiStrip,
  KpiCard,
  StatusChip,
  Dot,
  CalloutCard,
  AIActionCard,
  AIInsightChip,
  DocumentPreview,
  EmptyState,
  useAiSidecar,
} from "@/components/os";
import { buyerAgreements } from "@/lib/data";
import type { BuyerAgreement } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd, initials } from "@/lib/utils";
import {
  IntakeField,
  intakeInputClass,
  intakeSelectClass,
} from "./IntakeField";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreement Builder  (ref §2.5, wireframe 08)

   Replaces Google Forms: a three-pane builder.
     • LEFT     — selectable list of buyer agreements (the records).
     • COL 1    — Structured intake form (label-above-field; every field maps to
                  a DB column). Generate packet (ink) + Save draft (light).
     • COL 2    — Live document preview (ruled lines + signature field).
     • COL 3    — Automation state (label + StatusChip rows) + AI surfaces.

   Oregon context: OREF Buyer Representation Agreement, form C-565 mandatory per
   HB 4058. AI drafts the agreement (agent reviews, not authors); validates
   broker rules; flags missing initials with location.
   ────────────────────────────────────────────────────────────────────────── */

type AgreementState = BuyerAgreement["agreementStatus"];

/* Representation period (in months) derived per record so Expiration reads real. */
function repMonths(timeline: BuyerAgreement["timeline"]): number {
  if (timeline === "Immediately") return 6;
  if (timeline === "1-3 months") return 6;
  return 12;
}

/* An expiration date string, computed from "now" + representation period. */
function expirationLabel(months: number): string {
  const d = new Date(2026, 5, 21); // build context date — stable across renders
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* Status → chip tone + label for the record list. */
function stateTone(s: AgreementState): { tone: "danger" | "warn" | "success"; label: string } {
  if (s === "Not Signed") return { tone: "danger", label: "Draft" };
  if (s === "Sent") return { tone: "warn", label: "Awaiting sig" };
  return { tone: "success", label: "Signed" };
}

/* ── Avatar token (compact) ──────────────────────────────────────────────── */
function Token({ name }: { name: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.62rem] font-semibold text-ink ring-1 ring-inset ring-mist">
      {initials(name)}
    </span>
  );
}

/* ── Document-preview status mapping ─────────────────────────────────────── */
function previewStatus(s: AgreementState): {
  status: string;
  tone: "success" | "warn" | "danger";
  missing?: string[];
} {
  if (s === "Signed") return { status: "Executed", tone: "success" };
  if (s === "Sent")
    return {
      status: "Out for signature",
      tone: "warn",
      missing: ["Buyer initials · page 2", "Buyer signature · page 4"],
    };
  return {
    status: "Draft",
    tone: "warn",
    missing: ["Agent license # · page 1", "Buyer initials · page 2"],
  };
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function BuyerAgreementBuilder() {
  const { openAi } = useAiSidecar();

  // Default-select the canonical first record (Reed) — storyline anchor.
  const [selectedId, setSelectedId] = useState<string>(buyerAgreements[0]?.id ?? "");
  const buyer = useMemo(
    () => buyerAgreements.find((b) => b.id === selectedId) ?? buyerAgreements[0],
    [selectedId],
  );

  // Generate-packet streaming state, keyed off the AI 'agreement' tool.
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [envelopeSent, setEnvelopeSent] = useState(false);

  // ── KPI rollups (reconcile to the records) ──────────────────────────────
  const kpis = useMemo(() => {
    const out = buyerAgreements.length;
    const awaiting = buyerAgreements.filter((b) => b.agreementStatus === "Sent").length;
    const signedThisWeek = buyerAgreements.filter(
      (b) => b.agreementStatus === "Signed" && b.lastContactDaysAgo <= 7,
    ).length;
    // "Expiring soon" — signed long ago (rep period winding down) OR stale draft.
    const expiringSoon = buyerAgreements.filter(
      (b) => b.lastContactDaysAgo >= 14,
    ).length;
    // Missing-field flags — drafts not signed + in-progress preapprovals on sent.
    const missingFlags =
      buyerAgreements.filter((b) => b.agreementStatus === "Not Signed").length +
      buyerAgreements.filter(
        (b) => b.agreementStatus === "Sent" && b.preapproval !== "Yes",
      ).length;
    return { out, awaiting, signedThisWeek, expiringSoon, missingFlags };
  }, []);

  if (!buyer) {
    return (
      <div className="px-4 py-8 md:px-6">
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No buyer agreements yet"
          body="Start a structured intake to generate an OREF buyer representation packet, run broker rules, and send for e-signature."
          actionLabel="Start intake"
          onAction={() => openAi(`Context: Buyer Agreements / new intake · OREF C-565`)}
        />
      </div>
    );
  }

  const months = repMonths(buyer.timeline);
  const expiration = expirationLabel(months);
  const pv = previewStatus(buyer.agreementStatus);
  const aiContext = `Context: Buyer Agreements / ${buyer.name} · OREF C-565`;

  async function handleGeneratePacket() {
    setGenerating(true);
    setDraft("");
    setSaved(false);
    await streamAi(
      {
        tool: "agreement",
        input: {
          form: "OREF Buyer Representation Agreement (C-565)",
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          agentName: buyer.agentName,
          brokerage: "Matin Real Estate",
          representationAreas: buyer.areas,
          budgetMin: buyer.budgetMin,
          budgetMax: buyer.budgetMax,
          representationMonths: months,
          expiration,
          preapproval: buyer.preapproval,
          timeline: buyer.timeline,
          notes: buyer.notes,
          state: "Oregon",
          mandate: "C-565 mandatory per HB 4058",
        },
      },
      (_chunk, full) => setDraft(full),
    );
    setGenerating(false);
  }

  // ── Automation-state rows (label + chip) ────────────────────────────────
  type AutoRow = {
    label: string;
    chip: string;
    tone: "success" | "info" | "warn";
    variant?: "soft" | "solid";
    meta?: string;
  };
  const draftReady = buyer.agreementStatus !== "Not Signed" || draft.length > 0;
  const autoRows: AutoRow[] = [
    {
      label: "Draft generated",
      chip: draftReady ? "Complete" : "Pending",
      tone: draftReady ? "success" : "warn",
      meta: "OREF C-565 packet built from intake",
    },
    {
      label: "Broker rules checked",
      chip: "Complete",
      tone: "success",
      meta: "12-month cap · 3% compensation · BIC review",
    },
    {
      label: "Missing initials",
      chip: pv.missing ? `${pv.missing.length} flagged` : "None",
      tone: pv.missing ? "warn" : "success",
      meta: pv.missing ? pv.missing[0] : "All required fields complete",
    },
    {
      label: "Send envelope",
      chip: envelopeSent ? "Sent" : "Ready",
      tone: "success",
      variant: envelopeSent ? "solid" : "soft",
      meta: envelopeSent
        ? `Delivered to ${buyer.email} via DocuSign`
        : "DocuSign · buyer + agent recipients",
    },
    {
      label: "CRM timeline",
      chip: "Will update",
      tone: "info",
      meta: "Writes activity_event on contact record",
    },
    {
      label: "Reminder schedule",
      chip: "3 days",
      tone: "info",
      meta: "Auto follow-up if unsigned",
    },
  ];

  return (
    <div className="px-4 py-5 md:px-6">
      {/* Subtitle / eyebrow under the TopCommandBar section name */}
      <p className="text-[0.82rem] leading-snug text-slate">
        Replace Google Forms: structured intake feeds templates, broker rules,
        e-signature, CRM timeline, reporting.
      </p>

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="mt-4">
        <KpiStrip>
          <KpiCard
            label="Agreements out"
            value={kpis.out}
            icon={<FileSignature className="h-4 w-4" />}
            hint="Active buyer representations"
            onDrill={() => openAi(aiContext)}
          />
          <KpiCard
            label="Awaiting signature"
            value={kpis.awaiting}
            valueTone={kpis.awaiting > 0 ? "danger" : "ink"}
            icon={<Clock className="h-4 w-4" />}
            hint="Sent · not yet executed"
            onDrill={() => openAi(aiContext)}
          />
          <KpiCard
            label="Signed this week"
            value={kpis.signedThisWeek}
            valueTone="success"
            icon={<FileSignature className="h-4 w-4" />}
            hint="Executed in last 7 days"
            onDrill={() => openAi(aiContext)}
          />
          <KpiCard
            label="Expiring soon"
            value={kpis.expiringSoon}
            valueTone={kpis.expiringSoon > 0 ? "danger" : "ink"}
            icon={<CalendarClock className="h-4 w-4" />}
            hint="Representation period winding down"
            onDrill={() => openAi(aiContext)}
          />
          <KpiCard
            label="Missing-field flags"
            value={kpis.missingFlags}
            valueTone={kpis.missingFlags > 0 ? "danger" : "ink"}
            icon={<AlertCircle className="h-4 w-4" />}
            hint="Cannot send until resolved"
            onDrill={() => openAi(aiContext)}
          />
        </KpiStrip>
      </div>

      {/* ── Builder grid: record list + 3 columns ─────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* LEFT — record list */}
        <aside className="rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center justify-between border-b border-mist px-4 py-3">
            <p className="eyebrow text-slate">Buyer agreements</p>
            <span className="text-[0.72rem] font-medium text-slate tabular-nums">
              {buyerAgreements.length}
            </span>
          </div>
          <ul className="max-h-[560px] overflow-y-auto">
            {buyerAgreements.map((b) => {
              const active = b.id === buyer.id;
              const st = stateTone(b.agreementStatus);
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(b.id);
                      setDraft("");
                      setSaved(false);
                      setEnvelopeSent(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 border-b border-mist px-3 py-2.5 text-left transition-colors last:border-0",
                      active ? "bg-paper-200" : "hover:bg-paper",
                    )}
                  >
                    <Token name={b.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-medium text-ink">
                        {b.name}
                      </span>
                      <span className="block truncate text-[0.72rem] text-slate">
                        {b.agentName}
                      </span>
                    </span>
                    <span className="shrink-0">
                      <StatusChip tone={st.tone}>
                        <Dot tone={st.tone} />
                        {st.label}
                      </StatusChip>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* RIGHT — three columns */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* COL 1 — Structured intake form */}
          <section className="rounded-2xl border border-mist bg-cloud shadow-soft">
            <div className="border-b border-mist px-5 py-4">
              <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
                Structured intake form
              </h2>
              <p className="mt-1 text-[0.76rem] leading-snug text-slate">
                Every field maps to a database column — no loose Google Form
                answers.
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <IntakeField label="Buyer" column="contacts.full_name">
                <input
                  className={intakeInputClass}
                  defaultValue={buyer.name}
                  key={`name-${buyer.id}`}
                />
              </IntakeField>

              <IntakeField label="Email" column="contacts.email">
                <input
                  className={intakeInputClass}
                  defaultValue={buyer.email}
                  key={`email-${buyer.id}`}
                />
              </IntakeField>

              <IntakeField label="Agent" column="agreement_answers.agent_slug">
                <input
                  className={intakeInputClass}
                  defaultValue={buyer.agentName}
                  key={`agent-${buyer.id}`}
                />
              </IntakeField>

              <IntakeField
                label="Representation area"
                column="agreement_answers.areas[]"
              >
                <input
                  className={intakeInputClass}
                  defaultValue={buyer.areas.join(", ")}
                  key={`areas-${buyer.id}`}
                />
              </IntakeField>

              <div className="grid grid-cols-2 gap-3">
                <IntakeField label="Budget min" column="agreement_answers.budget_min">
                  <input
                    className={intakeInputClass}
                    defaultValue={compactUsd(buyer.budgetMin)}
                    key={`bmin-${buyer.id}`}
                  />
                </IntakeField>
                <IntakeField label="Budget max" column="agreement_answers.budget_max">
                  <input
                    className={intakeInputClass}
                    defaultValue={compactUsd(buyer.budgetMax)}
                    key={`bmax-${buyer.id}`}
                  />
                </IntakeField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <IntakeField
                  label="Representation period"
                  column="agreement_answers.term_months"
                >
                  <select
                    className={intakeSelectClass}
                    defaultValue={String(months)}
                    key={`term-${buyer.id}`}
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months (max)</option>
                    <option value="3">3 months</option>
                  </select>
                </IntakeField>
                <IntakeField label="Expiration" column="buyer_agreements.expires_at">
                  <input
                    className={intakeInputClass}
                    defaultValue={expiration}
                    key={`exp-${buyer.id}`}
                  />
                </IntakeField>
              </div>

              <IntakeField
                label="Broker compensation clause"
                column="agreement_answers.compensation"
              >
                <select
                  className={intakeSelectClass}
                  defaultValue="seller-paid-fallback-buyer"
                >
                  <option value="seller-paid-fallback-buyer">
                    Seller-paid · buyer-paid fallback (3.0%)
                  </option>
                  <option value="buyer-paid-flat">Buyer-paid flat fee</option>
                  <option value="buyer-paid-percent">Buyer-paid 3.0%</option>
                </select>
              </IntakeField>

              <IntakeField
                label="Broker clauses"
                column="agreement_templates.clauses[]"
              >
                <div className="space-y-2 rounded-lg border border-mist bg-paper px-3 py-2.5">
                  {[
                    "Agency disclosure (OREF Initial Agency)",
                    "Dual-agency consent",
                    "Earnest-money handling per Matin BIC",
                    "Non-exclusive showing carve-out",
                  ].map((clause, i) => (
                    <label
                      key={clause}
                      className="flex items-center gap-2 text-[0.78rem] text-ink"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={i < 3}
                        className="h-3.5 w-3.5 rounded border-mist accent-ink"
                      />
                      {clause}
                    </label>
                  ))}
                </div>
              </IntakeField>

              {/* AI suggestion (form-suggest) — pre-seeded so it looks complete */}
              <div className="flex flex-wrap gap-2 pt-1">
                <AIInsightChip>
                  Suggest: add VA-loan addendum
                </AIInsightChip>
                <AIInsightChip>
                  {buyer.preapproval === "Yes"
                    ? "Pre-approved — financing clause ready"
                    : "Flag: financing not yet confirmed"}
                </AIInsightChip>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-mist px-5 py-4">
              <button
                type="button"
                onClick={handleGeneratePacket}
                disabled={generating}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink/90 disabled:opacity-60",
                )}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <FileSignature className="h-4 w-4" />
                    Generate packet
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSaved(true)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-[0.82rem] font-medium transition-colors",
                  saved
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-mist bg-cloud text-ink hover:bg-paper",
                )}
              >
                <Save className="h-4 w-4" />
                {saved ? "Saved" : "Save draft"}
              </button>
            </div>
          </section>

          {/* COL 2 — Live document preview */}
          <section className="flex flex-col gap-4">
            <div>
              <p className="eyebrow pb-2 text-slate">Live document preview</p>
              <DocumentPreview
                title="BUYER REPRESENTATION AGREEMENT"
                status={pv.status}
                statusTone={pv.tone}
                lines={9}
                signatureField
                page={1}
                pages={4}
                missing={pv.missing}
                actions={
                  <>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-1.5 text-[0.76rem] font-medium text-ink transition-colors hover:bg-paper"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvelopeSent(true)}
                      disabled={!!pv.missing || envelopeSent}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
                        pv.missing
                          ? "cursor-not-allowed bg-paper-200 text-slate"
                          : envelopeSent
                          ? "bg-success/10 text-success ring-1 ring-inset ring-success/30"
                          : "bg-ink text-cloud hover:bg-ink/90",
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {envelopeSent ? "Sent" : "Send for signature"}
                    </button>
                  </>
                }
              />
              <p className="mt-2 px-1 text-[0.72rem] leading-snug text-slate">
                What will be signed before sending — OREF form{" "}
                <span className="font-mono text-[0.7rem] text-ink">C-565</span>,
                mandatory in Oregon per HB 4058.
              </p>
            </div>

            {/* Streamed AI draft (Generate packet output) */}
            {(generating || draft) && (
              <div className="rounded-2xl border border-mist bg-cloud p-4 shadow-soft">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold-soft text-gold-ink ring-1 ring-inset ring-gold/25">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-[0.78rem] font-semibold text-ink">
                    AI-drafted packet language
                  </p>
                  <span className="ml-auto text-[0.68rem] font-medium uppercase tracking-[0.12em] text-slate">
                    Agent reviews · does not author
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-[0.8rem] leading-relaxed text-ink/85">
                  {draft}
                  {generating && (
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-ink/40" />
                  )}
                </p>
              </div>
            )}
          </section>

          {/* COL 3 — Automation state + AI surfaces */}
          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
              <div className="flex items-center gap-2 border-b border-mist px-5 py-4">
                <Database className="h-4 w-4 text-slate" />
                <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
                  Automation state
                </h2>
              </div>
              <ul className="divide-y divide-mist px-5">
                {autoRows.map((r) => (
                  <li key={r.label} className="flex items-start gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.82rem] font-medium text-ink">{r.label}</p>
                      {r.meta ? (
                        <p className="mt-0.5 text-[0.72rem] leading-snug text-slate">
                          {r.meta}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 pt-0.5">
                      <StatusChip tone={r.tone} variant={r.variant ?? "soft"}>
                        {r.chip}
                      </StatusChip>
                    </span>
                  </li>
                ))}
              </ul>
              {/* Downstream-effect note (plumbing transparency) */}
              <div className="border-t border-mist px-5 py-3">
                <p className="font-mono text-[0.68rem] leading-relaxed text-slate">
                  Automation after send: signature_envelopes → activity_events →
                  reminder task → notify {buyer.agentName.split(" ")[0]} →
                  checklist update
                </p>
              </div>
            </div>

            {/* Broker rule check — AI action card on dark surface */}
            <AIActionCard
              title="Broker rule check passed"
              riskTag={buyer.preapproval === "Yes" ? "Ready" : "Approval required"}
              evidence={`Term ${months}mo ≤ 12mo cap · compensation 3.0% within Matin BIC policy · agency disclosure attached.${
                buyer.preapproval !== "Yes"
                  ? ` Financing unconfirmed (${buyer.preapproval}) — broker sign-off needed before send.`
                  : ""
              }`}
              confidence={buyer.preapproval === "Yes" ? "High" : "Medium"}
              runLabel="Approve & send"
              onRun={() => setEnvelopeSent(true)}
              onEdit={() => openAi(aiContext)}
              onReject={() => openAi(aiContext)}
            />

            {/* Missing-field / risk callout — dark system surface */}
            {pv.missing ? (
              <CalloutCard
                tone="risk"
                title="Missing fields block send"
                action={
                  <button
                    type="button"
                    onClick={() => openAi(aiContext)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                  >
                    Draft the fix
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                }
              >
                AI located {pv.missing.length} incomplete required fields:{" "}
                {pv.missing.join(", ")}. The DocuSign envelope cannot be sent
                until these are resolved.
              </CalloutCard>
            ) : (
              <CalloutCard
                tone="system"
                title="Ready to execute"
                action={
                  <span className="inline-flex items-center gap-1.5 text-[0.76rem] font-medium text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    All checks clear
                  </span>
                }
              >
                Every required field on the OREF C-565 packet is complete and the
                broker rule check has passed. This agreement is clear to send for
                signature.
              </CalloutCard>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
