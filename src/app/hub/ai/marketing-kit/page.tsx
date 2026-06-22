"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Megaphone,
  CheckCircle2,
  PenLine,
  FileText,
  Loader2,
  ClipboardCopy,
  Check,
  Copy,
  RefreshCw,
  X,
  Printer,
} from "lucide-react";
import { listings, getCommunity } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { LiveDot, Pill, SectionLabel } from "@/components/command/ui";

/* ─── types ─────────────────────────────────────────────────────────────── */

type SectionKey = "mls" | "instagram" | "facebook" | "email" | "openhouse";
type Sections = Record<SectionKey, string>;

const SECTION_KEYS: SectionKey[] = ["mls", "instagram", "facebook", "email", "openhouse"];

const TAB_CONFIG: Array<{
  key: SectionKey;
  label: string;
  copyLabel: string;
  charLimit?: number;
}> = [
  { key: "mls", label: "MLS Description", copyLabel: "MLS Description" },
  { key: "instagram", label: "Instagram", copyLabel: "Instagram Caption", charLimit: 150 },
  { key: "facebook", label: "Facebook", copyLabel: "Facebook Post", charLimit: 400 },
  { key: "email", label: "Email Blast", copyLabel: "Email Blast" },
  { key: "openhouse", label: "Open House", copyLabel: "Open House Invite" },
];

/* ─── section header map ─────────────────────────────────────────────────── */

const SECTION_HEADERS: Record<SectionKey, string> = {
  mls: "## MLS Description",
  instagram: "## Instagram Caption",
  facebook: "## Facebook Post",
  email: "## Email Blast",
  openhouse: "## Open House Invite",
};

const SECTION_LABEL_MAP: Record<SectionKey, string> = {
  mls: "MLS DESCRIPTION",
  instagram: "INSTAGRAM CAPTION",
  facebook: "FACEBOOK POST",
  email: "EMAIL BLAST",
  openhouse: "OPEN HOUSE INVITE",
};

/* ─── demo data ──────────────────────────────────────────────────────────── */

const EXAMPLE = listings.find((l) => l.status !== "Sold") ?? listings[0];
const community = getCommunity(EXAMPLE.communitySlug)?.name ?? EXAMPLE.city;

const TRY_EXAMPLE_VALUES = {
  address: EXAMPLE.address,
  city: `${EXAMPLE.city}, ${EXAMPLE.state}`,
  beds: String(EXAMPLE.beds),
  baths: String(EXAMPLE.baths),
  sqft: String(EXAMPLE.sqft),
  yearBuilt: String(EXAMPLE.yearBuilt),
  price: `$${EXAMPLE.price.toLocaleString()}`,
  features: EXAMPLE.features?.slice(0, 4).join(", ") ?? "Renovated kitchen, hardwood floors, mountain views",
  highlights: `${community} neighborhood, top-rated schools, minutes to downtown`,
};

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

const BLANK_FORM: Record<string, string> = {
  address: "", city: "", beds: "", baths: "", sqft: "", yearBuilt: "", price: "", features: "", highlights: "",
};

/* ─── utilities ──────────────────────────────────────────────────────────── */

/** Strip markdown syntax for clean clipboard paste */
function stripMarkdown(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^---+$/.test(line.trim()) && !line.startsWith("## ") && !line.startsWith("# "))
    .join("\n")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .trim();
}

/** Parse full streaming string into 5 named sections */
function parseSections(full: string): Sections {
  const result: Sections = { mls: "", instagram: "", facebook: "", email: "", openhouse: "" };

  for (let i = 0; i < SECTION_KEYS.length; i++) {
    const key = SECTION_KEYS[i];
    const header = SECTION_HEADERS[key];
    const startIdx = full.indexOf(header);
    if (startIdx === -1) continue;

    // Content starts after the header line
    const afterHeader = full.slice(startIdx + header.length);
    // Find where the next section begins
    let endIdx = afterHeader.length;
    for (let j = i + 1; j < SECTION_KEYS.length; j++) {
      const nextHeader = SECTION_HEADERS[SECTION_KEYS[j]];
      const nextIdx = afterHeader.indexOf(nextHeader);
      if (nextIdx !== -1 && nextIdx < endIdx) {
        endIdx = nextIdx;
      }
    }

    const raw = afterHeader.slice(0, endIdx).trim();
    // Strip any leading/trailing --- dividers
    result[key] = raw.replace(/^---+\s*/m, "").replace(/\s*---+$/m, "").trim();
  }

  return result;
}

