"use client";

import { useMemo, useRef, useState } from "react";
import { Search, X, ChevronDown, Users } from "lucide-react";
import { AgentCard } from "@/components/site/AgentCard";
import { scrollIntoViewSafe } from "@/components/site/useScrollReveal";
import { cn } from "@/lib/utils";
import { communities } from "@/lib/data";
import type { Agent } from "@/lib/types";

const communityName = (slug: string) =>
  communities.find((c) => c.slug === slug)?.name ?? slug;

export function AgentDirectory({ agents }: { agents: Agent[] }) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [community, setCommunity] = useState("");
  const [language, setLanguage] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  // A selection should visibly move the user to the updated results on narrow
  // screens where the grid is below the filter bar.
  function revealResults() {
    scrollIntoViewSafe(resultsRef.current, { block: "start", onlyBelowLg: true });
  }

  // Derive filter options from the data
  const specialties = useMemo(
    () => Array.from(new Set(agents.flatMap((a) => a.specialties))).sort(),
    [agents],
  );
  const languages = useMemo(
    () => Array.from(new Set(agents.flatMap((a) => a.languages))).sort(),
    [agents],
  );
  const communityOptions = useMemo(() => {
    const slugs = Array.from(new Set(agents.flatMap((a) => a.communities)));
    return slugs
      .map((slug) => ({ slug, name: communityName(slug) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [agents]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = agents.filter((a) => {
      if (q && !`${a.name} ${a.title} ${a.role}`.toLowerCase().includes(q)) return false;
      if (specialty && !a.specialties.includes(specialty)) return false;
      if (community && !a.communities.includes(community)) return false;
      if (language && !a.languages.includes(language)) return false;
      return true;
    });
    // Leadership first, then by sales volume
    return filtered.sort((a, b) => {
      if (a.leadership !== b.leadership) return a.leadership ? -1 : 1;
      return b.volume - a.volume;
    });
  }, [agents, query, specialty, community, language]);

  const hasFilters = Boolean(query || specialty || community || language);

  function reset() {
    setQuery("");
    setSpecialty("");
    setCommunity("");
    setLanguage("");
  }

  function selectSpecialty(value: string) {
    setSpecialty(value);
    revealResults();
  }

  return (
    <div>
      {/* ---------- FILTER BAR (design language) ---------- */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brokers by name or title…"
            className="h-11 w-full rounded-[10px] border border-ink/[0.16] bg-[#fbfbfa] pl-10 pr-9 text-[14px] text-ink-600 placeholder:text-slate/70 transition-colors focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Specialty chips + community / language pills */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2 min-w-0">
            <SpecialtyChip label="All" active={!specialty} onClick={() => selectSpecialty("")} />
            {specialties.map((s) => (
              <SpecialtyChip
                key={s}
                label={s}
                active={specialty === s}
                onClick={() => selectSpecialty(s)}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
            <FilterSelect
              value={community}
              onChange={(v) => { setCommunity(v); revealResults(); }}
              placeholder="Any community"
            >
              {communityOptions.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              value={language}
              onChange={(v) => { setLanguage(v); revealResults(); }}
              placeholder="Any language"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </FilterSelect>
          </div>
        </div>
      </div>

      {/* ---------- RESULT META ---------- */}
      <div ref={resultsRef} className="mt-7 flex scroll-mt-24 flex-wrap items-center justify-between gap-3 border-t border-ink/[0.07] pt-5">
        <p className="text-[0.95rem] text-slate" aria-live="polite">
          <span className="font-display text-2xl text-ink tabular-nums">{results.length}</span>{" "}
          {results.length === 1 ? "broker" : "brokers"}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/[0.14] px-3 py-2 text-[13px] font-medium text-ink-600 transition-colors hover:border-ink/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" /> Clear filters
          </button>
        )}
      </div>

      {/* ---------- GRID ---------- */}
      {results.length > 0 ? (
        <div
          key={`${query}|${specialty}|${community}|${language}`}
          className="mt-6 grid grid-cols-1 gap-[18px] motion-safe:animate-[fade_0.35s_ease-out] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {results.map((a) => (
            <AgentCard key={a.slug} agent={a} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[14px] border border-ink/[0.08] bg-white px-6 py-20 text-center" style={{ boxShadow: "0 1px 2px rgba(20,20,22,.05), 0 14px 36px rgba(20,20,22,.08)" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-gold-soft text-gold">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="mt-5 font-display text-2xl text-ink">No brokers match those filters</h3>
          <p className="mt-2 max-w-md text-[0.95rem] text-slate">Try a different specialty, community, or language.</p>
          <button
            type="button"
            onClick={reset}
            className="btn-accent mt-6 inline-flex items-center rounded-[10px] px-5 py-2.5 text-[0.85rem] font-semibold"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function SpecialtyChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg px-3.5 py-2 text-[13px] leading-none transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold/50",
        active
          ? "bg-ink font-semibold text-white"
          : "border border-ink/[0.14] font-medium text-ink-600 hover:border-ink/30 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-lg border border-ink/[0.14] bg-white py-2 pl-3.5 pr-9 text-[13px] font-medium transition-colors hover:border-ink/30 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:w-44",
          value ? "text-ink" : "text-slate",
        )}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
    </div>
  );
}
