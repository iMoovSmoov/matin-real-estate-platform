"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  Rocket,
  GraduationCap,
  BarChart2,
  FileSignature,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Wand2,
  ClipboardList,
  ScrollText,
  Settings,
} from "lucide-react";

import { MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/command/CommandPalette";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

/** Bottom-tab items shown on mobile — the 4 most-used destinations + More */
const BOTTOM_TABS = [
  { label: "Dashboard", href: "/hub", icon: LayoutDashboard },
  { label: "CRM", href: "/hub/crm", icon: Users },
  { label: "Deals", href: "/hub/transactions", icon: FileText },
  { label: "Listings", href: "/hub/listing-launch", icon: Rocket },
] satisfies { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];

const NAV: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/hub", icon: LayoutDashboard },
    ],
  },
  {
    label: "LEADS & CLIENTS",
    items: [
      { label: "CRM & Leads", href: "/hub/crm", icon: Users },
      { label: "Cash Offer Pipeline", href: "/hub/cash-offer", icon: DollarSign },
      { label: "Buyer Agreements", href: "/hub/buyer-agreements", icon: FileSignature },
    ],
  },
  {
    label: "LISTINGS",
    items: [
      { label: "Listing Launch", href: "/hub/listing-launch", icon: Rocket },
      { label: "Transactions", href: "/hub/transactions", icon: FileText },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "AI Tools", href: "/hub/ai", icon: Wand2 },
      { label: "Forms Library", href: "/hub/forms", icon: ClipboardList },
      { label: "Contract Builder", href: "/hub/contracts", icon: ScrollText },
      { label: "Reporting", href: "/hub/reporting", icon: BarChart2 },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { label: "Coaching", href: "/hub/coaching", icon: GraduationCap },
      { label: "Settings", href: "/hub/settings", icon: Settings },
    ],
  },
];

