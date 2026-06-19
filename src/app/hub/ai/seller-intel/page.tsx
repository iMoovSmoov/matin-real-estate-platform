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
const FIRST_LEAD = sellerLeads[0];
const TRY_EXAMPLE: Preset = FIRST_LEAD
  ? {
      label: "Try with pipeline seller",
      values: {
        address: FIRST_LEAD.address,
        city: FIRST_LEAD.city,
        estValue: String(FIRST_LEAD.estValue),
        condition: FIRST_LEAD.condition,
        motivation: motivationKeyword(FIRST_LEAD.motivation),
        timeline: FIRST_LEAD.timeline,
        notes: FIRST_LEAD.notes ?? "",
      },
    }
  : { label: "Try with example", values: {} };

export default function SellerIntelPage() {
  const [selectedId, setSelectedId] = useState<string>("");

  const activeLead = sellerLeads.find((s) => s.id === selectedId);

  const initial: Record<string, string> = activeLead
    ? {
        address: activeLead.address,
        city: activeLead.city,
        estValue: `$${activeLead.estValue.toLocaleString()}`,
        condition: activeLead.condition,
        motivation: motivationKeyword(activeLead.motivation),
        timeline: activeLead.timeline,
        notes: activeLead.notes,
      }
    : {};

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink md:text-3xl">Seller Intel</h1>
        <p className="mt-1 text-[0.92rem] text-slate">
          Build your seller intelligence brief before the first call.
        </p>
      </div>

      {/* How-to callout */}
      <div className="flex items-start gap-2.5 rounded-xl border border-ink/[0.08] bg-paper px-4 py-3">
        <span className="mt-0.5 shrink-0 text-ink/40">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7.5 5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.5 7V10.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-[0.78rem] leading-relaxed text-slate">
          Load a seller from the Cash Offer Pipeline or fill in the details manually. The output is a
          printable cheat sheet — cash range, net-to-seller table, a phone script, and urgency signals.
        </p>
      </div>

      {/* Load from Cash Offer Pipeline select */}
      <div className="flex items-center gap-3 rounded-xl border border-ink/[0.08] bg-white px-4 py-3">
        <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate/60">
          Load from Pipeline
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.85rem] text-ink transition-colors focus:border-ink/40 focus:outline-none"
        >
          <option value="">— choose a seller lead to auto-fill —</option>
          {sellerLeads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.sellerName} — {s.address}, {s.city}
            </option>
          ))}
        </select>
        {selectedId && (
          <button
            type="button"
            onClick={() => setSelectedId("")}
            className="shrink-0 text-[0.75rem] text-slate/50 hover:text-ink transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tool panel — re-key on selectedId so AiToolPanel resets when seller changes */}
      <AiToolPanel
        key={selectedId || "__blank__"}
        tool="seller-intel"
        tryExample={!selectedId ? TRY_EXAMPLE : undefined}
        title="Seller Intel"
        pillar="Acquisitions"
        description="Generate a seller intelligence brief — cash offer range, cash vs. list comparison table, a ready-to-use phone script, and urgency signals. Print it before your first call."
        submitLabel="Build seller brief"
        outputTitle="Seller intelligence brief"
        printable
        initial={initial}
        fields={[
          { name: "address", label: "Property address", placeholder: "4218 SW Terwilliger Blvd", full: true },
          { name: "city", label: "City", placeholder: "Portland, OR" },
          { name: "estValue", label: "Estimated value ($)", placeholder: "$875,000" },
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
            label: "Timeline",
            type: "select",
            options: ["ASAP", "1-3 months", "3-6 months", "Flexible"],
          },
          {
            name: "notes",
            label: "Additional context",
            type: "textarea",
            placeholder: "Tenant occupied, pre-inspection done, family coordinating sale…",
            full: true,
            optional: true,
          },
        ]}
      />
    </div>
  );
}
