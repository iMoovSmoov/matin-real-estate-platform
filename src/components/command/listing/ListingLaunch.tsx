"use client";

import { useState, useCallback } from "react";
import {
  Search,
  Wand2,
  CheckCircle2,
  Circle,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  ClipboardList,
  Camera,
  FileText,
  Megaphone,
  Rocket,
  Home,
  X,
} from "lucide-react";
import { Panel, PanelHeader, Pill, ProgressBar } from "@/components/command/ui";
import { EmptyState } from "@/components/command/ui/EmptyState";
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

/* ── stage progress pipeline ────────────────────────────────────────────────── */

interface StageStep {
  key: ListingPipelineStage | "Marketing";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAGE_STEPS: StageStep[] = [
  { key: "Intake", label: "Intake", icon: ClipboardList },
  { key: "Photos Scheduled", label: "Photos", icon: Camera },
  { key: "MLS Draft", label: "MLS", icon: FileText },
  { key: "Marketing", label: "Marketing", icon: Megaphone },
  { key: "Active", label: "Launch", icon: Rocket },
];

function stageIndex(stage: ListingPipelineStage): number {
  switch (stage) {
    case "Intake": return 0;
    case "Photos Scheduled": return 1;
    case "MLS Draft": return 2;
    case "Broker Review": return 2; // same as MLS
    case "Active": return 4;
    case "Under Offer": return 4;
    default: return 0;
  }
}

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

/* ── Stage Progress Bar ──────────────────────────────────────────────────────── */

function StageProgressBar({
  stage,
  hasMarketingKit,
}: {
  stage: ListingPipelineStage;
  hasMarketingKit: boolean;
}) {
  // STEP 9: When marketing kit exists, ensure Marketing step (index 3) is at least active
  const baseIndex = stageIndex(stage);
  const current = hasMarketingKit ? Math.max(baseIndex, 3) : baseIndex;

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-1">
      {STAGE_STEPS.map((step, i) => {
        const StepIcon = step.icon;
        const isComplete = i < current;
        const isActive = i === current;
        const isLast = i === STAGE_STEPS.length - 1;

        return (
          <div key={step.key} className="flex min-w-0 items-center">
            {/* step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.65rem] transition-colors",
                  isComplete
                    ? "border-success/40 bg-success/[0.12] text-success"
                    : isActive
                    ? "border-ink/20 bg-ink text-white ring-2 ring-ink/10"
                    : "border-ink/[0.08] bg-white text-slate/40",
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <StepIcon className="h-3 w-3" />
                )}
              </span>
              <span
                className={cn(
                  "whitespace-nowrap text-[0.6rem] font-semibold uppercase tracking-wider",
                  isComplete
                    ? "text-success"
                    : isActive
                    ? "text-ink"
                    : "text-slate/40",
                )}
              >
                {step.label}
              </span>
            </div>
            {/* connector */}
            {!isLast && (
              <div
                className={cn(
                  "mx-1 mt-[-12px] h-px w-8 shrink-0 sm:w-10 lg:w-14",
                  i < current ? "bg-success/40" : "bg-ink/[0.08]",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── sub-components ─────────────────────────────────────────────────────────── */

function ListingCard({
  listing,
  overrides,
  isSelected,
  isActiveMls,
  onClick,
}: {
  listing: ListingPipeline;
  overrides: Record<string, boolean>;
  isSelected: boolean;
  isActiveMls: boolean;
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
          ? "border-l-4 border-ink/30 border-l-ink bg-ink/[0.04] pl-2.5"
          : "border-ink/[0.07] bg-white hover:border-ink/15 hover:bg-ink/[0.02]",
      )}
    >
      <p className="text-[0.85rem] font-semibold leading-tight text-ink">{listing.address}</p>
      <p className="mt-0.5 text-[0.72rem] text-slate">
        {listing.city} &middot; {listing.beds}bd / {listing.baths}ba
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        {isActiveMls ? (
          <Pill tone="success">Active</Pill>
        ) : (
          <Pill tone={stagePillTone(listing.stage)}>{listing.stage}</Pill>
        )}
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
      {/* STEP 4 — tab bar: overflow-x-auto + horizontal bleed on mobile */}
      <div className="flex overflow-x-auto gap-0.5 border-b border-ink/[0.08] pb-0 -mx-5 px-5">
        {CHECKLIST_TABS.map((tab) => {
          const { done, total } = sectionCount(
            listing.checklist[tab.key],
            tab.key,
            overrides,
          );
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-[0.8rem] font-medium transition-colors",
                isActive
                  ? "bg-ink text-white"
                  : "text-slate hover:bg-ink/[0.04] hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.62rem] font-semibold",
                  isActive
                    ? "bg-white/20 text-white"
                    : done === total
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

      {/* items — min-height 44px each for thumb compliance */}
      <div className="mt-3 space-y-1">
        {listing.checklist[activeTab].map((item) => {
          const key = `${activeTab}::${item.label}`;
          const isDone = key in overrides ? overrides[key] : item.done;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onToggle(activeTab, item.label)}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-ink/[0.03]"
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

/* ── ListingDetail: shared sub-component for desktop right pane + mobile slide-over ── */
/* STEP 8: extracted so it renders in both places without JSX duplication */

interface ListingDetailProps {
  listing: ListingPipeline;
  checklistOverrides: Record<string, Record<string, boolean>>;
  brokerOverrides: Record<string, boolean>;
  activeListings: Set<string>;
  kitFields: Record<string, Record<string, string>>;
  kitOutput: Record<string, string>;
  kitLoading: Record<string, boolean>;
  kitTab: Record<string, KitTab>;
  copiedSection: string | null;
  onToggle: (listingId: string, section: ChecklistSection, label: string) => void;
  onToggleBroker: (listingId: string, current: boolean) => void;
  onMarkActive: (listingId: string) => void;
  onGenerateKit: (listing: ListingPipeline) => void;
  onKitTabChange: (listingId: string, tab: KitTab) => void;
  onCopy: (listingId: string, text: string, sectionKey: string) => void;
  onKitFieldChange: (listingId: string, field: string, value: string) => void;
  getKitField: (listingId: string, field: string) => string;
  getBrokerApproved: (listing: ListingPipeline) => boolean;
}

function ListingDetail({
  listing,
  checklistOverrides,
  brokerOverrides: _brokerOverrides,
  activeListings,
  kitFields: _kitFields,
  kitOutput,
  kitLoading,
  kitTab,
  copiedSection,
  onToggle,
  onToggleBroker,
  onMarkActive,
  onGenerateKit,
  onKitTabChange,
  onCopy,
  onKitFieldChange,
  getKitField,
  getBrokerApproved,
}: ListingDetailProps) {
  const id = listing.id;
  const overrides = checklistOverrides[id] ?? {};
  const brokerApproved = getBrokerApproved(listing);
  const isActive = activeListings.has(id);
  const currentKitTab = kitTab[id] ?? "MLS";
  const hasMarketingKit = !!kitOutput[id];

  // Overall checklist progress for header
  const { done: checkDone, total: checkTotal } = countChecklist(listing.checklist, overrides);
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Panel 1: Listing Header + Stage Progress */}
      <Panel>
        <PanelHeader
          title={listing.address}
          subtitle={`${listing.city} · ${listing.beds}bd / ${listing.baths}ba · ${listing.sqft.toLocaleString()} sqft · Built ${listing.yearBuilt}`}
          action={
            <div className="flex items-center gap-2">
              <Pill tone={stagePillTone(listing.stage)}>
                {listing.stage}
              </Pill>
              <span className="text-[0.72rem] text-slate">
                {listing.daysInStage}d in stage
              </span>
            </div>
          }
        />
        <div className="border-t border-ink/[0.05] px-5 py-4">
          <StageProgressBar stage={listing.stage} hasMarketingKit={hasMarketingKit} />
        </div>
      </Panel>

      {/* Panel 2: Two-column grid */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* STEP 6: Launch Checklist with overall progress in header */}
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Launch Checklist"
            action={
              <div className="flex flex-col items-end gap-1">
                <span className="text-[0.72rem] text-slate">{checkDone}/{checkTotal} items</span>
                <div className="w-20">
                  <ProgressBar value={checkPct} tone={checkPct === 100 ? "success" : "azure"} />
                </div>
              </div>
            }
          />
          <div className="px-5 py-4">
            <ChecklistTab
              listing={listing}
              overrides={overrides}
              onToggle={(section, label) => onToggle(id, section, label)}
            />
          </div>
        </Panel>

        {/* Broker Approval + MLS Status */}
        <div className="flex flex-col gap-4">
          <Panel className="overflow-hidden">
            <div className="border-b border-ink/[0.08] px-5 py-4">
              <h3 className="text-[0.95rem] font-semibold text-ink">Broker Approval</h3>
            </div>
            <div className="space-y-4 px-5 py-4">
              {/* toggle */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.85rem] text-ink">Broker reviewed &amp; approved</p>
                <button
                  type="button"
                  onClick={() => onToggleBroker(id, brokerApproved)}
                  className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-ink/[0.04]"
                  aria-label="Toggle broker approval"
                >
                  {brokerApproved ? (
                    <ToggleRight className="h-7 w-7 text-success" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-slate/40" />
                  )}
                </button>
              </div>

              {/* approved banner */}
              {brokerApproved && (
                <div className="flex items-center gap-2 rounded-xl bg-success/[0.08] px-4 py-3 ring-1 ring-inset ring-success/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  <p className="text-[0.82rem] font-medium text-success">
                    Broker has reviewed and approved this listing.
                  </p>
                </div>
              )}

              {/* not approved warning */}
              {!brokerApproved && (
                <p className="text-[0.78rem] italic text-slate/60">
                  Broker approval required before publishing.
                </p>
              )}

              {/* MLS action button / success state */}
              {isActive ? (
                <div className="space-y-2 rounded-xl border border-success/30 bg-success/[0.06] px-4 py-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    <p className="text-[0.9rem] font-semibold text-success">Live on MLS</p>
                  </div>
                  <div className="space-y-1 pl-6 text-[0.8rem] text-slate">
                    <p>
                      <span className="font-medium text-ink">MLS #:</span>{" "}
                      RMLS-{id.slice(0, 6).toUpperCase()}
                    </p>
                    <p>
                      <span className="font-medium text-ink">Listed:</span> Just now
                    </p>
                    <p>
                      <span className="font-medium text-ink">Status:</span> Active — Accepting Showings
                    </p>
                  </div>
                  <a
                    href={`https://www.rmls.com/search/?q=${encodeURIComponent(listing.address + ", " + listing.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 pl-6 text-[0.8rem] font-medium text-success hover:underline"
                  >
                    View on RMLS →
                  </a>
                </div>
              ) : (
                /* STEP 1: Fix button visual state — bg-ink text-white when approved */
                <button
                  type="button"
                  disabled={!brokerApproved}
                  onClick={() => onMarkActive(id)}
                  className={cn(
                    "w-full rounded-xl px-4 py-3 text-[0.85rem] font-semibold transition-all",
                    brokerApproved
                      ? "bg-ink text-white shadow-sm hover:opacity-90 active:scale-[0.99]"
                      : "cursor-not-allowed border border-ink/[0.04] text-slate/40 opacity-50",
                  )}
                >
                  Mark Active on MLS
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* Panel 3: Marketing Kit */}
      <Panel className="overflow-hidden">
        <div className="border-b border-ink/[0.08] px-5 py-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-ink" />
            <h3 className="text-[0.95rem] font-semibold text-ink">Generate Marketing Kit</h3>
          </div>
          <p className="mt-0.5 pl-6 text-[0.78rem] text-slate">
            AI-generates MLS copy, social posts, email, and open house script in one click.
          </p>
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
                value={getKitField(id, "address")}
                onChange={(e) => onKitFieldChange(id, "address", e.target.value)}
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
                value={getKitField(id, "city")}
                onChange={(e) => onKitFieldChange(id, "city", e.target.value)}
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
                value={getKitField(id, "price")}
                onChange={(e) => onKitFieldChange(id, "price", e.target.value)}
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
                value={getKitField(id, "beds")}
                onChange={(e) => onKitFieldChange(id, "beds", e.target.value)}
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
                value={getKitField(id, "baths")}
                onChange={(e) => onKitFieldChange(id, "baths", e.target.value)}
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
                value={getKitField(id, "sqft")}
                onChange={(e) => onKitFieldChange(id, "sqft", e.target.value)}
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
                value={getKitField(id, "yearBuilt")}
                onChange={(e) => onKitFieldChange(id, "yearBuilt", e.target.value)}
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
                value={getKitField(id, "features")}
                onChange={(e) => onKitFieldChange(id, "features", e.target.value)}
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
                value={getKitField(id, "highlights")}
                onChange={(e) => onKitFieldChange(id, "highlights", e.target.value)}
                className="w-full resize-none rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
              />
            </div>
          </div>

          <div className="mt-5">
            <button
              type="button"
              disabled={kitLoading[id]}
              onClick={() => onGenerateKit(listing)}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.9rem] font-semibold text-white shadow-sm transition-opacity",
                kitLoading[id]
                  ? "cursor-not-allowed opacity-50"
                  : "hover:opacity-90 active:scale-[0.99]",
              )}
            >
              <Wand2 className="h-4 w-4" />
              {kitLoading[id] ? "Generating marketing kit…" : "Generate Marketing Kit"}
            </button>
          </div>

          {/* STEP 5: Streaming skeleton shimmer when loading and no output yet */}
          {kitLoading[id] && !kitOutput[id] && (
            <div className="mt-4 rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05] space-y-2.5">
              {[80, 95, 60, 85, 45].map((w, i) => (
                <div
                  key={i}
                  className="animate-pulse h-3 rounded bg-ink/[0.07]"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}

          {/* output tabs */}
          {kitOutput[id] && (
            <div className="mt-5 space-y-3">
              {/* STEP 3: kit tab bar — overflow-x-auto + mobile bleed, no wrap */}
              <div className="flex overflow-x-auto gap-0 border-b border-ink/[0.08] pb-0 -mx-5 px-5">
                {KIT_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => onKitTabChange(id, tab)}
                    className={cn(
                      "relative shrink-0 whitespace-nowrap px-3 py-2 text-[0.8rem] font-medium transition-colors",
                      currentKitTab === tab
                        ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-ink"
                        : "text-slate hover:text-ink",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* section content + copy button */}
              {(() => {
                const sections = parseKitSections(kitOutput[id]);
                const sectionText = sections[currentKitTab];
                const copyKey = `${id}::${currentKitTab}`;
                return (
                  <div className="space-y-3">
                    {sectionText ? (
                      <div className="rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05]">
                        <AiMarkdown text={sectionText} />
                      </div>
                    ) : (
                      <div className="rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05]">
                        <p className="text-[0.85rem] italic text-slate/60">
                          No content for this section yet.
                        </p>
                      </div>
                    )}
                    {sectionText && (
                      <button
                        type="button"
                        onClick={() => onCopy(id, sectionText, copyKey)}
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
                            Copy {currentKitTab} copy
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
  );
}

/* ── main component ─────────────────────────────────────────────────────────── */

export function ListingLaunch({ listings }: { listings: ListingPipeline[] }) {
  // Left pane state
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(listings[0]?.id ?? null);

  // STEP 7: Mobile slide-over state
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Per-listing checklist overrides: "section::label" -> boolean keyed by listingId
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

  // Active listings (marked on MLS)
  const [activeListings, setActiveListings] = useState<Set<string>>(new Set());

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

  const handleKitFieldChange = (listingId: string, field: string, value: string) => {
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
    // STEP 2: Auto-reset kit tab to MLS on each new generation
    setKitTab((prev) => ({ ...prev, [listing.id]: "MLS" }));
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

  // STEP 1 + STEP 10: handleMarkActive — removed showToast, inline success card is sufficient
  const handleMarkActive = (listingId: string) => {
    if (!getBrokerApproved(listings.find((l) => l.id === listingId)!)) return;
    setActiveListings((prev) => {
      const n = new Set(prev);
      n.add(listingId);
      return n;
    });
  };

  // Init fields for first listing on mount
  if (selectedListing && !kitFields[selectedListing.id]) {
    initKitFields(selectedListing);
  }

  // Shared props for ListingDetail
  const detailProps = selectedListing
    ? {
        listing: selectedListing,
        checklistOverrides,
        brokerOverrides,
        activeListings,
        kitFields,
        kitOutput,
        kitLoading,
        kitTab,
        copiedSection,
        onToggle: handleToggle,
        onToggleBroker: toggleBrokerApproved,
        onMarkActive: handleMarkActive,
        onGenerateKit: handleGenerateKit,
        onKitTabChange: (listingId: string, tab: KitTab) =>
          setKitTab((prev) => ({ ...prev, [listingId]: tab })),
        onCopy: handleCopy,
        onKitFieldChange: handleKitFieldChange,
        getKitField,
        getBrokerApproved,
      }
    : null;

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 280px)" }}>
      {/* STEP 7: Mobile — horizontally scrollable pill-list of listing cards (replaces native <select>) */}
      <div className="mb-4 overflow-x-auto flex gap-2 pb-2 -mx-4 px-4 md:hidden">
        {listings.map((listing) => {
          const { done, total } = countChecklist(
            listing.checklist,
            checklistOverrides[listing.id] ?? {},
          );
          const isSelected = listing.id === selectedId;
          const isActiveMls = activeListings.has(listing.id);
          return (
            <button
              key={listing.id}
              type="button"
              onClick={() => {
                handleSelectListing(listing);
                setMobileDetailOpen(true);
              }}
              className={cn(
                "min-w-[160px] shrink-0 rounded-xl border p-2.5 text-left transition-colors",
                isSelected
                  ? "border-ink bg-ink text-white"
                  : "border-ink/[0.08] bg-white text-ink",
              )}
            >
              <p
                className={cn(
                  "text-[0.78rem] font-semibold leading-tight truncate",
                  isSelected ? "text-white" : "text-ink",
                )}
              >
                {listing.address.length > 18
                  ? listing.address.slice(0, 18) + "…"
                  : listing.address}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                {isActiveMls ? (
                  <Pill tone="success">Active</Pill>
                ) : (
                  <Pill tone={stagePillTone(listing.stage)}>{listing.stage}</Pill>
                )}
                <span className={cn("text-[0.64rem]", isSelected ? "text-white/70" : "text-slate")}>
                  {done}/{total}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Desktop two-pane layout ──────────────────────────────────────────── */}
      <div className="flex gap-4">
        {/* Left pane — hidden on mobile, shown on md+ */}
        <div className="hidden w-[280px] shrink-0 space-y-3 md:block">
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
              listings.length === 0 ? (
                <EmptyState
                  icon={Home}
                  title="No active listings"
                  description="Add your first listing to generate marketing materials, track MLS status, and manage your launch checklist."
                  action={{ label: "Add listing", href: "/hub/listing-launch?new=1" }}
                />
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[0.8rem] text-slate">No listings match your search.</p>
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-2 text-[0.78rem] font-medium text-ink underline-offset-2 hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )
            ) : (
              filtered.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  overrides={checklistOverrides[listing.id] ?? {}}
                  isSelected={listing.id === selectedId}
                  isActiveMls={activeListings.has(listing.id)}
                  onClick={() => handleSelectListing(listing)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right pane (desktop only) ───────────────────────────────────────── */}
        <div className="hidden min-w-0 flex-1 md:block">
          {!selectedListing ? (
            <Panel>
              <EmptyState
                icon={Home}
                title="No active listings"
                description="Add your first listing to generate marketing materials, track MLS status, and manage your launch checklist."
                action={{ label: "Add listing", href: "/hub/listing-launch?new=1" }}
              />
            </Panel>
          ) : (
            /* STEP 8: Use shared ListingDetail sub-component */
            detailProps && <ListingDetail {...detailProps} />
          )}
        </div>

        {/* ── Mobile: right pane shown inline when no slide-over (md:hidden) ─── */}
        {/* On mobile, content lives in the slide-over below. Show empty prompt if nothing selected. */}
        <div className="min-w-0 flex-1 md:hidden">
          {!selectedListing && listings.length > 0 && (
            <Panel>
              <div className="px-5 py-8 text-center">
                <p className="text-[0.85rem] text-slate">
                  Tap a listing above to view details.
                </p>
              </div>
            </Panel>
          )}
          {!selectedListing && listings.length === 0 && (
            <Panel>
              <EmptyState
                icon={Home}
                title="No active listings"
                description="Add your first listing to generate marketing materials, track MLS status, and manage your launch checklist."
                action={{ label: "Add listing", href: "/hub/listing-launch?new=1" }}
              />
            </Panel>
          )}
        </div>
      </div>

      {/* STEP 7: Mobile slide-over */}
      {mobileDetailOpen && selectedListing && detailProps && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40 bg-ink/30 md:hidden"
            onClick={() => setMobileDetailOpen(false)}
          />
          {/* panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white border-l border-ink/[0.08] shadow-2xl sm:max-w-[480px] md:hidden">
            {/* slide-over header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/[0.08] bg-white px-4 py-3">
              <div>
                <p className="text-[0.88rem] font-semibold text-ink">{selectedListing.address}</p>
                <p className="text-[0.72rem] text-slate">{selectedListing.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* slide-over body */}
            <div className="p-4">
              <ListingDetail {...detailProps} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
