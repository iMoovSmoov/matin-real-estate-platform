"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  FileInput,
  Save,
  Send,
  Printer,
  Check,
  Loader2,
  ShieldCheck,
  FilePen,
  ChevronDown,
  Users,
} from "lucide-react";
import type { ReForm, ReFormField } from "@/lib/forms";
import { listings, leads, company, getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { Pill } from "@/components/command/ui";

/* ──────────────────────────────────────────────────────────────────────────
   The real form experience (SkySlope / Dotloop-style). A branded, editable
   document: every ReFormField renders as a labeled input (signature → a
   signature line). The toolbar does the real work:
     • Auto-fill — pick a listing or lead, populate the `autofill` fields.
     • Generate with AI — contract forms → `agreement`, Listing forms →
       `listing-description`, streamed live into a panel.
     • Save — persists draft to localStorage.
     • Send for e-signature (esign only) — role-assignment modal → POST.
     • Print — window.print() with slide-over as the only print element.
   ────────────────────────────────────────────────────────────────────────── */

/** Best-effort mapping from a CRM/MLS record onto a form field. */
function autofillValue(field: ReFormField, record: AutofillRecord): string {
  const n = field.name.toLowerCase();
  const label = field.label.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => n.includes(k) || label.includes(k));

  if (has("buyer", "seller", "consumer", "client", "name")) return record.party;
  if (has("broker", "agent")) return record.broker;
  if (has("property", "address", "area", "search")) return record.property;
  if (has("price", "amount", "gci", "commission")) return record.price;
  if (has("yearbuilt", "year")) return record.yearBuilt;
  if (has("deal", "transaction")) return record.deal;
  return "";
}

type AutofillRecord = {
  key: string;
  label: string;
  party: string;
  broker: string;
  property: string;
  price: string;
  yearBuilt: string;
  deal: string;
};

function buildRecords(): { listings: AutofillRecord[]; leads: AutofillRecord[] } {
  const l = listings.slice(0, 8).map((x): AutofillRecord => {
    const agent = getAgent(x.agentSlug);
    return {
      key: `listing:${x.id}`,
      label: `${x.address}, ${x.city}`,
      party: agent ? agent.name : company.founder,
      broker: agent ? agent.name : company.founder,
      property: `${x.address}, ${x.city}, ${x.state} ${x.zip}`,
      price: usd(x.price),
      yearBuilt: String(x.yearBuilt),
      deal: `${x.mlsId} — ${x.address}`,
    };
  });
  const le = leads.slice(0, 8).map((x): AutofillRecord => {
    const agent = getAgent(x.assignedAgent);
    return {
      key: `lead:${x.id}`,
      label: `${x.name} · ${x.community}`,
      party: x.name,
      broker: agent ? agent.name : company.founder,
      property: x.community,
      price: usd(x.budgetMax),
      yearBuilt: "",
      deal: `${x.id} — ${x.name}`,
    };
  });
  return { listings: l, leads: le };
}

export function FormTemplate({ form, onClose }: { form: ReForm | null; onClose: () => void }) {
  const open = !!form;

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-md transition-opacity duration-300 print:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(760px,96vw)] flex-col border-l border-ink/[0.08] bg-ink shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out print:static print:w-full print:border-0 print:shadow-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {form && <FormTemplateInner key={form.code} form={form} onClose={onClose} />}
      </aside>
    </>
  );
}

// ── Esign role assignment modal ───────────────────────────────────────────────

const ESIGN_ROLES = ["Buyer", "Seller", "Agent", "Co-Agent"] as const;
type EsignRole = (typeof ESIGN_ROLES)[number];

