"use client";

import { useMemo, useState } from "react";
import { Search, X, ChevronDown, Users } from "lucide-react";
import { AgentCard } from "@/components/site/AgentCard";
import { Button } from "@/components/ui/button";
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

  return (
    <div>
      {/* ---------- FILTER BAR ---------- */}
      <div className="flex flex-col gap-3 rounded-2xl bg-cloud p-3 shadow-soft ring-1 ring-ink/[0.08] lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Search className="h-5 w-5 shrink-0 text-azure" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brokers by name or title"
            className="w-full bg-transparent py-2.5 text-[0.95rem] text-ink placeholder:text-slate focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear" className="text-slate hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          <FilterSelect value={specialty} onChange={setSpecialty} placeholder="Any specialty">
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={community} onChange={setCommunity} placeholder="Any community">
            {communityOptions.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={language} onChange={setLanguage} placeholder="Any language">
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </FilterSelect>
        </div>
      </div>

      {/* ---------- RESULT META ---------- */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.95rem] text-slate">
          <span className="font-display text-2xl text-ink">{results.length}</span>{" "}
          {results.length === 1 ? "broker" : "brokers"}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>

      {/* ---------- GRID ---------- */}
      {results.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {results.map((a) => (
            <AgentCard key={a.slug} agent={a} />
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-cloud px-6 py-20 text-center shadow-soft ring-1 ring-ink/[0.06]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-azure/10 text-azure">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="mt-5 font-display text-2xl text-ink">No brokers match those filters</h3>
          <p className="mt-2 max-w-md text-[0.95rem] text-slate">Try a different specialty, community, or language.</p>
          <Button variant="primary" size="md" onClick={reset} className="mt-6">
            Clear filters
          </Button>
        </div>
      )}
    </div>
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none rounded-xl bg-paper-200/70 py-2.5 pl-4 pr-9 text-[0.85rem] font-medium ring-1 ring-ink/[0.08] focus:outline-none focus-visible:ring-azure/40 lg:w-44",
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
