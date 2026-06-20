"use client";

import { useState, useCallback, useRef } from "react";
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
  ListChecks,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Users,
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
type DetailTab = "checklist" | "marketing" | "documents" | "status";

const DETAIL_TABS: { key: DetailTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "checklist", label: "Checklist", icon: ListChecks },
  { key: "marketing", label: "Marketing Kit", icon: Wand2 },
  { key: "documents", label: "Documents", icon: FileSignature },
  { key: "status", label: "Status", icon: Rocket },
];

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
    case "Broker Review": return 2;
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
    case "Intake": return "neutral";
    case "Photos Scheduled": return "warn";
    case "MLS Draft": return "azure";
    case "Broker Review": return "warn";
    case "Active": return "success";
    case "Under Offer": return "success";
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

/* ── Listing Card ────────────────────────────────────────────────────────────── */

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

/* ── ChecklistTab ─────────────────────────────────────────────────────────────── */

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

  const { done: checkDone, total: checkTotal } = countChecklist(listing.checklist, overrides);
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  return (
    <div>
      {/* Overall progress */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <ProgressBar value={checkPct} tone={checkPct === 100 ? "success" : "azure"} />
        </div>
        <span className="shrink-0 text-[0.72rem] text-slate">{checkDone}/{checkTotal} items</span>
      </div>

      {/* Section tab bar */}
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

      {/* Items */}
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

/* ── Marketing Kit Tab ──────────────────────────────────────────────────────── */

function MarketingKitTab({
  listing,
  kitFields,
  kitOutput,
  kitLoading,
  kitTab,
  copiedSection,
  onGenerateKit,
  onKitTabChange,
  onCopy,
  onKitFieldChange,
  getKitField,
}: {
  listing: ListingPipeline;
  kitFields: Record<string, Record<string, string>>;
  kitOutput: Record<string, string>;
  kitLoading: Record<string, boolean>;
  kitTab: Record<string, KitTab>;
  copiedSection: string | null;
  onGenerateKit: (listing: ListingPipeline) => void;
  onKitTabChange: (listingId: string, tab: KitTab) => void;
  onCopy: (listingId: string, text: string, sectionKey: string) => void;
  onKitFieldChange: (listingId: string, field: string, value: string) => void;
  getKitField: (listingId: string, field: string) => string;
}) {
  const id = listing.id;
  const currentKitTab = kitTab[id] ?? "MLS";

  return (
    <div className="space-y-5">
      {/* Property details form */}
      <div>
        <p className="mb-3 text-[0.78rem] text-slate">
          Pre-filled from listing data — edit any field before generating.
        </p>
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

          {/* key features */}
          <div className="col-span-2 space-y-1 lg:col-span-2">
            <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
              Key Features
            </label>
            <textarea
              rows={2}
              placeholder="hardwood floors, mountain views, chef's kitchen"
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
              placeholder="walking distance to schools, updated 2023"
              value={getKitField(id, "highlights")}
              onChange={(e) => onKitFieldChange(id, "highlights", e.target.value)}
              className="w-full resize-none rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>
        </div>
      </div>

      {/* Generate button */}
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
        {kitLoading[id] ? "Generating full kit…" : "Generate Full Kit"}
      </button>

      {/* Skeleton shimmer while loading */}
      {kitLoading[id] && !kitOutput[id] && (
        <div className="rounded-xl bg-paper/60 px-4 py-4 ring-1 ring-inset ring-ink/[0.05] space-y-2.5">
          {[80, 95, 60, 85, 45].map((w, i) => (
            <div
              key={i}
              className="animate-pulse h-3 rounded bg-ink/[0.07]"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {/* Output tabs */}
      {kitOutput[id] && (
        <div className="space-y-3">
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
                      No content for this section yet — still streaming or not generated.
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
  );
}

/* ── Document field type ────────────────────────────────────────────────────── */

type DocType = "listing-agreement" | "open-house-signin";

interface DocFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "textarea";
  colSpan?: number;
}

const LISTING_AGREEMENT_FIELDS: DocFieldDef[] = [
  { key: "sellerName", label: "Seller Name(s)", type: "text", colSpan: 2 },
  { key: "sellerPhone", label: "Seller Phone", type: "text" },
  { key: "sellerEmail", label: "Seller Email", type: "text" },
  { key: "propertyAddress", label: "Property Address", type: "text", colSpan: 2 },
  { key: "propertyCity", label: "City, State, Zip", type: "text" },
  { key: "legalDescription", label: "Legal Description", type: "text" },
  { key: "listPrice", label: "List Price ($)", type: "number" },
  { key: "commission", label: "Commission (%)", type: "number" },
  { key: "listingTerm", label: "Listing Term (days)", type: "number" },
  { key: "effectiveDate", label: "Effective Date", type: "date" },
  { key: "expirationDate", label: "Expiration Date", type: "date" },
  { key: "agentName", label: "Listing Agent", type: "text" },
  { key: "brokerageName", label: "Brokerage", type: "text" },
  { key: "specialTerms", label: "Special Terms / Notes", type: "textarea", colSpan: 2 },
];

const OPEN_HOUSE_FIELDS: DocFieldDef[] = [
  { key: "propertyAddress", label: "Property Address", type: "text", colSpan: 2 },
  { key: "propertyCity", label: "City, State, Zip", type: "text" },
  { key: "eventDate", label: "Open House Date", type: "date" },
  { key: "startTime", label: "Start Time", type: "text" },
  { key: "endTime", label: "End Time", type: "text" },
  { key: "agentName", label: "Hosting Agent", type: "text" },
  { key: "agentPhone", label: "Agent Phone", type: "text" },
  { key: "listPrice", label: "List Price ($)", type: "number" },
  { key: "beds", label: "Beds", type: "number" },
  { key: "baths", label: "Baths", type: "number" },
  { key: "sqft", label: "Sqft", type: "number" },
  { key: "yearBuilt", label: "Year Built", type: "number" },
  { key: "welcomeNote", label: "Welcome Message (optional)", type: "textarea", colSpan: 2 },
];

/* ── Document HTML generators ───────────────────────────────────────────────── */

/** Escape user-supplied values before inserting into HTML strings. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildListingAgreementHtml(fields: Record<string, string>): string {
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Listing Agreement — ${esc(fields.propertyAddress ?? "")}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; font-size: 11pt; color: #111; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1a1a2e; padding-bottom: 18px; margin-bottom: 28px; }
  .logo-block { display: flex; flex-direction: column; }
  .brand { font-size: 18pt; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; }
  .brand-sub { font-size: 8.5pt; color: #555; margin-top: 2px; }
  .doc-meta { text-align: right; font-size: 9pt; color: #555; }
  .doc-title { font-size: 15pt; font-weight: 700; text-align: center; color: #1a1a2e; margin-bottom: 24px; letter-spacing: 0.4px; }
  .section { margin-bottom: 22px; }
  .section-title { font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; }
  .row { display: flex; gap: 24px; margin-bottom: 10px; }
  .field { flex: 1; }
  .field-label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.8px; color: #777; margin-bottom: 3px; }
  .field-value { font-size: 11pt; border-bottom: 1px solid #ccc; padding-bottom: 3px; min-height: 22px; }
  .terms-box { border: 1px solid #ddd; border-radius: 4px; padding: 14px; font-size: 10pt; line-height: 1.65; color: #333; min-height: 60px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; }
  .sig-block { }
  .sig-line { border-top: 1px solid #111; margin-top: 50px; margin-bottom: 5px; }
  .sig-label { font-size: 9pt; color: #444; }
  .disclaimer { margin-top: 28px; font-size: 8pt; color: #777; line-height: 1.5; border-top: 1px solid #eee; padding-top: 12px; }
  .accent-bar { height: 4px; background: linear-gradient(90deg, #1a1a2e 0%, #c9a227 100%); border-radius: 2px; margin-bottom: 4px; }
  @media print { .page { padding: 32px 40px; } }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="logo-block">
      <div class="brand">MATIN REAL ESTATE</div>
      <div class="brand-sub">Portland Metro · Lake Oswego · SW Washington</div>
    </div>
    <div class="doc-meta">
      Exclusive Listing Agreement<br/>
      Prepared: ${today}
    </div>
  </div>

  <div class="doc-title">EXCLUSIVE RIGHT TO SELL LISTING AGREEMENT</div>

  <div class="section">
    <div class="section-title">1. Seller Information</div>
    <div class="row">
      <div class="field">
        <div class="field-label">Seller Name(s)</div>
        <div class="field-value">${esc(fields.sellerName ?? "")}</div>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <div class="field-label">Phone</div>
        <div class="field-value">${esc(fields.sellerPhone ?? "")}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value">${esc(fields.sellerEmail ?? "")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Property</div>
    <div class="row">
      <div class="field">
        <div class="field-label">Street Address</div>
        <div class="field-value">${esc(fields.propertyAddress ?? "")}</div>
      </div>
      <div class="field">
        <div class="field-label">City, State, Zip</div>
        <div class="field-value">${esc(fields.propertyCity ?? "")}</div>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <div class="field-label">Legal Description</div>
        <div class="field-value">${esc(fields.legalDescription ?? "")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. Listing Terms</div>
    <div class="row">
      <div class="field">
        <div class="field-label">List Price</div>
        <div class="field-value">$${Number(fields.listPrice ?? 0).toLocaleString()}</div>
      </div>
      <div class="field">
        <div class="field-label">Commission</div>
        <div class="field-value">${esc(fields.commission ?? "")}%</div>
      </div>
    </div>
    <div class="row">
      <div class="field">
        <div class="field-label">Effective Date</div>
        <div class="field-value">${esc(fields.effectiveDate ?? "")}</div>
      </div>
      <div class="field">
        <div class="field-label">Expiration Date</div>
        <div class="field-value">${esc(fields.expirationDate ?? "")}</div>
      </div>
      <div class="field">
        <div class="field-label">Listing Term</div>
        <div class="field-value">${esc(fields.listingTerm ?? "")} days</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">4. Brokerage &amp; Agent</div>
    <div class="row">
      <div class="field">
        <div class="field-label">Listing Agent</div>
        <div class="field-value">${esc(fields.agentName ?? "")}</div>
      </div>
      <div class="field">
        <div class="field-label">Brokerage</div>
        <div class="field-value">${esc(fields.brokerageName ?? "Matin Real Estate")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">5. Special Terms &amp; Conditions</div>
    <div class="terms-box">${esc(fields.specialTerms ?? "None.")}</div>
  </div>

  <div class="section">
    <div class="section-title">6. Seller Acknowledgment</div>
    <p style="font-size:10pt;line-height:1.65;color:#333;">
      The Seller acknowledges reading and understanding this Exclusive Right to Sell Listing Agreement in its entirety and agrees to its terms. The Seller confirms that they are the legal owner(s) of the property described herein and have the authority to execute this agreement.
    </p>
  </div>

  <div class="sig-grid">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Seller Signature &amp; Date</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Seller Signature &amp; Date (if joint)</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Listing Agent Signature &amp; Date</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Broker Signature &amp; Date</div>
    </div>
  </div>

  <div class="disclaimer">
    This document is a drafting aid prepared by Matin Real Estate for discussion purposes. All agreements require review and execution by a licensed Oregon real estate broker. This is not legal advice. Matin Real Estate · (503) 622-9624 · Portland, OR.
  </div>
</div>
</body>
</html>`.trim();
}

function buildOpenHouseHtml(fields: Record<string, string>): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Open House Sign-In — ${fields.propertyAddress ?? ""}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; font-size: 11pt; color: #111; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 36px 48px; }
  .accent-bar { height: 4px; background: linear-gradient(90deg, #1a1a2e 0%, #c9a227 100%); border-radius: 2px; margin-bottom: 4px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1a1a2e; padding-bottom: 14px; margin-bottom: 22px; }
  .brand { font-size: 16pt; font-weight: 700; color: #1a1a2e; }
  .brand-sub { font-size: 8pt; color: #555; margin-top: 2px; }
  .doc-title { font-size: 16pt; font-weight: 700; text-align: center; color: #1a1a2e; margin-bottom: 6px; }
  .property-card { background: #f7f6f2; border: 1px solid #e0ddd4; border-radius: 6px; padding: 14px 18px; margin-bottom: 22px; }
  .prop-address { font-size: 13pt; font-weight: 700; color: #1a1a2e; }
  .prop-meta { font-size: 9.5pt; color: #555; margin-top: 3px; }
  .prop-event { font-size: 10pt; font-weight: 600; color: #333; margin-top: 6px; }
  .agent-line { font-size: 9.5pt; color: #555; margin-top: 2px; }
  .welcome { font-size: 10pt; color: #444; line-height: 1.55; border-left: 3px solid #c9a227; padding-left: 12px; margin-bottom: 20px; font-style: italic; }
  .table-wrap { overflow: visible; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a1a2e; color: #fff; font-size: 8.5pt; font-weight: 600; text-align: left; padding: 8px 10px; letter-spacing: 0.6px; }
  td { border: 1px solid #ddd; padding: 10px; font-size: 10pt; height: 36px; }
  tr:nth-child(even) td { background: #fafaf8; }
  .privacy { font-size: 8pt; color: #888; line-height: 1.45; margin-top: 16px; border-top: 1px solid #eee; padding-top: 10px; }
  .sig-row { display: flex; gap: 40px; margin-top: 24px; }
  .sig-block { flex: 1; }
  .sig-line { border-top: 1px solid #111; margin-top: 40px; margin-bottom: 5px; }
  .sig-label { font-size: 9pt; color: #555; }
  @media print { .page { padding: 24px 32px; } }
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="header">
    <div>
      <div class="brand">MATIN REAL ESTATE</div>
      <div class="brand-sub">Portland Metro · Lake Oswego · SW Washington</div>
    </div>
  </div>

  <div class="doc-title">OPEN HOUSE SIGN-IN SHEET</div>

  <div class="property-card">
    <div class="prop-address">${esc(fields.propertyAddress ?? "")}${fields.propertyCity ? ", " + esc(fields.propertyCity) : ""}</div>
    <div class="prop-meta">${fields.beds ? esc(fields.beds) + " bed" : ""}${fields.baths ? " / " + esc(fields.baths) + " bath" : ""}${fields.sqft ? " · " + Number(fields.sqft).toLocaleString() + " sqft" : ""}${fields.yearBuilt ? " · Built " + esc(fields.yearBuilt) : ""}${fields.listPrice ? " · $" + Number(fields.listPrice).toLocaleString() : ""}</div>
    <div class="prop-event">${esc(fields.eventDate ?? "")} · ${esc(fields.startTime ?? "")}${fields.endTime ? " – " + esc(fields.endTime) : ""}</div>
    <div class="agent-line">Hosted by: ${esc(fields.agentName ?? "")}${fields.agentPhone ? " · " + esc(fields.agentPhone) : ""}</div>
  </div>

  ${fields.welcomeNote ? `<div class="welcome">${esc(fields.welcomeNote)}</div>` : ""}

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:22%">Full Name</th>
          <th style="width:24%">Email Address</th>
          <th style="width:16%">Phone</th>
          <th style="width:18%">Currently Working With Agent?</th>
          <th style="width:20%">Comments / Questions</th>
        </tr>
      </thead>
      <tbody>
        ${Array.from({ length: 18 }).map(() => `<tr>${["","","","",""].map(() => `<td>&nbsp;</td>`).join("")}</tr>`).join("\n        ")}
      </tbody>
    </table>
  </div>

  <div class="privacy">
    Privacy Notice: Information collected on this sheet is used solely by Matin Real Estate to follow up with prospective buyers regarding this property and similar listings. We do not sell or share your information with third parties. By signing in, you consent to receive follow-up communication from our team.
  </div>

  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Agent Signature &amp; Date</div>
    </div>
    <div class="sig-block" style="flex:2;"></div>
  </div>
</div>
</body>
</html>`.trim();
}

/* ── Documents Tab ──────────────────────────────────────────────────────────── */

function DocForm({
  title,
  icon,
  fields,
  values,
  onChange,
  onPreview,
}: {
  title: string;
  icon: React.ReactNode;
  fields: DocFieldDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onPreview: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-ink/[0.08] bg-white overflow-hidden">
      {/* Header row — click to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-ink/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink">
            {icon}
          </span>
          <div>
            <p className="text-[0.9rem] font-semibold text-ink">{title}</p>
            <p className="text-[0.72rem] text-slate">Auto-filled from listing · review and print</p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate/50 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate/50 shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-ink/[0.06] px-5 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div
                key={f.key}
                className={cn("space-y-1", f.colSpan === 2 ? "col-span-2" : "")}
              >
                <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={2}
                    value={values[f.key] ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className="w-full resize-none rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                  />
                ) : (
                  <input
                    type={f.type}
                    value={values[f.key] ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-semibold text-white transition-opacity hover:opacity-90 active:scale-[0.99]"
            >
              <Printer className="h-3.5 w-3.5" />
              Preview &amp; Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsTab({
  listing,
  docFields,
  onDocFieldChange,
  onPrintDoc,
}: {
  listing: ListingPipeline;
  docFields: Record<DocType, Record<string, string>>;
  onDocFieldChange: (docType: DocType, key: string, value: string) => void;
  onPrintDoc: (docType: DocType) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-[0.78rem] text-slate">
        Documents are pre-filled from listing data. Review, edit any field, then print or copy.
      </p>

      <DocForm
        title="Listing Agreement"
        icon={<FileSignature className="h-4 w-4" />}
        fields={LISTING_AGREEMENT_FIELDS}
        values={docFields["listing-agreement"] ?? {}}
        onChange={(key, value) => onDocFieldChange("listing-agreement", key, value)}
        onPreview={() => onPrintDoc("listing-agreement")}
      />

      <DocForm
        title="Open House Sign-In Sheet"
        icon={<Users className="h-4 w-4" />}
        fields={OPEN_HOUSE_FIELDS}
        values={docFields["open-house-signin"] ?? {}}
        onChange={(key, value) => onDocFieldChange("open-house-signin", key, value)}
        onPreview={() => onPrintDoc("open-house-signin")}
      />
    </div>
  );
}

/* ── Status Tab ──────────────────────────────────────────────────────────────── */

function StatusTab({
  listing,
  brokerApproved,
  isActive,
  onToggleBroker,
  onMarkActive,
}: {
  listing: ListingPipeline;
  brokerApproved: boolean;
  isActive: boolean;
  onToggleBroker: () => void;
  onMarkActive: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Stage Progress */}
      <div>
        <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
          Launch Pipeline
        </p>
        <StageProgressBar stage={listing.stage} hasMarketingKit={false} />
      </div>

      {/* Broker Approval */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white overflow-hidden">
        <div className="border-b border-ink/[0.08] px-5 py-3">
          <h4 className="text-[0.88rem] font-semibold text-ink">Broker Approval</h4>
        </div>
        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.85rem] text-ink">Broker reviewed &amp; approved</p>
            <button
              type="button"
              onClick={onToggleBroker}
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

          {brokerApproved ? (
            <div className="flex items-center gap-2 rounded-xl bg-success/[0.08] px-4 py-3 ring-1 ring-inset ring-success/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <p className="text-[0.82rem] font-medium text-success">
                Broker has reviewed and approved this listing.
              </p>
            </div>
          ) : (
            <p className="text-[0.78rem] italic text-slate/60">
              Broker approval required before publishing to MLS.
            </p>
          )}
        </div>
      </div>

      {/* MLS Status */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white overflow-hidden">
        <div className="border-b border-ink/[0.08] px-5 py-3">
          <h4 className="text-[0.88rem] font-semibold text-ink">MLS Status</h4>
        </div>
        <div className="px-5 py-4">
          {isActive ? (
            <div className="space-y-2 rounded-xl border border-success/30 bg-success/[0.06] px-4 py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <p className="text-[0.9rem] font-semibold text-success">Live on MLS</p>
              </div>
              <div className="space-y-1 pl-6 text-[0.8rem] text-slate">
                <p>
                  <span className="font-medium text-ink">MLS #:</span>{" "}
                  RMLS-{listing.id.slice(0, 6).toUpperCase()}
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
            <button
              type="button"
              disabled={!brokerApproved}
              onClick={onMarkActive}
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
      </div>

      {/* Listing meta */}
      <div className="rounded-2xl border border-ink/[0.08] bg-white overflow-hidden">
        <div className="border-b border-ink/[0.08] px-5 py-3">
          <h4 className="text-[0.88rem] font-semibold text-ink">Listing Details</h4>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            { label: "Address", value: listing.address },
            { label: "City", value: listing.city },
            { label: "Agent", value: listing.agentName },
            { label: "Stage", value: listing.stage },
            { label: "Days in Stage", value: String(listing.daysInStage) },
            { label: "List Price", value: `$${listing.price.toLocaleString()}` },
            { label: "Beds / Baths", value: `${listing.beds} / ${listing.baths}` },
            { label: "Sqft", value: listing.sqft.toLocaleString() },
            { label: "Year Built", value: String(listing.yearBuilt) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/60">{label}</p>
              <p className="text-[0.88rem] text-ink font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ListingDetail ──────────────────────────────────────────────────────────── */

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
  detailTab: Record<string, DetailTab>;
  docFields: Record<string, Record<DocType, Record<string, string>>>;
  onToggle: (listingId: string, section: ChecklistSection, label: string) => void;
  onToggleBroker: (listingId: string, current: boolean) => void;
  onMarkActive: (listingId: string) => void;
  onGenerateKit: (listing: ListingPipeline) => void;
  onKitTabChange: (listingId: string, tab: KitTab) => void;
  onCopy: (listingId: string, text: string, sectionKey: string) => void;
  onKitFieldChange: (listingId: string, field: string, value: string) => void;
  getKitField: (listingId: string, field: string) => string;
  getBrokerApproved: (listing: ListingPipeline) => boolean;
  onDetailTabChange: (listingId: string, tab: DetailTab) => void;
  onDocFieldChange: (listingId: string, docType: DocType, key: string, value: string) => void;
  onPrintDoc: (listingId: string, docType: DocType) => void;
}

function ListingDetail({
  listing,
  checklistOverrides,
  activeListings,
  kitFields,
  kitOutput,
  kitLoading,
  kitTab,
  copiedSection,
  detailTab,
  docFields,
  onToggle,
  onToggleBroker,
  onMarkActive,
  onGenerateKit,
  onKitTabChange,
  onCopy,
  onKitFieldChange,
  getKitField,
  getBrokerApproved,
  onDetailTabChange,
  onDocFieldChange,
  onPrintDoc,
}: ListingDetailProps) {
  const id = listing.id;
  const overrides = checklistOverrides[id] ?? {};
  const brokerApproved = getBrokerApproved(listing);
  const isActive = activeListings.has(id);
  const currentDetailTab = detailTab[id] ?? "checklist";
  const hasMarketingKit = !!kitOutput[id];

  const { done: checkDone, total: checkTotal } = countChecklist(listing.checklist, overrides);
  const checkPct = checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Listing Header */}
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
        {/* Compact checklist progress strip inside header card */}
        <div className="px-5 pb-3 pt-2 flex items-center gap-3 border-t border-ink/[0.04]">
          <div className="flex-1">
            <ProgressBar value={checkPct} tone={checkPct === 100 ? "success" : "azure"} />
          </div>
          <span className="shrink-0 text-[0.68rem] text-slate">
            {checkDone}/{checkTotal} checklist items
          </span>
          {hasMarketingKit && (
            <span className="shrink-0 rounded-full bg-success/[0.1] px-2 py-0.5 text-[0.65rem] font-semibold text-success ring-1 ring-inset ring-success/20">
              Kit ready
            </span>
          )}
        </div>
      </Panel>

      {/* Main Detail Panel with 4 tabs */}
      <Panel className="overflow-hidden">
        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-0 border-b border-ink/[0.08] -mx-0 px-4 pt-1">
          {DETAIL_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isTabActive = currentDetailTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onDetailTabChange(id, tab.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-[0.82rem] font-medium transition-colors",
                  isTabActive
                    ? "text-ink after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-ink"
                    : "text-slate hover:text-ink",
                )}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="px-5 py-5">
          {currentDetailTab === "checklist" && (
            <ChecklistTab
              listing={listing}
              overrides={overrides}
              onToggle={(section, label) => onToggle(id, section, label)}
            />
          )}

          {currentDetailTab === "marketing" && (
            <MarketingKitTab
              listing={listing}
              kitFields={kitFields}
              kitOutput={kitOutput}
              kitLoading={kitLoading}
              kitTab={kitTab}
              copiedSection={copiedSection}
              onGenerateKit={onGenerateKit}
              onKitTabChange={onKitTabChange}
              onCopy={onCopy}
              onKitFieldChange={onKitFieldChange}
              getKitField={getKitField}
            />
          )}

          {currentDetailTab === "documents" && (
            <DocumentsTab
              listing={listing}
              docFields={docFields[id] ?? { "listing-agreement": {}, "open-house-signin": {} }}
              onDocFieldChange={(docType, key, value) => onDocFieldChange(id, docType, key, value)}
              onPrintDoc={(docType) => onPrintDoc(id, docType)}
            />
          )}

          {currentDetailTab === "status" && (
            <StatusTab
              listing={listing}
              brokerApproved={brokerApproved}
              isActive={isActive}
              onToggleBroker={() => onToggleBroker(id, brokerApproved)}
              onMarkActive={() => onMarkActive(id)}
            />
          )}
        </div>
      </Panel>
    </div>
  );
}

/* ── Print helper ──────────────────────────────────────────────────────────── */

/**
 * Opens the document HTML in a new tab via a Blob URL rather than
 * document.write(), which avoids XSS injection risk and parser-mode issues.
 * The Blob URL is revoked after the tab loads so it doesn't linger in memory.
 */
function openPrintWindow(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=900,height=700");
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  // Revoke after the tab has had time to load the blob
  win.addEventListener("load", () => URL.revokeObjectURL(url), { once: true });
  // Fallback revoke in case the load event doesn't fire (e.g. popup blocked then allowed)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/* ── Initialize doc fields from listing ────────────────────────────────────── */

function initDocFieldsForListing(listing: ListingPipeline): Record<DocType, Record<string, string>> {
  const today = new Date().toISOString().split("T")[0];
  const expiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return {
    "listing-agreement": {
      sellerName: "",
      sellerPhone: "",
      sellerEmail: "",
      propertyAddress: listing.address,
      propertyCity: `${listing.city}, OR`,
      legalDescription: "",
      listPrice: String(listing.price),
      commission: "5",
      listingTerm: "90",
      effectiveDate: today,
      expirationDate: expiry,
      agentName: listing.agentName,
      brokerageName: "Matin Real Estate",
      specialTerms: "",
    },
    "open-house-signin": {
      propertyAddress: listing.address,
      propertyCity: `${listing.city}, OR`,
      eventDate: "",
      startTime: "1:00 PM",
      endTime: "4:00 PM",
      agentName: listing.agentName,
      agentPhone: "(503) 622-9624",
      listPrice: String(listing.price),
      beds: String(listing.beds),
      baths: String(listing.baths),
      sqft: String(listing.sqft),
      yearBuilt: String(listing.yearBuilt),
      welcomeNote: "",
    },
  };
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export function ListingLaunch({ listings }: { listings: ListingPipeline[] }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(listings[0]?.id ?? null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [checklistOverrides, setChecklistOverrides] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [brokerOverrides, setBrokerOverrides] = useState<Record<string, boolean>>({});

  // Marketing kit state
  const [kitFields, setKitFields] = useState<Record<string, Record<string, string>>>({});
  const [kitOutput, setKitOutput] = useState<Record<string, string>>({});
  const [kitLoading, setKitLoading] = useState<Record<string, boolean>>({});
  const [kitTab, setKitTab] = useState<Record<string, KitTab>>({});
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Active MLS listings
  const [activeListings, setActiveListings] = useState<Set<string>>(new Set());

  // Detail tab per listing
  const [detailTab, setDetailTab] = useState<Record<string, DetailTab>>({});

  // Document fields per listing per doc type
  const [docFields, setDocFields] = useState<Record<string, Record<DocType, Record<string, string>>>>({});

  const selectedListing = listings.find((l) => l.id === selectedId) ?? null;

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return l.address.toLowerCase().includes(q) || l.city.toLowerCase().includes(q);
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
        return { ...prev, [listingId]: { ...listingOverrides, [key]: !currentVal } };
      });
    },
    [listings],
  );

  // Kit fields
  const getKitField = (listingId: string, field: string): string =>
    kitFields[listingId]?.[field] ?? "";

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

  // Initialize doc fields for a listing
  const initDocFields = useCallback(
    (listing: ListingPipeline) => {
      if (docFields[listing.id]) return;
      setDocFields((prev) => ({
        ...prev,
        [listing.id]: initDocFieldsForListing(listing),
      }));
    },
    [docFields],
  );

  const handleSelectListing = (listing: ListingPipeline) => {
    setSelectedId(listing.id);
    initKitFields(listing);
    initDocFields(listing);
  };

  // Generate marketing kit
  const handleGenerateKit = async (listing: ListingPipeline) => {
    const fields = kitFields[listing.id] ?? {};
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

  const handleCopy = (listingId: string, text: string, sectionKey: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedSection(sectionKey);
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  };

  const getBrokerApproved = (listing: ListingPipeline): boolean =>
    listing.id in brokerOverrides ? brokerOverrides[listing.id] : listing.brokerApproved;

  const toggleBrokerApproved = (listingId: string, current: boolean) => {
    setBrokerOverrides((prev) => ({ ...prev, [listingId]: !current }));
  };

  const handleMarkActive = (listingId: string) => {
    if (!getBrokerApproved(listings.find((l) => l.id === listingId)!)) return;
    setActiveListings((prev) => {
      const n = new Set(prev);
      n.add(listingId);
      return n;
    });
  };

  const handleDetailTabChange = (listingId: string, tab: DetailTab) => {
    setDetailTab((prev) => ({ ...prev, [listingId]: tab }));
  };

  const handleDocFieldChange = (listingId: string, docType: DocType, key: string, value: string) => {
    setDocFields((prev) => ({
      ...prev,
      [listingId]: {
        ...(prev[listingId] ?? initDocFieldsForListing(listings.find((l) => l.id === listingId)!)),
        [docType]: {
          ...(prev[listingId]?.[docType] ?? {}),
          [key]: value,
        },
      },
    }));
  };

  const handlePrintDoc = (listingId: string, docType: DocType) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;
    const fields = docFields[listingId]?.[docType] ?? {};
    const html =
      docType === "listing-agreement"
        ? buildListingAgreementHtml(fields)
        : buildOpenHouseHtml(fields);
    openPrintWindow(html);
  };

  // Init fields for first listing on mount
  if (selectedListing) {
    if (!kitFields[selectedListing.id]) initKitFields(selectedListing);
    if (!docFields[selectedListing.id]) initDocFields(selectedListing);
  }

  const sharedDetailProps = (listing: ListingPipeline): ListingDetailProps => ({
    listing,
    checklistOverrides,
    brokerOverrides,
    activeListings,
    kitFields,
    kitOutput,
    kitLoading,
    kitTab,
    copiedSection,
    detailTab,
    docFields,
    onToggle: handleToggle,
    onToggleBroker: toggleBrokerApproved,
    onMarkActive: handleMarkActive,
    onGenerateKit: handleGenerateKit,
    onKitTabChange: (listingId, tab) => setKitTab((prev) => ({ ...prev, [listingId]: tab })),
    onCopy: handleCopy,
    onKitFieldChange: handleKitFieldChange,
    getKitField,
    getBrokerApproved,
    onDetailTabChange: handleDetailTabChange,
    onDocFieldChange: handleDocFieldChange,
    onPrintDoc: handlePrintDoc,
  });

  return (
    <div className="relative" style={{ minHeight: "calc(100vh - 280px)" }}>
      {/* Mobile — horizontal pill-list of listing cards */}
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

      {/* Desktop two-pane layout */}
      <div className="flex gap-4">
        {/* Left pane */}
        <div className="hidden w-[280px] shrink-0 space-y-3 md:block">
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

        {/* Right pane (desktop) */}
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
            <ListingDetail {...sharedDetailProps(selectedListing)} />
          )}
        </div>

        {/* Mobile: placeholder when nothing selected */}
        <div className="min-w-0 flex-1 md:hidden">
          {!selectedListing && listings.length > 0 && (
            <Panel>
              <div className="px-5 py-8 text-center">
                <p className="text-[0.85rem] text-slate">Tap a listing above to view details.</p>
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

      {/* Mobile slide-over */}
      {mobileDetailOpen && selectedListing && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/30 md:hidden"
            onClick={() => setMobileDetailOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white border-l border-ink/[0.08] shadow-2xl sm:max-w-[480px] md:hidden">
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
            <div className="p-4">
              <ListingDetail {...sharedDetailProps(selectedListing)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
