"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Sparkles,
  PenLine,
  ShieldCheck,
  ArrowRight,
  Database,
} from "lucide-react";
import { mostUsedForms, FORM_CATEGORIES, type ReForm, type FormCategory } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { Panel, PanelHeader, Pill, ProgressBar, SectionLabel } from "@/components/command/ui";
import { FormTemplate } from "@/components/command/forms/FormTemplate";

type Filter = FormCategory | "All";

const pillarTone: Record<ReForm["pillar"], "azure" | "success" | "warn"> = {
  "Structured Data": "azure",
  "Contract Systems": "success",
  "AI Integration": "warn",
};

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
          title="Form library"
          subtitle="Every OREF + Matin form as a branded, editable, AI-assisted template — searchable, sorted by how often agents reach for it."
          icon={<FileText className="h-4 w-4" />}
          action={
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search forms…"
                className="w-44 rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-8 pr-3 text-[0.8rem] text-white placeholder:text-slate-300/40 transition-colors focus:border-white/40 focus:bg-white/[0.05] focus:outline-none sm:w-56"
              />
            </div>
          }
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3.5">
          {(["All", ...FORM_CATEGORIES] as Filter[]).map((c) => {
            const on = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.78rem] font-medium transition-colors",
                  on
                    ? "border-white/30 bg-white/[0.12] text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
                )}
              >
                {c}
                <span
                  className={cn(
                    "rounded px-1 text-[0.66rem] tabular-nums",
                    on ? "bg-white/15 text-white" : "bg-white/[0.06] text-slate-300/70",
                  )}
                >
                  {counts.get(c) ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((form) => (
            <FormCard key={form.code} form={form} onOpen={() => setActive(form)} />
          ))}
          {visible.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-14 text-center">
              <Search className="h-6 w-6 text-slate-300/40" />
              <p className="text-[0.86rem] text-slate-300">No forms match “{query}”.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setFilter("All");
                }}
                className="text-[0.78rem] font-semibold text-white hover:underline"
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

function FormCard({ form, onOpen }: { form: ReForm; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition-all hover:border-white/30 hover:bg-white/[0.055] hover:shadow-glow"
    >
      {/* Top row: code + tags */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.66rem] font-semibold text-white/80 ring-1 ring-inset ring-white/10">
            {form.code}
          </span>
          {form.oref && <Pill tone="azure">OREF</Pill>}
        </div>
        
      </div>

      {/* Name + category */}
      <h4 className="mt-2.5 font-sans text-[0.94rem] font-semibold leading-snug text-white">
        {form.name}
      </h4>
      <SectionLabel className="mt-1">{form.category}</SectionLabel>

      {/* Popularity */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[0.68rem] text-slate-300/70">
          <span>Used across deals</span>
          <span className="font-semibold tabular-nums text-slate-200">{form.popularity}%</span>
        </div>
        <ProgressBar value={form.popularity} />
      </div>

      {/* Replaces — the spreadsheet-killer line */}
      <div className="mt-3 flex items-start gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
        <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300/50" />
        <p className="text-[0.74rem] leading-snug text-slate-300/80">
          Replaces{" "}
          <span className="text-slate-400 line-through decoration-danger/60 decoration-1">
            {form.replaces}
          </span>
        </p>
      </div>

      {/* AI assist */}
      <div className="mt-2 flex items-start gap-1.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" />
        <p className="text-[0.76rem] leading-snug text-slate-300">{form.aiAssist}</p>
      </div>

      {/* Footer pills + CTA */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {form.esign && (
            <Pill tone="success">
              <PenLine className="h-2.5 w-2.5" /> e-sign
            </Pill>
          )}
          {form.compliance && (
            <Pill tone="neutral">
              <ShieldCheck className="h-2.5 w-2.5" /> compliance
            </Pill>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[0.74rem] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          Open template <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
