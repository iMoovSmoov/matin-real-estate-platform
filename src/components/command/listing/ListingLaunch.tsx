"use client";

import { useState, useCallback } from "react";
import { Search, Wand2, CheckCircle2, Circle, ToggleLeft, ToggleRight, Copy, Check } from "lucide-react";
import { Panel, PanelHeader, Pill, ProgressBar } from "@/components/command/ui";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import type { ListingPipeline, ListingPipelineStage } from "@/lib/types";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ChecklistSection = "prep" | "photos" | "mls" | "marketing" | "launch";
type KitTab = "MLS" | "Instagram" | "Facebook" | "Email" | "Open House";

const CHECKLIST_TABS: { key: ChecklistSection; label: string }[] = [
  { key: "prep", label: "Prep" },
  { key: "photos", label: "Photos" },
  { key: "mls", label: "MLS" },
  { key: "marketing", label: "Marketing" },
  { key: "launch", label: "Launch" },
];

const KIT_TABS: KitTab[] = ["MLS", "Instagram", "Facebook", "Email", "Open House"];

/* ── helpers ────────────────────────────────────────────────────────────────── */

function stagePillTone(
  stage: ListingPipelineStage,
): "neutral" | "warn" | "azure" | "success" {
  switch (stage) {
    case "Intake":
      return "neutral";
    case "Photos Scheduled":
      return "warn";
    case "MLS Draft":
      return "azure";
    case "Broker Review":
      return "warn";
    case "Active":
      return "success";
    case "Under Offer":
      return "success";
  }
}

function countChecklist(
  checklist: ListingPipeline["checklist"],
  overrides: Record<string, boolean>,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const section of Object.keys(checklist) as ChecklistSection[]) {
    for (const item of checklist[section]) {
      total++;
      const key = `${section}::${item.label}`;
      const isDone = key in overrides ? overrides[key] : item.done;
      if (isDone) done++;
    }
  }
  return { done, total };
}

function sectionCount(
  items: { label: string; done: boolean }[],
  section: ChecklistSection,
  overrides: Record<string, boolean>,
): { done: number; total: number } {
  let done = 0;
  const total = items.length;
  for (const item of items) {
    const key = `${section}::${item.label}`;
    const isDone = key in overrides ? overrides[key] : item.done;
    if (isDone) done++;
  }
  return { done, total };
}

function parseKitSections(raw: string): Record<KitTab, string> {
  const result: Record<KitTab, string> = {
    MLS: "",
    Instagram: "",
    Facebook: "",
    Email: "",
    "Open House": "",
  };
  // split on "## " headers
  const parts = raw.split(/^## /m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstNewline = part.indexOf("\n");
    const header = firstNewline === -1 ? part.trim() : part.slice(0, firstNewline).trim();
    const body = firstNewline === -1 ? "" : part.slice(firstNewline + 1).trim();
    if (header.toLowerCase().includes("mls")) result["MLS"] = body;
    else if (header.toLowerCase().includes("instagram")) result["Instagram"] = body;
    else if (header.toLowerCase().includes("facebook")) result["Facebook"] = body;
    else if (header.toLowerCase().includes("email")) result["Email"] = body;
    else if (header.toLowerCase().includes("open house")) result["Open House"] = body;
  }
  // If we got nothing (e.g. AI returned no headers) put it all in MLS
  const hasContent = Object.values(result).some((v) => v.length > 0);
  if (!hasContent) result["MLS"] = raw;
  return result;
}

/* ── sub-components ─────────────────────────────────────────────────────────── */

