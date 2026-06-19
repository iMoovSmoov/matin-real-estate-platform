"use client";

import { useMemo, useState } from "react";
import {
  ScrollText,
  FileSignature,
  Wand2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Database,
  PenTool,
  Stamp,
  Users,
  Sparkles,
  Loader2,
  RefreshCw,
  Building2,
  UserRound,
} from "lucide-react";
import { reForms, type ReForm, type ReFormField } from "@/lib/forms";
import { listings, leads, getAgent, getListing } from "@/lib/data";
import type { Listing, Lead } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn, usd } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot, Pill, SectionLabel } from "@/components/command/ui";
import { ComplianceCheck, evaluateCompliance } from "./ComplianceCheck";

/* ──────────────────────────────────────────────────────────────────────────
   Contract Builder — a guided, AI-native, 5-step contract workflow.
   1 · Choose contract   2 · Auto-fill from a record   3 · AI draft
   4 · Review & compliance   5 · Route for e-signature
   State persists across steps; the AI draft streams live via /api/ai
   (tool "agreement"). Built only on the contract-type OREF forms.
   ────────────────────────────────────────────────────────────────────────── */

// Only the contract-type forms (pillar 5) drive this wizard.
const CONTRACT_FORMS = reForms.filter((f) => f.pillar === "Contract Systems");

type RecordRef =
  | { kind: "listing"; data: Listing }
  | { kind: "lead"; data: Lead }
  | null;

interface AuditEntry {
  ts: string;
  who: string;
  action: string;
}

const STEPS = [
  { n: 1, label: "Choose contract", icon: ScrollText, hint: "Pick the OREF document" },
  { n: 2, label: "Auto-fill", icon: Database, hint: "Pull from the CRM record" },
  { n: 3, label: "AI draft", icon: Wand2, hint: "AI writes the clauses" },
  { n: 4, label: "Review & compliance", icon: ShieldCheck, hint: "Oregon & federal checks" },
  { n: 5, label: "Route for e-sign", icon: PenTool, hint: "Send to all parties" },
] as const;

/* ── Field-mapping: turn a CRM record into the chosen form's field values ── */
function mapRecordToFields(form: ReForm, ref: RecordRef): Record<string, string> {
  const out: Record<string, string> = {};
  if (!ref) return out;

  if (ref.kind === "listing") {
    const l = ref.data;
    const agent = getAgent(l.agentSlug);
    const full = `${l.address}, ${l.city}, ${l.state} ${l.zip}`;
    const map: Record<string, string> = {
      property: full,
      area: `${l.city}, ${l.state}`,
      price: usd(l.price),
      listPrice: usd(l.price),
      amount: usd(l.price),
      gci: usd(l.price),
      yearBuilt: String(l.yearBuilt),
      agent: agent?.name ?? "Matin Real Estate",
      broker: agent?.name ?? "Matin Real Estate",
      seller: "Property owner of record",
      deal: full,
    };
    for (const f of form.fields) if (map[f.name] != null) out[f.name] = map[f.name];
  } else {
    const ld = ref.data;
    const agent = getAgent(ld.assignedAgent);
    const budget =
      ld.budgetMin && ld.budgetMax ? `${usd(ld.budgetMin)} – ${usd(ld.budgetMax)}` : "";
    const map: Record<string, string> = {
      buyer: ld.name,
      broker: agent?.name ?? "Matin Real Estate",
      agent: agent?.name ?? "Matin Real Estate",
      area: ld.community,
      property: ld.community ? `${ld.community} search area` : "",
      price: budget,
    };
    for (const f of form.fields) if (map[f.name] != null && map[f.name]) out[f.name] = map[f.name];
  }
  return out;
}

/** Pull a usable value for the AI "agreement" tool from whatever field exists. */
function pick(values: Record<string, string>, keys: string[]): string {
  for (const k of keys) if (values[k]?.trim()) return values[k];
  return "";
}

