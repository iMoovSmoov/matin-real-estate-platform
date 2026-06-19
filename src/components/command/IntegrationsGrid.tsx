"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Database, ChevronDown } from "lucide-react";
import type { Integration } from "@/lib/types";
import { cn, num } from "@/lib/utils";

// Deterministic accent per integration name so the "logo squares" feel branded.
const PALETTE = [
  "from-azure to-azure-deep",
  "from-emerald-500 to-emerald-700",
  "from-violet-500 to-violet-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-sky-500 to-sky-700",
  "from-cyan-500 to-cyan-700",
  "from-indigo-500 to-indigo-700",
];
function accentFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function IntegrationsGrid({ integrations }: { integrations: Integration[] }) {
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState<"all" | "connected" | "available">("all");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(integrations.map((i) => i.category))).sort()],
    [integrations],
  );

  const filtered = integrations.filter((i) => {
    if (cat !== "All" && i.category !== cat) return false;
    if (status !== "all" && i.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[0.76rem] font-semibold transition-colors",
                cat === c
                  ? "bg-azure text-white"
                  : "border border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/30 hover:text-white",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-9 appearance-none rounded-lg border border-white/10 bg-white/[0.04] pl-3 pr-8 text-[0.8rem] font-medium text-white focus:border-white/40 focus:outline-none"
          >
            <option value="all" className="bg-white/[0.06]">All statuses</option>
            <option value="connected" className="bg-white/[0.06]">Connected</option>
            <option value="available" className="bg-white/[0.06]">Available</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300/50" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => {
          const connected = i.status === "connected";
          return (
            <div
              key={i.name}
              className={cn(
                "group flex flex-col rounded-2xl border bg-white/[0.045] p-4 transition-colors",
                connected ? "border-white/10 hover:border-white/20" : "border-dashed border-white/12 hover:border-white/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-[1.05rem] font-bold text-white shadow-inner",
                    accentFor(i.name),
                    !connected && "opacity-60 grayscale",
                  )}
                >
                  {i.name.charAt(0)}
                </span>
                {connected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-1 text-[0.66rem] font-semibold text-success ring-1 ring-inset ring-success/25">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-[0.66rem] font-semibold text-slate-300/70 ring-1 ring-inset ring-white/12">
                    Available
                  </span>
                )}
              </div>

              <h3 className="mt-3 text-[0.92rem] font-semibold text-white">{i.name}</h3>
              <p className="text-[0.66rem] font-medium uppercase tracking-wider text-slate-300/55">{i.category}</p>
              <p className="mt-1.5 flex-1 text-[0.8rem] leading-relaxed text-slate-300/80">{i.description}</p>

              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                {connected && i.records != null ? (
                  <span className="inline-flex items-center gap-1.5 text-[0.74rem] text-slate-300/70">
                    <Database className="h-3.5 w-3.5 text-white" />
                    <span className="font-semibold text-white tabular-nums">{num(i.records)}</span> records
                  </span>
                ) : (
                  <span className="text-[0.74rem] text-slate-300/45">Not syncing</span>
                )}
                {connected ? (
                  <button className="text-[0.74rem] font-semibold text-slate-300/60 hover:text-white">Manage</button>
                ) : (
                  <button className="inline-flex items-center gap-1 text-[0.74rem] font-semibold text-white hover:text-white">
                    <Plus className="h-3.5 w-3.5" /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-[0.84rem] text-slate-300/55">No integrations match these filters.</p>
      )}
    </div>
  );
}
