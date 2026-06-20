"use client";

import { useState, useRef } from "react";
import {
  DollarSign,
  X,
  Phone,
  Home,
  Clock,
  User,
  Bed,
  Bath,
  Maximize2,
  CalendarDays,
  StickyNote,
  Send,
  ArrowRightLeft,
  CheckCircle,
  ChevronRight,
  FileText,
  Wand2,
  Printer,
  Copy,
  ChevronDown,
  BarChart2,
  Zap,
} from "lucide-react";
import { sellerLeads } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { Pill } from "@/components/command/ui";
import { cn, initials } from "@/lib/utils";
import type { SellerLead, SellerLeadStage, PropertyCondition } from "@/lib/types";

/* ── Constants ──────────────────────────────────────────────────────────────── */

const STAGES: SellerLeadStage[] = [
  "New Request",
  "Needs Valuation",
  "Offer Pending",
  "Offer Sent",
  "Accepted",
  "Converted to Listing",
  "Dead",
];

const STAGE_HEADER_TONE: Record<SellerLeadStage, string> = {
  "New Request":          "bg-blue-50   text-blue-700   border-blue-200",
  "Needs Valuation":      "bg-purple-50 text-purple-700 border-purple-200",
  "Offer Pending":        "bg-amber-50  text-amber-700  border-amber-200",
  "Offer Sent":           "bg-orange-50 text-orange-700 border-orange-200",
  "Accepted":             "bg-green-50  text-green-700  border-green-200",
  "Converted to Listing": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Dead":                 "bg-slate-50  text-slate-500  border-slate-200",
};

const ACTIVE_EXCLUDED: SellerLeadStage[] = ["Dead", "Accepted", "Converted to Listing"];

const SLIDE_TABS = ["Overview", "AI Analysis", "Documents", "Notes"] as const;
type SlideTab = (typeof SLIDE_TABS)[number];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function conditionTone(c: PropertyCondition): "success" | "azure" | "warn" | "danger" {
  switch (c) {
    case "Excellent":  return "success";
    case "Good":       return "azure";
    case "Fair":       return "warn";
    case "Needs Work": return "danger";
  }
}

function timelineTone(t: string): "warn" | "danger" | "azure" | "neutral" {
  switch (t) {
    case "ASAP":        return "danger";
    case "1-3 months":  return "warn";
    case "3-6 months":  return "azure";
    default:            return "neutral";
  }
}

