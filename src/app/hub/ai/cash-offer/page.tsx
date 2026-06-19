"use client";

import { useState } from "react";
import { sellerLeads } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

// Derive motivation keyword from free-text motivation field
function motivationKeyword(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("downsize") || t.includes("downsizing")) return "Downsizing";
  if (t.includes("upsize") || t.includes("upsizing") || t.includes("larger")) return "Upgrading";
  if (t.includes("relocat") || t.includes("job") || t.includes("work") || t.includes("transfer")) return "Relocation";
  if (t.includes("financ") || t.includes("mortgage") || t.includes("debt")) return "Financial";
  if (t.includes("divorc")) return "Divorce";
  if (t.includes("inherit") || t.includes("estate") || t.includes("probate") || t.includes("passing")) return "Estate";
  return "Other";
}

// One-click demo using first seller lead
const FIRST = sellerLeads[0];
const TRY_EXAMPLE: Preset = FIRST
  ? {
      label: "Try with pipeline seller",
      values: {
        address: FIRST.address,
        city: FIRST.city,
        beds: String(FIRST.beds),
        baths: String(FIRST.baths),
        sqft: String(FIRST.sqft),
        yearBuilt: String(FIRST.yearBuilt),
        estValue: String(FIRST.estValue),
        condition: FIRST.condition,
        motivation: motivationKeyword(FIRST.motivation),
        timeline: FIRST.timeline,
        notes: FIRST.notes ?? "",
      },
    }
  : { label: "Try with example", values: {} };

export default function CashOfferPage() {
  const [selectedId, setSelectedId] = useState<string>("");

  const activeLead = sellerLeads.find((s) => s.id === selectedId);

  const initial: Record<string, string> = activeLead
    ? {
        address: activeLead.address,
        city: activeLead.city,
        beds: String(activeLead.beds),
        baths: String(activeLead.baths),
        sqft: String(activeLead.sqft),
        yearBuilt: String(activeLead.yearBuilt),
        estValue: `$${activeLead.estValue.toLocaleString()}`,
        condition: activeLead.condition,
        motivation: motivationKeyword(activeLead.motivation),
        timeline: activeLead.timeline,
        notes: activeLead.notes,
      }
    : {};

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4 sm:space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Cash Offer Evaluator</h1>
        <p className="mt-1 text-[0.92rem] text-slate">
          Generate a professional cash offer evaluation with Net-to-Seller breakdown.
        </p>
      </div>

      {/* Load from Cash Offer Pipeline select */}
      <div className="flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60">
          Load from Pipeline
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-ink/40 focus:outline-none"
        >
          <option value="">— choose a seller lead to auto-fill —</option>
          {sellerLeads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sellerName} — {s.address}, {s.city}
            </option>
          ))}
        </select>
        {selectedId && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Seller loaded
          </span>
        )}
      </div>

      {/* Tool panel */}
      <AiToolPanel
        key={selectedId || "__blank__"}
        tool="cash-offer"
        tryExample={!selectedId ? TRY_EXAMPLE : undefined}
        title="Cash Offer Evaluator"
        pillar="Acquisitions"
        description="Build a full cash offer evaluation — estimated ARV, wholesale range, net-to-seller breakdown, and a recommended offer. Load a pipeline lead or enter property details manually."
        submitLabel="Generate evaluation"
        outputTitle="Cash offer evaluation"
        printable
        initial={initial}
        fields={[
          { name: "address", label: "Property address", placeholder: "9315 SE McLoughlin Blvd", full: true },
          { name: "city", label: "City", placeholder: "Milwaukie, OR" },
          { name: "beds", label: "Beds", type: "number", placeholder: "3" },
          { name: "baths", label: "Baths", type: "number", placeholder: "2" },
          { name: "sqft", label: "Square feet", type: "number", placeholder: "1620" },
          { name: "yearBuilt", label: "Year built", type: "number", placeholder: "1972" },
          { name: "estValue", label: "Estimated value (ARV)", placeholder: "$545,000" },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: ["Excellent", "Good", "Fair", "Needs Work"],
          },
          {
            name: "motivation",
            label: "Seller motivation",
            type: "select",
            options: ["Downsizing", "Upgrading", "Relocation", "Financial", "Divorce", "Estate", "Other"],
          },
          {
            name: "timeline",
            label: "Seller timeline",
            type: "select",
            options: ["ASAP", "1-3 months", "3-6 months", "6+ months"],
          },
          {
            name: "notes",
            label: "Additional notes",
            type: "textarea",
            placeholder: "Tenant occupied, deferred maintenance, probate completed…",
            full: true,
          },
        ]}
      />
    </div>
  );
}
