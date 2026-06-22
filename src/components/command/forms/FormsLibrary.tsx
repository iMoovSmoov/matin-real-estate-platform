"use client";

import { useMemo, useRef, useState } from "react";
import {
  Search,
  FileText,
  FilePlus,
  ChevronRight,
  Filter,
  X,
  Clock,
  Wand2,
  Loader2,
  LayoutList,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi } from "@/lib/ai/client";
import { FormTemplate } from "@/components/command/forms/FormTemplate";
import { reForms, FORM_CATEGORIES } from "@/lib/forms";
import type { ReForm, FormCategory } from "@/lib/forms";

/* ──────────────────────────────────────────────────────────────────────────
   Forms Library — ZipForms/SkySlope-style template grid.
   All data comes from reForms (src/lib/forms.ts — single source of truth).
   Every interactive button opens the FormTemplate slide-over in-place; no
   navigation away from this page.
   ────────────────────────────────────────────────────────────────────────── */

// ── Tabs — derived from real FORM_CATEGORIES ──────────────────────────────

type TabKey = "All" | FormCategory;
const TABS: TabKey[] = ["All", ...FORM_CATEGORIES];

// ── Quick actions mapped to real form codes ───────────────────────────────

interface QuickAction {
  label: string;
  code: string;
  subtitle: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "New Buyer Agreement", code: "C-565", subtitle: "Buyer Representation" },
  { label: "New Listing Agreement", code: "OREF-015", subtitle: "Exclusive Right to Sell" },
  { label: "New Purchase Offer", code: "OREF-001", subtitle: "Sale Agreement" },
  { label: "New Disclosure", code: "C-530", subtitle: "Initial Agency Disclosure" },
];

// ── Filter state type ─────────────────────────────────────────────────────

interface FilterState {
  orefOnly: boolean;
  esignOnly: boolean;
  sortBy: "default" | "popularity";
}

// ── Recent documents (static demo data) ──────────────────────────────────

type DocStatus = "Draft" | "Sent" | "Signed";

interface RecentDoc {
  id: string;
  name: string;
  client: string;
  status: DocStatus;
  code: string;
}

const RECENT_DOCS: RecentDoc[] = [
  { id: "r1", name: "Residential Real Estate Sale Agreement", client: "Sarah & Tom Chen", status: "Signed", code: "OREF-001" },
  { id: "r2", name: "Residential Listing Agreement — Exclusive", client: "Rivera Family Trust", status: "Sent", code: "OREF-015" },
  { id: "r3", name: "Buyer Representation Agreement — Exclusive", client: "Marcus Okafor", status: "Signed", code: "C-565" },
  { id: "r4", name: "Counter Offer", client: "Wei & Jing Liu", status: "Draft", code: "OREF-002" },
  { id: "r5", name: "Initial Agency Disclosure Pamphlet", client: "Amelia Sanchez", status: "Draft", code: "C-530" },
];

const STATUS_TONE: Record<DocStatus, "success" | "azure" | "neutral"> = {
  Signed: "success",
  Sent: "azure",
  Draft: "neutral",
};

// ── Component ─────────────────────────────────────────────────────────────