function formatUsd(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

function compactK(n: number): string {
  return "$" + (n / 1000).toFixed(0) + "K";
}

function slugHue(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function agentInitials(slug: string): string {
  return initials(slug.replace(/-/g, " "));
}

function formatAgentName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/* ── Document templates ──────────────────────────────────────────────────────── */

interface DocFields {
  offerAmount: string;
  closingDate: string;
  earnestMoney: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  additionalTerms: string;
}

function buildCashOfferLetter(lead: SellerLead, fields: DocFields): string {
  return `CASH OFFER LETTER
Matin Real Estate · Cash Is King Home Buyers
18825 Willamette Dr, West Linn, OR 97068 · (503) 622-9624

Date: ${todayStr()}

To: ${lead.sellerName}
Re: ${lead.address}, ${lead.city}

Dear ${lead.sellerName},

We are pleased to present this cash offer to purchase the above-referenced property.

PROPERTY
Address:        ${lead.address}, ${lead.city}
Beds / Baths:   ${lead.beds} bed · ${lead.baths} bath
Square Feet:    ${lead.sqft.toLocaleString()} sqft · Built ${lead.yearBuilt}
Condition:      ${lead.condition}

OFFER TERMS
Purchase Price:    ${fields.offerAmount || "[OFFER AMOUNT]"}
Earnest Money:     ${fields.earnestMoney || "[EARNEST MONEY]"}
Proposed Closing:  ${fields.closingDate || "[CLOSING DATE]"}
Financing:         ALL CASH — No financing contingency
Inspections:       Waived — Property purchased as-is
Closing Costs:     Paid by Cash Is King Home Buyers

This offer is contingent upon the execution of a mutually acceptable Purchase and Sale Agreement
and a satisfactory title review. No repairs or credits will be requested.

${fields.additionalTerms ? `ADDITIONAL TERMS\n${fields.additionalTerms}\n\n` : ""}This offer is valid for 72 hours from the date above.

We look forward to working with you.

Sincerely,

${fields.agentName || "[AGENT NAME]"}
${fields.agentPhone || "(503) 622-9624"} · ${fields.agentEmail || "info@matinrealestate.com"}
Matin Real Estate | Cash Is King Home Buyers
Licensed Oregon Real Estate Broker

────────────────────────────────────────────────────────
This letter is a summary of proposed terms only. All transactions
are subject to a fully executed Purchase and Sale Agreement.
Matin Real Estate, 18825 Willamette Dr, West Linn OR 97068.
`;
}

function buildLetterOfIntent(lead: SellerLead, fields: DocFields): string {
  return `LETTER OF INTENT TO PURCHASE REAL PROPERTY
Matin Real Estate · Cash Is King Home Buyers
18825 Willamette Dr, West Linn, OR 97068 · (503) 622-9624

Date: ${todayStr()}

SELLER:   ${lead.sellerName}
BUYER:    Cash Is King Home Buyers (affiliated with Matin Real Estate)

PROPERTY: ${lead.address}, ${lead.city}
          ${lead.beds} bed · ${lead.baths} bath · ${lead.sqft.toLocaleString()} sqft · Built ${lead.yearBuilt}

────────────────────────────────────────────────────────────

1. PURCHASE PRICE
   The Buyer intends to purchase the Property for ${fields.offerAmount || "[OFFER AMOUNT]"} cash.

2. EARNEST MONEY
   Buyer will deposit ${fields.earnestMoney || "[EARNEST MONEY]"} in earnest money within 3 business
   days of mutual acceptance of a Purchase and Sale Agreement.

3. DUE DILIGENCE / INSPECTION
   Buyer will have 7 calendar days from mutual acceptance to conduct any desired
   inspections. Property is purchased in its current as-is condition.

4. CLOSING DATE
   Estimated closing: ${fields.closingDate || "[CLOSING DATE]"} or sooner at mutual agreement.

5. CLOSING COSTS
   All standard closing costs to be paid by Buyer. No real estate commission
   charged to Seller through this transaction.

6. FINANCING CONTINGENCY
   NONE. This is a fully funded cash purchase.

7. TITLE
   A preliminary title report will be ordered within 3 business days of acceptance.
   Buyer to approve title within 5 business days of receipt.

${fields.additionalTerms ? `8. ADDITIONAL TERMS\n   ${fields.additionalTerms}\n\n` : ""}────────────────────────────────────────────────────────────
NON-BINDING NATURE OF THIS LETTER
This Letter of Intent is intended solely to outline the proposed terms of a potential
transaction and is NOT a binding contract. Either party may withdraw at any time prior
to execution of a fully signed Purchase and Sale Agreement. This document does not
create any obligation to negotiate exclusively or in good faith.

────────────────────────────────────────────────────────────

ACKNOWLEDGED BY:

Buyer:  _________________________________  Date: ______________
        ${fields.agentName || "[AGENT NAME]"}, on behalf of Cash Is King Home Buyers

Seller: _________________________________  Date: ______________
        ${lead.sellerName}

────────────────────────────────────────────────────────────
Matin Real Estate | (503) 622-9624 | info@matinrealestate.com
18825 Willamette Dr, West Linn, OR 97068
`;
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function AgentAvatar({ slug }: { slug: string }) {
  const hue = slugHue(slug);
  return (
    <span
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold"
      style={{ backgroundColor: `hsl(${hue},38%,88%)`, color: `hsl(${hue},45%,30%)` }}
      title={slug}
    >
      {agentInitials(slug)}
    </span>
  );
}

function DaysPill({ days }: { days: number }) {
  const cls =
    days > 7
      ? "bg-red-50 text-red-600"
      : days >= 4
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", cls)}>
      {days}d in stage
    </span>
  );
}

function FactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/[0.06] text-ink">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">{label}</p>
        <p className="text-[0.85rem] text-ink">{value}</p>
      </div>
    </div>
  );
}

/* ── Kanban card ─────────────────────────────────────────────────────────────── */

