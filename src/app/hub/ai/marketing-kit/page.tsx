"use client";

import { useState } from "react";
import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";
import { Megaphone, CheckCircle2 } from "lucide-react";

// One-click demo example using first active listing
const EXAMPLE = listings.find((l) => l.status !== "Sold") ?? listings[0];
const community = getCommunity(EXAMPLE.communitySlug)?.name ?? EXAMPLE.city;
const TRY_EXAMPLE: Preset = {
  label: "Try with active listing",
  values: {
    address: EXAMPLE.address,
    city: `${EXAMPLE.city}, ${EXAMPLE.state}`,
    beds: String(EXAMPLE.beds),
    baths: String(EXAMPLE.baths),
    sqft: String(EXAMPLE.sqft),
    yearBuilt: String(EXAMPLE.yearBuilt),
    price: `$${EXAMPLE.price.toLocaleString()}`,
    features: EXAMPLE.features?.slice(0, 4).join(", ") ?? "Renovated kitchen, hardwood floors, mountain views",
    highlights: `${community} neighborhood, top-rated schools, minutes to downtown`,
  },
};

// All listings for the database selector
const ALL_LISTING_OPTIONS = listings.map((l) => {
  const comm = getCommunity(l.communitySlug)?.name ?? l.city;
  return {
    id: l.id,
    label: `${l.address} · ${l.city}, ${l.state}`,
    shortLabel: l.address,
    values: {
      address: l.address,
      city: `${l.city}, ${l.state}`,
      beds: String(l.beds),
      baths: String(l.baths),
      sqft: String(l.sqft),
      yearBuilt: String(l.yearBuilt),
      price: `$${l.price.toLocaleString()}`,
      features: l.features?.slice(0, 4).join(", ") ?? "",
      highlights: `${comm} neighborhood, ${l.type?.toLowerCase() ?? "single family"}, ${l.daysOnMarket === 0 ? "just listed" : `${l.daysOnMarket} days on market`}`,
    },
  };
});

export default function MarketingKitPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);

  function handleListingSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      setSelectedId("");
      setLoadedAddress(null);
      return;
    }
    setSelectedId(id);
    const opt = ALL_LISTING_OPTIONS.find((o) => o.id === id);
    if (opt) setLoadedAddress(opt.shortLabel);
  }

  const activePreset = ALL_LISTING_OPTIONS.find((o) => o.id === selectedId);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4">
      {/* Page header */}
      <div>
        <h1 className="font-display text-2xl text-ink md:text-3xl">Marketing Kit</h1>
        <p className="mt-1 text-[0.92rem] text-slate">
          Generate a complete listing marketing kit — MLS copy, Instagram, Facebook, email blast, and open house invite.
        </p>
      </div>

      {/* Load from Listings select */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-ink/[0.08] bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Megaphone className="h-4 w-4 text-ink/50" />
          <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
            Load from Listings
          </span>
        </div>
        <div className="flex flex-1 items-center gap-3">
          <select
            value={selectedId}
            onChange={handleListingSelect}
            className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.84rem] text-ink transition-colors focus:border-ink/40 focus:outline-none"
          >
            <option value="">— choose a listing to auto-fill all fields —</option>
            {ALL_LISTING_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          {loadedAddress && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.75rem] font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {loadedAddress}
            </span>
          )}
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={() => { setSelectedId(""); setLoadedAddress(null); }}
            className="shrink-0 text-[0.75rem] text-slate/50 hover:text-ink transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tool panel */}
      <AiToolPanel
        key={selectedId || "__blank__"}
        tool="marketing-kit"
        title="Marketing Kit"
        pillar="Marketing"
        description="One click generates five ready-to-paste assets — MLS description, Instagram caption, Facebook post, email blast, and open house invite. Load a listing or fill in the details."
        submitLabel="Generate full marketing kit"
        outputTitle="Marketing kit"
        printable
        outputMinHeight={750}
        tryExample={!selectedId ? TRY_EXAMPLE : undefined}
        initial={activePreset?.values ?? {}}
        fields={[
          { name: "address", label: "Property address", placeholder: "8457 NW Lakeshore Ave", full: true },
          { name: "city", label: "City / state", placeholder: "Vancouver, WA" },
          { name: "beds", label: "Beds", type: "number", placeholder: "5" },
          { name: "baths", label: "Baths", type: "number", placeholder: "4" },
          { name: "sqft", label: "Square feet", type: "number", placeholder: "2,624" },
          { name: "yearBuilt", label: "Year built", type: "number", placeholder: "1974" },
          { name: "price", label: "List price", placeholder: "$1,580,000" },
          {
            name: "features",
            label: "Top 3–4 standout features",
            type: "textarea",
            placeholder: "ADU / guest suite, mountain views, chef's kitchen, hardwood floors…",
            full: true,
            optional: true,
          },
          {
            name: "highlights",
            label: "Neighborhood highlights",
            type: "textarea",
            placeholder: "Top-rated schools, minutes to downtown, quiet cul-de-sac…",
            full: true,
            optional: true,
          },
        ]}
      />
    </div>
  );
}
