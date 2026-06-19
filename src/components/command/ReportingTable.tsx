"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpDown, Download, Star, Trophy, LayoutList, CheckCircle2 } from "lucide-react";
import type { Agent } from "@/lib/types";
import { cn, usd, num, compactUsd } from "@/lib/utils";
import { Pill, ProgressBar } from "@/components/command/ui";

export type Row = {
  name: string;
  title: string;
  photo: string;
  homesSold: number;
  volume: number;
  activeListings: number;
  rating: number;
  reviews: number;
  responseTimeMins: number;
};

type SortKey = "name" | "homesSold" | "volume" | "activeListings" | "rating" | "responseTime";

export function ReportingTable({
  agents,
  onAgentClick,
}: {
  agents: Agent[];
  onAgentClick?: (row: Row) => void;
}) {
  const rows: Row[] = agents.map((a) => ({
    name: a.name,
    title: a.title,
    photo: a.photo,
    homesSold: a.homesSold,
    volume: a.volume,
    activeListings: a.activeListings,
    rating: a.rating,
    reviews: a.reviews,
    responseTimeMins: a.responseTimeMins ?? 0,
  }));

  const [sort, setSort] = useState<SortKey>("volume");
  const [asc, setAsc] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [leaderboardView, setLeaderboardView] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    const dir = asc ? 1 : -1;
    if (sort === "name") return a.name.localeCompare(b.name) * dir;
    if (sort === "responseTime") return (a.responseTimeMins - b.responseTimeMins) * dir;
    return ((a[sort] as number) - (b[sort] as number)) * dir;
  });

  const maxVolume = Math.max(...sorted.map((r) => r.volume), 1);

  function toggle(key: SortKey) {
    if (sort === key) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(key === "name" || key === "responseTime");
    }
  }

  function exportCsv() {
    setExporting(true);
    const header = ["Agent", "Title", "Homes Sold", "Volume", "Active Listings", "Rating", "Reviews", "Response Time (min)"];
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(","),
      ...sorted.map((r) =>
        [r.name, r.title, r.homesSold, r.volume, r.activeListings, r.rating, r.reviews, r.responseTimeMins].map(escape).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matin-agent-production-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setExporting(false), 1500);
  }

  function respTone(mins: number): "success" | "warn" | "danger" {
    if (mins <= 5) return "success";
    if (mins <= 15) return "warn";
    return "danger";
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/[0.08] bg-white">
      <div className="flex flex-col gap-3 border-b border-ink/[0.08] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[0.95rem] font-semibold text-ink">Per-Agent Production</h3>
          <p className="text-[0.74rem] text-slate/60">{rows.length} agents · sorted by {labelFor(sort)}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <button
            onClick={() => setLeaderboardView((v) => !v)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-white px-3 py-2 text-[0.78rem] font-semibold text-ink transition-colors hover:border-ink/20 hover:bg-paper sm:flex-none"
          >
            {leaderboardView ? (
              <><LayoutList className="h-3.5 w-3.5" /> Table View</>
            ) : (
              <><Trophy className="h-3.5 w-3.5" /> Leaderboard</>
            )}
          </button>
          <button
            onClick={exportCsv}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[0.78rem] font-semibold transition-colors sm:flex-none",
              exporting
                ? "border-success bg-white text-success"
                : "border-ink/10 bg-white text-ink hover:border-ink/20 hover:bg-paper",
            )}
          >
            {exporting ? (
              <><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Downloaded</>
            ) : (
              <><Download className="h-3.5 w-3.5 text-ink" /> Export CSV</>
            )}
          </button>
        </div>
      </div>

      {leaderboardView ? (
        /* ── Leaderboard view ── */
        <div className="divide-y divide-ink/[0.06]">
          {sorted.map((r, i) => (
            <button
              key={r.name}
              onClick={() => onAgentClick?.(r)}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-paper"
            >
              <span className="w-8 shrink-0 text-center font-display text-3xl text-ink/10">{i + 1}</span>
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                <Image src={r.photo} alt={r.name} fill sizes="32px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.84rem] font-semibold text-ink">{r.name}</p>
                <ProgressBar value={(r.volume / maxVolume) * 100} className="mt-1 h-1" />
              </div>
              <span className="shrink-0 text-[0.82rem] font-semibold tabular-nums text-ink">
                {compactUsd(r.volume)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        /* ── Table view ── */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-ink/[0.08] text-[0.68rem] uppercase tracking-wider text-slate/55">
                <Th label="Agent" sortKey="name" sort={sort} asc={asc} onClick={toggle} />
                <Th label="Homes sold" sortKey="homesSold" sort={sort} asc={asc} onClick={toggle} align="right" />
                <Th label="Volume" sortKey="volume" sort={sort} asc={asc} onClick={toggle} align="right" />
                <Th label="Active" sortKey="activeListings" sort={sort} asc={asc} onClick={toggle} align="right" />
                <Th label="Resp. Time" sortKey="responseTime" sort={sort} asc={asc} onClick={toggle} align="right" />
                <Th label="Rating" sortKey="rating" sort={sort} asc={asc} onClick={toggle} align="right" />
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {sorted.map((r) => (
                <tr
                  key={r.name}
                  className="cursor-pointer transition-colors hover:bg-paper"
                  onClick={() => onAgentClick?.(r)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-ink/[0.06]">
                        <Image src={r.photo} alt={r.name} fill sizes="32px" className="object-cover" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[0.84rem] font-semibold text-ink">{r.name}</p>
                        <p className="truncate text-[0.7rem] text-slate/55">{r.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right text-[0.82rem] text-slate tabular-nums">{num(r.homesSold)}</td>
                  <td className="px-5 py-3 text-right text-[0.84rem] font-semibold text-ink tabular-nums">{usd(r.volume)}</td>
                  <td className="px-5 py-3 text-right text-[0.82rem] text-slate tabular-nums">{r.activeListings}</td>
                  <td className="px-5 py-3 text-right">
                    <Pill tone={respTone(r.responseTimeMins)}>{r.responseTimeMins} min</Pill>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center justify-end gap-1 text-[0.82rem] text-ink tabular-nums">
                      <Star className="h-3 w-3 fill-warn text-warn" /> {r.rating.toFixed(2)}
                      <span className="text-[0.7rem] text-slate/50">({r.reviews})</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-[0.7rem] text-slate/40">›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function labelFor(k: SortKey) {
  return {
    name: "name",
    homesSold: "homes sold",
    volume: "volume",
    activeListings: "active listings",
    rating: "rating",
    responseTime: "response time",
  }[k];
}

function Th({
  label,
  sortKey,
  sort,
  asc,
  onClick,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortKey;
  asc: boolean;
  onClick: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort === sortKey;
  return (
    <th className={cn("px-5 py-3 font-semibold", align === "right" && "text-right")}>
      <button
        onClick={() => onClick(sortKey)}
        className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink", align === "right" && "flex-row-reverse")}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active ? "opacity-100" : "opacity-30")} />
        {active && <span className="text-[0.6rem]">{asc ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}
