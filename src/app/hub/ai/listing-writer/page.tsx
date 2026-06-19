"use client";

import { useState } from "react";
import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";

// One-click demo example using first active listing
const EXAMPLE_LISTING = listings.find((l) => l.status !== "Sold") ?? listings[0];
const TRY_EXAMPLE: Preset = {
  label: "Try with active listing",
  values: {
    address: EXAMPLE_LISTING.address,
    city: `${EXAMPLE_LISTING.city}, ${EXAMPLE_LISTING.state}`,
    type: EXAMPLE_LISTING.type,
    beds: String(EXAMPLE_LISTING.beds),
    baths: String(EXAMPLE_LISTING.baths),
    sqft: String(EXAMPLE_LISTING.sqft),
    yearBuilt: String(EXAMPLE_LISTING.yearBuilt),
    price: `$${EXAMPLE_LISTING.price.toLocaleString()}`,
    features: EXAMPLE_LISTING.features?.slice(0, 4).join(", ") ?? "Renovated kitchen, hardwood floors, mountain views",
  },
};

// Build presets from the full listings array
const ALL_PRESETS: (Preset & { id: string })[] = listings.map((l) => {
  const community = getCommunity(l.communitySlug)?.name ?? l.city;
  return {
    id: l.id,
    label: `${l.address.split(" ").slice(0, 2).join(" ")} · ${l.city}`,
    hint: `${l.beds}bd/${l.baths}ba · ${l.sqft.toLocaleString()} sqft`,
    values: {
      address: l.address,
      city: `${l.city}, ${l.state}`,
      beds: String(l.beds),
      baths: String(l.baths),
      sqft: String(l.sqft),
      yearBuilt: String(l.yearBuilt),
      type: l.type,
      price: `$${l.price.toLocaleString()}`,
      features: [...l.features, `Located in ${community}`].slice(0, 6).join(", "),
    },
  };
});

export default function ListingWriterPage() {
  const [selectedId, setSelectedId] = useState<string>("");

  const activePreset = ALL_PRESETS.find((p) => p.id === selectedId);
  const initial = activePreset?.values ?? {};

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4 sm:space-y-5">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Listing Writer</h1>
        <p className="mt-1 text-[0.92rem] text-slate">Write MLS-ready listing descriptions that sell.</p>
      </div>

      {/* Load from Listings select */}
      <div className="flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="shrink-0 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60">
          Load from Listings
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-ink/40 focus:outline-none"
        >
          <option value="">— choose a listing to auto-fill —</option>
          {ALL_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.hint}
            </option>
          ))}
        </select>
        {selectedId && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            Listing loaded
          </span>
        )}
      </div>

      {/* Tool panel — re-key on selectedId so AiToolPanel resets when listing changes */}
      <AiToolPanel
        key={selectedId || "__blank__"}
        tool="listing-description"
        title="Listing Writer"
        pillar="Marketing"
        description="Turn raw property facts into a vivid, MLS-ready listing description — lifestyle hook first, standout features woven in, fair-housing compliant."
        submitLabel="Write description"
        outputTitle="MLS description"
        tryExample={!selectedId ? TRY_EXAMPLE : undefined}
        initial={initial}
        fields={[
          { name: "address", label: "Address", placeholder: "8457 NW Lakeshore Ave", full: true },
          { name: "city", label: "City", placeholder: "Vancouver, WA" },
          { name: "type", label: "Property type", placeholder: "Single Family" },
          { name: "beds", label: "Beds", type: "number", placeholder: "5" },
          { name: "baths", label: "Baths", type: "number", placeholder: "4" },
          { name: "sqft", label: "Square feet", type: "number", placeholder: "2624" },
          { name: "yearBuilt", label: "Year built", type: "number", placeholder: "1974" },
          { name: "price", label: "List price", placeholder: "$1,580,000" },
          {
            name: "features",
            label: "Standout features",
            type: "textarea",
            placeholder: "ADU / guest suite, mountain views, hardwoods…",
            full: true,
            optional: true,
          },
        ]}
      />
    </div>
  );
}