export function FormsLibrary() {
  const [tab, setTab] = useState<TabKey>("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ReForm | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Filter panel
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ orefOnly: false, esignOnly: false, sortBy: "default" });
  const filterRef = useRef<HTMLDivElement>(null);

  // AI Suggest (desktop sidebar)
  const [suggestQuery, setSuggestQuery] = useState("");
  const [suggestOut, setSuggestOut] = useState("");
  const [suggestBusy, setSuggestBusy] = useState(false);

  // Recently used collapse on mobile
  const [showRecent, setShowRecent] = useState(false);

  /** Open FormTemplate by code. */
  function openByCode(code: string) {
    const form = reForms.find((f) => f.code === code);
    if (form) setActive(form);
  }

  /** Open FormTemplate for a ReForm directly. */
  function openForm(form: ReForm) {
    setActive(form);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = reForms.filter((f) => {
      if (tab !== "All" && f.category !== tab) return false;
      if (filters.orefOnly && !f.oref) return false;
      if (filters.esignOnly && !f.esign) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q)
      );
    });
    if (filters.sortBy === "popularity") {
      list = [...list].sort((a, b) => b.popularity - a.popularity);
    }
    return list;
  }, [tab, query, filters]);

  const counts = useMemo(() => {
    const m = new Map<TabKey, number>();
    m.set("All", reForms.length);
    for (const cat of FORM_CATEGORIES) {
      m.set(cat, reForms.filter((f) => f.category === cat).length);
    }
    return m;
  }, []);

  async function runSuggest() {
    if (!suggestQuery.trim() || suggestBusy) return;
    setSuggestBusy(true);
    setSuggestOut("");
    try {
      await streamAi(
        { tool: "form-suggest", input: { situation: suggestQuery } },
        (_c, full) => setSuggestOut(full),
      );
    } finally {
      setSuggestBusy(false);
    }
  }

  const activeFiltersCount = [filters.orefOnly, filters.esignOnly, filters.sortBy !== "default"].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* 1. Quick Actions bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.code}
            onClick={() => openByCode(action.code)}
            className="group flex min-w-0 flex-col gap-2.5 rounded-xl border border-ink/[0.08] bg-white p-3 text-left transition-all hover:border-ink/20 hover:shadow-sm sm:gap-3 sm:p-4"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper ring-1 ring-inset ring-ink/[0.06] transition-colors group-hover:bg-ink group-hover:text-white sm:h-9 sm:w-9">
              <FilePlus className="h-4 w-4 text-ink transition-colors group-hover:text-white" />
            </span>
            <div>
              <div className="text-[0.84rem] font-semibold text-ink leading-snug sm:text-[0.88rem]">
                {action.label}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-0.5 text-[0.7rem] font-medium text-slate/70 transition-colors group-hover:text-ink sm:mt-1 sm:text-[0.74rem]">
                {action.subtitle} <ChevronRight className="h-3 w-3" />
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
              title="Document Library"
              subtitle={`${reForms.length} forms — pre-loaded and ready to fill`}
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
                      className="w-36 rounded-lg border border-ink/[0.08] bg-white py-1.5 pl-8 pr-7 text-[0.8rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/20 focus:outline-none sm:w-52"
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

                  {/* Filter button */}
                  <div className="relative" ref={filterRef}>
                    <button
                      aria-label="Filter"
                      onClick={() => setShowFilter((v) => !v)}
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                        showFilter || activeFiltersCount > 0
                          ? "border-ink bg-ink text-white"
                          : "border-ink/[0.08] bg-white text-slate/60 hover:border-ink/20 hover:text-ink",
                      )}
                    >
                      <Filter className="h-3.5 w-3.5" />
                      {activeFiltersCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[0.5rem] font-bold text-white">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>

                    {/* Filter dropdown */}
                    {showFilter && (
                      <div className="absolute right-0 top-10 z-20 w-52 rounded-xl border border-ink/[0.08] bg-white py-2 shadow-xl">
                        <div className="px-3 pb-1 pt-0.5">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-slate/50">
                            Filter
                          </span>
                        </div>
                        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-paper/60">
                          <input
                            type="checkbox"
                            checked={filters.orefOnly}
                            onChange={(e) =>
                              setFilters((f) => ({ ...f, orefOnly: e.target.checked }))
                            }
                            className="h-3.5 w-3.5 rounded border-ink/20 accent-ink"
                          />
                          <span className="text-[0.82rem] text-ink">OREF forms only</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-paper/60">
                          <input
                            type="checkbox"
                            checked={filters.esignOnly}
                            onChange={(e) =>
                              setFilters((f) => ({ ...f, esignOnly: e.target.checked }))
                            }
                            className="h-3.5 w-3.5 rounded border-ink/20 accent-ink"
                          />
                          <span className="text-[0.82rem] text-ink">E-sign ready only</span>
                        </label>
                        <div className="mx-3 my-1.5 border-t border-ink/[0.06]" />
                        <div className="px-3 pb-1">
                          <span className="text-[0.68rem] font-semibold uppercase tracking-widest text-slate/50">
                            Sort
                          </span>
                        </div>
                        {(["default", "popularity"] as const).map((opt) => (
                          <label
                            key={opt}
                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-paper/60"
                          >
                            <input
                              type="radio"
                              name="sortBy"
                              checked={filters.sortBy === opt}
                              onChange={() => setFilters((f) => ({ ...f, sortBy: opt }))}
                              className="h-3.5 w-3.5 accent-ink"
                            />
                            <span className="text-[0.82rem] text-ink capitalize">
                              {opt === "default" ? "Default order" : "By popularity"}
                            </span>
                          </label>
                        ))}
                        <div className="mx-3 mt-1.5 border-t border-ink/[0.06] pt-2">
                          <button
                            onClick={() => {
                              setFilters({ orefOnly: false, esignOnly: false, sortBy: "default" });
                              setShowFilter(false);
                            }}
                            className="text-[0.76rem] font-medium text-slate hover:text-ink"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Table/Grid toggle (desktop only) */}
                  <button
                    onClick={() => setViewMode((v) => (v === "grid" ? "table" : "grid"))}
                    aria-label={viewMode === "grid" ? "Switch to table view" : "Switch to grid view"}
                    className={cn(
                      "hidden h-8 w-8 items-center justify-center rounded-lg border transition-colors sm:flex",
                      viewMode === "table"
                        ? "border-ink bg-ink text-white"
                        : "border-ink/[0.08] bg-white text-slate/60 hover:border-ink/20 hover:text-ink",
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
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
                      "shrink-0 border-b-2 px-3 py-3 text-[0.78rem] font-medium transition-colors sm:px-3.5 sm:text-[0.82rem]",
                      on
                        ? "border-ink text-ink"
                        : "border-transparent text-slate/70 hover:text-ink",
                    )}
                  >
                    {t}
                    <span
                      className={cn(
                        "ml-1.5 rounded px-1 py-0.5 text-[0.62rem] tabular-nums sm:text-[0.66rem]",
                        on ? "bg-ink/10 text-ink" : "bg-paper text-slate/60",
                      )}
                    >
                      {counts.get(t) ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Form rows or table */}
            {viewMode === "grid" ? (
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto divide-y divide-ink/[0.04] px-2 py-1">
                {visible.map((form) => (
                  <FormRow key={form.code} form={form} onOpen={() => openForm(form)} />
                ))}
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <Search className="h-6 w-6 text-slate/40" />
                    <p className="text-[0.86rem] text-slate">
                      No forms match{query ? ` "${query}"` : " these filters"}.
                    </p>
                    <button
                      onClick={() => {
                        setQuery("");
                        setTab("All");
                        setFilters({ orefOnly: false, esignOnly: false, sortBy: "default" });
                      }}
                      className="text-[0.78rem] font-semibold text-ink hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Table view (desktop power-user mode) */
              <div className="max-h-[calc(100vh-20rem)] overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-ink/[0.06] bg-paper/40">
                      {["Code", "Name", "Category", "OREF", "E-Sign", "Popularity", ""].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-widest text-slate/50"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/[0.04]">
                    {visible.map((form) => (
                      <tr
                        key={form.code}
                        className="cursor-pointer transition-colors hover:bg-paper/50"
                        onClick={() => openForm(form)}
                      >
                        <td className="px-4 py-3 font-mono text-[0.76rem] font-semibold text-ink">
                          {form.code}
                        </td>
                        <td className="px-4 py-3 text-[0.82rem] text-ink">{form.name}</td>
                        <td className="px-4 py-3 text-[0.76rem] text-slate">{form.category}</td>
                        <td className="px-4 py-3 text-center">
                          {form.oref ? (
                            <CheckSquare className="h-3.5 w-3.5 text-ink mx-auto" />
                          ) : (
                            <span className="text-slate/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {form.esign ? (
                            <CheckSquare className="h-3.5 w-3.5 text-ink mx-auto" />
                          ) : (
                            <span className="text-slate/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1 w-12 overflow-hidden rounded-full bg-ink/10">
                              <div
                                className="h-full rounded-full bg-ink/40"
                                style={{ width: `${form.popularity}%` }}
                              />
                            </div>
                            <span className="text-[0.7rem] text-slate/50">{form.popularity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); openForm(form); }}
                            className="rounded-lg bg-ink px-3 py-1 text-[0.74rem] font-semibold text-white transition-colors hover:bg-ink/80"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visible.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-[0.84rem] text-slate">
                          No forms match the current filters.{" "}
                          <button
                            onClick={() => {
                              setQuery("");
                              setTab("All");
                              setFilters({ orefOnly: false, esignOnly: false, sortBy: "default" });
                            }}
                            className="font-semibold text-ink hover:underline"
                          >
                            Clear all
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        {/* 3. Right sidebar */}
        <aside className="w-full lg:w-72 lg:shrink-0">
          {/* Recently used */}
          <Panel>
            <div className="flex items-center gap-2.5 border-b border-ink/[0.08] px-5 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-ink ring-1 ring-inset ring-ink/[0.06]">
                <Clock className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <h3 className="text-[0.9rem] font-semibold text-ink">Recently used</h3>
                <p className="text-[0.72rem] text-slate/60">Last 5 documents</p>
              </div>
              {/* Mobile collapse toggle */}
              <button
                className="flex items-center gap-1 text-[0.74rem] font-medium text-slate/70 transition-colors hover:text-ink lg:hidden"
                onClick={() => setShowRecent((v) => !v)}
                aria-expanded={showRecent}
              >
                {showRecent ? "Hide" : "Show"}
                <ChevronRight
                  className={cn("h-3.5 w-3.5 transition-transform", showRecent && "rotate-90")}
                />
              </button>
            </div>

            <ul className={cn("divide-y divide-ink/[0.06]", !showRecent && "hidden lg:block")}>
              {RECENT_DOCS.map((doc) => {
                const form = reForms.find((f) => f.code === doc.code);
                return (
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
                      {form ? (
                        <button
                          onClick={() => openForm(form)}
                          className="text-[0.7rem] font-medium text-ink hover:underline"
                        >
                          Open
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* AI Form Suggest (desktop only) */}
          <div className="mt-4 hidden lg:block">
            <Panel>
              <PanelHeader
                title="AI Form Suggest"
                subtitle="Describe your situation"
                icon={<Wand2 className="h-4 w-4" />}
              />
              <div className="px-5 pb-5 pt-3 space-y-3">
                <textarea
                  rows={3}
                  value={suggestQuery}
                  onChange={(e) => setSuggestQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runSuggest();
                  }}
                  placeholder="e.g. buyer wants repairs after inspection…"
                  className="w-full resize-none rounded-xl border border-ink/[0.08] bg-paper/40 px-3 py-2.5 text-[0.8rem] text-ink placeholder:text-slate/40 focus:border-ink/20 focus:outline-none focus:ring-1 focus:ring-ink/10"
                />
                <button
                  onClick={runSuggest}
                  disabled={!suggestQuery.trim() || suggestBusy}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-[0.8rem] font-semibold text-white transition-colors hover:bg-ink/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  {suggestBusy ? "Thinking…" : "Suggest Form"}
                </button>

                {(suggestOut || suggestBusy) && (
                  <div className="rounded-xl border border-ink/[0.08] bg-white px-4 py-3">
                    <AiMarkdown text={suggestOut} />
                    {suggestBusy && (
                      <span className="ml-0.5 inline-block h-3.5 w-1 animate-pulse rounded-sm bg-ink align-middle" />
                    )}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </aside>
      </div>

      {/* FormTemplate slide-over */}
      <FormTemplate form={active} onClose={() => setActive(null)} />
    </div>
  );
}

// ── Form row ──────────────────────────────────────────────────────────────────

function FormRow({ form, onOpen }: { form: ReForm; onOpen: () => void }) {
  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3.5 transition-colors hover:bg-paper/50 sm:gap-4 sm:px-4"
      onClick={onOpen}
    >
      <FileText className="h-4 w-4 shrink-0 text-slate/60 sm:h-5 sm:w-5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[0.83rem] font-medium text-ink leading-snug sm:text-sm">
            {form.name}
          </span>
          {form.oref && (
            <span className="inline-flex items-center rounded bg-ink/[0.07] px-1 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-ink">
              OREF
            </span>
          )}
          {form.esign && (
            <span className="inline-flex items-center rounded bg-paper px-1 py-0.5 text-[0.58rem] font-medium text-slate/60 ring-1 ring-inset ring-ink/[0.06]">
              e-sign
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate">
          <span>{form.category}</span>
          <span className="text-slate/30">·</span>
          {/* Popularity bar */}
          <div className="flex items-center gap-1">
            <div className="h-1 w-8 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-ink/30"
                style={{ width: `${form.popularity}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: two buttons */}
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="rounded-lg border border-ink/[0.08] bg-white px-2.5 py-1 text-[0.74rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
        >
          Preview
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="rounded-lg border border-ink/20 bg-white px-2.5 py-1 text-[0.74rem] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Open form
        </button>
      </div>

      {/* Mobile: chevron tap target */}
      <ChevronRight className="h-4 w-4 shrink-0 text-slate/40 sm:hidden" />
    </div>
  );
}
