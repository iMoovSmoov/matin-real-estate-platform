"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FilePlus,
  ChevronRight,
  Filter,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { Button } from "@/components/ui/button";
import { FormTemplate } from "@/components/command/forms/FormTemplate";
import type { ReForm } from "@/lib/forms";

/* ──────────────────────────────────────────────────────────────────────────
   Forms page — DocuSign-style template library.
   Three sections:
     1. Quick Actions bar — 4 create shortcuts at the top
     2. Document library  — tabbed form list with search
     3. Recently used sidebar — last 5 docs with status pills
   ────────────────────────────────────────────────────────────────────────── */

// ── Static template data ─────────────────────────────────────────────────────

type TabKey = "All" | "Buyer Forms" | "Seller Forms" | "Transaction" | "Disclosures";

const TABS: TabKey[] = ["All", "Buyer Forms", "Seller Forms", "Transaction", "Disclosures"];

interface TemplateForm {
  slug: string;
  name: string;
  category: TabKey;
  updated: string;
}

const TEMPLATE_FORMS: TemplateForm[] = [
  // Buyer Forms
  { slug: "buyer-representation-agreement", name: "Buyer Representation Agreement", category: "Buyer Forms", updated: "Jun 2025" },
  { slug: "buyer-information-sheet", name: "Buyer Information Sheet", category: "Buyer Forms", updated: "Mar 2025" },
  { slug: "pre-approval-checklist", name: "Pre-Approval Checklist", category: "Buyer Forms", updated: "Jan 2025" },
  { slug: "home-wish-list", name: "Home Wish List", category: "Buyer Forms", updated: "Jan 2025" },
  { slug: "inspection-request-form", name: "Inspection Request Form", category: "Buyer Forms", updated: "Apr 2025" },
  // Seller Forms
  { slug: "listing-agreement", name: "Listing Agreement", category: "Seller Forms", updated: "Jun 2025" },
  { slug: "seller-disclosure-statement", name: "Seller Disclosure Statement", category: "Seller Forms", updated: "May 2025" },
  { slug: "home-preparation-checklist", name: "Home Preparation Checklist", category: "Seller Forms", updated: "Feb 2025" },
  { slug: "open-house-sign-in-sheet", name: "Open House Sign-In Sheet", category: "Seller Forms", updated: "Jan 2025" },
  { slug: "net-sheet-calculator", name: "Net Sheet Calculator", category: "Seller Forms", updated: "May 2025" },
  // Transaction
  { slug: "purchase-and-sale-agreement", name: "Purchase and Sale Agreement", category: "Transaction", updated: "Jun 2025" },
  { slug: "counter-offer-form", name: "Counter Offer Form", category: "Transaction", updated: "Apr 2025" },
  { slug: "amendment-to-purchase-agreement", name: "Amendment to Purchase Agreement", category: "Transaction", updated: "Mar 2025" },
  { slug: "earnest-money-receipt", name: "Earnest Money Receipt", category: "Transaction", updated: "Jan 2025" },
  { slug: "closing-checklist", name: "Closing Checklist", category: "Transaction", updated: "Feb 2025" },
  // Disclosures
  { slug: "lead-based-paint-disclosure", name: "Lead-Based Paint Disclosure", category: "Disclosures", updated: "Jan 2025" },
  { slug: "agency-disclosure", name: "Agency Disclosure", category: "Disclosures", updated: "Jun 2025" },
  { slug: "property-condition-report", name: "Property Condition Report", category: "Disclosures", updated: "May 2025" },
  { slug: "natural-hazard-disclosure", name: "Natural Hazard Disclosure", category: "Disclosures", updated: "Mar 2025" },
];

// ── Quick actions ─────────────────────────────────────────────────────────────

interface QuickAction {
  label: string;
  slug: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "New Buyer Agreement", slug: "buyer-representation-agreement" },
  { label: "New Listing Agreement", slug: "listing-agreement" },
  { label: "New Purchase Offer", slug: "purchase-and-sale-agreement" },
  { label: "New Disclosure", slug: "agency-disclosure" },
];

// ── Recent documents (static demo data) ──────────────────────────────────────

type DocStatus = "Draft" | "Sent" | "Signed";

interface RecentDoc {
  id: string;
  name: string;
  client: string;
  status: DocStatus;
  slug: string;
}

const RECENT_DOCS: RecentDoc[] = [
  { id: "r1", name: "Purchase and Sale Agreement", client: "Sarah & Tom Chen", status: "Signed", slug: "purchase-and-sale-agreement" },
  { id: "r2", name: "Listing Agreement", client: "Rivera Family Trust", status: "Sent", slug: "listing-agreement" },
  { id: "r3", name: "Buyer Representation Agreement", client: "Marcus Okafor", status: "Signed", slug: "buyer-representation-agreement" },
  { id: "r4", name: "Counter Offer Form", client: "Wei & Jing Liu", status: "Draft", slug: "counter-offer-form" },
  { id: "r5", name: "Agency Disclosure", client: "Amelia Sanchez", status: "Draft", slug: "agency-disclosure" },
];

