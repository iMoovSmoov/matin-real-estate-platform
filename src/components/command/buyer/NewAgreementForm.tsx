"use client";

import { useMemo, useState, type FormEvent } from "react";
import { UserPlus, Link2 } from "lucide-react";
import type { BuyerAgreement, BuyerTimeline, PreapprovalStatus } from "@/lib/types";
import { leads } from "@/lib/data";
import { SALES_ROSTER } from "@/lib/data/agreement-roster";
import { IntakeField, intakeInputClass, intakeSelectClass } from "./IntakeField";
import { parseMoney } from "./agreementModel";
import { cn, compactUsd } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreements / NewAgreementForm

   The body of the "+ New agreement" create drawer (RecordDrawer). Controlled
   inputs → on submit, builds a real BuyerAgreement and hands it back so the
   page appends it to local state and it appears immediately in the list.
   The drawer chrome + action bar are owned by the page; this renders the form
   fields and exposes a submit via the `formId` so the action-bar button can
   submit it. LIGHT surface.

   The agent picker is sourced from the REAL agents.json roster (SALES_ROSTER) —
   no hardcoded staff list. The intake can also start from a REAL buyer lead in
   leads.json (truthful "backend record joins": contacts → agreement_answers).
   ────────────────────────────────────────────────────────────────────────── */

/** Real buyer leads available to seed an agreement from (truthful join). */
const BUYER_LEADS = leads.filter(
  (l) => l.intent === "Buying" && !["Closed", "Lost"].includes(l.stage),
);

export function NewAgreementForm({
  formId,
  onCreate,
}: {
  formId: string;
  onCreate: (record: BuyerAgreement) => void;
}) {
  const [leadId, setLeadId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agentSlug, setAgentSlug] = useState(SALES_ROSTER[0].slug);
  const [areas, setAreas] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preapproval, setPreapproval] = useState<PreapprovalStatus>("In Progress");
  const [timeline, setTimeline] = useState<BuyerTimeline>("1-3 months");
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 1;
  const emailValid = /.+@.+\..+/.test(email);

  const selectedLead = useMemo(
    () => BUYER_LEADS.find((l) => l.id === leadId),
    [leadId],
  );

  /** Prefill every field from a real CRM lead record. */
  function applyLead(id: string) {
    setLeadId(id);
    const l = BUYER_LEADS.find((x) => x.id === id);
    if (!l) return;
    setName(l.name);
    setEmail(l.email);
    setPhone(l.phone);
    setAgentSlug(
      SALES_ROSTER.some((a) => a.slug === l.assignedAgent)
        ? l.assignedAgent
        : SALES_ROSTER[0].slug,
    );
    setAreas(l.community);
    setBudgetMin(String(l.budgetMin));
    setBudgetMax(String(l.budgetMax));
    setTouched(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!nameValid || !emailValid) return;
    const agent = SALES_ROSTER.find((a) => a.slug === agentSlug) ?? SALES_ROSTER[0];
    const record: BuyerAgreement = {
      id: `BA-NEW-${Date.now().toString().slice(-5)}`,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || "(503) 000-0000",
      agentSlug: agent.slug,
      agentName: agent.name,
      budgetMin: parseMoney(budgetMin) || 500_000,
      budgetMax: parseMoney(budgetMax) || 700_000,
      areas: areas
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      preapproval,
      agreementStatus: "Not Signed",
      showingCount: selectedLead?.propertyViews?.length ?? 0,
      lastContactDaysAgo: selectedLead?.lastContactDaysAgo ?? 0,
      timeline,
      notes: selectedLead
        ? `Started from CRM lead ${selectedLead.id} · ${selectedLead.aiSummary}`
        : "New intake — packet not yet generated.",
    };
    onCreate(record);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2.5 rounded-xl border border-mist bg-paper px-3.5 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist">
          <UserPlus className="h-4 w-4" />
        </span>
        <p className="text-[0.78rem] leading-snug text-slate">
          Fill in the buyer&apos;s details and we&apos;ll create a draft OREF
          C-565 buyer agreement, saved as{" "}
          <span className="font-medium text-ink">Not Signed</span> until you send it.
        </p>
      </div>

      {/* Start from a REAL CRM buyer lead — truthful contacts join */}
      <IntakeField
        label="Start from a CRM lead"
        flag={
          selectedLead ? (
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-success">
              <Link2 className="h-3 w-3" />
              Linked
            </span>
          ) : null
        }
      >
        <select
          className={intakeSelectClass}
          value={leadId}
          onChange={(e) => applyLead(e.target.value)}
        >
          <option value="">New contact (not from CRM)</option>
          {BUYER_LEADS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} · {l.community} · {compactUsd(l.budgetMin)}–{compactUsd(l.budgetMax)}
            </option>
          ))}
        </select>
      </IntakeField>

      <IntakeField
        label="Buyer name"
        flag={
          touched && !nameValid ? (
            <span className="text-[0.7rem] font-medium text-danger">Required</span>
          ) : null
        }
      >
        <input
          className={cn(intakeInputClass, touched && !nameValid && "border-danger/50")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jordan & Sam Avery"
          autoFocus
        />
      </IntakeField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <IntakeField
          label="Email"
          flag={
            touched && !emailValid ? (
              <span className="text-[0.7rem] font-medium text-danger">Invalid</span>
            ) : null
          }
        >
          <input
            type="email"
            className={cn(intakeInputClass, touched && !emailValid && "border-danger/50")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="buyer@email.com"
          />
        </IntakeField>
        <IntakeField label="Phone">
          <input
            className={intakeInputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(503) 000-0000"
          />
        </IntakeField>
      </div>

      <IntakeField label="Representing agent">
        <select
          className={intakeSelectClass}
          value={agentSlug}
          onChange={(e) => setAgentSlug(e.target.value)}
        >
          {SALES_ROSTER.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name} — {a.title}
            </option>
          ))}
        </select>
      </IntakeField>

      <IntakeField label="Representation area">
        <input
          className={intakeInputClass}
          value={areas}
          onChange={(e) => setAreas(e.target.value)}
          placeholder="Portland, Lake Oswego"
        />
      </IntakeField>

      <div className="grid grid-cols-2 gap-3">
        <IntakeField label="Budget min">
          <input
            className={intakeInputClass}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="$500K"
          />
        </IntakeField>
        <IntakeField label="Budget max">
          <input
            className={intakeInputClass}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="$700K"
          />
        </IntakeField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IntakeField label="Pre-approval">
          <select
            className={intakeSelectClass}
            value={preapproval}
            onChange={(e) => setPreapproval(e.target.value as PreapprovalStatus)}
          >
            <option value="Yes">Yes</option>
            <option value="In Progress">In Progress</option>
            <option value="No">No</option>
          </select>
        </IntakeField>
        <IntakeField label="Timeline">
          <select
            className={intakeSelectClass}
            value={timeline}
            onChange={(e) => setTimeline(e.target.value as BuyerTimeline)}
          >
            <option value="Immediately">Immediately</option>
            <option value="1-3 months">1-3 months</option>
            <option value="3-6 months">3-6 months</option>
          </select>
        </IntakeField>
      </div>

      <p className="font-mono text-[0.66rem] leading-relaxed text-slate/70">
        {selectedLead
          ? `Saved as a draft buyer agreement for ${selectedLead.name} — Not Signed until you send it.`
          : "Saved as a draft buyer agreement — Not Signed until you send it."}
      </p>
    </form>
  );
}