/** Split Open House content into social post and flyer block */
function parseOpenHouseBlocks(content: string): { social: string; flyer: string } {
  const dividerMatch = content.match(/\n---+\n/);
  if (dividerMatch && dividerMatch.index !== undefined) {
    return {
      social: content.slice(0, dividerMatch.index).trim(),
      flyer: content.slice(dividerMatch.index + dividerMatch[0].length).trim(),
    };
  }
  // Try splitting on ### subheadings
  const subMatch = content.match(/\n###\s/);
  if (subMatch && subMatch.index !== undefined) {
    return {
      social: content.slice(0, subMatch.index).trim(),
      flyer: content.slice(subMatch.index).trim(),
    };
  }
  // No divider found — put everything in social
  return { social: content, flyer: "" };
}

/* ─── Open House sub-blocks component ───────────────────────────────────── */

function OpenHouseSubBlocks({
  content,
  onCopy,
}: {
  content: string;
  onCopy: (text: string, key: string) => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { social, flyer } = parseOpenHouseBlocks(content);

  function copyBlock(text: string, key: string) {
    onCopy(text, key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const blocks = [
    { key: "social", label: "Social Announcement", content: social },
    ...(flyer ? [{ key: "flyer", label: "Flyer Text Block", content: flyer }] : []),
  ];

  return (
    <div className={cn("grid gap-4", blocks.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
      {blocks.map((block) => (
        <div key={block.key} className="flex flex-col rounded-xl border border-ink/[0.08] bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-ink/[0.06] px-4 py-2.5">
            <SectionLabel>{block.label}</SectionLabel>
            <button
              onClick={() => copyBlock(stripMarkdown(block.content), block.key)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
            >
              {copiedKey === block.key ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <ClipboardCopy className="h-3 w-3" />
              )}
              {copiedKey === block.key ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex-1 p-4 text-[0.875rem] leading-relaxed text-ink">
            <AiMarkdown text={block.content} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function MarketingKitPage() {
  const [formValues, setFormValues] = useState<Record<string, string>>(BLANK_FORM);
  const [sections, setSections] = useState<Sections>({ mls: "", instagram: "", facebook: "", email: "", openhouse: "" });
  const [activeTab, setActiveTab] = useState<SectionKey>("mls");
  const [busy, setBusy] = useState(false);
  const [busySection, setBusySection] = useState<SectionKey | null>(null);
  const [copiedTab, setCopiedTab] = useState<SectionKey | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [touched, setTouched] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [loadedAddress, setLoadedAddress] = useState<string | null>(null);
  const [docDate, setDocDate] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  /* ── form helpers ───────────────────────────────────────────────────── */

  function setField(name: string, value: string) {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleListingSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) {
      setSelectedId("");
      setLoadedAddress(null);
      return;
    }
    setSelectedId(id);
    const opt = ALL_LISTING_OPTIONS.find((o) => o.id === id);
    if (opt) {
      setFormValues({ ...BLANK_FORM, ...opt.values });
      setLoadedAddress(opt.shortLabel);
    }
  }

  /* ── AI actions ─────────────────────────────────────────────────────── */

  async function generateAll(values: Record<string, string>) {
    if (busy) return;
    setBusy(true);
    setTouched(true);
    setSections({ mls: "", instagram: "", facebook: "", email: "", openhouse: "" });
    setDocDate("");
    setActiveTab("mls");

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }

    try {
      const finalOutput = await streamAi(
        { tool: "marketing-kit", input: values },
        (_chunk, full) => {
          setSections(parseSections(full));
        }
      );
      setDocDate(
        new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      );
      try { localStorage.setItem("matin_ai_last_marketing-kit", finalOutput.slice(0, 600)); } catch { /* private mode */ }
    } catch {
      setSections((prev) => ({ ...prev, mls: "_Sorry — connection error. Please try again._" }));
    } finally {
      setBusy(false);
    }
  }

  async function tryExampleAndRun() {
    if (busy) return;
    setFormValues({ ...BLANK_FORM, ...TRY_EXAMPLE_VALUES });
    setSelectedId("");
    setLoadedAddress(null);
    await generateAll({ ...BLANK_FORM, ...TRY_EXAMPLE_VALUES });
  }

  async function regenerateSection(section: SectionKey) {
    if (busy || busySection) return;
    const tab = TAB_CONFIG.find((t) => t.key === section);
    const targetedMsg = `Regenerate ONLY the ${tab?.label ?? section} for this property: ${formValues.address}, ${formValues.city}. ${formValues.beds}bd/${formValues.baths}ba, ${formValues.sqft} sqft, built ${formValues.yearBuilt}, priced at ${formValues.price}. Features: ${formValues.features}. Highlights: ${formValues.highlights}. Output ONLY that one section with its ## heading.`;

    setBusySection(section);
    setSections((prev) => ({ ...prev, [section]: "" }));

    try {
      await streamAi(
        { tool: "marketing-kit", messages: [{ role: "user", content: targetedMsg }] },
        (_chunk, full) => {
          // The response may include the section header — parse it out
          const parsed = parseSections(full);
          const content = parsed[section] || stripMarkdown(full);
          setSections((prev) => ({ ...prev, [section]: content }));
        }
      );
    } finally {
      setBusySection(null);
    }
  }

  async function copySection(section: SectionKey) {
    try {
      await navigator.clipboard.writeText(stripMarkdown(sections[section]));
      setCopiedTab(section);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function copyAll() {
    const parts = TAB_CONFIG.map(
      (tab) => `${SECTION_LABEL_MAP[tab.key]}\n\n${stripMarkdown(sections[tab.key])}`
    );
    try {
      await navigator.clipboard.writeText(parts.join("\n\n" + "─".repeat(40) + "\n\n"));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function clear() {
    setSections({ mls: "", instagram: "", facebook: "", email: "", openhouse: "" });
    setDocDate("");
    setTouched(false);
    setActiveTab("mls");
  }

  /* ── derived ─────────────────────────────────────────────────────────── */

  const hasAnySection = SECTION_KEYS.some((k) => sections[k]);
  const currentTabConfig = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const activeSectionContent = sections[activeTab];
  const charCount = activeSectionContent ? stripMarkdown(activeSectionContent).length : 0;
  const charLimit = currentTabConfig.charLimit;
  const charPct = charLimit ? charCount / charLimit : 0;
  const charTone = charPct > 1 ? "danger" : charPct > 0.9 ? "warn" : "success";

  /* ── render ──────────────────────────────────────────────────────────── */

  return (
    <>
      {/* Print CSS — scopes print output to marketing-kit-print-area only */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .marketing-kit-print-area { display: block !important; }
        }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8 space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[0.78rem] text-slate/60">
          <Link href="/hub/ai" className="inline-flex items-center gap-1 hover:text-ink transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" />
            AI Tools
          </Link>
          <span>/</span>
          <span className="text-ink/70">Marketing Kit</span>
        </nav>

        {/* Page header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink md:text-3xl">Marketing Kit</h1>
            <p className="mt-1 text-[0.92rem] text-slate">
              Generate five ready-to-paste channel assets — MLS copy, Instagram, Facebook, email blast, and open house invite.
            </p>
          </div>
        </div>

        {/* Main two-column grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">

          {/* ── LEFT: Input card ── */}
          <div className="rounded-2xl border border-ink/[0.08] bg-white px-4 py-5 md:px-6 md:py-6 print:hidden">

            {/* Card header */}
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
                <PenLine className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <span className="mb-1.5 inline-block rounded-full bg-azure/[0.09] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-azure">
                  Marketing
                </span>
                <h2 className="font-display text-xl text-ink sm:text-2xl">Marketing Kit</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate">
                  One click generates five ready-to-paste assets. Load a listing or fill in the details below.
                </p>
              </div>
            </div>

            {/* Load from Listings — inline in input card */}
            <div className="mt-4 rounded-xl border border-ink/[0.08] bg-[#fafaf9] px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="h-3.5 w-3.5 text-ink/40" />
                <SectionLabel>Load from Listings</SectionLabel>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedId}
                  onChange={handleListingSelect}
                  className="flex-1 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.82rem] text-ink transition-colors focus:border-ink/40 focus:outline-none"
                >
                  <option value="">— choose a listing to auto-fill —</option>
                  {ALL_LISTING_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
                {selectedId && (
                  <button
                    type="button"
                    onClick={() => { setSelectedId(""); setLoadedAddress(null); }}
                    className="shrink-0 text-[0.74rem] text-slate/50 hover:text-ink transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {loadedAddress && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.72rem] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  {loadedAddress}
                </span>
              )}
            </div>

            {/* Try with live data button */}
            <button
              type="button"
              onClick={tryExampleAndRun}
              disabled={busy}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-azure/30 bg-gradient-to-r from-azure/[0.08] to-azure-bright/[0.06] px-4 py-2.5 text-sm font-semibold text-azure transition-colors hover:border-azure/60 hover:bg-azure/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><PenLine className="h-4 w-4" /> Try with live data &rarr;</>
              )}
            </button>

            {/* Form */}
            <form
              className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); generateAll(formValues); }}
            >
              {/* Address — full width */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="f-address" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Property Address
                </label>
                <input
                  id="f-address"
                  type="text"
                  value={formValues.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="8457 NW Lakeshore Ave"
                  className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none"
                />
              </div>

              {/* City / State + Price */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-city" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">City / State</label>
                <input id="f-city" type="text" value={formValues.city} onChange={(e) => setField("city", e.target.value)} placeholder="Vancouver, WA" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-price" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">List Price</label>
                <input id="f-price" type="text" value={formValues.price} onChange={(e) => setField("price", e.target.value)} placeholder="$1,580,000" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>

              {/* Beds + Baths */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-beds" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">Beds</label>
                <input id="f-beds" type="number" value={formValues.beds} onChange={(e) => setField("beds", e.target.value)} placeholder="5" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-baths" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">Baths</label>
                <input id="f-baths" type="number" value={formValues.baths} onChange={(e) => setField("baths", e.target.value)} placeholder="4" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>

              {/* Sqft + Year Built */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-sqft" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">Square Feet</label>
                <input id="f-sqft" type="number" value={formValues.sqft} onChange={(e) => setField("sqft", e.target.value)} placeholder="2,624" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="f-yearBuilt" className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">Year Built</label>
                <input id="f-yearBuilt" type="number" value={formValues.yearBuilt} onChange={(e) => setField("yearBuilt", e.target.value)} placeholder="1974" className="rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none" />
              </div>

              {/* Features — full width */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="f-features" className="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Top 3–4 Standout Features
                  <span className="text-[0.6rem] font-normal normal-case tracking-normal text-slate/40">optional</span>
                </label>
                <textarea
                  id="f-features"
                  value={formValues.features}
                  onChange={(e) => setField("features", e.target.value)}
                  placeholder="ADU / guest suite, mountain views, chef's kitchen, hardwood floors…"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none"
                />
              </div>

              {/* Highlights — full width */}
              <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="f-highlights" className="flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
                  Neighborhood Highlights
                  <span className="text-[0.6rem] font-normal normal-case tracking-normal text-slate/40">optional</span>
                </label>
                <textarea
                  id="f-highlights"
                  value={formValues.highlights}
                  onChange={(e) => setField("highlights", e.target.value)}
                  placeholder="Top-rated schools, minutes to downtown, quiet cul-de-sac…"
                  rows={3}
                  className="w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/40 focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="col-span-1 sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {busy ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><PenLine className="h-4 w-4" /> Generate full marketing kit</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── RIGHT: Output card ── */}
          <div
            ref={outputRef}
            className="flex flex-col rounded-2xl border border-ink/[0.08] bg-white shadow-sm overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]"
            style={{ minHeight: 600 }}
          >
            {/* Output card header bar */}
            <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2">
                {busy ? <LiveDot tone="azure" /> : <FileText className="h-4 w-4 text-ink" />}
                <span className="text-[0.84rem] font-semibold text-ink">Marketing kit</span>
                {busy && (
                  <span className="text-[0.72rem] text-slate/70">streaming live</span>
                )}
              </div>
              {touched && !busy && hasAnySection && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => generateAll(formValues)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink disabled:opacity-40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate all
                  </button>
                  <button
                    onClick={copyAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                  >
                    {copiedAll ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    )}
                    {copiedAll ? "Copied!" : "Copy all"}
                  </button>
                </div>
              )}
            </div>

            {/* Document date banner */}
            {touched && docDate && formValues.address && (
              <div className="bg-[#f8f7f6] ring-1 ring-ink/[0.06] px-5 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <p className="font-display text-[0.68rem] uppercase tracking-[0.18em] text-ink/40">Matin Real Estate</p>
                <p className="font-display text-[0.9rem] font-semibold text-ink truncate">
                  {formValues.address}{formValues.city ? `, ${formValues.city}` : ""}
                </p>
                <p className="text-[0.72rem] text-slate/50 tabular-nums shrink-0">{docDate}</p>
              </div>
            )}

            {/* Tab rail — renders as soon as touched (even during loading) */}
            {touched && (
              <div className="flex overflow-x-auto border-b border-ink/[0.08] px-2 shrink-0 scrollbar-none">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "shrink-0 px-4 py-2.5 text-[0.84rem] font-medium transition-colors whitespace-nowrap border-b-2",
                      activeTab === tab.key
                        ? "border-ink text-ink"
                        : "border-transparent text-slate/60 hover:text-ink"
                    )}
                  >
                    {tab.label}
                    {sections[tab.key] && busySection !== tab.key && !busy && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 align-middle" />
                    )}
                    {(busySection === tab.key || (busy && !sections[tab.key])) && (
                      <span className="ml-1.5 inline-block">
                        <Loader2 className="h-3 w-3 animate-spin text-slate/40 inline" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Tab content area */}
            <div className="flex-1 overflow-y-auto relative flex flex-col">
              {!touched ? (
                /* Empty state */
                <div
                  className="flex h-full flex-col items-center justify-center gap-3 px-8 py-12"
                  style={{ minHeight: 450 }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paper ring-1 ring-inset ring-ink/[0.06]">
                    <PenLine className="h-6 w-6 text-ink/30" />
                  </div>
                  <p className="text-center text-[0.82rem] text-slate/45 max-w-[18rem]">
                    Fill in the details to generate your{" "}
                    <span className="font-medium text-slate/60">marketing kit</span>
                  </p>
                </div>
              ) : !activeSectionContent && (busy || busySection) ? (
                /* Skeleton shimmer for this tab */
                <div className="px-6 py-6 space-y-3 flex-1">
                  <div className="h-3 w-3/4 rounded bg-ink/[0.06] animate-pulse" />
                  <div className="h-3 w-full rounded bg-ink/[0.06] animate-pulse" />
                  <div className="h-3 w-2/3 rounded bg-ink/[0.06] animate-pulse" />
                  <div className="h-3 w-full rounded bg-ink/[0.06] animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-ink/[0.06] animate-pulse" />
                  <div className="h-3 w-4/5 rounded bg-ink/[0.06] animate-pulse" />
                </div>
              ) : activeSectionContent ? (
                <div className="flex flex-col flex-1">
                  {/* Tab action bar — sticky at top of content */}
                  <div className="sticky top-0 z-10 bg-white border-b border-ink/[0.06] px-5 py-2.5 flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copySection(activeTab)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                    >
                      {copiedTab === activeTab ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <ClipboardCopy className="h-3.5 w-3.5" />
                      )}
                      {copiedTab === activeTab ? "Copied!" : `Copy ${currentTabConfig.copyLabel}`}
                    </button>

                    {/* Character count badge for Instagram & Facebook */}
                    {charLimit && (
                      <Pill tone={charTone} className="ml-1">
                        {charCount} / {charLimit} chars
                      </Pill>
                    )}

                    <button
                      onClick={() => regenerateSection(activeTab)}
                      disabled={busy || !!busySection}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1.5 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink disabled:opacity-40"
                    >
                      {busySection === activeTab ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Regenerate
                    </button>
                  </div>

                  {/* Content area */}
                  <div className="flex-1 px-5 py-5">
                    {activeTab === "openhouse" ? (
                      <OpenHouseSubBlocks
                        content={activeSectionContent}
                        onCopy={async (text) => {
                          try {
                            await navigator.clipboard.writeText(text);
                          } catch {
                            /* clipboard unavailable */
                          }
                        }}
                      />
                    ) : (
                      <div className="prose-document rounded-xl border border-ink/[0.08] bg-white p-5 text-[0.875rem] leading-relaxed text-ink">
                        <AiMarkdown text={activeSectionContent} />
                        {(busy || busySection === activeTab) && (
                          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ink align-middle" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile sticky copy bar */}
                  <div className="sticky bottom-0 bg-white border-t border-ink/[0.06] px-4 py-3 sm:hidden">
                    <button
                      onClick={() => copySection(activeTab)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-semibold text-white"
                    >
                      {copiedTab === activeTab ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedTab === activeTab ? "Copied!" : `Copy ${currentTabConfig.copyLabel}`}
                    </button>
                  </div>
                </div>
              ) : touched && !busy ? (
                /* Generation finished but this tab has no content */
                <div className="flex h-full flex-col items-center justify-center gap-2 px-8 py-12" style={{ minHeight: 200 }}>
                  <p className="text-center text-[0.82rem] text-slate/45">
                    No content for this section yet.{" "}
                    <button
                      onClick={() => regenerateSection(activeTab)}
                      className="underline text-slate/60 hover:text-ink transition-colors"
                    >
                      Regenerate
                    </button>
                  </p>
                </div>
              ) : null}
            </div>

            {/* Bottom action bar — shown after generation completes */}
            {touched && !busy && hasAnySection && (
              <div className="border-t border-ink/[0.06] bg-[#fafaf9] px-4 py-3 flex flex-wrap items-center gap-2 shrink-0 sm:px-5">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                >
                  <Printer className="h-3.5 w-3.5" /> Download as PDF
                </button>
                <button
                  onClick={copyAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-ink/20 hover:bg-paper hover:text-ink"
                >
                  {copiedAll ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedAll ? "Copied!" : "Copy All (plain text)"}
                </button>
                <button
                  onClick={clear}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.78rem] font-medium text-slate transition-colors hover:border-red-100 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden print area — all 5 sections rendered sequentially */}
      <div className="marketing-kit-print-area hidden">
        <div style={{ fontFamily: "Georgia, serif", maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>
          <div style={{ borderBottom: "2px solid #1a1a1a", marginBottom: 24, paddingBottom: 16 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", margin: 0 }}>
              Matin Real Estate — Marketing Kit
            </p>
            {formValues.address && (
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 4px" }}>
                {formValues.address}{formValues.city ? `, ${formValues.city}` : ""}
              </h1>
            )}
            {docDate && (
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{docDate}</p>
            )}
          </div>
          {TAB_CONFIG.map((tab) => (
            sections[tab.key] ? (
              <div key={tab.key} style={{ marginBottom: 32, pageBreakInside: "avoid" }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#555", borderBottom: "1px solid #e5e5e5", paddingBottom: 8, marginBottom: 12 }}>
                  {SECTION_LABEL_MAP[tab.key]}
                </h2>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: "#1a1a1a", whiteSpace: "pre-wrap", margin: 0 }}>
                  {stripMarkdown(sections[tab.key])}
                </p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </>
  );
}