const NOTIFICATIONS = [
  {
    title: "New lead — Sarah M. from Zillow",
    meta: "Lake Oswego · Buyer inquiry · 2m ago",
    tone: "azure" as const,
  },
  {
    title: "Offer accepted — 8457 NW Lakeshore",
    meta: "Listed at $1.15M · congrats · 18m ago",
    tone: "success" as const,
  },
  {
    title: "Inspection deadline this week",
    meta: "TX-4003 · due in 2 days · action needed",
    tone: "warn" as const,
  },
  {
    title: "5-star review from the Harrisons",
    meta: "West Linn · just posted on Google · 1h ago",
    tone: "success" as const,
  },
  {
    title: "Kim Tran opened your CMA",
    meta: "Lake Oswego lead · viewed 3 pages · 2h ago",
    tone: "azure" as const,
  },
  {
    title: "Showing scheduled — 1204 NW Lovejoy",
    meta: "Tomorrow 10 AM · Buyer: Chen family · 3h ago",
    tone: "azure" as const,
  },
  {
    title: "Buyer agreement missing — Reyes family",
    meta: "Showing tomorrow, agreement not signed",
    tone: "warn" as const,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/hub") return pathname === "/hub";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, g: NavGroup) {
  return g.items.some((i) => isActive(pathname, i.href));
}

function AgentPhoto({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7 sm:h-8 sm:w-8";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-2 ring-ink/20",
        dim,
      )}
    >
      <Image
        src="/matin/agents/jordan-matin.jpg"
        alt="Jordan Matin"
        fill
        className="object-cover object-top"
        sizes="36px"
      />
    </div>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  collapsed = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.map((g) => [g.label, g.items.length <= 3 || groupHasActive(pathname, g)])),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div
        className={cn(
          "flex items-center border-b-2 border-azure/20 bg-white shadow-[0_1px_0_0_rgb(0,0,0,0.04)]",
          collapsed ? "justify-center px-0 py-[1.15rem]" : "gap-3 px-5 py-[1.15rem]",
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-white ring-1 ring-inset ring-ink/[0.12] shadow-sm">
          <MatinMark className="h-4" theme="white" />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-ink/40" />
              <span className="block truncate font-display text-[1.05rem] font-semibold text-ink">
                Matin
              </span>
            </div>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-widest text-azure/60">
              Matin Hub
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto py-4", collapsed ? "px-1.5" : "px-3")}>
        {NAV.map((group) => {
          const isOpen = open[group.label];
          const single = group.items.length === 1;
          return (
            <div key={group.label} className="pb-1">
              {/* Group label — hidden when collapsed */}
              {!collapsed && !single && (
                <button
                  onClick={() => setOpen((s) => ({ ...s, [group.label]: !s[group.label] }))}
                  className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-slate/40 transition-colors hover:text-slate/70"
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-150",
                      isOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>
              )}
              {/* Collapsed: always show all items as icon-only */}
              {(collapsed || single || isOpen) && (
                <ul className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        {collapsed ? (
                          /* Icon-only with tooltip */
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            title={item.label}
                            className={cn(
                              "group relative flex items-center justify-center rounded-lg py-2 transition-all duration-100",
                              active
                                ? "bg-azure/[0.10] text-azure shadow-[inset_0_0_0_1px_rgb(0,0,0,0.04)]"
                                : "text-slate/50 hover:bg-ink/[0.04] hover:text-ink",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[0.72rem] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                              {item.label}
                            </span>
                          </Link>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-all duration-100",
                              active
                                ? "border-l-[3px] border-azure bg-azure/[0.07] pl-[0.625rem] text-ink shadow-[inset_0_0_0_1px_rgb(0,0,0,0.04)]"
                                : "text-slate/70 hover:bg-ink/[0.04] hover:text-ink",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-colors",
                                active ? "text-azure" : "text-slate/50 group-hover:text-ink",
                              )}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — user + phone */}
      <div className={cn("border-t border-ink/[0.08]", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          /* Collapsed: avatar only, centred */
          <div className="flex justify-center py-1">
            <AgentPhoto size="sm" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-ink/[0.06] bg-paper/60 px-3 py-2.5">
            <AgentPhoto size="sm" />
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate text-[0.78rem] font-semibold text-ink">Jordan Matin</span>
              </div>
              <a
                href="tel:+15037615616"
                className="block text-[0.64rem] text-slate/55 transition-colors hover:text-ink"
              >
                (503) 761-5616
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { setOpen: setPaletteOpen } = useCommandPalette();

  const openPalette = useCallback(() => setPaletteOpen(true), [setPaletteOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden h-full shrink-0 flex-col border-r border-ink/[0.08] bg-white transition-all duration-200 lg:flex",
          sidebarCollapsed ? "w-14" : "w-64",
        )}
      >
        {/* Collapse toggle button */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[1.35rem] z-20 flex h-6 w-6 items-center justify-center rounded-full border border-ink/[0.12] bg-white shadow-sm text-slate/60 transition-colors hover:bg-paper hover:text-ink"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
        <SidebarContent pathname={pathname} collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[82vw] border-r border-ink/[0.08] bg-white shadow-2xl">
            {/* Close button — larger tap target */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-slate hover:bg-ink/[0.06] hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Gradient fade top to hint scrollability */}
            <div className="pointer-events-none absolute inset-x-0 top-[72px] z-10 h-8 bg-gradient-to-b from-white to-transparent" />
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 z-30 flex h-14 items-center gap-3 border-b border-ink/[0.08] bg-white px-4 sm:h-16 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search — opens command palette */}
          <button
            onClick={openPalette}
            className="relative hidden max-w-sm flex-1 items-center sm:flex"
            aria-label="Open command palette"
          >
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate/50" />
            <span className="h-9 w-full rounded-lg border border-ink/[0.08] bg-white pl-9 pr-16 text-left text-[0.85rem] text-slate/40 transition-all hover:border-azure/30 hover:bg-white flex items-center">
              Search leads, listings, agents…
            </span>
            <kbd className="pointer-events-none absolute right-2.5 rounded border border-ink/[0.08] bg-paper px-1.5 py-0.5 text-[0.6rem] font-medium text-slate/50">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-ink/[0.04] hover:text-ink",
                  notifOpen ? "bg-ink/[0.06] text-ink" : "text-slate",
                )}
              >
                <Bell className="h-[1.1rem] w-[1.1rem]" />
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.56rem] font-bold text-white ring-2 ring-paper">
                  {NOTIFICATIONS.length}
                </span>
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] sm:w-[22rem]">
                    <div className="flex items-center justify-between border-b border-ink/[0.07] px-4 py-3">
                      <span className="text-[0.84rem] font-semibold text-ink">Notifications</span>
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[0.62rem] font-bold text-danger">
                        {NOTIFICATIONS.length} new
                      </span>
                    </div>
                    <ul className="max-h-[22rem] divide-y divide-ink/[0.05] overflow-y-auto">
                      {NOTIFICATIONS.map((n, i) => (
                        <li
                          key={i}
                          className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper/60 cursor-pointer"
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                              n.tone === "success"
                                ? "bg-success"
                                : n.tone === "warn"
                                  ? "bg-warn"
                                  : "bg-azure",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-[0.82rem] font-medium leading-snug text-ink">
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-[0.72rem] text-slate/60">{n.meta}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/hub/crm"
                      onClick={() => setNotifOpen(false)}
                      className="block border-t border-ink/[0.07] px-4 py-2.5 text-center text-[0.76rem] font-semibold text-azure transition-colors hover:bg-paper/60"
                    >
                      View all in CRM
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* User pill */}
            <div className="flex items-center gap-2.5 rounded-full border border-ink/[0.08] bg-white py-1 pl-1 pr-1 shadow-sm md:pr-3">
              <AgentPhoto size="sm" />
              <div className="hidden leading-tight md:block">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span className="text-[0.78rem] font-semibold text-ink">Jordan Matin</span>
                </div>
                <div className="text-[0.63rem] text-slate/60">Oregon Principal Broker</div>
              </div>
            </div>
          </div>
        </header>

        {/* Back-to-site strip */}
        <div className="shrink-0 flex items-center overflow-x-hidden border-b border-ink/[0.06] bg-white px-4 py-1.5 md:px-6">
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[0.72rem] font-medium text-slate/70 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to website
          </Link>
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 inset-x-0 z-30 flex h-16 items-stretch border-t border-ink/[0.08] bg-white shadow-[0_-1px_0_0_rgb(0,0,0,0.06)] lg:hidden"
      >
        {BOTTOM_TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.58rem] font-semibold uppercase tracking-wider transition-colors",
                active ? "text-ink" : "text-slate/50 hover:text-slate/80",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active ? "text-ink" : "text-slate/40",
                )}
              />
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-8 rounded-full bg-ink" />
              )}
            </Link>
          );
        })}
        {/* More — opens the full sidebar drawer */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="More navigation"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-slate/50 transition-colors hover:text-slate/80"
        >
          <Menu className="h-5 w-5 text-slate/40" />
          More
        </button>
      </nav>

      {/* Command palette — mounted once, toggled via context */}
      <CommandPalette />
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <ShellInner>{children}</ShellInner>
    </CommandPaletteProvider>
  );
}
