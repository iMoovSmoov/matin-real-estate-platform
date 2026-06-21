"use client";

import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import type { BuyerAgreement, BuyerTimeline, PreapprovalStatus } from "@/lib/types";
import { IntakeField, intakeInputClass, intakeSelectClass } from "./IntakeField";
import { parseMoney } from "./agreementModel";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Buyer Agreements / NewAgreementForm

   The body of the "+ New agreement" create drawer (RecordDrawer). Controlled
   inputs → on submit, builds a real BuyerAgreement and hands it back so the
   page appends it to local state and it appears immediately in the list.
   The drawer chrome + action bar are owned by the page; this renders the form
   fields and exposes a submit via the `formId` so the action-bar button can
   submit it. LIGHT surface.
   ────────────────────────────────────────────────────────────────────────── */

const AGENTS: { slug: string; name: string }[] = [
  { slug: "joshua-rose", name: "Joshua Rose" },
  { slug: "alicia-smith", name: "Alicia Smith" },
  { slug: "russell-xay", name: "Russell Xay" },
  { slug: "lexa-brice", name: "Lexa Brice" },
  { slug: "jordan-matin", name: "Jordan Matin" },
  { slug: "ocean-chau", name: "Ocean Chau" },
];

export function NewAgreementForm({
  formId,
  onCreate,
}: {
  formId: string;
  onCreate: (record: BuyerAgreement) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agentSlug, setAgentSlug] = useState(AGENTS[0].slug);
  const [areas, setAreas] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [preapproval, setPreapproval] = useState<PreapprovalStatus>("In Progress");
  const [timeline, setTimeline] = useState<BuyerTimeline>("1-3 months");
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 1;
  const emailValid = /.+@.+\..+/.test(email);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!nameValid || !emailValid) return;
    const agent = AGENTS.find((a) => a.slug === agentSlug) ?? AGENTS[0];
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
      showingCount: 0,
      lastContactDaysAgo: 0,
      timeline,
      notes: "New intake — packet not yet generated.",
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
          Structured intake — every field writes to a database column. A draft
          OREF C-565 packet is created in <span className="font-medium text-ink">Not Signed</span> state.
        </p>
      </div>

      <IntakeField
        label="Buyer name"
        column="contacts.full_name"
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
          column="contacts.email"
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
        <IntakeField label="Phone" column="contacts.phone">
          <input
            className={intakeInputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(503) 000-0000"
          />
        </IntakeField>
      </div>

      <IntakeField label="Agent" column="agreement_answers.agent_slug">
        <select
          className={intakeSelectClass}
          value={agentSlug}
          onChange={(e) => setAgentSlug(e.target.value)}
        >
          {AGENTS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.name}
            </option>
          ))}
        </select>
      </IntakeField>

      <IntakeField label="Representation area" column="agreement_answers.areas[]">
        <input
          className={intakeInputClass}
          value={areas}
          onChange={(e) => setAreas(e.target.value)}
          placeholder="Portland, Lake Oswego"
        />
      </IntakeField>

      <div className="grid grid-cols-2 gap-3">
        <IntakeField label="Budget min" column="agreement_answers.budget_min">
          <input
            className={intakeInputClass}
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
            placeholder="$500K"
          />
        </IntakeField>
        <IntakeField label="Budget max" column="agreement_answers.budget_max">
          <input
            className={intakeInputClass}
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
            placeholder="$700K"
          />
        </IntakeField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IntakeField label="Pre-approval" column="agreement_answers.preapproval">
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
        <IntakeField label="Timeline" column="agreement_answers.timeline">
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
        Writes: contacts → agreement_answers → buyer_agreements (status: Not Signed)
      </p>
    </form>
  );
}
