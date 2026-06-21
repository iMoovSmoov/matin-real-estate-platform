"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Search, Plus, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { NAV_ITEMS } from "./SidebarNav";
import { useAiSidecar } from "./AISidecar";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — TopCommandBar  (ref §1.3)

   Sticky, on every page. Left = page H1 (Fraunces), derived from the route if
   no explicit title is passed. Right cluster, in order: search pill (⌘K chip)
   → ink "+ Create" → gold "Ask AI" → notification bell w/ red count.

   Two-tier action hierarchy is load-bearing: ink = primary human action,
   gold = AI. "Ask AI" opens the docked AISidecar with a global context line.
   ────────────────────────────────────────────────────────────────────────── */

export type Notification = { title: string; meta: string; tone: "info" | "success" | "warn" };

const NOTIFICATIONS: Notification[] = [
  { title: "New lead — Sarah M. from Zillow", meta: "Lake Oswego · Buyer inquiry · 2m ago", tone: "info" },
  { title: "Offer accepted — 8457 NW Lakeshore", meta: "Listed at $1.15M · 18m ago", tone: "success" },
  { title: "Inspection deadline this week", meta: "TX-4003 · due in 2 days · action needed", tone: "warn" },
  { title: "5-star review from the Harrisons", meta: "West Linn · posted on Google · 1h ago", tone: "success" },
  { title: "Kim Tran opened your CMA", meta: "Lake Oswego lead · viewed 3 pages · 2h ago", tone: "info" },
  { title: "Buyer agreement missing — Reyes family", meta: "Showing tomorrow, not signed", tone: "warn" },
];

/** Derive the page H1 from the deepest matching nav route. */
export function titleFromPath(pathname: string): string {
  // Longest matching href wins (so /hub/crm beats /hub).
  let best: { len: number; label: string } | null = null;
  for (const item of NAV_ITEMS) {
    const match =
      item.href === "/hub"
        ? pathname === "/hub"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (match && (!best || item.href.length > best.len)) {
      best = { len: item.href.length, label: item.label };
    }
  }
  if (best) return best.label === "Today" ? "Today Command Center" : best.label;
  return "Matin Brokerage OS";
}

export function TopCommandBar({
  pathname,
  title,
  onOpenPalette,
  onOpenMobileNav,
}: {
  pathname: string;
  title?: ReactNode;
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  const { openAi } = useAiSidecar();
  const [notifOpen, setNotifOpen] = useState(false);
  const heading = title ?? titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-mist bg-paper px-4 sm:h-16 md:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Page H1 — Fraunces */}
      <h1 className="min-w-0 truncate font-display text-[1.15rem] font-normal leading-none text-ink sm:text-[1.35rem]">
        {heading}
      </h1>

      <div className="ml-auto flex items-center gap-2 md:gap-2.5">
        {/* Search pill — opens command palette */}
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search (Command-K)"
          className="hidden items-center gap-2 rounded-full bg-paper-200 py-1.5 pl-3 pr-2 text-[0.82rem] text-slate ring-1 ring-inset ring-mist transition-colors hover:text-ink md:inline-flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Search…</span>
          <kbd className="rounded bg-cloud px-1.5 py-0.5 text-[0.62rem] font-semibold text-slate ring-1 ring-inset ring-mist">
            ⌘K
          </kbd>
        </button>

        {/* Search icon — compact (small screens) */}
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink md:hidden"
        >
          <Search className="h-[1.05rem] w-[1.05rem]" />
        </button>

        {/* + Create — ink-filled (primary HUMAN action) */}
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink py-1.5 pl-3 pr-3.5 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </button>

        {/* Ask AI — gold-filled (the ONE accent, rationed to AI) */}
        <button
          type="button"
          onClick={() => openAi("Context: Matin Brokerage OS")}
          className="inline-flex items-center gap-1.5 rounded-full bg-gold py-1.5 pl-3 pr-3.5 text-[0.82rem] font-semibold text-ink transition-colors hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {/* Gold surface = LIGHT → dark "M" mark */}
          <MatinMark theme="dark" className="h-4 w-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-paper-200 hover:text-ink",
              notifOpen ? "bg-paper-200 text-ink" : "text-slate",
            )}
          >
            <Bell className="h-[1.05rem] w-[1.05rem]" />
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.58rem] font-bold leading-none text-cloud ring-2 ring-paper tabular-nums">
              {NOTIFICATIONS.length}
            </span>
          </button>

          {notifOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
              <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-mist bg-cloud shadow-lift sm:w-[22rem]">
                <div className="flex items-center justify-between border-b border-mist px-4 py-3">
                  <span className="text-[0.84rem] font-semibold text-ink">Notifications</span>
                  <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[0.62rem] font-bold text-danger tabular-nums">
                    {NOTIFICATIONS.length} new
                  </span>
                </div>
                <ul className="max-h-[22rem] divide-y divide-mist overflow-y-auto">
                  {NOTIFICATIONS.map((n, i) => (
                    <li key={i} className="flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-paper">
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                          n.tone === "success" ? "bg-success" : n.tone === "warn" ? "bg-warn" : "bg-info",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[0.82rem] font-medium leading-snug text-ink">{n.title}</p>
                        <p className="mt-0.5 text-[0.72rem] text-slate">{n.meta}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/hub/crm"
                  onClick={() => setNotifOpen(false)}
                  className="block border-t border-mist px-4 py-2.5 text-center text-[0.76rem] font-semibold text-ink transition-colors hover:bg-paper"
                >
                  View all in CRM
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
