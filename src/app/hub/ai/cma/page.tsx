"use client";

import { useState } from "react";
import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";
import { Building2, CheckCircle2 } from "lucide-react";

// ── One-click demo example ───────────────────────────────────────────────────
const EXAMPLE = listings.find((l) => l.status !== "Sold") ?? listings[0];
const TRY_EXAMPLE: Preset = {
  label: "Try with active listing",
  values: {
    address: EXAMPLE.address,
    city: `${EXAMPLE.city}, ${EXAMPLE.state}`,
    beds: String(EXAMPLE.beds),
    baths: String(EXAMPLE.baths),
    sqft: String(EXAMPLE.sqft),
    yearBuilt: String(EXAMPLE.yearBuilt),
    notes: EXAMPLE.features?.slice(0, 3).join(", ") ?? "",
    target: `$${EXAMPLE.price.toLocaleString()}`,
  },
};

// ── Presets (non-sold, up to 4) for quick-fill buttons ──────────────────────
const presets: Preset[] = listings
  .filter((l) => l.status !== "Sold")
  .slice(0, 4)
  .map((l) => {
    const community = getCommunity(l.communitySlug)?.name ?? l.city;
    return {
      label: `${l.address.split(" ").slice(0, 2).join(" ")} · ${l.city}`,
      hint: `Subject in ${community}`,
      values: {
        address: l.address,
        city: `${l.city}, ${l.state}`,
        beds: String(l.beds),
        baths: String(l.baths),
        sqft: String(l.sqft),
        yearBuilt: String(l.yearBuilt),
        notes: `${l.type}; ${l.features.slice(0, 3).join(", ")}; ${l.daysOnMarket} days on market.`,
        target: `$${l.price.toLocaleString()}`,
      },
    };
  });

// ── All listings for the database selector ───────────────────────────────────
const allListingOptions = listings.map((l) => ({
  id: l.id,
  label: `${l.address} · ${l.city}, ${l.state}`,
  values: {
    address: l.address,
    city: `${l.city}, ${l.state}`,
    beds: String(l.beds),
    baths: String(l.baths),
    sqft: String(l.sqft),
    yearBuilt: String(l.yearBuilt),
    notes: `${l.type}; ${l.features?.slice(0, 3).join(", ") ?? ""}; ${l.daysOnMarket} days on market.`,
    target: `$${l.price.toLocaleString()}`,
  },
  shortLabel: l.address,
}));

export default function CmaPage() {
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [presetOverride, setPresetOverride] = useState<Preset | null>(null);

  function handleListingSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      setLoadedAddress(null);
      setPresetOverride(null);
      return;
    }
    const opt = allListingOptions.find((o) => o.id === id);
    if (!opt) return;
    setLoadedAddress(opt.shortLabel);
    setPresetOverride({ label: opt.shortLabel, values: opt.values });
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-5">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          CMA Generator
        </h1>
        <p className="mt-1 text-[0.92rem] leading-relaxed text-slate">
          Generate a full Comparative Market Analysis for any property — suggested
          price range, comparable-sale talking points, market posture, and a
          one-line recommendation.
        </p>
      </div>

      {/* ── "Load from database" selector ────────────────────────────────── */}
      <div className="mb-5 flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Building2 className="h-4 w-4 text-ink/40" />
          <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/60 shrink-0">
            Load from listings
          </span>
        </div>
        <select
          defaultValue=""
          onChange={handleListingSelect}
          className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-sm text-ink transition-colors focus:border-ink/40 focus:outline-none"
        >
          <option value="">— or load a listing from database —</option>
          {allListingOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {loadedAddress && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Loaded: {loadedAddress}
          </span>
        )}
      </div>

      <AiToolPanel
          tool="cma"
          title="CMA Generator"
          pillar="Pricing"
          description="Generate a decisive comparative market analysis — a suggested list-price range with reasoning, comparable-sale talking points, current market posture, and a one-line recommendation."
          submitLabel="Generate CMA"
          outputTitle="Comparative market analysis"
          presets={presets}
          presetLabel="Quick-fill a subject property"
          printable
          outputMinHeight={700}
          reportBannerLabel="COMPARATIVE MARKET ANALYSIS"
          reportBannerSub="Prepared by Matin Real Estate · (503) 622-9624"
          externalPreset={presetOverride ?? undefined}
          tryExample={!loadedAddress ? TRY_EXAMPLE : undefined}
          fields={[
            {
              name: "address",
              label: "Subject address",
              placeholder: "3302 Tannler Dr",
              full: true,
            },
            { name: "city", label: "City", placeholder: "West Linn, OR" },
            {
              name: "beds",
              label: "Beds",
              type: "number",
              placeholder: "5",
            },
            {
              name: "baths",
              label: "Baths",
              type: "number",
              placeholder: "3.5",
            },
            {
              name: "sqft",
              label: "Square feet",
              type: "number",
              placeholder: "3582",
            },
            {
              name: "yearBuilt",
              label: "Year built",
              type: "number",
              placeholder: "1980",
            },
            {
              name: "notes",
              label: "Condition / notes",
              type: "textarea",
              placeholder: "Recently renovated kitchen, river frontage…",
              full: true,
              optional: true,
            },
            {
              name: "target",
              label: "Seller's target price",
              placeholder: "$1,370,000",
              full: true,
              prefix: "$",
              optional: true,
            },
          ]}
      />
    </div>
  );
}