export function ContractWizard() {
  const [step, setStep] = useState(1);
  const [formCode, setFormCode] = useState<string>("");
  const [recordId, setRecordId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [sent, setSent] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const form = useMemo(() => CONTRACT_FORMS.find((f) => f.code === formCode) ?? null, [formCode]);

  const record: RecordRef = useMemo(() => {
    if (!recordId) return null;
    if (recordId.startsWith("L:")) {
      const l = getListing(recordId.slice(2));
      return l ? { kind: "listing", data: l } : null;
    }
    if (recordId.startsWith("D:")) {
      const d = leads.find((x) => x.id === recordId.slice(2));
      return d ? { kind: "lead", data: d } : null;
    }
    return null;
  }, [recordId]);

  const autofillNames = useMemo(
    () => new Set(form?.fields.filter((f) => f.autofill).map((f) => f.name) ?? []),
    [form],
  );

  // Choose a contract → reset everything downstream.
  function chooseForm(code: string) {
    setFormCode(code);
    setRecordId("");
    setValues({});
    setDraft("");
    setDrafted(false);
    setSent(false);
    setAudit([]);
  }

  // Pick a CRM record → auto-fill the form fields (editable after).
  function chooseRecord(id: string) {
    setRecordId(id);
    if (!form) return;
    let ref: RecordRef = null;
    if (id.startsWith("L:")) {
      const l = getListing(id.slice(2));
      ref = l ? { kind: "listing", data: l } : null;
    } else if (id.startsWith("D:")) {
      const d = leads.find((x) => x.id === id.slice(2));
      ref = d ? { kind: "lead", data: d } : null;
    }
    setValues(mapRecordToFields(form, ref));
    setDraft("");
    setDrafted(false);
  }

  function setField(name: string, v: string) {
    setValues((p) => ({ ...p, [name]: v }));
  }

  async function runDraft() {
    if (!form || drafting) return;
    setDrafting(true);
    setDrafted(true);
    setDraft("");
    try {
      await streamAi(
        {
          tool: "agreement",
          input: {
            docType: form.name,
            party: pick(values, ["buyer", "seller", "consumer", "broker", "agent"]),
            property: pick(values, ["property", "area", "deal"]),
            price: pick(values, ["price", "listPrice", "counterPrice", "amount", "gci"]),
            commission: pick(values, ["commission", "compensation", "split"]),
            term: pick(values, ["term", "closeDate", "receivedOn", "deliveredOn"]),
            special: pick(values, ["contingencies", "changes", "change", "items", "knownIssues"]),
          },
        },
        (_c, full) => setDraft(full),
      );
    } finally {
      setDrafting(false);
    }
  }

  // Compliance for the summary chip & e-sign gating.
  const compliance = useMemo(
    () => (form ? evaluateCompliance(form, record, values) : null),
    [form, record, values],
  );

  // Recipients for e-sign, derived from the record + agent.
  const recipients = useMemo(() => {
    if (!form) return [];
    const list: { name: string; role: string; email: string }[] = [];
    if (record?.kind === "listing") {
      const agent = getAgent(record.data.agentSlug);
      if (values.seller) list.push({ name: values.seller, role: "Seller", email: "seller@client.email" });
      if (agent) list.push({ name: agent.name, role: "Listing Broker", email: agent.email });
    } else if (record?.kind === "lead") {
      const agent = getAgent(record.data.assignedAgent);
      list.push({ name: record.data.name, role: "Buyer", email: record.data.email });
      if (agent) list.push({ name: agent.name, role: "Buyer's Broker", email: agent.email });
    }
    if (list.length === 0) {
      if (values.buyer) list.push({ name: values.buyer, role: "Buyer", email: "buyer@client.email" });
      if (values.seller) list.push({ name: values.seller, role: "Seller", email: "seller@client.email" });
    }
    return list;
  }, [form, record, values]);

  function sendForSignature() {
    if (sent || !form) return;
    const now = new Date();
    const stamp = now.toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const log: AuditEntry[] = [
      { ts: stamp, who: "Contract Builder", action: `Generated ${form.code} — ${form.name}` },
      { ts: stamp, who: "Compliance Engine", action: `Passed ${compliance?.passes ?? 0}/${compliance?.applicable ?? 0} checks` },
      ...recipients.map((r) => ({ ts: stamp, who: r.name, action: `Envelope sent to ${r.email} (${r.role})` })),
      { ts: stamp, who: "DocuSign", action: "Envelope created · awaiting signatures" },
    ];
    setAudit(log);
    setSent(true);
  }

  // Gating: which step can be reached.
  const reach = (n: number) => {
    if (n <= 1) return true;
    if (n === 2) return !!form;
    if (n === 3) return !!form && !!record;
    if (n === 4) return !!form && drafted;
    if (n === 5) return !!form && drafted;
    return false;
  };

  const canNext =
    (step === 1 && !!form) ||
    (step === 2 && !!record) ||
    (step === 3 && drafted) ||
    (step === 4 && !!compliance?.ready) ||
    step === 5;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]">
      {/* Summary header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.1] text-white ring-1 ring-inset ring-white/12">
            <FileSignature className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate-300/60">
              Building
            </p>
            <p className="text-[0.9rem] font-semibold text-white">
              {form ? form.name : "New contract"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {form && <Pill tone="azure">{form.code}</Pill>}
          {record && (
            <Pill tone="neutral">
              {record.kind === "listing" ? <Building2 className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
              {record.kind === "listing" ? record.data.address : record.data.name}
            </Pill>
          )}
          {sent && (
            <Pill tone="success">
              <CheckCircle2 className="h-3 w-3" /> Sent
            </Pill>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* ── Left rail · step progress ── */}
        <aside className="border-b border-white/10 bg-white/[0.025] p-4 lg:border-b-0 lg:border-r">
          <SectionLabel className="mb-3 px-1">Workflow</SectionLabel>
          <ol className="space-y-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.n;
              const done = step > s.n;
              const open = reach(s.n);
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => open && setStep(s.n)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                      active && "bg-azure/[0.12] ring-1 ring-inset ring-white/15",
                      !active && open && "hover:bg-white/[0.04]",
                      !open && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.78rem] font-semibold ring-1 ring-inset transition-colors",
                        done
                          ? "bg-success/15 text-success ring-success/25"
                          : active
                            ? "bg-white/[0.12] text-white ring-white/15"
                            : "bg-white/[0.05] text-slate-300/70 ring-white/10",
                      )}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-[0.82rem] font-semibold",
                          active ? "text-white" : "text-slate-300",
                        )}
                      >
                        {s.n}. {s.label}
                      </span>
                      <span className="block truncate text-[0.68rem] text-slate-300/55">{s.hint}</span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="ml-[1.45rem] h-2 w-px bg-white/10" aria-hidden />
                  )}
                </li>
              );
            })}
          </ol>
        </aside>

        {/* ── Right · active step ── */}
        <div className="min-h-[28rem] p-5 md:p-6">
          {step === 1 && <StepChoose selected={formCode} onChoose={chooseForm} />}
          {step === 2 && form && (
            <StepAutofill
              form={form}
              recordId={recordId}
              record={record}
              values={values}
              autofillNames={autofillNames}
              onPick={chooseRecord}
              onField={setField}
            />
          )}
          {step === 3 && form && (
            <StepDraft
              draft={draft}
              drafting={drafting}
              drafted={drafted}
              onDraft={runDraft}
              onEdit={setDraft}
            />
          )}
          {step === 4 && form && (
            <StepReview form={form} record={record} values={values} />
          )}
          {step === 5 && form && (
            <StepSign
              recipients={recipients}
              sent={sent}
              audit={audit}
              ready={!!compliance?.ready}
              onSend={sendForSignature}
            />
          )}

          {/* Nav */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[0.82rem] font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <p className="text-[0.74rem] text-slate-300/60">
              Step {step} of {STEPS.length}
            </p>

            {step < 5 ? (
              <button
                type="button"
                onClick={() => canNext && setStep((s) => Math.min(5, s + 1))}
                disabled={!canNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:opacity-50"
                title={!canNext ? gateHint(step) : undefined}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[0.82rem] font-medium text-slate-300/70">
                {sent ? "Workflow complete" : "Final step"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function gateHint(step: number): string {
  if (step === 1) return "Choose a contract to continue";
  if (step === 2) return "Pick a record to auto-fill";
  if (step === 3) return "Draft the document first";
  if (step === 4) return "Resolve compliance flags to continue";
  return "";
}

/* ── Step 1 · Choose contract ─────────────────────────────────────────── */
function StepChoose({ selected, onChoose }: { selected: string; onChoose: (c: string) => void }) {
  return (
    <div>
      <StepHead
        icon={ScrollText}
        eyebrow="Step 1"
        title="Choose the contract"
        sub="Every document is an official OREF or federal form, pre-wired for auto-fill and e-signature."
      />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CONTRACT_FORMS.map((f) => {
          const active = selected === f.code;
          return (
            <button
              key={f.code}
              type="button"
              onClick={() => onChoose(f.code)}
              className={cn(
                "group relative flex flex-col rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-white/30 bg-azure/[0.08] shadow-glow"
                  : "border-white/10 bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20 hover:bg-azure/[0.04]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.64rem] font-semibold uppercase tracking-wide text-white/80 ring-1 ring-inset ring-white/10">
                  {f.code}
                </span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-inset transition-colors",
                    active ? "bg-azure text-white ring-azure" : "ring-white/15 text-transparent group-hover:ring-azure/40",
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <h4 className="mt-2 text-[0.92rem] font-semibold leading-snug text-white">{f.name}</h4>
              <p className="mt-1 flex-1 text-[0.78rem] leading-relaxed text-slate-300/80">{f.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Pill tone="neutral">{f.category}</Pill>
                {f.esign && (
                  <Pill tone="azure">
                    <PenTool className="h-3 w-3" /> e-sign
                  </Pill>
                )}
              </div>
              {f.compliance && (
                <p className="mt-2 flex items-start gap-1.5 text-[0.7rem] leading-snug text-slate-300/65">
                  <ShieldCheck className="mt-px h-3 w-3 shrink-0 text-white" />
                  {f.compliance}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 2 · Auto-fill from a record ─────────────────────────────────── */
function StepAutofill({
  form,
  recordId,
  record,
  values,
  autofillNames,
  onPick,
  onField,
}: {
  form: ReForm;
  recordId: string;
  record: RecordRef;
  values: Record<string, string>;
  autofillNames: Set<string>;
  onPick: (id: string) => void;
  onField: (name: string, v: string) => void;
}) {
  const filledCount = form.fields.filter((f) => f.autofill && values[f.name]?.trim()).length;

  return (
    <div>
      <StepHead
        icon={Database}
        eyebrow="Step 2"
        title="Auto-fill from a record"
        sub="Pick a CRM record and every shared field flows in automatically — no duplicate entry."
      />

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <select
          value={recordId}
          onChange={(e) => onPick(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[0.85rem] text-white transition-colors focus:border-white/40 focus:outline-none"
        >
          <option value="" className="bg-white/[0.06]">Select a CRM record…</option>
          <optgroup label="Listings" className="bg-white/[0.06]">
            {listings.slice(0, 14).map((l) => (
              <option key={l.id} value={`L:${l.id}`} className="bg-white/[0.06]">
                {l.address}, {l.city} · {usd(l.price)}
              </option>
            ))}
          </optgroup>
          <optgroup label="Buyer leads" className="bg-white/[0.06]">
            {leads.slice(0, 14).map((d) => (
              <option key={d.id} value={`D:${d.id}`} className="bg-white/[0.06]">
                {d.name} · {d.community}
              </option>
            ))}
          </optgroup>
        </select>
        {record && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/[0.1] px-3 py-2 text-[0.78rem] font-semibold text-success ring-1 ring-inset ring-success/25">
            <Sparkles className="h-3.5 w-3.5" />
            {filledCount} field{filledCount === 1 ? "" : "s"} auto-filled
          </span>
        )}
      </div>

      {!record ? (
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/12 bg-white/[0.01] px-4 py-12 text-center">
          <Database className="h-7 w-7 text-slate-300/40" />
          <p className="mt-2 text-[0.86rem] font-semibold text-white">No duplicate data entry</p>
          <p className="mt-1 max-w-sm text-[0.78rem] leading-relaxed text-slate-300/65">
            Choose a listing or buyer lead above and the {form.name} fields fill themselves from the CRM.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-lg border border-azure/20 bg-azure/[0.06] px-3 py-2">
            <Sparkles className="h-4 w-4 shrink-0 text-white" />
            <p className="text-[0.8rem] font-medium text-white">
              Auto-filled from CRM — no duplicate entry.{" "}
              <span className="font-normal text-slate-300/75">Highlighted fields came straight from the record; edit anything inline.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {form.fields
              .filter((f) => f.type !== "signature")
              .map((f) => (
                <FieldInput
                  key={f.name}
                  field={f}
                  value={values[f.name] ?? ""}
                  autofilled={autofillNames.has(f.name) && !!values[f.name]?.trim()}
                  onChange={(v) => onField(f.name, v)}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  autofilled,
  onChange,
}: {
  field: ReFormField;
  value: string;
  autofilled: boolean;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-lg border bg-white/[0.03] px-3 py-2 text-[0.85rem] text-white placeholder:text-slate-300/40 transition-colors focus:outline-none";
  const ring = autofilled
    ? "border-white/25 bg-azure/[0.06] focus:border-azure/60"
    : "border-white/10 focus:border-white/40 focus:bg-white/[0.05]";
  return (
    <div className={cn("flex flex-col gap-1.5", field.type === "textarea" && "sm:col-span-2")}>
      <label className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-300">
        {field.label}
        {field.required && <span className="text-white">*</span>}
        {autofilled && (
          <span className="inline-flex items-center gap-0.5 rounded bg-white/[0.1] px-1 py-px text-[0.58rem] font-semibold uppercase tracking-wide text-white ring-1 ring-inset ring-white/15">
            <Sparkles className="h-2.5 w-2.5" /> auto
          </span>
        )}
      </label>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(base, ring, "resize-y")}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(base, ring)}>
          <option value="" className="bg-white/[0.06]">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o} className="bg-white/[0.06]">
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(base, ring)}
        />
      )}
    </div>
  );
}

/* ── Step 3 · AI draft ────────────────────────────────────────────────── */
function StepDraft({
  draft,
  drafting,
  drafted,
  onDraft,
  onEdit,
}: {
  draft: string;
  drafting: boolean;
  drafted: boolean;
  onDraft: () => void;
  onEdit: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <StepHead
        icon={Wand2}
        eyebrow="Step 3"
        title="Draft with AI"
        sub="AI writes Oregon-ready clause language from your terms and streams it live."
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onDraft}
          disabled={drafting}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[0.86rem] font-semibold text-ink transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {drafting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> AI is drafting…
            </>
          ) : drafted ? (
            <>
              <RefreshCw className="h-4 w-4" /> Regenerate draft
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Draft with AI
            </>
          )}
        </button>
        {drafted && !drafting && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.78rem] font-medium text-slate-300 transition-colors hover:border-white/30 hover:text-white"
          >
            <PenTool className="h-3.5 w-3.5" /> {editing ? "Preview" : "Edit text"}
          </button>
        )}
      </div>

      {/* Document preview */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {drafting ? <LiveDot tone="azure" /> : <FileSignature className="h-3.5 w-3.5 text-white" />}
            <span className="text-[0.8rem] font-semibold text-white">Document preview</span>
            {drafting && <span className="text-[0.7rem] text-slate-300/65">streaming live</span>}
          </div>
          {drafted && !drafting && (
            <Pill tone="success">
              <CheckCircle2 className="h-3 w-3" /> Drafted
            </Pill>
          )}
        </div>
        <div className="max-h-[26rem] overflow-y-auto px-5 py-4">
          {!drafted ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] text-white ring-1 ring-inset ring-white/12">
                <Wand2 className="h-6 w-6" />
              </span>
              <p className="mt-3 text-[0.9rem] font-semibold text-white">Ready to draft</p>
              <p className="mt-1 max-w-xs text-[0.8rem] leading-relaxed text-slate-300/65">
                Hit <span className="font-semibold text-white">Draft with AI</span> to generate clause
                language from the auto-filled terms.
              </p>
            </div>
          ) : editing ? (
            <textarea
              value={draft}
              onChange={(e) => onEdit(e.target.value)}
              rows={16}
              className="w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-slate-200 focus:border-white/40 focus:outline-none"
            />
          ) : (
            <div>
              <AiMarkdown text={draft} />
              {drafting && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-white align-middle" />
              )}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-slate-300/55">
        <AlertTriangle className="h-3 w-3 text-warn" />
        AI drafting aid — final language is reviewed by the principal broker. Not legal advice.
      </p>
    </div>
  );
}

/* ── Step 4 · Review & compliance ─────────────────────────────────────── */
function StepReview({
  form,
  record,
  values,
}: {
  form: ReForm;
  record: RecordRef;
  values: Record<string, string>;
}) {
  return (
    <div>
      <StepHead
        icon={ShieldCheck}
        eyebrow="Step 4"
        title="Review & compliance"
        sub="Automated Oregon & federal checks run against the document before anything is sent."
      />
      <div className="mt-5">
        <ComplianceCheck form={form} record={record} values={values} />
      </div>
    </div>
  );
}

/* ── Step 5 · Route for e-signature ───────────────────────────────────── */
function StepSign({
  recipients,
  sent,
  audit,
  ready,
  onSend,
}: {
  recipients: { name: string; role: string; email: string }[];
  sent: boolean;
  audit: AuditEntry[];
  ready: boolean;
  onSend: () => void;
}) {
  return (
    <div>
      <StepHead
        icon={PenTool}
        eyebrow="Step 5"
        title="Route for e-signature"
        sub="Send the finished packet to every party for binding e-signature, with a full audit trail."
      />

      {/* Recipients */}
      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-white" />
          <SectionLabel>Recipients</SectionLabel>
        </div>
        {recipients.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-[0.8rem] text-slate-300/70">
            No recipients resolved — go back and attach a record.
          </p>
        ) : (
          <ul className="space-y-2">
            {recipients.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.1] text-[0.72rem] font-semibold text-white ring-1 ring-inset ring-white/12">
                    {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <div className="leading-tight">
                    <p className="text-[0.85rem] font-semibold text-white">{r.name}</p>
                    <p className="text-[0.74rem] text-slate-300/65">{r.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="neutral">{r.role}</Pill>
                  {sent ? (
                    <Pill tone="success">
                      <Send className="h-3 w-3" /> Sent
                    </Pill>
                  ) : (
                    <Pill tone="azure">Pending</Pill>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!sent ? (
        <div className="mt-5">
          {!ready && (
            <p className="mb-3 flex items-center gap-1.5 text-[0.78rem] text-warn">
              <AlertTriangle className="h-3.5 w-3.5" />
              Resolve the compliance flags in Step 4 before routing for signature.
            </p>
          )}
          <button
            type="button"
            onClick={onSend}
            disabled={!ready || recipients.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-colors hover:bg-paper-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Stamp className="h-4 w-4" /> Send via DocuSign / Dotloop
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Success banner */}
          <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.08] px-4 py-3.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success ring-1 ring-inset ring-success/30">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[0.95rem] font-semibold text-white">Envelope sent for e-signature</p>
              <p className="text-[0.78rem] text-slate-300/80">
                All {recipients.length} parties notified. You&apos;ll be alerted as each one signs.
              </p>
            </div>
          </div>

          {/* Audit log */}
          <div className="rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              <span className="text-[0.8rem] font-semibold text-white">Audit log</span>
              <span className="ml-auto text-[0.7rem] text-slate-300/55">tamper-evident</span>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {audit.map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="mt-0.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8rem] text-slate-200">
                      <span className="font-semibold text-white">{a.who}</span> — {a.action}
                    </p>
                    <p className="font-mono text-[0.68rem] text-slate-300/50">{a.ts}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared step header ───────────────────────────────────────────────── */
function StepHead({
  icon: Icon,
  eyebrow,
  title,
  sub,
}: {
  icon: typeof ScrollText;
  eyebrow: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.1] text-white ring-1 ring-inset ring-white/12">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</p>
        <h2 className="font-display text-xl text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-[0.84rem] leading-relaxed text-slate-300/85">{sub}</p>
      </div>
    </div>
  );
}
