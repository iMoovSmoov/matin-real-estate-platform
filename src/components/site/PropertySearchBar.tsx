"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";

export function PropertySearchBar({ dark = false }: { dark?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [searchError, setSearchError] = useState("");
  const [navigating, setNavigating] = useState(false);

  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) {
      setSearchError("Please enter a city, neighborhood, or ZIP");
      return;
    }
    setSearchError("");
    setNavigating(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    router.push(`/property-search?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl">
    <form
      onSubmit={go}
      noValidate
      className={`flex w-full flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:rounded-full ${
        dark ? "bg-white/10 ring-1 ring-white/20 backdrop-blur-md" : "bg-cloud shadow-lift ring-1 ring-ink/10"
      }`}
    >
      <div className="flex flex-1 flex-row items-center sm:contents">
        <div className="flex flex-1 items-center gap-2 px-3">
          <MapPin className={`h-5 w-5 shrink-0 ${dark ? "text-white/70" : "text-azure"}`} />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value.trim()) setSearchError(""); }}
            placeholder="City, neighborhood, or ZIP"
            aria-label="Search by city, neighborhood, or ZIP"
            aria-describedby={searchError ? "psb-error" : undefined}
            className={`w-full bg-transparent py-2.5 text-[0.95rem] focus:outline-none ${
              dark ? "text-white placeholder:text-white/50" : "text-ink placeholder:text-slate"
            }`}
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Property type"
          className={`shrink-0 rounded-full border-l px-3 py-2.5 text-[0.9rem] focus:outline-none ${
            dark ? "bg-transparent text-white border-white/20" : "bg-transparent text-ink/80 border-ink/10"
          }`}
        >
          <option value="" className="text-ink">Any type</option>
          <option value="Single Family" className="text-ink">Single Family</option>
          <option value="Condo" className="text-ink">Condo</option>
          <option value="Townhouse" className="text-ink">Townhouse</option>
          <option value="Acreage Estate" className="text-ink">Acreage</option>
        </select>
      </div>
      <button
        type="submit"
        aria-label="Search properties"
        disabled={navigating}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full px-6 py-3 font-medium transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-azure disabled:opacity-70 disabled:cursor-wait ${
          dark ? "bg-white text-ink hover:bg-paper" : "bg-azure text-white hover:bg-azure-deep"
        }`}
      >
        {navigating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching&hellip;
          </>
        ) : (
          <>
            <Search className="h-4 w-4" aria-hidden="true" /> Search
          </>
        )}
      </button>
    </form>
    {searchError && (
      <p id="psb-error" role="alert" className="mt-1.5 text-xs text-red-500 px-4">
        {searchError}
      </p>
    )}
    </div>
  );
}
