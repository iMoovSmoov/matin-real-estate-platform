"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Bot,
  MessageSquareText,
  PenSquare,
  GraduationCap,
  FileSignature,
  Calculator,
  Sparkles,
  Workflow,
  Plug,
  BarChart3,
  Database,
  ScrollText,
  Trophy,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  LifeBuoy,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { cn, initials } from "@/lib/utils";
import { LiveDot } from "@/components/command/ui";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/hub", icon: LayoutDashboard }] },
  {
    label: "Clients",
    items: [
      { label: "CRM & Leads", href: "/hub/crm", icon: Users },
      { label: "Transactions", href: "/hub/transactions", icon: Wallet },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "AI Studio", href: "/hub/ai", icon: Bot },
      { label: "Lead Responder", href: "/hub/ai/lead-responder", icon: MessageSquareText },
      { label: "Listing Writer", href: "/hub/ai/listing-writer", icon: PenSquare },
      { label: "Agent Coach", href: "/hub/ai/coach", icon: GraduationCap },
      { label: "CMA Generator", href: "/hub/ai/cma", icon: Calculator },
      { label: "Agreements", href: "/hub/ai/agreements", icon: FileSignature },
      { label: "Ask Matin", href: "/hub/ai/ask", icon: Sparkles },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Forms", href: "/hub/forms", icon: Database },
      { label: "Contract Builder", href: "/hub/contracts", icon: ScrollText },
      { label: "Coaching", href: "/hub/coaching", icon: Trophy },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reporting", href: "/hub/reporting", icon: BarChart3 },
      { label: "Integrations", href: "/hub/integrations", icon: Plug },
    ],
  },
];

const NOTIFICATIONS = [
  { title: "New lead — Olivia Bennett", meta: "Zillow · West Linn · 2m ago", tone: "azure" as const },
  { title: "Offer accepted", meta: "8457 NW Lakeshore Ave · 18m ago", tone: "success" as const },
  { title: "Inspection deadline tomorrow", meta: "TX-4003 · due in 1 day", tone: "warn" as const },
  { title: "New 5-star review from the Harrisons", meta: "West Linn · 1h ago", tone: "success" as const },
  { title: "Seller opened your CMA", meta: "Lake Oswego lead · 2h ago", tone: "azure" as const },
];

function isActive(pathname: string, href: string) {
  if (href === "/hub") return pathname === "/hub";
  if (href === "/hub/ai") return pathname === "/hub/ai";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, g: NavGroup) {
  return g.items.some((i) => isActive(pathname, i.href));
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  // Collapse long groups by default; expand short ones or the active group.
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV.map((g) => [g.label, g.items.length <= 3 || groupHasActive(pathname, g)])),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-ink/[0.08] px-5 py-[1.15rem]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.08]">
          <MatinMark className="h-4 text-ink" />
        </span>
        <div className="min-w-0 leading-tight">
          <span className="block truncate font-display text-[1.05rem] text-ink">Matin Hub</span>
          <span className="block text-[0.6rem] font-medium uppercase tracking-[0.2em] text-slate/65">
            Matin Real Estate
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const isOpen = open[group.label];
          const single = group.items.length === 1;
          return (
            <div key={group.label} className="pb-1">
              {single ? null : (
                <button
                  onClick={() => setOpen((s) => ({ ...s, [group.label]: !s[group.label] }))}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate/55 transition-colors hover:text-slate"
                >
                  {group.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-0" : "-rotate-90")} />
                </button>
              )}
              {(single || isOpen) && (
                <ul className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.85rem] font-medium transition-colors",
                            active
                              ? "bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.08]"
                              : "text-slate hover:bg-white hover:text-ink",
                          )}
                        >
                          {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-ink" />}
                          <Icon className={cn("h-[1.05rem] w-[1.05rem] shrink-0", active ? "text-ink" : "text-slate group-hover:text-ink")} />
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

      {/* Footer */}
      <div className="border-t border-ink/[0.08] p-3">
        <a
          href="tel:+15036229624"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:bg-white hover:text-ink"
        >
          <LifeBuoy className="h-[1.05rem] w-[1.05rem]" /> Help &amp; support
        </a>
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
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink/[0.08] bg-white backdrop-blur-md lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[82vw] border-r border-ink/[0.08] bg-white shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink/[0.08] bg-paper/85 px-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate/60" />
            <input
              type="text"
              placeholder="Search leads, listings, agents…"
              className="h-9 w-full rounded-lg border border-ink/[0.08] bg-white pl-9 pr-16 text-[0.85rem] text-ink placeholder:text-slate/45 transition-colors focus:border-ink/40 focus:bg-white focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-2.5 rounded border border-ink/[0.08] bg-white px-1.5 py-0.5 text-[0.6rem] font-medium text-slate/60">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-ink/[0.04] hover:text-ink",
                  notifOpen ? "bg-ink/[0.04] text-ink" : "text-slate",
                )}
              >
                <Bell className="h-[1.15rem] w-[1.15rem]" />
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.58rem] font-bold text-ink ring-2 ring-ink">
                  {NOTIFICATIONS.length}
                </span>
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden />
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-ink/[0.08] px-4 py-3">
                      <span className="text-[0.84rem] font-semibold text-ink">Notifications</span>
                      <span className="rounded-md bg-ink/[0.08] px-1.5 py-0.5 text-[0.62rem] font-semibold text-ink">
                        {NOTIFICATIONS.length} new
                      </span>
                    </div>
                    <ul className="max-h-80 divide-y divide-ink/[0.06] overflow-y-auto">
                      {NOTIFICATIONS.map((n, i) => (
                        <li key={i} className="flex gap-3 px-4 py-3 transition-colors hover:bg-white">
                          <span
                            className={cn(
                              "mt-1 h-2 w-2 shrink-0 rounded-full",
                              n.tone === "success" ? "bg-success" : n.tone === "warn" ? "bg-warn" : "bg-ink",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="text-[0.82rem] font-medium text-ink">{n.title}</p>
                            <p className="mt-0.5 text-[0.72rem] text-slate/65">{n.meta}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/hub/crm"
                      onClick={() => setNotifOpen(false)}
                      className="block border-t border-ink/[0.08] px-4 py-2.5 text-center text-[0.76rem] font-semibold text-ink hover:bg-white"
                    >
                      View all in CRM
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-full border border-ink/[0.08] bg-white py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[0.66rem] font-bold text-white">
                {initials("Alicia Kelly-Smith")}
              </span>
              <div className="hidden leading-tight md:block">
                <div className="text-[0.78rem] font-semibold text-ink">Alicia Kelly-Smith</div>
                <div className="text-[0.64rem] text-slate/70">Operations</div>
              </div>
            </div>
          </div>
        </header>

        {/* Back-to-site strip */}
        <div className="flex items-center border-b border-ink/[0.06] bg-white px-4 py-1.5 md:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-slate/70 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to website
          </Link>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
