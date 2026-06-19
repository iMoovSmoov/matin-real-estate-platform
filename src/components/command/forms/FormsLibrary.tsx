"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  PenLine,
  ShieldCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { mostUsedForms, FORM_CATEGORIES, type ReForm, type FormCategory } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, Pill } from "@/components/command/ui";
import { FormTemplate } from "@/components/command/forms/FormTemplate";

type Filter = FormCategory | "All";

export function FormsLibrary() {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ReForm | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mostUsedForms.filter((f) => {
      if (filter !== "All" && f.category !== filter) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.replaces.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  const counts = useMemo(() => {
    const m = new Map<Filter, number>();
    m.set("All", mostUsedForms.length);
    for (const c of FORM_CATEGORIES) m.set(c, 0);
    for (const f of mostUsedForms) m.set(f.category, (m.get(f.category) ?? 0) + 1);
    return m;
  }, []);

  return (
    <section className="space-y-4">
      <Panel>
        <PanelHeader
          title="Forms library"
          subtitle="Pick a form — it auto-fills, you fill the rest, then send for signature."
          icon={<FileText className="h-4 w-4" />}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search forms…"
                className="w-44 rounded-lg border border-ink/[0.08] bg-white py-1.5 pl-8 pr-7 text-[0.8rem] text-ink placeholder:text-slate/40 transition-colors focus:border-ink/20 focus:outline-none sm:w-56"
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
          }
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 border-b border-ink/[0.08] px-5 py-3.5">
          {(["All", ...FORM_CATEGORIES] as Filter[]).map((c) => {
            const on = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                  on
                    ? "border-ink/20 bg-ink/[0.08] text-ink"
                    : "border-ink/[0.08] bg-white text-slate hover:border-ink/15 hover:bg-white hover:text-ink",
                )}
              >
                {c}
                <span
                  className={cn(
                    "rounded px-1 text-[0.66rem] tabular-nums",
                    on ? "bg-ink/10 text-ink" : "bg-white text-slate/70",
                  )}
                >
                  {counts.get(c) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Form rows */}
        <div className="divide-y divide-ink/[0.06]">
          {visible.map((form) => (
            <FormRow key={form.code} form={form} onUse={() => setActive(form)} />
          ))}
          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Search className="h-6 w-6 text-slate/40" />
              <p className="text-[0.86rem] text-slate">No forms match “{query}”.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
                className="text-[0.78rem] font-semibold text-ink hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </Panel>

      <FormTemplate form={active} onClose={() => setActive(null)} />
    </section>
  );
}

function FormRow({ form, onUse }: { form: ReForm; onUse: () => void }) {
  return (
    <div className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-paper sm:flex-row sm:items-center">
      {/* Code badge */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-md bg-white px-2 py-1 font-mono text-[0.7rem] font-semibold text-ink/85 ring-1 ring-inset ring-ink/[0.06]">
          {form.code}
        </span>
        {form.oref && (
          <span className="rounded-md bg-ink/[0.06] px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink ring-1 ring-inset ring-ink/[0.08]">
            OREF
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h4 className="font-sans text-[0.94rem] font-semibold leading-snug text-ink">
            {form.name}
          </h4>
          <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-slate/60">
            {form.category}
          </span>
        </div>
        <p className="mt-1 truncate text-[0.78rem] text-slate/80">
          Replaces <span className="text-slate">{form.replaces}</span>
        </p>
      </div>

      {/* Popularity */}
      <div className="hidden w-32 shrink-0 lg:block">
        <div className="mb-1 flex items-center justify-between text-[0.66rem] text-slate/60">
          <span>Used</span>
          <span className="font-semibold tabular-nums text-slate">{form.popularity}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-ink/30 transition-[width] duration-500"
            style={{ width: `${Math.max(0, Math.min(100, form.popularity))}%` }}
          />
        </div>
      </div>

      {/* Pills */}
      <div className="flex shrink-0 items-center gap-1.5">
        {form.esign && (
          <Pill tone="neutral">
            <PenLine className="h-2.5 w-2.5" /> e-sign
          </Pill>
        )}
        {form.compliance && (
          <Pill tone="neutral">
            <ShieldCheck className="h-2.5 w-2.5" /> compliance
          </Pill>
        )}
      </div>

      {/* Use form */}
      <button
        onClick={onUse}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-ink px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition-colors hover:bg-ink-700"
      >
        Use form <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