function ListingCard({
  listing,
  overrides,
  isSelected,
  onClick,
}: {
  listing: ListingPipeline;
  overrides: Record<string, boolean>;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { done, total } = countChecklist(listing.checklist, overrides);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-colors",
        isSelected
          ? "border-ink/30 bg-ink/[0.04]"
          : "border-ink/[0.07] bg-white hover:border-ink/15 hover:bg-ink/[0.02]",
      )}
    >
      <p className="text-[0.85rem] font-semibold text-ink leading-tight">{listing.address}</p>
      <p className="mt-0.5 text-[0.72rem] text-slate">
        {listing.city} &middot; {listing.beds}bd / {listing.baths}ba
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Pill tone={stagePillTone(listing.stage)}>{listing.stage}</Pill>
        <span className="text-[0.66rem] text-slate">{listing.daysInStage}d in stage</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[0.66rem] text-slate">{done}/{total} complete</span>
          <span className="text-[0.66rem] text-slate">{pct}%</span>
        </div>
        <ProgressBar value={pct} tone={pct === 100 ? "success" : "azure"} />
      </div>
    </button>
  );
}

function ChecklistTab({
  listing,
  overrides,
  onToggle,
}: {
  listing: ListingPipeline;
  overrides: Record<string, boolean>;
  onToggle: (section: ChecklistSection, label: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<ChecklistSection>("prep");

  return (
    <div>
      {/* tab bar */}
      <div className="flex gap-1 border-b border-ink/[0.08] pb-0">
        {CHECKLIST_TABS.map((tab) => {
          const { done, total } = sectionCount(
            listing.checklist[tab.key],
            tab.key,
            overrides,
          );
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-3 py-2 text-[0.8rem] font-medium transition-colors",
                activeTab === tab.key
                  ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-ink"
                  : "text-slate hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold",
                  done === total
                    ? "bg-success/12 text-success"
                    : "bg-ink/[0.06] text-slate",
                )}
              >
                {done}/{total}
              </span>
            </button>
          );
        })}
      </div>

      {/* items */}
      <div className="mt-3 space-y-2">
        {listing.checklist[activeTab].map((item) => {
          const key = `${activeTab}::${item.label}`;
          const isDone = key in overrides ? overrides[key] : item.done;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onToggle(activeTab, item.label)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-ink/[0.03]"
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-slate/40" />
              )}
              <span
                className={cn(
                  "text-[0.85rem] leading-snug",
                  isDone ? "text-slate line-through" : "text-ink",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────────────── */

export function ListingLaunch({ listings }: { listings: ListingPipeline[] }) {
  // Left pane state
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(listings[0]?.id ?? null);

  // Per-listing checklist overrides: "listingId::section::label" -> boolean
  // Using a flat map keyed by "listingId" with nested overrides
  const [checklistOverrides, setChecklistOverrides] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Per-listing broker approved overrides
  const [brokerOverrides, setBrokerOverrides] = useState<Record<string, boolean>>({});

  // Marketing kit state
  const [kitFields, setKitFields] = useState<Record<string, Record<string, string>>>({});
  const [kitOutput, setKitOutput] = useState<Record<string, string>>({});
  const [kitLoading, setKitLoading] = useState<Record<string, boolean>>({});
  const [kitTab, setKitTab] = useState<Record<string, KitTab>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const selectedListing = listings.find((l) => l.id === selectedId) ?? null;

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.address.toLowerCase().includes(q) || l.city.toLowerCase().includes(q)
    );
  });

  // Checklist toggle
  const handleToggle = useCallback(
    (listingId: string, section: ChecklistSection, label: string) => {
      setChecklistOverrides((prev) => {
        const listingOverrides = prev[listingId] ?? {};
        const key = `${section}::${label}`;
        const listing = listings.find((l) => l.id === listingId);
        if (!listing) return prev;
        const originalItem = listing.checklist[section].find((i) => i.label === label);
        const currentVal =
          key in listingOverrides ? listingOverrides[key] : (originalItem?.done ?? false);
        return {
          ...prev,
          [listingId]: { ...listingOverrides, [key]: !currentVal },
        };
      });
    },
    [listings],
  );

  // Marketing kit field helper
  const getKitField = (listingId: string, field: string): string => {
    return kitFields[listingId]?.[field] ?? "";
  };

  const setKitField = (listingId: string, field: string, value: string) => {
    setKitFields((prev) => ({
      ...prev,
      [listingId]: { ...prev[listingId], [field]: value },
    }));
  };

  const initKitFields = useCallback(
    (listing: ListingPipeline) => {
      if (kitFields[listing.id]) return;
      setKitFields((prev) => ({
        ...prev,
        [listing.id]: {
          address: listing.address,
          city: listing.city,
          beds: String(listing.beds),
          baths: String(listing.baths),
          sqft: String(listing.sqft),
          yearBuilt: String(listing.yearBuilt),
          price: String(listing.price),
          features: listing.features.join(", "),
          highlights: "",
        },
      }));
    },
    [kitFields],
  );

  // When selected listing changes, init its fields
  const handleSelectListing = (listing: ListingPipeline) => {
    setSelectedId(listing.id);
    initKitFields(listing);
  };

  // Generate marketing kit
  const handleGenerateKit = async (listing: ListingPipeline) => {
    const fields = kitFields[listing.id] ?? {};
    setKitLoading((prev) => ({ ...prev, [listing.id]: true }));
    setKitOutput((prev) => ({ ...prev, [listing.id]: "" }));
    try {
      await streamAi(
        {
          tool: "marketing-kit",
          input: {
            address: fields.address ?? listing.address,
            city: fields.city ?? listing.city,
            beds: Number(fields.beds ?? listing.beds),
            baths: Number(fields.baths ?? listing.baths),
            sqft: Number(fields.sqft ?? listing.sqft),
            yearBuilt: Number(fields.yearBuilt ?? listing.yearBuilt),
            price: Number(fields.price ?? listing.price),
            features: fields.features ?? listing.features.join(", "),
            highlights: fields.highlights ?? "",
          },
        },
        (_, full) => {
          setKitOutput((prev) => ({ ...prev, [listing.id]: full }));
        },
      );
    } finally {
      setKitLoading((prev) => ({ ...prev, [listing.id]: false }));
    }
  };

  // Copy section text
  const handleCopy = (listingId: string, text: string, sectionKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedSection(sectionKey);
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  };

  // Broker toggle
  const getBrokerApproved = (listing: ListingPipeline): boolean => {
    return listing.id in brokerOverrides
      ? brokerOverrides[listing.id]
      : listing.brokerApproved;
  };

  const toggleBrokerApproved = (listingId: string, current: boolean) => {
    setBrokerOverrides((prev) => ({ ...prev, [listingId]: !current }));
  };

  const handleMarkActive = (listingId: string) => {
    if (!getBrokerApproved(listings.find((l) => l.id === listingId)!)) return;
    showToast("Status updated — awaiting MLS sync.");
    void listingId;
  };

  // Init fields for first listing on mount
  if (selectedListing && !kitFields[selectedListing.id]) {
    initKitFields(selectedListing);
  }

  return (
    <div className="relative flex gap-4" style={{ minHeight: "calc(100vh - 280px)" }}>
      {/* ── Left pane ──────────────────────────────────────────────────────── */}
      <div className="w-[280px] shrink-0 space-y-3">
        {/* search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/50" />
          <input
            type="text"
            placeholder="Search address or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-ink/[0.08] bg-white py-2 pl-8 pr-3 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
        </div>

        {/* listing cards */}
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-[0.8rem] text-slate">No listings match.</p>
          ) : (
            filtered.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                overrides={checklistOverrides[listing.id] ?? {}}
                isSelected={listing.id === selectedId}
                onClick={() => handleSelectListing(listing)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right pane ─────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        {!selectedListing ? (
          <Panel className="flex h-64 items-center justify-center">
            <p className="text-[0.85rem] text-slate">Select a listing to get started.</p>
          </Panel>
        ) : (
          <div className="space-y-4">
            {/* listing header */}
            <Panel>
              <PanelHeader
                title={selectedListing.address}
                subtitle={`${selectedListing.city} · ${selectedListing.beds}bd / ${selectedListing.baths}ba · ${selectedListing.sqft.toLocaleString()} sqft · Built ${selectedListing.yearBuilt}`}
                action={
                  <div className="flex items-center gap-2">
                    <Pill tone={stagePillTone(selectedListing.stage)}>
                      {selectedListing.stage}
                    </Pill>
                    <span className="text-[0.72rem] text-slate">
                      {selectedListing.daysInStage}d in stage
                    </span>
                  </div>
                }
              />
            </Panel>

            {/* main content grid */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* checklist section */}
              <Panel className="overflow-hidden">
                <div className="border-b border-ink/[0.08] px-5 py-4">
                  <h3 className="text-[0.95rem] font-semibold text-ink">Launch Checklist</h3>
                </div>
                <div className="px-5 py-4">
                  <ChecklistTab
                    listing={selectedListing}
                    overrides={checklistOverrides[selectedListing.id] ?? {}}
                    onToggle={(section, label) =>
                      handleToggle(selectedListing.id, section, label)
                    }
                  />
                </div>
              </Panel>

              {/* broker approval + MLS action */}
              <div className="flex flex-col gap-4">
                <Panel className="overflow-hidden">
                  <div className="border-b border-ink/[0.08] px-5 py-4">
                    <h3 className="text-[0.95rem] font-semibold text-ink">Broker Approval</h3>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {/* toggle */}
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[0.85rem] text-ink">Broker reviewed &amp; approved</p>
                      <button
                        type="button"
                        onClick={() =>
                          toggleBrokerApproved(
                            selectedListing.id,
                            getBrokerApproved(selectedListing),
                          )
                        }
                        className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-ink/[0.04]"
                        aria-label="Toggle broker approval"
                      >
                        {getBrokerApproved(selectedListing) ? (
                          <ToggleRight className="h-7 w-7 text-success" />
                        ) : (
                          <ToggleLeft className="h-7 w-7 text-slate/40" />
                        )}
                      </button>
                    </div>

                    {/* approved banner */}
                    {getBrokerApproved(selectedListing) && (
                      <div className="flex items-center gap-2 rounded-xl bg-success/[0.08] px-4 py-3 ring-1 ring-inset ring-success/20">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        <p className="text-[0.82rem] font-medium text-success">
                          Broker has reviewed and approved this listing.
                        </p>
                      </div>
                    )}

                    {/* MLS action button */}
                    <button
                      type="button"
                      disabled={!getBrokerApproved(selectedListing)}
                      onClick={() => handleMarkActive(selectedListing.id)}
                      className={cn(
                        "w-full rounded-xl border px-4 py-2 text-[0.85rem] font-medium transition-colors",
                        getBrokerApproved(selectedListing)
                          ? "border-ink/[0.08] text-ink hover:bg-ink/[0.04]"
                          : "cursor-not-allowed border-ink/[0.04] text-slate/40",
                      )}
                    >
                      Mark Active on MLS
                    </button>
                  </div>
                </Panel>
              </div>
            </div>

            {/* marketing kit section */}
            <Panel className="overflow-hidden">
              <div className="border-b border-ink/[0.08] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-ink" />
                  <h3 className="text-[0.95rem] font-semibold text-ink">Generate Marketing Kit</h3>
                </div>
              </div>

              <div className="px-5 py-5">
                {/* form */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {/* address */}
                  <div className="col-span-2 space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Address
                    </label>
                    <input
                      type="text"
                      value={getKitField(selectedListing.id, "address")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "address", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* city */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      City
                    </label>
                    <input
                      type="text"
                      value={getKitField(selectedListing.id, "city")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "city", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* price */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      List Price ($)
                    </label>
                    <input
                      type="number"
                      value={getKitField(selectedListing.id, "price")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "price", e.target.value)
                      }
                      placeholder="e.g. 795000"
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* beds */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Beds
                    </label>
                    <input
                      type="number"
                      value={getKitField(selectedListing.id, "beds")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "beds", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* baths */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Baths
                    </label>
                    <input
                      type="number"
                      value={getKitField(selectedListing.id, "baths")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "baths", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* sqft */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Sqft
                    </label>
                    <input
                      type="number"
                      value={getKitField(selectedListing.id, "sqft")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "sqft", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* year built */}
                  <div className="space-y-1">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Year Built
                    </label>
                    <input
                      type="number"
                      value={getKitField(selectedListing.id, "yearBuilt")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "yearBuilt", e.target.value)
                      }
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* features */}
                  <div className="col-span-2 space-y-1 lg:col-span-2">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Features
                    </label>
                    <textarea
                      rows={2}
                      value={getKitField(selectedListing.id, "features")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "features", e.target.value)
                      }
                      className="w-full resize-none rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>

                  {/* highlights */}
                  <div className="col-span-2 space-y-1 lg:col-span-2">
                    <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                      Highlights
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What makes this listing special?"
                      value={getKitField(selectedListing.id, "highlights")}
                      onChange={(e) =>
                        setKitField(selectedListing.id, "highlights", e.target.value)
                      }
                      className="w-full resize-none rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={kitLoading[selectedListing.id]}
                    onClick={() => handleGenerateKit(selectedListing)}
                    className={cn(
                      "rounded-xl bg-ink px-4 py-2 text-[0.85rem] font-medium text-white transition-opacity",
                      kitLoading[selectedListing.id]
                        ? "cursor-not-allowed opacity-50"
                        : "hover:opacity-90",
                    )}
                  >
                    {kitLoading[selectedListing.id] ? "Generating..." : "Generate Kit"}
                  </button>
                </div>

                {/* loading pulse */}
                {kitLoading[selectedListing.id] && !kitOutput[selectedListing.id] && (
                  <div className="mt-4">
                    <p className="animate-pulse text-[0.85rem] text-slate">
                      Generating your marketing kit...
                    </p>
                  </div>
                )}

                {/* output */}
                {kitOutput[selectedListing.id] && (
                  <div className="mt-5 space-y-3">
                    {/* kit tab bar */}
                    <div className="flex flex-wrap gap-1 border-b border-ink/[0.08] pb-0">
                      {KIT_TABS.map((tab) => {
                        const currentKitTab =
                          kitTab[selectedListing.id] ?? "MLS";
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() =>
                              setKitTab((prev) => ({
                                ...prev,
                                [selectedListing.id]: tab,
                              }))
                            }
                            className={cn(
                              "relative px-3 py-2 text-[0.8rem] font-medium transition-colors",
                              currentKitTab === tab
                                ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-ink"
                                : "text-slate hover:text-ink",
                            )}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>

                    {/* section content */}
                    {(() => {
                      const currentKitTab = kitTab[selectedListing.id] ?? "MLS";
                      const sections = parseKitSections(kitOutput[selectedListing.id]);
                      const sectionText = sections[currentKitTab];
                      const copyKey = `${selectedListing.id}::${currentKitTab}`;
                      return (
                        <div className="space-y-3">
                          {sectionText ? (
                            <div className="rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05]">
                              <AiMarkdown text={sectionText} />
                            </div>
                          ) : (
                            <div className="rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05]">
                              <p className="text-[0.85rem] text-slate/60 italic">
                                No content for this section yet.
                              </p>
                            </div>
                          )}
                          {sectionText && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(selectedListing.id, sectionText, copyKey)
                              }
                              className="flex items-center gap-1.5 rounded-xl border border-ink/[0.08] px-4 py-2 text-[0.85rem] font-medium text-ink transition-colors hover:bg-ink/[0.04]"
                            >
                              {copiedSection === copyKey ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-success" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-ink px-4 py-3 shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <p className="text-[0.85rem] font-medium text-white">{toast}</p>
        </div>
      )}
    </div>
  );
}
