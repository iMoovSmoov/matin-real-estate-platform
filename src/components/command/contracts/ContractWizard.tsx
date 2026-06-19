"use client";

import { useMemo, useState } from "react";
import {
  ScrollText,
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Database,
  PenTool,
  Users,
  Sparkles,
  Loader2,
  RefreshCw,
  Building2,
  UserRound,
  FileText,
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
   Contract Builder — one clean working screen (SkySlope / Dotloop feel).
   Left pane = set it up (pick a contract → auto-fill from a record → draft).
   Right pane = the live document (AI draft → compliance → send).
   No numbered process rail; just preparing and sending a real document.
   State persists; the AI draft streams live via /api/ai (tool "agreement").
   Built only on the contract-type OREF forms (pillar "Contract Systems").
   ────────────────────────────────────────────────────────────────────────── */

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
  const [formCode, setFormCode] = useState<string>("");
  const [recordId, setRecordId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [drafted, setDrafted] = useState(false);
  const [editing, setEditing] = useState(false);
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
    setFormCode(code === formCode ? "" : code);
    setRecordId("");
    setValues({});
    setDraft("");
    setDrafted(false);
    setEditing(false);
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
    setSent(false);
    setAudit([]);
  }

  function setField(name: string, v: string) {
    setValues((p) => ({ ...p, [name]: v }));
  }

  async function runDraft() {
    if (!form || drafting) return;
    setDrafting(true);
    setDrafted(true);
    setEditing(false);
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

  // Compliance for the checklist & send gating.
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
      { ts: stamp, who: "Compliance", action: `Passed ${compliance?.passes ?? 0}/${compliance?.applicable ?? 0} checks` },
      ...recipients.map((r) => ({ ts: stamp, who: r.name, action: `Sent to ${r.email} (${r.role})` })),
      { ts: stamp, who: "E-signature", action: "Envelope created · awaiting signatures" },
    ];
    setAudit(log);
    setSent(true);
  }

  const editableFields = form?.fields.filter((f) => f.type !== "signature") ?? [];
  const filledCount = form
    ? form.fields.filter((f) => f.autofill && values[f.name]?.trim()).length
    : 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white backdrop-blur-md">
      {/* Working bar: what's being built + live status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/[0.08] bg-white px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <FileSignature className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-slate/60">
              Preparing
            </p>
            <p className="truncate text-[0.9rem] font-semibold text-ink">
              {form ? form.name : "Choose a contract to begin"}
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
          {compliance && (
            <Pill tone={compliance.ready ? "success" : "danger"}>
              {compliance.ready ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {compliance.ready ? "Ready to send" : `${compliance.warnings} to fix`}
            </Pill>
          )}
          {sent && (
            <Pill tone="success">
              <Send className="h-3 w-3" /> Sent
            </Pill>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)]">
        {/* ── Left · set it up ── */}
        <aside className="space-y-6 border-b border-ink/[0.08] p-5 lg:border-b-0 lg:border-r lg:p-6">
          {/* Contract picker */}
          <section>
            <SectionHead icon={ScrollText} title="Contract" sub="Pick the document to prepare." />
            <div className="mt-3 space-y-2">
              {CONTRACT_FORMS.map((f) => {
                const active = formCode === f.code;
                return (
                  <button
                    key={f.code}
                    type="button"
                    onClick={() => chooseForm(f.code)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      active
                        ? "border-ink/20 bg-paper"
                        : "border-ink/[0.08] bg-white hover:border-ink/15 hover:bg-white",
                    )}
                  >
                    <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wide text-ink ring-1 ring-inset ring-ink/[0.06]">
                      {f.code}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.84rem] font-semibold text-ink">{f.name}</span>
                      <span className="block truncate text-[0.72rem] text-slate/65">{f.category}</span>
                    </span>
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-ink" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Auto-fill from a record */}
          {form && (
            <section>
              <SectionHead
                icon={Database}
                title="Auto-fill"
                sub="Pull the details from a CRM record."
              />
              <select
                value={recordId}
                onChange={(e) => chooseRecord(e.target.value)}
                className="mt-3 w-full rounded-lg border border-ink/[0.08] bg-white px-3 py-2.5 text-[0.84rem] text-ink transition-colors focus:border-ink/20 focus:outline-none"
              >
                <option value="" className="bg-ink">Select a listing or lead…</option>
                <optgroup label="Listings" className="bg-ink">
                  {listings.slice(0, 14).map((l) => (
                    <option key={l.id} value={`L:${l.id}`} className="bg-ink">
                      {l.address}, {l.city} · {usd(l.price)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Buyer leads" className="bg-ink">
                  {leads.slice(0, 14).map((d) => (
                    <option key={d.id} value={`D:${d.id}`} className="bg-ink">
                      {d.name} · {d.community}
                    </option>
                  ))}
                </optgroup>
              </select>

              {record && filledCount > 0 && (
                <p className="mt-2.5 flex items-center gap-1.5 text-[0.74rem] text-slate/80">
                  <Sparkles className="h-3.5 w-3.5 text-ink" />
                  <span className="font-semibold text-ink">{filledCount} field{filledCount === 1 ? "" : "s"}</span>{" "}
                  auto-filled from CRM — edit anything below.
                </p>
              )}

              {/* The form's fields (pre-filled + editable) */}
              <div className="mt-3 space-y-3">
                {editableFields.length === 0 && (
                  <p className="rounded-lg border border-dashed border-ink/10 bg-white/[0.01] px-3 py-4 text-center text-[0.78rem] text-slate/65">
                    Pick a record above and this contract&apos;s fields fill themselves.
                  </p>
                )}
                {editableFields.map((f) => (
                  <FieldInput
                    key={f.name}
                    field={f}
                    value={values[f.name] ?? ""}
                    autofilled={autofillNames.has(f.name) && !!values[f.name]?.trim()}
                    onChange={(v) => setField(f.name, v)}
                  />
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* ── Right · the document ── */}
        <div className="min-h-[34rem] space-y-6 p-5 md:p-6">
          {!form ? (
            <div className="flex min-h-[28rem] flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-ink ring-1 ring-inset ring-ink/[0.06]">
                <FileText className="h-7 w-7" />
              </span>
              <p className="mt-4 text-[1rem] font-semibold text-ink">Pick a contract to start</p>
              <p className="mt-1.5 max-w-sm text-[0.84rem] leading-relaxed text-slate/70">
                Choose a document on the left. It auto-fills from a record, AI drafts the language,
                we check compliance, and you send it for signature — all on this screen.
              </p>
            </div>
          ) : (
            <>
              {/* Document + AI draft */}
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <SectionHead icon={FileText} title="Document" sub="AI drafts the clause language — edit anything." />
                  <div className="flex items-center gap-2">
                    {drafted && !drafting && (
                      <button
                        type="button"
                        onClick={() => setEditing((e) => !e)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink/12 bg-white px-3 py-2 text-[0.78rem] font-medium text-ink transition-colors hover:border-ink/15 hover:bg-white"
                      >
                        <PenTool className="h-3.5 w-3.5" /> {editing ? "Preview" : "Edit text"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={runDraft}
                      disabled={drafting}
                      className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-[0.84rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {drafting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Drafting…
                        </>
                      ) : drafted ? (
                        <>
                          <RefreshCw className="h-4 w-4" /> Regenerate
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Draft with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Document surface */}
                <div className="mt-4 rounded-xl border border-ink/[0.08] bg-white">
                  <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      {drafting ? <LiveDot tone="azure" /> : <FileSignature className="h-3.5 w-3.5 text-ink" />}
                      <span className="text-[0.8rem] font-semibold text-ink">{form.code} · {form.name}</span>
                      {drafting && <span className="text-[0.7rem] text-slate/65">streaming live</span>}
                    </div>
                    {drafted && !drafting && (
                      <Pill tone="success">
                        <CheckCircle2 className="h-3 w-3" /> Drafted
                      </Pill>
                    )}
                  </div>
                  <div className="max-h-[24rem] overflow-y-auto px-5 py-4">
                    {!drafted ? (
                      <div className="flex min-h-[12rem] flex-col items-center justify-center text-center">
                        <p className="text-[0.9rem] font-semibold text-ink">Ready to draft</p>
                        <p className="mt-1 max-w-xs text-[0.8rem] leading-relaxed text-slate/65">
                          Hit <span className="font-semibold text-ink">Draft with AI</span> to generate clause
                          language from the {record ? "auto-filled" : "entered"} terms.
                        </p>
                      </div>
                    ) : editing ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={16}
                        className="w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 font-mono text-[0.8rem] leading-relaxed text-ink focus:border-ink/20 focus:outline-none"
                      />
                    ) : (
                      <div>
                        <AiMarkdown text={draft} />
                        {drafting && (
                          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-slate/55">
                  <AlertTriangle className="h-3 w-3 text-warn" />
                  AI drafting aid — final language is reviewed by the principal broker. Not legal advice.
                </p>
              </section>

              {/* Compliance */}
              <section>
                <SectionHead
                  icon={ShieldCheck}
                  title="Compliance"
                  sub="Oregon & federal checks run automatically before you send."
                />
                <div className="mt-3">
                  <ComplianceCheck form={form} record={record} values={values} />
                </div>
              </section>

              {/* Send for signature */}
              <section>
                <SectionHead
                  icon={Send}
                  title="Send for signature"
                  sub="Recipients are prefilled from the record — review and send."
                />

                <div className="mt-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-ink" />
                    <SectionLabel>Recipients</SectionLabel>
                  </div>
                  {recipients.length === 0 ? (
                    <p className="rounded-lg border border-ink/[0.08] bg-white/[0.02] px-4 py-3 text-[0.8rem] text-slate/70">
                      No recipients yet — attach a record or fill in the party names above.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {recipients.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-xl border border-ink/[0.08] bg-white/[0.02] px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-[0.72rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]">
                              {r.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="truncate text-[0.85rem] font-semibold text-ink">{r.name}</p>
                              <p className="truncate text-[0.74rem] text-slate/65">{r.email}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Pill tone="neutral">{r.role}</Pill>
                            {sent ? (
                              <Pill tone="success">
                                <Send className="h-3 w-3" /> Sent
                              </Pill>
                            ) : (
                              <Pill tone="neutral">Pending</Pill>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {!sent ? (
                  <div className="mt-4">
                    {!compliance?.ready && (
                      <p className="mb-3 flex items-center gap-1.5 text-[0.78rem] text-danger">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Clear the compliance items above before sending.
                      </p>
                    )}
                    {!drafted && (
                      <p className="mb-3 flex items-center gap-1.5 text-[0.78rem] text-slate/70">
                        <FileText className="h-3.5 w-3.5" />
                        Draft the document before sending.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={sendForSignature}
                      disabled={!compliance?.ready || !drafted || recipients.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-[0.88rem] font-semibold text-white transition-colors hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> Send for e-signature
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/[0.08] px-4 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success ring-1 ring-inset ring-success/30">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[0.95rem] font-semibold text-ink">Sent for e-signature</p>
                        <p className="text-[0.78rem] text-slate/80">
                          All {recipients.length} parties notified. You&apos;ll be alerted as each one signs.
                        </p>
                      </div>
                    </div>

                    {/* Audit line */}
                    <div className="rounded-xl border border-ink/[0.08] bg-white">
                      <div className="flex items-center gap-2 border-b border-ink/[0.08] px-4 py-2.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-ink" />
                        <span className="text-[0.8rem] font-semibold text-ink">Audit trail</span>
                        <span className="ml-auto text-[0.7rem] text-slate/55">tamper-evident</span>
                      </div>
                      <ul className="divide-y divide-ink/[0.06]">
                        {audit.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                            <span className="mt-0.5 flex h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[0.8rem] text-slate">
                                <span className="font-semibold text-ink">{a.who}</span> — {a.action}
                              </p>
                              <p className="font-mono text-[0.68rem] text-slate/50">{a.ts}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
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
    "w-full rounded-lg border bg-white px-3 py-2 text-[0.84rem] text-ink placeholder:text-slate/40 transition-colors focus:outline-none";
  const ring = autofilled
    ? "border-ink/15 bg-white focus:border-ink/40"
    : "border-ink/[0.08] focus:border-ink/20 focus:bg-white";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate">
        {field.label}
        {field.required && <span className="text-ink">*</span>}
        {autofilled && (
          <span className="inline-flex items-center gap-0.5 rounded bg-ink/[0.06] px-1 py-px text-[0.56rem] font-semibold uppercase tracking-wide text-ink ring-1 ring-inset ring-ink/[0.08]">
            <Sparkles className="h-2.5 w-2.5" /> CRM
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
          <option value="" className="bg-ink">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o} className="bg-ink">
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

/* ── Compact section header (no numbered eyebrow / stepper) ───────────── */
function SectionHead({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof ScrollText;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-inset ring-ink/[0.06]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-[1.05rem] leading-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-[0.78rem] leading-snug text-slate/75">{sub}</p>
      </div>
    </div>
  );
}
