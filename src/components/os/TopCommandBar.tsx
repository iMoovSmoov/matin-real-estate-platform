"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Bell,
  Menu,
  Users,
  Building2,
  HandCoins,
  FileSignature,
  FileText,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
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

export type Notification = {
  title: string;
  meta: string;
  tone: "info" | "success" | "warn";
  /** Where clicking the notification takes the user (always a real destination). */
  href: string;
};

/** Notifications are bound to the canonical demo records so each one navigates
    to the actual lead / deal / opportunity it refers to (no dead ends). */
const NOTIFICATIONS: Notification[] = [
  { title: "New lead — Daniel Cho from IDX Search", meta: "Beaverton · Buyer · score 84 · 2m ago", tone: "info", href: "/hub/crm" },
  { title: "Inspection deadline — 8912 SE Hawthorne", meta: "Due tomorrow · repair addendum unsigned", tone: "warn", href: "/hub/transactions" },
  { title: "Sarah Mitchell opened your market report", meta: "Seller intent 91 · clicked the cash-offer page", tone: "info", href: "/hub/cash-offer" },
  { title: "Listing blocked — 1248 NW Cedar Hills Dr", meta: "Seller disclosure missing initials · broker review due", tone: "warn", href: "/hub/listing-launch" },
  { title: "Buyer agreement awaiting signature", meta: "Angela Park · sent for e-signature · not yet signed", tone: "warn", href: "/hub/buyer-agreements" },
  { title: "5-star review from the Harrisons", meta: "West Linn · posted on Google · 1h ago", tone: "success", href: "/hub/reporting" },
];

/** "+ Create" menu — each item routes to its section and (via ?create=) opens
    that section's create form, so Create is fully connected, never a dead end. */
type CreateItem = { label: string; href: string; icon: LucideIcon };
const CREATE_ITEMS: CreateItem[] = [
  { label: "New lead", href: "/hub/crm?create=lead", icon: Users },
  { label: "New listing launch", href: "/hub/listing-launch?create=listing", icon: Building2 },
  { label: "New seller / cash offer", href: "/hub/cash-offer?create=opportunity", icon: HandCoins },
  { label: "New buyer agreement", href: "/hub/buyer-agreements?create=agreement", icon: FileSignature },
  { label: "New document packet", href: "/hub/forms?create=packet", icon: FileText },
  { label: "New marketing campaign", href: "/hub/marketing?create=campaign", icon: Megaphone },
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
  const [createOpen, setCreateOpen] = useState(false);
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

        {/* + Create — ink-filled (primary HUMAN action) → opens a create menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCreateOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={createOpen}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink py-1.5 pl-3 pr-3.5 text-[0.82rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {createOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} aria-hidden />
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-mist bg-cloud py-1.5 shadow-lift"
              >
                <p className="px-4 pb-1.5 pt-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-slate">
                  Create new
                </p>
                {CREATE_ITEMS.map((c) => {
                  const Icon = c.icon;
                  return (
                    <Link
                      key={c.label}
                      href={c.href}
                      role="menuitem"
                      onClick={() => setCreateOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[0.85rem] font-medium text-ink transition-colors hover:bg-paper-200"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-ink ring-1 ring-inset ring-mist">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {c.label}
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* Ask AI — the ONE accent, rationed to AI. Premium jeweled
            green→brass gradient w/ hover sheen (.btn-accent). */}
        <button
          type="button"
          onClick={() => openAi("Working on: Matin Brokerage OS")}
          className="btn-accent inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-3.5 text-[0.82rem] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        >
          {/* Dark green accent surface → white "M" mark */}
          <MatinMark theme="white" className="h-4 w-4" />
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
                    <li key={i}>
                      <Link
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper"
                      >
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
                      </Link>
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
