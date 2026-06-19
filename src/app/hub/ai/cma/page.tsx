"use client";

import { useState } from "react";
import Link from "next/link";
import { listings, getCommunity } from "@/lib/data";
import { AiToolPanel, type Preset } from "@/components/command/AiToolPanel";
import { BarChart2, Building2, CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  beds: l.beds,
  city: l.city,
}));

export default function CmaPage() {
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [presetOverride, setPresetOverride] = useState<Preset | null>(null);
  const [subjectBeds, setSubjectBeds] = useState<number | null>(null);
  const [subjectCity, setSubjectCity] = useState<string | null>(null);
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [compNotes, setCompNotes] = useState<Record<string, string>>({});

  function handleListingSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      setLoadedAddress(null);
      setPresetOverride(null);
      setSubjectBeds(null);
      setSubjectCity(null);
      setSelectedComps([]);
      setCompNotes({});
      return;
    }
    const opt = allListingOptions.find((o) => o.id === id);
    if (!opt) return;
    setLoadedAddress(opt.shortLabel);
    setSubjectBeds(opt.beds);
    setSubjectCity(opt.city);
    setSelectedComps([]);
    setCompNotes({});

    // Build the preset values; append any selected comp data to notes
    const baseValues = { ...opt.values };
    setPresetOverride({ label: opt.shortLabel, values: baseValues });
  }

  // Derive comp candidates: Sold listings in same city with beds ±1
  const compCandidates =
    subjectBeds !== null && subjectCity
      ? listings
          .filter(
            (l) =>
              l.status === "Sold" &&
              Math.abs(l.beds - subjectBeds) <= 1 &&
              l.city.toLowerCase() === subjectCity.toLowerCase()
          )
          .slice(0, 8)
      : [];

  // Build the effective preset including selected comp data in notes
  function buildEffectivePreset(): Preset | null {
    if (!presetOverride) return null;
    if (selectedComps.length === 0) return presetOverride;

    const selectedCompData = selectedComps
      .map((id) => {
        const l = listings.find((listing) => listing.id === id);
        if (!l) return null;
        const note = compNotes[id] ? `; notes: ${compNotes[id]}` : "";
        return `${l.address} — ${l.beds}bd/${l.baths}ba, ${l.sqft.toLocaleString()}sqft, sold $${l.price.toLocaleString()}, ${l.daysOnMarket} DOM${note}`;
      })
      .filter(Boolean)
      .join("\n");

    const existingNotes = presetOverride.values.notes ?? "";
    const combinedNotes = [
      existingNotes,
      selectedCompData ? `AGENT-SELECTED COMPS:\n${selectedCompData}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      ...presetOverride,
      values: { ...presetOverride.values, notes: combinedNotes },
    };
  }

  const effectivePreset = buildEffectivePreset();

  return (
    <>
      {/* Print stylesheet — hides everything except the output document */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          nav, header, aside, footer { display: none !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">
        {/* Breadcrumb */}
        <nav className="no-print mb-4 flex items-center gap-1.5 text-[0.78rem] text-slate/60">
          <Link href="/hub/ai" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            AI Studio
          </Link>
          <span>/</span>
          <span className="text-ink/70">CMA Generator</span>
        </nav>

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="no-print mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink sm:text-3xl">
              CMA Generator
            </h1>
            <p className="mt-1 text-[0.92rem] leading-relaxed text-slate">
              Generate a full Comparative Market Analysis for any property — suggested
              price range, comparable-sale talking points, market posture, and a
              one-line recommendation.
            </p>
          </div>
        </div>

        {/* ── "Load from database" selector ────────────────────────────────── */}
        <div className="no-print mb-5 flex flex-col items-start gap-2 rounded-xl border border-ink/[0.08] bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
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

        {/* ── Comp candidates row — only shown when a listing is loaded and sold comps exist ── */}
        {compCandidates.length > 0 && (
          <div className="no-print mb-5 rounded-xl border border-ink/[0.08] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/80">
                Comparable Candidates — {subjectCity}
              </p>
              {selectedComps.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-[0.68rem] font-semibold text-ink">
                  {selectedComps.length} comp{selectedComps.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {compCandidates.map((l) => {
                const isSelected = selectedComps.includes(l.id);
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "flex-none w-52 cursor-pointer rounded-xl border px-3 py-3 transition-colors",
                      isSelected
                        ? "border-ink/40 bg-ink/[0.04]"
                        : "border-ink/[0.08] bg-white hover:border-ink/20"
                    )}
                    onClick={() =>
                      setSelectedComps((prev) =>
                        prev.includes(l.id)
                          ? prev.filter((id) => id !== l.id)
                          : [...prev, l.id]
                      )
                    }
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-1">
                      <p className="truncate text-[0.78rem] font-semibold leading-tight text-ink">
                        {l.address}
                      </p>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[0.72rem] text-slate">
                      ${l.price.toLocaleString()} · {l.beds}bd/{l.baths}ba · {l.sqft.toLocaleString()} sqft
                    </p>
                    <p className="mt-0.5 text-[0.68rem] text-slate/50">
                      {l.daysOnMarket} days on market
                    </p>
                    <textarea
                      placeholder="Adj. notes…"
                      value={compNotes[l.id] ?? ""}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        setCompNotes((prev) => ({
                          ...prev,
                          [l.id]: e.target.value,
                        }))
                      }
                      rows={1}
                      className="mt-2 w-full resize-none rounded border border-ink/[0.08] bg-transparent px-2 py-1 text-[0.72rem] text-ink placeholder:text-slate/40 focus:border-ink/30 focus:outline-none"
                    />
                  </div>
                );
              })}
            </div>
            {selectedComps.length > 0 && (
              <p className="mt-2 text-[0.72rem] text-slate/60">
                {selectedComps.length} comp{selectedComps.length !== 1 ? "s" : ""} selected — will be included in the CMA prompt
              </p>
            )}
          </div>
        )}

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
            externalPreset={effectivePreset ?? undefined}
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
    </>
  );
}
