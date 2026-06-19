"use client";

import { useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Wand2,
  Save,
  Send,
  Printer,
  Plus,
  Trash2,
  Check,
  Loader2,
  ShieldCheck,
  Stamp,
  FilePen,
  ChevronDown,
} from "lucide-react";
import type { ReForm, ReFormField, FieldType } from "@/lib/forms";
import { listings, leads, company, getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { Pill } from "@/components/command/ui";

/* ──────────────────────────────────────────────────────────────────────────
   A branded, fully-editable real-estate document template. Every ReFormField
   renders as a live input; AI auto-fill maps a listing/lead record onto the
   autofill fields; "Generate with AI" streams drafted clause/listing copy;
   agents can add or remove custom fields right on the form. This is the
   "fully branded, fully editable & customizable templates" deliverable.
   ────────────────────────────────────────────────────────────────────────── */

type EditableField = ReFormField & { _id: string; custom?: boolean };

let _seq = 0;
const uid = () => `cf-${Date.now().toString(36)}-${_seq++}`;

const FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "currency",
  "date",
  "select",
  "textarea",
  "checkbox",
  "signature",
];

/** Best-effort mapping from a CRM/MLS record onto a form field name. */
function autofillValue(field: ReFormField, record: AutofillRecord): string {
  const n = field.name.toLowerCase();
  const label = field.label.toLowerCase();
  const has = (...keys: string[]) => keys.some((k) => n.includes(k) || label.includes(k));

  if (has("buyer") || has("seller") || has("consumer") || has("client") || has("name"))
    return record.party;
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
          "fixed inset-y-0 right-0 z-50 flex w-[min(760px,96vw)] flex-col border-l border-white/10 bg-ink-900 shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out print:static print:w-full print:border-0 print:shadow-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {form && <FormTemplateInner key={form.code} form={form} onClose={onClose} />}
      </aside>
    </>
  );
}

