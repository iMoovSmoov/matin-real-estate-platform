"use client";

import { useState } from "react";
import { buyerAgreements } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

// One-click demo using first buyer agreement
const FIRST_BUYER = buyerAgreements[0];
const TRY_EXAMPLE: Preset = FIRST_BUYER
  ? {
      label: "Try with buyer agreement",
      values: {
        docType: "Buyer Representation Agreement",
        party: `Buyer — ${FIRST_BUYER.name}`,
        property: `${FIRST_BUYER.areas.join(" / ")} metro · up to $${FIRST_BUYER.budgetMax.toLocaleString()}`,
        price: `$${FIRST_BUYER.budgetMin.toLocaleString()} – $${FIRST_BUYER.budgetMax.toLocaleString()}`,
        commission: "2.5% buyer-side, seller-paid where available",
        term: FIRST_BUYER.timeline === "Immediately" ? "60 days exclusive" : "90 days exclusive",
        special: FIRST_BUYER.notes ?? "Pre-approved buyer, immediate timeline.",
      },
    }
  : { label: "Try with example", values: {} };

const OREGON_DOC_TYPES = [
  "Buyer Representation Agreement",
  "Exclusive Right to Sell Listing Agreement",
  "Exclusive Agency Listing Agreement",
  "Purchase and Sale Agreement Summary",
  "Property Management Agreement",
];

export default function AgreementsPage() {
  const [selectedId, setSelectedId] = useState<string>("");

  const activeBuyer = buyerAgreements.find((b) => b.id === selectedId);

  const initial: Record<string, string> = activeBuyer
    ? {
        docType: "Buyer Representation Agreement",
        party: `Buyer — ${activeBuyer.name}`,
        property: `${activeBuyer.areas.join(" / ")} metro`,
        price: `$${activeBuyer.budgetMin.toLocaleString()} – $${activeBuyer.budgetMax.toLocaleString()}`,
        commission: "2.5% buyer-side, seller-paid where available",
        term: activeBuyer.timeline === "Immediately" ? "60 days exclusive" : `${activeBuyer.timeline} exclusive`,
        special: activeBuyer.notes,
      }
    : {};

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4 sm:space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Agreements</h1>
        <p className="mt-1 text-[0.92rem] text-slate">
          Generate professional Oregon real estate agreement language.
        </p>
      </div>

      {/* Legal disclaimer banner */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <span className="mt-0.5 shrink-0 text-amber-600">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7.5 1L14 13.5H1L7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M7.5 6V9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="7.5" cy="11.5" r="0.75" fill="currentColor" />
          </svg>
        </span>
        <p className="text-[0.78rem] leading-relaxed text-amber-800">
          <strong>Drafting aid only — not legal advice.</strong> Output is a starting point for attorney or broker review.
          Oregon requires licensed broker approval before any agreement language is used with clients.
        </p>
      </div>

      {/* Load from CRM select */}
      <div className="flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60">
          Load from CRM
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-ink/40 focus:outline-none"
        >
          <option value="">— choose a buyer to auto-fill —</option>
          {buyerAgreements.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.areas.join(", ")} · ${Math.round(b.budgetMin / 1000)}k–${Math.round(b.budgetMax / 1000)}k
            </option>
          ))}
        </select>
        {selectedId && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Buyer loaded
          </span>
        )}
      </div>

      {/* Tool panel */}
      <AiToolPanel
        key={selectedId || "__blank__"}
        tool="agreement"
        tryExample={!selectedId ? TRY_EXAMPLE : undefined}
        title="Agreements"
        pillar="Contracts"
        description="Generate clear, organized Oregon listing & buyer-representation agreement language from your terms — plain-English clauses with broker/legal-review flags. A drafting aid, not legal advice."
        submitLabel="Generate language"
        outputTitle="Agreement language"
        printable
        initial={initial}
        fields={[
          {
            name: "docType",
            label: "Document type",
            type: "select",
            options: OREGON_DOC_TYPES,
            full: true,
          },
          { name: "party", label: "Client name", placeholder: "Seller — Logan Lopez  or  Buyer — Sarah Kim" },
          {
            name: "property",
            label: "Property / area",
            placeholder: "8457 NW Lakeshore Ave, Vancouver, WA",
          },
          { name: "price", label: "Price / budget range", placeholder: "$1,580,000" },
          { name: "commission", label: "Commission", placeholder: "2.5% listing side", optional: true },
          { name: "term", label: "Term", placeholder: "6 months exclusive", optional: true },
          {
            name: "special",
            label: "Special terms",
            type: "textarea",
            placeholder: "Photography included, staging consult, contingencies, earnest money…",
            full: true,
            optional: true,
          },
        ]}
      />
    </div>
  );
}