function LeadCard({ lead, onClick }: { lead: SellerLead; onClick: () => void }) {
  const isStale = lead.daysInStage > 7;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full cursor-pointer rounded-xl bg-white text-left shadow-soft ring-1 p-3 transition-all hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        isStale ? "ring-red-200" : "ring-ink/[0.07]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-medium text-[0.88rem] text-ink leading-tight">{lead.sellerName}</p>
        {isStale && (
          <span className="shrink-0 text-[0.65rem] font-semibold text-red-600 bg-red-50 rounded-full px-1.5 py-0.5">
            {lead.daysInStage}d
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[0.75rem] text-slate">{lead.address}, {lead.city}</p>
      {lead.motivation && (
        <p className="mt-1 line-clamp-1 text-[0.72rem] italic text-slate/70">
          {lead.motivation}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="font-display text-[0.9rem] font-semibold text-ink tabular-nums">
          {compactK(lead.estValue)}
        </span>
        <Pill tone={conditionTone(lead.condition)}>{lead.condition}</Pill>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <DaysPill days={lead.daysInStage} />
        <div className="flex items-center gap-1.5">
          <ChevronRight className="h-4 w-4 text-slate/40 opacity-0 transition-opacity group-hover:opacity-100" />
          <AgentAvatar slug={lead.assignedAgent} />
        </div>
      </div>
    </button>
  );
}

/* ── Documents tab ───────────────────────────────────────────────────────────── */

type DocType = "cash-offer" | "loi" | null;

function DocumentsTab({ lead }: { lead: SellerLead }) {
  const [activeDoc, setActiveDoc] = useState<DocType>(null);
  const [fields, setFields] = useState<DocFields>({
    offerAmount: "",
    closingDate: "",
    earnestMoney: "$5,000",
    agentName: formatAgentName(lead.assignedAgent),
    agentPhone: "(503) 622-9624",
    agentEmail: "info@matinrealestate.com",
    additionalTerms: "",
  });
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLPreElement>(null);

  function generatePreview() {
    if (!activeDoc) return;
    const text =
      activeDoc === "cash-offer"
        ? buildCashOfferLetter(lead, fields)
        : buildLetterOfIntent(lead, fields);
    setPreview(text);
  }

  function handleCopy() {
    if (!preview) return;
    navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handlePrint() {
    if (!preview) return;
    const win = window.open("", "_blank");
    if (!win) return;

    const docTitle = (activeDoc === "cash-offer" ? "Cash Offer Letter" : "Letter of Intent")
      + " — " + lead.sellerName;

    // Build DOM nodes — never inject HTML strings, avoids document.write XSS
    const titleEl = win.document.createElement("title");
    titleEl.textContent = docTitle;
    win.document.head.appendChild(titleEl);

    const style = win.document.createElement("style");
    style.textContent = [
      "body{font-family:'Courier New',monospace;font-size:12px;line-height:1.6;",
      "margin:40px;color:#1a1a1a;white-space:pre-wrap;}",
      "@media print{body{margin:20mm;}}",
    ].join("");
    win.document.head.appendChild(style);

    const pre = win.document.createElement("pre");
    pre.textContent = preview; // textContent never parses HTML — XSS-safe
    win.document.body.appendChild(pre);

    win.focus();
    win.print();
  }

  // Reset preview when doc type or fields change (user should regenerate)
  function handleFieldChange(key: keyof DocFields, val: string) {
    setFields((f) => ({ ...f, [key]: val }));
    setPreview("");
  }

  function handleDocSelect(d: DocType) {
    setActiveDoc(d === activeDoc ? null : d);
    setPreview("");
  }

  return (
    <div className="space-y-4">
      {/* Doc picker */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleDocSelect("cash-offer")}
          className={cn(
            "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
            activeDoc === "cash-offer"
              ? "border-ink bg-ink text-white"
              : "border-ink/[0.1] bg-white hover:border-ink/30 text-ink",
          )}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0" />
            <span className="text-[0.82rem] font-semibold">Cash Offer Letter</span>
          </div>
          <p className={cn("text-[0.72rem]", activeDoc === "cash-offer" ? "text-white/70" : "text-slate")}>
            Formal offer to purchase — pre-filled
          </p>
        </button>
        <button
          onClick={() => handleDocSelect("loi")}
          className={cn(
            "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
            activeDoc === "loi"
              ? "border-ink bg-ink text-white"
              : "border-ink/[0.1] bg-white hover:border-ink/30 text-ink",
          )}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="text-[0.82rem] font-semibold">Letter of Intent</span>
          </div>
          <p className={cn("text-[0.72rem]", activeDoc === "loi" ? "text-white/70" : "text-slate")}>
            Non-binding LOI — structured terms
          </p>
        </button>
      </div>

      {/* Inline form */}
      {activeDoc && (
        <div className="space-y-3 rounded-xl border border-ink/[0.08] bg-white p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
            Document Fields
          </p>

          {/* Pre-filled read-only context */}
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-ink/[0.03] p-2.5">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate/60">Seller</p>
              <p className="text-[0.8rem] text-ink">{lead.sellerName}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate/60">Property</p>
              <p className="text-[0.8rem] text-ink truncate">{lead.address}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate/60">City</p>
              <p className="text-[0.8rem] text-ink">{lead.city}</p>
            </div>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-slate/60">Est. Value</p>
              <p className="text-[0.8rem] text-ink">{formatUsd(lead.estValue)}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-2">
            <label className="block">
              <span className="text-[0.72rem] font-semibold text-slate/70">Offer Amount *</span>
              <input
                type="text"
                placeholder="e.g. $342,000"
                value={fields.offerAmount}
                onChange={(e) => handleFieldChange("offerAmount", e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[0.72rem] font-semibold text-slate/70">Earnest Money</span>
                <input
                  type="text"
                  value={fields.earnestMoney}
                  onChange={(e) => handleFieldChange("earnestMoney", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink focus:border-ink/25 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[0.72rem] font-semibold text-slate/70">Closing Date</span>
                <input
                  type="text"
                  placeholder="e.g. July 15, 2026"
                  value={fields.closingDate}
                  onChange={(e) => handleFieldChange("closingDate", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[0.72rem] font-semibold text-slate/70">Agent Name</span>
              <input
                type="text"
                value={fields.agentName}
                onChange={(e) => handleFieldChange("agentName", e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink focus:border-ink/25 focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[0.72rem] font-semibold text-slate/70">Agent Phone</span>
                <input
                  type="text"
                  value={fields.agentPhone}
                  onChange={(e) => handleFieldChange("agentPhone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink focus:border-ink/25 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[0.72rem] font-semibold text-slate/70">Agent Email</span>
                <input
                  type="text"
                  value={fields.agentEmail}
                  onChange={(e) => handleFieldChange("agentEmail", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink focus:border-ink/25 focus:outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[0.72rem] font-semibold text-slate/70">Additional Terms (optional)</span>
              <textarea
                rows={2}
                placeholder="Any special terms or conditions..."
                value={fields.additionalTerms}
                onChange={(e) => handleFieldChange("additionalTerms", e.target.value)}
                className="mt-1 w-full resize-y rounded-lg border border-ink/[0.1] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/25 focus:outline-none"
              />
            </label>
          </div>

          <button
            onClick={generatePreview}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-ink/90"
          >
            <FileText className="h-3.5 w-3.5" />
            Preview Document
          </button>
        </div>
      )}

      {/* Document preview */}
      {preview && (
        <div className="space-y-2">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
              Preview — {activeDoc === "cash-offer" ? "Cash Offer Letter" : "Letter of Intent"}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.75rem] font-semibold transition-colors",
                  copied
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-ink/[0.06] text-ink hover:bg-ink/[0.1]",
                )}
              >
                {copied ? (
                  <><CheckCircle className="h-3.5 w-3.5" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-ink/[0.06] px-3 py-1.5 text-[0.75rem] font-semibold text-ink transition-colors hover:bg-ink/[0.1]"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          {/* Matin branding header */}
          <div className="rounded-t-xl border border-b-0 border-ink/[0.1] bg-ink px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[0.78rem] font-bold tracking-wider text-white uppercase">Matin Real Estate</p>
                <p className="text-[0.68rem] text-white/60">Cash Is King Home Buyers</p>
              </div>
              <div className="text-right">
                <p className="text-[0.68rem] text-white/60">18825 Willamette Dr</p>
                <p className="text-[0.68rem] text-white/60">West Linn, OR 97068</p>
                <p className="text-[0.68rem] text-white/70">(503) 622-9624</p>
              </div>
            </div>
          </div>

          {/* Document body */}
          <pre
            ref={previewRef}
            className="rounded-b-xl border border-t-0 border-ink/[0.1] bg-[#f9f9f8] px-4 py-4 font-mono text-[0.72rem] leading-relaxed text-ink overflow-x-auto whitespace-pre-wrap"
          >
            {preview}
          </pre>
        </div>
      )}

      {!activeDoc && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/[0.08] py-10 text-center">
          <FileText className="h-8 w-8 text-ink/20 mb-2" />
          <p className="text-[0.82rem] text-slate">Select a document type above</p>
          <p className="mt-1 text-[0.72rem] text-slate/60">Pre-fills from seller lead data</p>
        </div>
      )}
    </div>
  );
}

/* ── Slide-over ──────────────────────────────────────────────────────────────── */

type AiMode = "eval" | "script" | "offer-draft" | "valuation" | null;

function SlideOver({
  lead,
  onClose,
  onStageChange,
  onConvert,
}: {
  lead: SellerLead | null;
  onClose: () => void;
  onStageChange: (id: string, stage: SellerLeadStage) => void;
  onConvert: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<SlideTab>("Overview");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>(null);
  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [stageConfirm, setStageConfirm] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  // Reset all state when a different lead is opened
  const [activeId, setActiveId] = useState<string | null>(null);
  if (lead && lead.id !== activeId) {
    setActiveId(lead.id);
    setAiOutput("");
    setAiLoading(false);
    setAiMode(null);
    setNoteText("");
    setNoteSaved(false);
    setStageConfirm(null);
    setConverting(false);
    setActiveTab("Overview");
  }

  const open = !!lead;

  async function runAi(mode: AiMode) {
    if (!lead || aiLoading || !mode) return;
    setAiMode(mode);
    setAiLoading(true);
    setAiOutput("");

    // Switch to AI Analysis tab for results (unless we're already there)
    if (mode !== null) setActiveTab("AI Analysis");

    try {
      if (mode === "eval" || mode === "valuation") {
        await streamAi(
          {
            tool: "cash-offer-eval",
            input: {
              address: lead.address,
              city: lead.city,
              beds: lead.beds,
              baths: lead.baths,
              sqft: lead.sqft,
              yearBuilt: lead.yearBuilt,
              condition: lead.condition,
              motivation: lead.motivation,
              estValue: lead.estValue,
              timeline: lead.timeline,
              notes: lead.notes,
            },
          },
          (_, full) => setAiOutput(full),
        );
      } else if (mode === "script") {
        await streamAi(
          {
            tool: "seller-intel",
            input: {
              address: lead.address,
              city: lead.city,
              estValue: lead.estValue,
              beds: lead.beds,
              baths: lead.baths,
              sqft: lead.sqft,
              yearBuilt: lead.yearBuilt,
              condition: lead.condition,
              motivation: lead.motivation,
              timeline: lead.timeline,
              notes: lead.notes,
            },
          },
          (_, full) => setAiOutput(full),
        );
      } else if (mode === "offer-draft") {
        await streamAi(
          {
            tool: "doc-generate",
            input: {
              templateName: "Cash Offer Letter",
              brokerage: {
                name: "Matin Real Estate / Cash Is King Home Buyers",
                address: "18825 Willamette Dr, West Linn, OR 97068",
                phone: "(503) 622-9624",
                email: "info@matinrealestate.com",
              },
              fields: {
                "Seller Name": lead.sellerName,
                "Property Address": `${lead.address}, ${lead.city}`,
                "Property Details": `${lead.beds} bed / ${lead.baths} bath · ${lead.sqft.toLocaleString()} sqft · Built ${lead.yearBuilt}`,
                "Estimated Value": formatUsd(lead.estValue),
                "Property Condition": lead.condition,
                "Seller Motivation": lead.motivation,
                "Seller Timeline": lead.timeline,
                "Assigned Agent": formatAgentName(lead.assignedAgent),
              },
            },
          },
          (_, full) => setAiOutput(full),
        );
      }
    } finally {
      setAiLoading(false);
    }
  }

  function aiModeLabel(m: AiMode): string {
    switch (m) {
      case "eval":        return "Cash Offer Evaluation";
      case "valuation":   return "AI Valuation";
      case "script":      return "Seller Intel & Call Script";
      case "offer-draft": return "AI Draft Offer Letter";
      default:            return "";
    }
  }

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full sm:max-w-[500px] flex-col border-l border-ink/[0.08] bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-ink/[0.08] px-5 pb-0 pt-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pr-10">
                <h2 className="font-display text-xl text-ink leading-tight">{lead.sellerName}</h2>
                <p className="mt-0.5 text-[0.85rem] text-slate">{lead.address}, {lead.city}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="font-display text-2xl leading-none text-ink tabular-nums">
                    {formatUsd(lead.estValue)}
                  </span>
                  <Pill tone={conditionTone(lead.condition)}>{lead.condition}</Pill>
                  <Pill tone="neutral">{lead.stage}</Pill>
                  <Pill tone="neutral">{lead.daysInStage}d in stage</Pill>
                </div>
              </div>

              {/* Tab strip */}
              <div className="mt-4 flex gap-0 overflow-x-auto">
                {SLIDE_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "shrink-0 border-b-2 px-4 pb-2.5 pt-1 text-[0.78rem] font-semibold transition-colors whitespace-nowrap",
                      activeTab === tab
                        ? "border-ink text-ink"
                        : "border-transparent text-slate hover:text-ink",
                    )}
                  >
                    {tab}
                    {tab === "AI Analysis" && aiLoading && (
                      <span className="ml-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-5">

              {/* ────── OVERVIEW TAB ────── */}
              {activeTab === "Overview" && (
                <div className="space-y-5">

                  {/* QUICK AI row */}
                  <div className="rounded-xl border border-ink/[0.08] bg-ink/[0.02] p-3">
                    <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-slate/60">
                      Quick AI
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => runAi("valuation")}
                        disabled={aiLoading}
                        className="flex flex-col items-center gap-1 rounded-lg border border-ink/[0.1] bg-white px-2 py-2.5 text-center text-[0.72rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white hover:border-ink disabled:opacity-40"
                      >
                        {aiLoading && aiMode === "valuation" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <BarChart2 className="h-4 w-4" />
                        )}
                        AI Valuation
                      </button>
                      <button
                        onClick={() => runAi("script")}
                        disabled={aiLoading}
                        className="flex flex-col items-center gap-1 rounded-lg border border-ink/[0.1] bg-white px-2 py-2.5 text-center text-[0.72rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white hover:border-ink disabled:opacity-40"
                      >
                        {aiLoading && aiMode === "script" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                        Call Script
                      </button>
                      <button
                        onClick={() => runAi("offer-draft")}
                        disabled={aiLoading}
                        className="flex flex-col items-center gap-1 rounded-lg border border-ink/[0.1] bg-white px-2 py-2.5 text-center text-[0.72rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white hover:border-ink disabled:opacity-40"
                      >
                        {aiLoading && aiMode === "offer-draft" ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Draft Offer
                      </button>
                    </div>
                    {aiLoading && (
                      <p className="mt-2 text-center text-[0.68rem] text-slate/60 animate-pulse">
                        Generating {aiModeLabel(aiMode).toLowerCase()}... switching to AI Analysis tab
                      </p>
                    )}
                  </div>

                  {/* Motivation block */}
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-amber-700/80">
                        Motivation
                      </p>
                      <Pill tone={timelineTone(lead.timeline)}>{lead.timeline}</Pill>
                    </div>
                    <p className="text-[0.85rem] text-ink/90 leading-snug">{lead.motivation}</p>
                    {lead.notes && (
                      <p className="mt-2 border-t border-amber-200/60 pt-2 text-[0.8rem] text-amber-800/80 italic">
                        {lead.notes}
                      </p>
                    )}
                  </div>

                  {/* Stage selector */}
                  <div>
                    <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                      Move to stage
                    </p>
                    <select
                      value={lead.stage}
                      onChange={(e) => {
                        const newStage = e.target.value as SellerLeadStage;
                        onStageChange(lead.id, newStage);
                        setStageConfirm(newStage);
                        setTimeout(() => setStageConfirm(null), 2000);
                      }}
                      className="w-full rounded-xl border border-ink/[0.08] bg-white px-3 py-2 text-[0.85rem] text-ink focus:border-ink/20 focus:outline-none"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {stageConfirm && (
                      <p className="mt-1 text-[0.75rem] font-medium text-emerald-600">
                        Moved to {stageConfirm}
                      </p>
                    )}
                  </div>

                  {/* Key facts */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ink/[0.03] rounded-xl p-3">
                      <div className="text-[0.7rem] uppercase tracking-wide text-slate/60">Est. Value</div>
                      <div className="font-display text-xl text-ink mt-1">{formatUsd(lead.estValue)}</div>
                    </div>
                    <div className="bg-ink/[0.03] rounded-xl p-3">
                      <div className="text-[0.7rem] uppercase tracking-wide text-slate/60">Condition</div>
                      <div className="font-medium text-ink mt-1">{lead.condition}</div>
                    </div>
                  </div>

                  {/* Property details */}
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink/[0.08] bg-white p-3">
                    <div className="col-span-2">
                      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">Property</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                      <Bed className="h-3.5 w-3.5 text-ink/60" />{lead.beds} bed
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                      <Bath className="h-3.5 w-3.5 text-ink/60" />{lead.baths} bath
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                      <Maximize2 className="h-3.5 w-3.5 text-ink/60" />{lead.sqft.toLocaleString()} sqft
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.82rem] text-slate">
                      <CalendarDays className="h-3.5 w-3.5 text-ink/60" />Built {lead.yearBuilt}
                    </div>
                  </div>

                  {/* Seller info */}
                  <div className="space-y-3 rounded-xl border border-ink/[0.08] bg-white p-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">Seller</p>
                    <FactRow icon={<User className="h-3.5 w-3.5" />} label="Name" value={lead.sellerName} />
                    <FactRow icon={<Clock className="h-3.5 w-3.5" />} label="Assigned Agent" value={formatAgentName(lead.assignedAgent)} />
                  </div>
                </div>
              )}

              {/* ────── AI ANALYSIS TAB ────── */}
              {activeTab === "AI Analysis" && (
                <div className="space-y-4">
                  {/* Full AI buttons (bigger surface for deliberate use) */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => runAi("eval")}
                      disabled={aiLoading}
                      className="flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 px-4 text-sm font-semibold hover:bg-ink/90 disabled:opacity-50 transition-colors"
                    >
                      {aiLoading && aiMode === "eval" ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Evaluating...
                        </>
                      ) : (
                        <><DollarSign className="h-4 w-4" /> Generate Cash Offer Eval</>
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => runAi("script")}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 rounded-xl border border-ink/20 text-ink py-2.5 px-4 text-sm font-semibold hover:bg-ink/5 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading && aiMode === "script" ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                            Generating...
                          </>
                        ) : (
                          <><Phone className="h-4 w-4" /> Call Script</>
                        )}
                      </button>
                      <button
                        onClick={() => runAi("offer-draft")}
                        disabled={aiLoading}
                        className="flex items-center justify-center gap-2 rounded-xl border border-ink/20 text-ink py-2.5 px-4 text-sm font-semibold hover:bg-ink/5 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading && aiMode === "offer-draft" ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                            Drafting...
                          </>
                        ) : (
                          <><Wand2 className="h-4 w-4" /> Draft Offer</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Output */}
                  {(aiOutput || (aiLoading && aiMode)) && (
                    <div className="rounded-xl border border-ink/[0.08] bg-[#f4f4f3] p-4">
                      <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                        {aiModeLabel(aiMode)}
                      </p>
                      {aiLoading && !aiOutput && (
                        <div className="flex items-center gap-2 text-[0.82rem] text-slate">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                          Generating...
                        </div>
                      )}
                      {aiOutput && <AiMarkdown text={aiOutput} />}
                    </div>
                  )}

                  {!aiOutput && !aiLoading && (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/[0.08] py-12 text-center">
                      <Wand2 className="h-8 w-8 text-ink/20 mb-2" />
                      <p className="text-[0.82rem] text-slate">Select an AI tool above</p>
                      <p className="mt-1 text-[0.72rem] text-slate/60">Results stream in real time</p>
                    </div>
                  )}
                </div>
              )}

              {/* ────── DOCUMENTS TAB ────── */}
              {activeTab === "Documents" && (
                <DocumentsTab lead={lead} />
              )}

              {/* ────── NOTES TAB ────── */}
              {activeTab === "Notes" && (
                <div className="space-y-4">
                  {lead.notes && (
                    <div className="rounded-xl border border-ink/[0.08] bg-ink/[0.02] p-3">
                      <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate/70">
                        Existing Notes
                      </p>
                      <p className="text-[0.85rem] text-ink/80 leading-relaxed">{lead.notes}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-ink/[0.08] bg-white p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5 text-ink" />
                      <p className="text-[0.78rem] font-semibold text-ink">Add Note</p>
                    </div>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={5}
                      placeholder="Add a note about this lead..."
                      className="min-h-[5rem] w-full resize-y rounded-lg border border-ink/[0.08] bg-white px-3 py-2 text-[0.82rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setNoteSaved(true);
                        setTimeout(() => setNoteSaved(false), 2000);
                      }}
                      className={cn(
                        "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.78rem] font-semibold transition-colors",
                        noteSaved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink/[0.06] text-ink hover:bg-ink/[0.1]",
                      )}
                    >
                      {noteSaved ? (
                        <><CheckCircle className="h-3.5 w-3.5" /> Saved</>
                      ) : (
                        "Save Note"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Convert to Listing */}
            <div className="shrink-0 border-t border-ink/[0.08] px-5 py-4">
              <button
                onClick={() => {
                  if (lead.stage === "Converted to Listing" || converting) return;
                  setConverting(true);
                  setTimeout(() => {
                    onConvert(lead.id);
                    onClose();
                    setConverting(false);
                  }, 800);
                }}
                disabled={lead.stage === "Converted to Listing"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.85rem] font-medium text-white transition-colors hover:bg-ink/90 disabled:opacity-40"
              >
                {converting ? (
                  <><CheckCircle className="h-4 w-4" /> Converted!</>
                ) : lead.stage === "Converted to Listing" ? (
                  <><Home className="h-4 w-4" /> Already Converted to Listing</>
                ) : (
                  <><Home className="h-4 w-4" /> Convert to Listing</>
                )}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ── Main board ──────────────────────────────────────────────────────────────── */

export default function CashOfferPipeline() {
  const [leads, setLeads] = useState<SellerLead[]>(sellerLeads as SellerLead[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaultMobileStage = STAGES.reduce((best, stage) => {
    const count = leads.filter((l) => l.stage === stage).length;
    const bestCount = leads.filter((l) => l.stage === best).length;
    return count > bestCount ? stage : best;
  }, "New Request" as SellerLeadStage);
  const [mobileStage, setMobileStage] = useState<SellerLeadStage>(defaultMobileStage);

  const agentSlugs = [...new Set(leads.map((l) => l.assignedAgent))];
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const displayLeads = agentFilter === "all" ? leads : leads.filter((l) => l.assignedAgent === agentFilter);

  const selectedLead = leads.find((l) => l.id === selectedId) ?? null;

  const activeCount = displayLeads.filter((l) => !ACTIVE_EXCLUDED.includes(l.stage)).length;
  const acceptedCount = displayLeads.filter((l) => l.stage === "Accepted").length;
  const portfolioValue = displayLeads
    .filter((l) => !ACTIVE_EXCLUDED.includes(l.stage))
    .reduce((sum, l) => sum + l.estValue, 0);

  function handleStageChange(id: string, stage: SellerLeadStage) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
  }

  function handleConvert(id: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: "Converted to Listing" } : l)),
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink/[0.06]">
        <h1 className="font-semibold text-[1.05rem] text-ink">Cash Offer Pipeline</h1>
        <div className="hidden md:flex items-center gap-2">
          <label className="text-[0.72rem] font-semibold uppercase tracking-wider text-slate/70">
            Agent:
          </label>
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded-lg border border-ink/[0.08] bg-white px-3 py-1.5 text-[0.82rem] text-ink focus:border-ink/20 focus:outline-none"
          >
            <option value="all">All Agents</option>
            {agentSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {formatAgentName(slug)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2.5 border-b border-ink/[0.06]">
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <DollarSign className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">Active</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <Send className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">Pipeline</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">
              {"$" + (portfolioValue / 1_000_000).toFixed(1) + "M"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-ink/[0.03] px-3 py-2">
          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-ink/50" />
          <div className="min-w-0">
            <p className="text-[0.68rem] text-slate/60 leading-none">Accepted</p>
            <p className="text-[0.95rem] font-semibold text-ink tabular-nums">{acceptedCount}</p>
          </div>
        </div>
      </div>

      {/* Primary content */}
      <div className="px-4 py-3">

        {/* Mobile: stage chip strip */}
        <div className="md:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {STAGES.map((stage) => {
              const count = displayLeads.filter((l) => l.stage === stage).length;
              const isActive = mobileStage === stage;
              return (
                <button
                  key={stage}
                  onClick={() => setMobileStage(stage)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold whitespace-nowrap transition-colors",
                    isActive ? "bg-ink text-white" : "bg-ink/[0.06] text-ink hover:bg-ink/[0.1]",
                  )}
                >
                  {stage}
                  {count > 0 && (
                    <span className={cn("ml-1 rounded-full px-1.5 text-[0.68rem]", isActive ? "bg-white/20" : "bg-ink/10")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-3">
            {displayLeads.filter((l) => l.stage === mobileStage).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-ink/[0.08] rounded-xl">
                <p className="text-sm text-slate">No sellers in this stage</p>
              </div>
            ) : (
              displayLeads
                .filter((l) => l.stage === mobileStage)
                .map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedId(lead.id)} />
                ))
            )}
          </div>
        </div>

        {/* Desktop: full horizontal Kanban */}
        <div className="hidden md:block overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {STAGES.map((stage) => {
              const stageLeads = displayLeads.filter((l) => l.stage === stage);
              const headerTone = STAGE_HEADER_TONE[stage];
              const isDead = stage === "Dead";
              return (
                <div key={stage} className="w-[260px] md:w-[280px] shrink-0" style={{ minWidth: 220 }}>
                  <div
                    className={cn(
                      "sticky top-0 z-10 mb-3 flex items-center justify-between rounded-lg border px-2.5 py-1.5 backdrop-blur-sm",
                      headerTone,
                    )}
                  >
                    <span className="text-[0.72rem] font-bold uppercase tracking-wide flex-1 truncate">
                      {stage}
                    </span>
                    <span className="ml-1.5 rounded-full bg-black/[0.06] px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-ink/[0.08] rounded-xl">
                        <p className="text-xs text-slate">
                          {isDead ? "No dead deals this month" : "No sellers here yet"}
                        </p>
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onClick={() => setSelectedId(lead.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Slide-over */}
      <SlideOver
        lead={selectedLead}
        onClose={() => setSelectedId(null)}
        onStageChange={handleStageChange}
        onConvert={handleConvert}
      />
    </div>
  );
}