function FormTemplateInner({ form, onClose }: { form: ReForm; onClose: () => void }) {
  const records = useMemo(buildRecords, []);

  const [fields, setFields] = useState<EditableField[]>(() =>
    form.fields.map((f) => ({ ...f, _id: uid() })),
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [signed, setSigned] = useState<Record<string, boolean>>({});

  const [recordKey, setRecordKey] = useState<string>("");
  const [filledFrom, setFilledFrom] = useState<string | null>(null);

  const [aiOut, setAiOut] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [saved, setSaved] = useState(false);
  const [sent, setSent] = useState(false);

  const allRecords = [...records.listings, ...records.leads];
  const isContract = form.pillar === "Contract Systems";
  const isListingForm = form.category === "Listing";
  const aiTool: "agreement" | "listing-description" = isListingForm
    ? "listing-description"
    : "agreement";

  function set(id: string, v: string) {
    setValues((p) => ({ ...p, [id]: v }));
  }

  /** Map the chosen record onto every autofill field. */
  function runAutofill() {
    if (!recordKey) return;
    const rec = allRecords.find((r) => r.key === recordKey);
    if (!rec) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const f of fields) {
        if (f.autofill) {
          const v = autofillValue(f, rec);
          if (v) next[f._id] = v;
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
    // pull a few field values to feed the model
    const byName = (name: string) => {
      const f = fields.find((x) => x.name === name || x.label.toLowerCase().includes(name));
      return f ? values[f._id] ?? "" : "";
    };
    try {
      if (aiTool === "listing-description") {
        const rec = allRecords.find((r) => r.key === recordKey);
        const lst = listings.find((l) => rec && rec.key === `listing:${l.id}`);
        await streamAi(
          {
            tool: "listing-description",
            input: {
              address: lst?.address ?? byName("property") ?? byName("address"),
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
              party: byName("buyer") || byName("seller") || byName("name") || byName("party"),
              property: byName("property") || byName("address") || byName("area"),
              price: byName("price") || byName("amount") || byName("list"),
              commission: byName("commission") || byName("split"),
              term: byName("term"),
              special: byName("contingen") || byName("change") || byName("note") || "",
            },
          },
          (_c, full) => setAiOut(full),
        );
      }
    } finally {
      setAiBusy(false);
    }
  }

  function addField() {
    setFields((p) => [
      ...p,
      { _id: uid(), name: `custom_${p.length}`, label: "New custom field", type: "text", custom: true },
    ]);
  }
  function removeField(id: string) {
    setFields((p) => p.filter((f) => f._id !== id));
  }
  function renameField(id: string, label: string) {
    setFields((p) => p.map((f) => (f._id === id ? { ...f, label } : f)));
  }
  function retypeField(id: string, type: FieldType) {
    setFields((p) => p.map((f) => (f._id === id ? { ...f, type } : f)));
  }

  function flash(setter: (b: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2400);
  }

  return (
    <>
      {/* Header / toolbar */}
      <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 px-5 py-4 print:hidden">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 pr-10">
          <FilePen className="h-4 w-4 text-azure-bright" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-azure-300">
            Editable template · {form.code}
          </span>
          {form.oref && <Pill tone="azure">OREF</Pill>}
        </div>
        <h2 className="mt-1 font-display text-xl leading-tight text-white">{form.name}</h2>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* AI auto-fill: record picker + button */}
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            <div className="relative">
              <select
                value={recordKey}
                onChange={(e) => setRecordKey(e.target.value)}
                className="appearance-none rounded-md bg-transparent py-1 pl-2 pr-6 text-[0.76rem] text-white focus:outline-none"
                aria-label="Source record for auto-fill"
              >
                <option value="" className="bg-white/[0.06]">
                  Pick a record…
                </option>
                <optgroup label="Listings" className="bg-white/[0.06]">
                  {records.listings.map((r) => (
                    <option key={r.key} value={r.key} className="bg-white/[0.06]">
                      {r.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Leads" className="bg-white/[0.06]">
                  {records.leads.map((r) => (
                    <option key={r.key} value={r.key} className="bg-white/[0.06]">
                      {r.label}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300/60" />
            </div>
            <button
              onClick={runAutofill}
              disabled={!recordKey}
              className="inline-flex items-center gap-1.5 rounded-md bg-azure/15 px-2.5 py-1 text-[0.76rem] font-semibold text-azure-bright ring-1 ring-inset ring-azure/25 transition-colors hover:bg-azure/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Wand2 className="h-3.5 w-3.5" /> AI auto-fill
            </button>
          </div>

          <ToolbarButton onClick={generate} disabled={aiBusy} accent>
            {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {isListingForm ? "Generate listing copy" : "Generate with AI"}
          </ToolbarButton>

          <ToolbarButton onClick={() => flash(setSaved)}>
            {saved ? <Check className="h-3.5 w-3.5 text-success" /> : <Save className="h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save"}
          </ToolbarButton>

          {form.esign ? (
            <ToolbarButton onClick={() => flash(setSent)}>
              {sent ? <Check className="h-3.5 w-3.5 text-success" /> : <Send className="h-3.5 w-3.5" />}
              {sent ? "Sent" : "Send for e-signature"}
            </ToolbarButton>
          ) : null}

          <ToolbarButton onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Export / Print
          </ToolbarButton>
        </div>

        {/* Inline confirmations */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem]">
          {filledFrom && (
            <span className="inline-flex items-center gap-1.5 font-medium text-azure-bright">
              <Wand2 className="h-3.5 w-3.5" /> Auto-filled from {filledFrom}
            </span>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <Check className="h-3.5 w-3.5" /> Draft saved to the transaction record
            </span>
          )}
          {sent && (
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <Check className="h-3.5 w-3.5" /> E-signature request sent · audit-logged
            </span>
          )}
        </div>
      </div>

      {/* Scrollable document body */}
      <div className="flex-1 overflow-y-auto bg-ink-900 px-5 py-5 print:overflow-visible">
        {/* The branded paper */}
        <article className="mx-auto max-w-[640px] rounded-2xl border border-white/10 bg-white text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,.5)] print:border-0 print:shadow-none">
          {/* Document letterhead */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900/90 px-8 pb-5 pt-8">
            <div className="flex items-center gap-3 text-slate-900">
              <MatinMark className="h-10 w-auto" />
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
                <div className="mt-1 inline-flex items-center gap-1 rounded bg-azure/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-azure-deep">
                  OREF standard form
                </div>
              )}
            </div>
          </div>

          {/* Compliance strip */}
          {form.compliance && (
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-8 py-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-azure-deep" />
              <span className="text-[0.72rem] text-slate-500">{form.compliance}</span>
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-4 px-8 py-6">
            <p className="text-[0.78rem] leading-relaxed text-slate-500">{form.description}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <DocField
                  key={f._id}
                  field={f}
                  value={values[f._id] ?? ""}
                  signed={!!signed[f._id]}
                  onChange={(v) => set(f._id, v)}
                  onSign={() => setSigned((p) => ({ ...p, [f._id]: !p[f._id] }))}
                  onRemove={() => removeField(f._id)}
                  onRename={(label) => renameField(f._id, label)}
                  onRetype={(t) => retypeField(f._id, t)}
                />
              ))}
            </div>

            {/* Add custom field — proves "fully customizable" */}
            <button
              onClick={addField}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[0.76rem] font-semibold text-slate-500 transition-colors hover:border-azure hover:text-azure-deep print:hidden"
            >
              <Plus className="h-3.5 w-3.5" /> Add custom field
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-8 pb-7 pt-4">
            <div className="flex items-center gap-1.5 text-[0.66rem] text-slate-400">
              <Stamp className="h-3 w-3" />
              <span>
                Generated by the Matin Hub · {company.address.city}, {company.address.state} ·{" "}
                {company.phone}
              </span>
            </div>
          </div>
        </article>

        {/* AI drafted clause / copy panel */}
        {(aiOut || aiBusy) && (
          <div className="mx-auto mt-5 max-w-[640px] rounded-2xl border border-azure/25 bg-azure/[0.06] print:hidden">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Sparkles className="h-4 w-4 text-azure-bright" />
              <span className="text-[0.82rem] font-semibold text-white">
                {isListingForm ? "AI-drafted listing copy" : "AI-drafted clause language"}
              </span>
              {aiBusy && <span className="text-[0.72rem] text-slate-300/70">streaming live</span>}
            </div>
            <div className="px-4 py-3">
              <AiMarkdown text={aiOut} />
              {aiBusy && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-azure-bright align-middle" />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.76rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        accent
          ? "bg-azure text-white shadow-glow hover:bg-azure-bright"
          : "border border-white/10 bg-white/[0.04] text-slate-300 hover:border-azure/40 hover:text-white",
      )}
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
  onRemove,
  onRename,
  onRetype,
}: {
  field: EditableField;
  value: string;
  signed: boolean;
  onChange: (v: string) => void;
  onSign: () => void;
  onRemove: () => void;
  onRename: (label: string) => void;
  onRetype: (t: FieldType) => void;
}) {
  const full = field.type === "textarea" || field.type === "signature";
  const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[0.84rem] text-slate-900 placeholder:text-slate-300 focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure/30";

  return (
    <div className={cn("group/field flex flex-col gap-1", full && "sm:col-span-2")}>
      <div className="flex items-center justify-between gap-2">
        {field.custom ? (
          <input
            value={field.label}
            onChange={(e) => onRename(e.target.value)}
            className="w-full rounded border-b border-dashed border-slate-300 bg-transparent text-[0.66rem] font-semibold uppercase tracking-wider text-slate-500 focus:border-azure focus:outline-none"
            aria-label="Field label"
          />
        ) : (
          <label className="flex items-center gap-1.5 text-[0.66rem] font-semibold uppercase tracking-wider text-slate-500">
            {field.label}
            {field.required && <span className="text-danger">*</span>}
          </label>
        )}

        <div className="flex items-center gap-1">
          {field.autofill && (
            <span className="inline-flex items-center gap-1 rounded bg-azure/10 px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide text-azure-deep print:hidden">
              <Wand2 className="h-2.5 w-2.5" /> auto
            </span>
          )}
          {field.custom && (
            <>
              <select
                value={field.type}
                onChange={(e) => onRetype(e.target.value as FieldType)}
                className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[0.56rem] text-slate-500 focus:outline-none print:hidden"
                aria-label="Field type"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                onClick={onRemove}
                aria-label="Remove field"
                className="text-slate-300 transition-colors hover:text-danger print:hidden"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Control by type */}
      {field.type === "signature" ? (
        <button
          onClick={onSign}
          className={cn(
            "flex h-12 items-end justify-between rounded-md border border-dashed px-3 pb-1.5 text-left transition-colors",
            signed
              ? "border-azure bg-azure/[0.06]"
              : "border-slate-300 hover:border-azure/60 hover:bg-slate-50",
          )}
        >
          <span
            className={cn(
              "font-display text-lg italic",
              signed ? "text-azure-deep" : "text-slate-300",
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
            className="h-4 w-4 rounded border-slate-300 text-azure focus:ring-azure/30"
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