const STATUS_TONE: Record<DocStatus, "success" | "azure" | "neutral"> = {
  Signed: "success",
  Sent: "azure",
  Draft: "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FormsLibrary() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ReForm | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATE_FORMS.filter((f) => {
      if (tab !== "All" && f.category !== tab) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    });
  }, [tab, query]);

  const counts = useMemo(() => {
    const m = new Map<TabKey, number>();
    m.set("All", TEMPLATE_FORMS.length);
    for (const t of TABS.slice(1) as TabKey[]) {
      m.set(t, TEMPLATE_FORMS.filter((f) => f.category === t).length);
    }
    return m;
  }, []);

  function useTemplate(slug: string) {
    router.push(`/hub/contracts?template=${slug}`);
  }

  return (
    <div className="space-y-5">
      {/* 1. Quick Actions bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.slug}
            onClick={() => useTemplate(action.slug)}
            className="group flex flex-col gap-3 rounded-xl border border-ink/[0.08] bg-white p-4 text-left transition-all hover:border-ink/20 hover:shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-paper ring-1 ring-inset ring-ink/[0.06] transition-colors group-hover:bg-ink group-hover:text-white">
              <FilePlus className="h-4 w-4 text-ink group-hover:text-white transition-colors" />
            </span>
            <div>
              <div className="text-[0.88rem] font-semibold text-ink leading-snug">{action.label}</div>
              <div className="mt-1 inline-flex items-center gap-0.5 text-[0.74rem] font-medium text-slate/70 group-hover:text-ink transition-colors">
                Create <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 2 + 3. Library + sidebar */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        {/* 2. Document library */}
        <div className="min-w-0 flex-1">
          <Panel>
            <PanelHeader
              title="Document library"
              subtitle="Templates pre-loaded and ready to fill."
              icon={<FileText className="h-4 w-4" />}
              action={
                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/60" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search forms…"
                      className="w-44 rounded-lg border border-ink/[0.08] bg-white py-1.5 pl-8 pr-7 text-[0.8rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/20 focus:outline-none sm:w-52"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate/50 transition-colors hover:text-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Filter icon */}
                  <button
                    aria-label="Filter"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/[0.08] bg-white text-slate/60 transition-colors hover:border-ink/20 hover:text-ink"
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                </div>
              }
            />

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-ink/[0.08] px-5 scrollbar-none">
              {TABS.map((t) => {
                const on = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "shrink-0 border-b-2 px-3.5 py-3 text-[0.82rem] font-medium transition-colors",
                      on
                        ? "border-ink text-ink"
                        : "border-transparent text-slate/70 hover:text-ink",
                    )}
                  >
                    {t}
                    <span
                      className={cn(
                        "ml-1.5 rounded px-1 py-0.5 text-[0.66rem] tabular-nums",
                        on ? "bg-ink/10 text-ink" : "bg-paper text-slate/60",
                      )}
                    >
                      {counts.get(t) ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Form rows */}
            <div className="divide-y divide-ink/[0.04] px-2 py-1">
              {visible.map((form) => (
                <FormRow key={form.slug} form={form} onUse={() => useTemplate(form.slug)} />
              ))}
              {visible.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Search className="h-6 w-6 text-slate/40" />
                  <p className="text-[0.86rem] text-slate">No forms match &ldquo;{query}&rdquo;.</p>
                  <button
                    onClick={() => { setQuery(""); setTab("All"); }}
                    className="text-[0.78rem] font-semibold text-ink hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* 3. Recently used sidebar */}
        <aside className="w-full lg:w-72 lg:shrink-0">
          <Panel>
            <div className="flex items-center gap-2.5 border-b border-ink/[0.08] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-inset ring-ink/[0.06]">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-[0.9rem] font-semibold text-ink">Recently used</h3>
                <p className="text-[0.72rem] text-slate/60">Last 5 documents</p>
              </div>
            </div>

            <ul className="divide-y divide-ink/[0.06]">
              {RECENT_DOCS.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper/50"
                >
                  <FileText className="h-4 w-4 shrink-0 text-slate/50" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.82rem] font-semibold text-ink leading-snug">
                      {doc.name}
                    </div>
                    <div className="truncate text-[0.72rem] text-slate/60">{doc.client}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Pill tone={STATUS_TONE[doc.status]}>{doc.status}</Pill>
                    <button
                      onClick={() => useTemplate(doc.slug)}
                      className="text-[0.7rem] font-medium text-ink hover:underline"
                    >
                      Open
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>

      {/* FormTemplate slide-over (still available for direct preview) */}
      <FormTemplate form={active} onClose={() => setActive(null)} />
    </div>
  );
}

// ── Form row ──────────────────────────────────────────────────────────────────

function FormRow({
  form,
  onUse,
}: {
  form: TemplateForm;
  onUse: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg px-4 py-4 transition-colors hover:bg-paper/50">
      <FileText className="h-5 w-5 shrink-0 text-slate/60" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{form.name}</div>
        <div className="text-xs text-slate">
          {form.category} &middot; Updated {form.updated}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm">
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={onUse}>
          Use template
        </Button>
      </div>
    </div>
  );
}
