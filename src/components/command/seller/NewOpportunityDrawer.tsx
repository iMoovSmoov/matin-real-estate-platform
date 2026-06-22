"use client";

import { useState } from "react";
import { CirclePlus } from "lucide-react";
import type {
  SellerLead,
  SellerTimeline,
  PropertyCondition,
} from "@/lib/types";
import { salesAgents } from "@/lib/data";
import { RecordDrawer } from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — "+ Add opportunity" form drawer

   A real create flow (build-reference §3.8 "every screen lets the user DO work
   immediately"). Submit builds a fully-typed SellerLead and hands it to the
   parent, which appends it to local state so it appears in the pipeline + list
   immediately — no fake placeholder, no AI panel.
   ────────────────────────────────────────────────────────────────────────── */

const TIMELINES: SellerTimeline[] = ["ASAP", "1-3 months", "3-6 months", "6+ months"];
const CONDITIONS: PropertyCondition[] = ["Excellent", "Good", "Fair", "Needs Work"];

const EMPTY = {
  sellerName: "",
  address: "",
  city: "",
  estValue: "",
  beds: "3",
  baths: "2",
  sqft: "",
  yearBuilt: "",
  condition: "Good" as PropertyCondition,
  timeline: "1-3 months" as SellerTimeline,
  assignedAgent: salesAgents[0]?.slug ?? "jordan-matin",
  source: "Home Value Page",
  motivation: "",
};

export function NewOpportunityDrawer({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (lead: SellerLead) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const valid =
    form.sellerName.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    Number(form.estValue) > 0;

  function submit() {
    if (!valid) return;
    const estValue = Number(form.estValue);
    const lead: SellerLead = {
      id: `SL-NEW-${Date.now()}`,
      sellerName: form.sellerName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      estValue,
      beds: Number(form.beds) || 3,
      baths: Number(form.baths) || 2,
      sqft: Number(form.sqft) || 1800,
      yearBuilt: Number(form.yearBuilt) || 1995,
      condition: form.condition,
      timeline: form.timeline,
      motivation:
        form.motivation.trim() ||
        "New home-value inquiry — needs qualification and a CMA.",
      stage: "New Request",
      assignedAgent: form.assignedAgent,
      daysInStage: 0,
      notes:
        form.motivation.trim() ||
        "Manually added opportunity — confirm contact details and pull comps.",
      source: form.source,
      signals: ["Manually added", `${form.timeline} timeline`],
    };
    onCreate(lead);
    setForm({ ...EMPTY });
    onClose();
  }

  return (
    <RecordDrawer
      open={open}
      onClose={onClose}
      title="New seller opportunity"
      subtitle="Adds straight into the Signal-detected column"
      actions={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-mist bg-cloud px-3.5 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CirclePlus className="h-4 w-4" aria-hidden />
            Add opportunity
          </button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-4"
      >
        <Field label="Seller name" required>
          <input
            value={form.sellerName}
            onChange={(e) => set("sellerName", e.target.value)}
            placeholder="e.g. Sarah Mitchell"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field label="Property address" required>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="5127 SW Cedar Hills Blvd"
              className={inputCls}
            />
          </Field>
          <Field label="City" required>
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Beaverton"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Est. home value ($)" required>
            <input
              inputMode="numeric"
              value={form.estValue}
              onChange={(e) => set("estValue", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="812000"
              className={inputCls}
            />
          </Field>
          <Field label="Living area (sqft)">
            <input
              inputMode="numeric"
              value={form.sqft}
              onChange={(e) => set("sqft", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="2410"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Beds">
            <input
              inputMode="numeric"
              value={form.beds}
              onChange={(e) => set("beds", e.target.value.replace(/[^\d]/g, ""))}
              className={inputCls}
            />
          </Field>
          <Field label="Baths">
            <input
              inputMode="numeric"
              value={form.baths}
              onChange={(e) => set("baths", e.target.value.replace(/[^\d]/g, ""))}
              className={inputCls}
            />
          </Field>
          <Field label="Year built">
            <input
              inputMode="numeric"
              value={form.yearBuilt}
              onChange={(e) => set("yearBuilt", e.target.value.replace(/[^\d]/g, ""))}
              placeholder="1999"
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Condition">
            <select
              value={form.condition}
              onChange={(e) => set("condition", e.target.value as PropertyCondition)}
              className={inputCls}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timeline">
            <select
              value={form.timeline}
              onChange={(e) => set("timeline", e.target.value as SellerTimeline)}
              className={inputCls}
            >
              {TIMELINES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Assign to agent">
          <select
            value={form.assignedAgent}
            onChange={(e) => set("assignedAgent", e.target.value)}
            className={inputCls}
          >
            {salesAgents.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Motivation / notes">
          <textarea
            rows={3}
            value={form.motivation}
            onChange={(e) => set("motivation", e.target.value)}
            placeholder="Exploring a move-up; curious what the home is worth in today's market."
            className={`${inputCls} resize-none`}
          />
        </Field>

        <p className="text-[0.72rem] leading-relaxed text-slate">
          Lands in <span className="font-medium text-ink">Signal detected</span> with a
          seller-intent score, ready for first outreach. We&rsquo;ll start tracking their
          home value, equity, and activity.
        </p>
      </form>
    </RecordDrawer>
  );
}

const inputCls =
  "w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] text-ink outline-none transition-colors placeholder:text-slate/55 focus:border-ink/30 focus:ring-2 focus:ring-ink/10";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
    </label>
  );
}
