"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  FileText,
  ClipboardList,
  FilePlus2,
  Rocket,
  GraduationCap,
  BarChart2,
  PlugZap,
  BrainCircuit,
  MessageSquareText,
  PenLine,
  Calculator,
  FileSignature,
  MessageCircle,
  Megaphone,
  PhoneCall,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  Building2,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/hub", icon: LayoutDashboard },
    ],
  },
  {
    label: "AGENT",
    items: [
      { label: "My Workspace", href: "/hub/agent", icon: BrainCircuit },
    ],
  },
  {
    label: "CLIENTS",
    items: [
      { label: "CRM & Leads", href: "/hub/crm", icon: Users },
      { label: "Cash Offers", href: "/hub/cash-offer", icon: DollarSign },
      { label: "Buyer Agreements", href: "/hub/buyer-agreements", icon: FileSignature },
      { label: "Transactions", href: "/hub/transactions", icon: FileText },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "Forms", href: "/hub/forms", icon: ClipboardList },
      { label: "Contract Builder", href: "/hub/contracts", icon: FilePlus2 },
      { label: "Listing Launch", href: "/hub/listing-launch", icon: Rocket },
      { label: "Coaching", href: "/hub/coaching", icon: GraduationCap },
    ],
  },
  {
    label: "AI STUDIO",
    items: [
      { label: "AI Studio", href: "/hub/ai", icon: BrainCircuit },
      { label: "Lead Responder", href: "/hub/ai/lead-responder", icon: MessageSquareText },
      { label: "Listing Writer", href: "/hub/ai/listing-writer", icon: PenLine },
      { label: "Marketing Kit", href: "/hub/ai/marketing-kit", icon: Megaphone },
      { label: "CMA Generator", href: "/hub/ai/cma", icon: Calculator },
      { label: "Agreements", href: "/hub/ai/agreements", icon: FileSignature },
      { label: "Seller Intel", href: "/hub/ai/seller-intel", icon: PhoneCall },
      { label: "Cash Offer Eval", href: "/hub/ai/cash-offer", icon: DollarSign },
      { label: "Agent Coach", href: "/hub/ai/coach", icon: GraduationCap },
      { label: "Ask Matin", href: "/hub/ai/ask", icon: MessageCircle },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { label: "Reporting", href: "/hub/reporting", icon: BarChart2 },
      { label: "Integrations", href: "/hub/integrations", icon: PlugZap },
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
  if (href === "/hub/ai") return pathname === "/hub/ai";
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

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.map((g) => [g.label, g.items.length <= 3 || groupHasActive(pathname, g)])),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="flex items-center gap-3 border-b-2 border-azure/20 bg-white px-5 py-[1.15rem] shadow-[0_1px_0_0_rgb(0,0,0,0.04)]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white ring-1 ring-inset ring-ink/[0.12] shadow-sm">
          <MatinMark className="h-4 text-white" />
        </span>
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
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const isOpen = open[group.label];
          const single = group.items.length === 1;
          return (
            <div key={group.label} className="pb-1">
              {single ? null : (
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
              {(single || isOpen) && (
                <ul className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
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
      <div className="border-t border-ink/[0.08] p-3">
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
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink/[0.08] bg-white lg:flex">
        <SidebarContent pathname={pathname} />
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
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-ink/[0.08] bg-paper/90 px-4 backdrop-blur-md sm:h-16 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate/50" />
            <input
              type="text"
              placeholder="Search leads, listings, agents…"
              className="h-9 w-full rounded-lg border border-ink/[0.08] bg-white pl-9 pr-16 text-[0.85rem] text-ink placeholder:text-slate/40 transition-all focus:border-azure/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-azure/10"
            />
            <kbd className="pointer-events-none absolute right-2.5 rounded border border-ink/[0.08] bg-paper px-1.5 py-0.5 text-[0.6rem] font-medium text-slate/50">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-ink/[0.04] hover:text-ink",
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
        <div className="flex items-center overflow-x-hidden border-b border-ink/[0.06] bg-white px-4 py-1.5 md:px-6">
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[0.72rem] font-medium text-slate/70 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to website
          </Link>
        </div>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