function EsignModal({
  form,
  onSend,
  onCancel,
  sending,
}: {
  form: ReForm;
  onSend: (roles: EsignRole[]) => void;
  onCancel: () => void;
  sending: boolean;
}) {
  const [selected, setSelected] = useState<Set<EsignRole>>(new Set(["Buyer", "Agent"]));

  function toggle(role: EsignRole) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:hidden">
      <div className="w-full max-w-sm rounded-2xl border border-ink/[0.08] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ink" />
            <h3 className="text-[0.9rem] font-semibold text-ink">Send for E-Signature</h3>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate/60 hover:bg-ink/[0.04] hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-[0.8rem] text-slate">
            Select the signing roles for <strong>{form.name}</strong>.
          </p>
          <div className="space-y-2">
            {ESIGN_ROLES.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/[0.06] bg-paper/40 px-4 py-3 transition-colors hover:bg-paper"
              >
                <input
                  type="checkbox"
                  checked={selected.has(role)}
                  onChange={() => toggle(role)}
                  className="h-4 w-4 rounded border-ink/20 accent-ink"
                />
                <span className="text-[0.84rem] font-medium text-ink">{role}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-ink/[0.06] px-5 py-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-ink/[0.08] py-2 text-[0.82rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend(Array.from(selected) as EsignRole[])}
            disabled={selected.size === 0 || sending}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {sending ? "Sending…" : "Send for signature"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormTemplateInner({ form, onClose }: { form: ReForm; onClose: () => void }) {
  const records = useMemo(buildRecords, []);

  // Restore draft from localStorage on mount
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(`form-draft-${form.code}`);
      return stored ? (JSON.parse(stored) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });
  const [signed, setSigned] = useState<Record<string, boolean>>({});

  const [recordKey, setRecordKey] = useState<string>("");
  const [filledFrom, setFilledFrom] = useState<string | null>(null);

  const [aiOut, setAiOut] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [showEsignModal, setShowEsignModal] = useState(false);
  const [esignSending, setEsignSending] = useState(false);
  const [esignConfirm, setEsignConfirm] = useState<string | null>(null);

  const allRecords = [...records.listings, ...records.leads];
  const isListingForm = form.category === "Listing";
  const aiTool: "agreement" | "listing-description" = isListingForm
    ? "listing-description"
    : "agreement";

  // Persist draft to localStorage whenever values change (debounced via useEffect)
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        localStorage.setItem(`form-draft-${form.code}`, JSON.stringify(values));
      } catch {
        // localStorage may be unavailable
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [form.code, values]);

  function set(name: string, v: string) {
    setValues((p) => ({ ...p, [name]: v }));
  }

  /** Map the chosen record onto every autofill field. */
  function runAutofill() {
    if (!recordKey) return;
    const rec = allRecords.find((r) => r.key === recordKey);
    if (!rec) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const f of form.fields) {
        if (f.autofill) {
          const v = autofillValue(f, rec);
          if (v) next[f.name] = v;
        }
      }
      return next;
    });
    setFilledFrom(rec.label);
    setTimeout(() => setFilledFrom((cur) => (cur === rec.label ? null : cur)), 3200);
  }

  async function generate() {
    if (aiBusy) return;
    setAiBusy(true);
    setAiOut("");
    const byName = (...names: string[]) => {
      for (const name of names) {
        const f = form.fields.find(
          (x) => x.name.toLowerCase().includes(name) || x.label.toLowerCase().includes(name),
        );
        if (f && values[f.name]) return values[f.name];
      }
      return "";
    };
    try {
      if (aiTool === "listing-description") {
        const rec = allRecords.find((r) => r.key === recordKey);
        const lst = listings.find((l) => rec && rec.key === `listing:${l.id}`);
        await streamAi(
          {
            tool: "listing-description",
            input: {
              address: lst?.address ?? byName("property", "address"),
              city: lst?.city ?? "",
              beds: lst?.beds ?? "",
              baths: lst?.baths ?? "",
              sqft: lst?.sqft ?? "",
              yearBuilt: lst?.yearBuilt ?? "",
              type: lst?.type ?? "",
              price: lst ? usd(lst.price) : byName("price"),
              features: lst?.features?.join(", ") ?? "",
            },
          },
          (_c, full) => setAiOut(full),
        );
      } else {
        await streamAi(
          {
            tool: "agreement",
            input: {
              docType: form.name,
              party: byName("buyer", "seller", "name", "party", "consumer", "client"),
              property: byName("property", "address", "area"),
              price: byName("price", "amount", "list"),
              commission: byName("commission", "split"),
              term: byName("term"),
              special: byName("contingen", "change", "note", "issue", "repair", "items"),
            },
          },
          (_c, full) => setAiOut(full),
        );
      }
    } finally {
      setAiBusy(false);
    }
  }

  function handleSave() {
    try {
      localStorage.setItem(`form-draft-${form.code}`, JSON.stringify(values));
      setSaved(true);
      setSaveMessage("Draft saved");
      setTimeout(() => {
        setSaved(false);
        setSaveMessage(null);
      }, 2400);
    } catch {
      setSaveMessage("Couldn't save your draft. Please try again.");
      setTimeout(() => setSaveMessage(null), 2400);
    }
  }

  async function handleEsignSend(roles: EsignRole[]) {
    setEsignSending(true);
    try {
      const res = await fetch("/api/forms/esign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formCode: form.code,
          formName: form.name,
          roles,
          values,
        }),
      });
      await res.json().catch(() => null);
      setShowEsignModal(false);
      const roleList = roles.join(", ");
      setEsignConfirm(`Sent for signature to ${roleList}.`);
      setTimeout(() => setEsignConfirm(null), 4000);
    } catch {
      setShowEsignModal(false);
      setEsignConfirm("Couldn't send for signature. Please try again.");
      setTimeout(() => setEsignConfirm(null), 3000);
    } finally {
      setEsignSending(false);
    }
  }

  const showStrip = !!(filledFrom || saveMessage || esignConfirm);

  return (
    <>
      {/* E-sign role modal */}
      {showEsignModal && (
        <EsignModal
          form={form}
          onSend={handleEsignSend}
          onCancel={() => setShowEsignModal(false)}
          sending={esignSending}
        />
      )}

      {/* Header / toolbar */}
      <div className="relative shrink-0 border-b border-ink/[0.08] bg-white px-5 py-4 print:hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.04] hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pr-10">
          <FilePen className="h-4 w-4 text-ink" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink/80">
            {form.code}
          </span>
          {form.oref && <Pill tone="neutral">OREF</Pill>}
        </div>
        <h2 className="mt-1 font-display text-xl leading-tight text-ink">{form.name}</h2>

        {/* Toolbar — hidden on mobile (replaced by bottom sticky bar) */}
        <div className="mt-3 hidden flex-wrap items-center gap-2 sm:flex">
          {/* Auto-fill: record picker + button */}
          <div className="flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white p-1">
            <div className="relative">
              <select
                value={recordKey}
                onChange={(e) => setRecordKey(e.target.value)}
                className="appearance-none rounded-md bg-transparent py-1 pl-2 pr-6 text-[0.76rem] text-ink focus:outline-none"
                aria-label="Choose a listing or lead to auto-fill from"
              >
                <option value="">Pick a listing or lead…</option>
                <optgroup label="Listings">
                  {records.listings.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Leads">
                  {records.leads.map((r) => (
                    <option key={r.key} value={r.key}>{r.label}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/60" />
            </div>
            <button
              onClick={runAutofill}
              disabled={!recordKey}
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-2.5 py-1 text-[0.76rem] font-semibold text-white transition-colors hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FileInput className="h-3.5 w-3.5" /> Auto-fill
            </button>
          </div>

          <ToolbarButton onClick={generate} disabled={aiBusy}>
            {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MatinMark theme="dark" className="h-3.5 w-3.5" />}
            Generate with AI
          </ToolbarButton>

          <ToolbarButton onClick={handleSave}>
            {saved ? <Check className="h-3.5 w-3.5 text-success" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save"}
          </ToolbarButton>

          {form.esign && (
            <ToolbarButton onClick={() => setShowEsignModal(true)} disabled={esignSending}>
              <Send className="h-3.5 w-3.5" />
              Send for e-signature
            </ToolbarButton>
          )}

          <ToolbarButton onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </ToolbarButton>
        </div>

        {/* Mobile: auto-fill row only (buttons are in sticky bar) */}
        <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white p-1 sm:hidden">
          <div className="relative flex-1 min-w-0">
            <select
              value={recordKey}
              onChange={(e) => setRecordKey(e.target.value)}
              className="w-full appearance-none rounded-md bg-transparent py-1 pl-2 pr-6 text-[0.76rem] text-ink focus:outline-none"
              aria-label="Choose a listing or lead to auto-fill from"
            >
              <option value="">Pick a listing or lead…</option>
              <optgroup label="Listings">
                {records.listings.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </optgroup>
              <optgroup label="Leads">
                {records.leads.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/60" />
          </div>
          <button
            onClick={runAutofill}
            disabled={!recordKey}
            className="shrink-0 inline-flex items-center gap-1 rounded-md bg-ink px-2 py-1 text-[0.72rem] font-semibold text-white disabled:opacity-40"
          >
            <FileInput className="h-3 w-3" /> Fill
          </button>
        </div>

        {/* Inline confirmations */}
        {showStrip && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem]">
            {filledFrom && (
              <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                <FileInput className="h-3.5 w-3.5" /> Auto-filled from {filledFrom}
              </span>
            )}
            {saveMessage && (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <Check className="h-3.5 w-3.5" /> {saveMessage}
              </span>
            )}
            {esignConfirm && (
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <Check className="h-3.5 w-3.5" /> {esignConfirm}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable document body */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a1a] px-5 py-5 pb-20 print:overflow-visible sm:pb-5">
        {/* The branded paper */}
        <article className="mx-auto max-w-[640px] rounded-2xl border border-ink/[0.08] bg-white text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,.5)] print:border-0 print:shadow-none">
          {/* Document letterhead */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900/90 px-8 pb-5 pt-8">
            <div className="flex items-center gap-3 text-slate-900">
              <MatinMark className="h-10 w-auto" theme="dark" />
              <div className="leading-none">
                <div className="font-sans text-lg font-semibold tracking-[0.2em]">MATIN</div>
                <div className="mt-1 text-[0.55rem] font-medium tracking-[0.4em] text-slate-500">
                  REAL ESTATE
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {form.code}
              </div>
              <h3 className="mt-0.5 font-display text-lg leading-tight text-slate-900">{form.name}</h3>
              {form.oref && (
                <div className="mt-1 inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white">
                  OREF standard form
                </div>
              )}
            </div>
          </div>

          {/* Compliance strip */}
          {form.compliance && (
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-8 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
              <span className="text-[0.72rem] text-slate-500">{form.compliance}</span>
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-4 px-8 py-6">
            <p className="text-[0.78rem] leading-relaxed text-slate-500">{form.description}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {form.fields.map((f) => (
                <DocField
                  key={f.name}
                  field={f}
                  value={values[f.name] ?? ""}
                  signed={!!signed[f.name]}
                  onChange={(v) => set(f.name, v)}
                  onSign={() => setSigned((p) => ({ ...p, [f.name]: !p[f.name] }))}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-8 pb-7 pt-4">
            <div className="text-[0.66rem] text-slate-400">
              {company.name} · {company.address.city}, {company.address.state} · {company.phone}
            </div>
          </div>
        </article>

        {/* AI drafted clause / copy panel */}
        {(aiOut || aiBusy) && (
          <div className="mx-auto mt-5 max-w-[640px] rounded-2xl border border-white/10 bg-white backdrop-blur-md print:hidden">
            <div className="flex items-center gap-2 border-b border-ink/[0.08] px-4 py-3">
              <MatinMark theme="dark" className="h-4 w-4" />
              <span className="text-[0.82rem] font-semibold text-ink">
                {isListingForm ? "AI-drafted listing copy" : "AI-drafted clause language"}
              </span>
              {aiBusy && <span className="text-[0.72rem] text-slate/70">drafting…</span>}
            </div>
            <div className="px-4 py-3">
              <AiMarkdown text={aiOut} />
              {aiBusy && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom sticky toolbar */}
      <div className="fixed bottom-0 right-0 z-[55] flex w-[min(760px,96vw)] items-center justify-around border-t border-ink/[0.08] bg-white px-4 py-3 sm:hidden print:hidden">
        <button
          onClick={generate}
          disabled={aiBusy}
          className="flex flex-col items-center gap-0.5 text-[0.64rem] font-medium text-ink disabled:opacity-50"
          aria-label="Generate with AI"
        >
          {aiBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <MatinMark theme="dark" className="h-5 w-5" />}
          AI
        </button>
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-0.5 text-[0.64rem] font-medium text-ink"
          aria-label="Save draft"
        >
          {saved ? <Check className="h-5 w-5 text-success" /> : <Save className="h-5 w-5" />}
          Save
        </button>
        {form.esign && (
          <button
            onClick={() => setShowEsignModal(true)}
            className="flex flex-col items-center gap-0.5 text-[0.64rem] font-medium text-ink"
            aria-label="Send for e-signature"
          >
            <Send className="h-5 w-5" />
            Send
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex flex-col items-center gap-0.5 text-[0.64rem] font-medium text-ink"
          aria-label="Print"
        >
          <Printer className="h-5 w-5" />
          Print
        </button>
      </div>
    </>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.12] bg-white px-2.5 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:border-ink/15 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function DocField({
  field,
  value,
  signed,
  onChange,
  onSign,
}: {
  field: ReFormField;
  value: string;
  signed: boolean;
  onChange: (v: string) => void;
  onSign: () => void;
}) {
  const full = field.type === "textarea" || field.type === "signature";
  const inputCls =
    "w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[0.84rem] text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900/20";

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", full && "sm:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-wider text-slate-500">
          {field.label}
          {field.required && <span className="text-danger">*</span>}
        </label>
        {field.autofill && (
          <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide text-white print:hidden">
            <FileInput className="h-2.5 w-2.5" /> auto
          </span>
        )}
      </div>

      {/* Control by type */}
      {field.type === "signature" ? (
        <button
          onClick={onSign}
          className={cn(
            "flex h-12 items-end justify-between rounded-md border border-dashed px-3 pb-1.5 text-left transition-colors",
            signed
              ? "border-slate-900 bg-slate-50"
              : "border-slate-300 hover:border-slate-500 hover:bg-slate-50",
          )}
        >
          <span
            className={cn(
              "font-display text-lg italic",
              signed ? "text-slate-900" : "text-slate-400",
            )}
          >
            {signed ? "Matin Real Estate" : "Sign here"}
          </span>
          <span className="mb-1 text-[0.56rem] uppercase tracking-wider text-slate-400">
            {signed ? "e-signed" : "x ____________"}
          </span>
        </button>
      ) : field.type === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className={cn(inputCls, "resize-y")}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="inline-flex items-center gap-2 text-[0.82rem] text-slate-700">
          <input
            type="checkbox"
            checked={value === "yes"}
            onChange={(e) => onChange(e.target.checked ? "yes" : "")}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
          />
          Yes
        </label>
      ) : (
        <input
          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
          inputMode={field.type === "currency" || field.type === "number" ? "decimal" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.type === "currency" ? "$0" : "—"}
          className={inputCls}
        />
      )}
    </div>
  );
}
