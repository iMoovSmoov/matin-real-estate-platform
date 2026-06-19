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
  BookOpen,
  Search,
  Bell,
  Menu,
  X,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { cn, initials } from "@/lib/utils";
import { LiveDot } from "@/components/command/ui";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/command-center", icon: LayoutDashboard }],
  },
  {
    label: "Pipeline",
    items: [
      { label: "CRM & Leads", href: "/command-center/crm", icon: Users },
      { label: "Transactions", href: "/command-center/transactions", icon: Wallet },
    ],
  },
  {
    label: "AI Studio",
    items: [
      { label: "AI Studio", href: "/command-center/ai", icon: Bot },
      { label: "Lead Responder", href: "/command-center/ai/lead-responder", icon: MessageSquareText },
      { label: "Listing Writer", href: "/command-center/ai/listing-writer", icon: PenSquare },
      { label: "Agent Coach", href: "/command-center/ai/coach", icon: GraduationCap },
      { label: "CMA Generator", href: "/command-center/ai/cma", icon: Calculator },
      { label: "Agreements", href: "/command-center/ai/agreements", icon: FileSignature },
      { label: "Ask Matin", href: "/command-center/ai/ask", icon: Sparkles },
    ],
  },
  {
    label: "Workflows",
    items: [
      { label: "Forms & Data Flows", href: "/command-center/forms", icon: Database },
      { label: "Contract Builder", href: "/command-center/contracts", icon: ScrollText },
      { label: "Coaching Academy", href: "/command-center/coaching", icon: Trophy },
      { label: "Playbook", href: "/command-center/playbook", icon: BookOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Automations", href: "/command-center/automations", icon: Workflow },
      { label: "Integrations", href: "/command-center/integrations", icon: Plug },
      { label: "Reporting", href: "/command-center/reporting", icon: BarChart3 },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/command-center") return pathname === "/command-center";
  // AI hub shouldn't stay highlighted on its sub-tools.
  if (href === "/command-center/ai") return pathname === "/command-center/ai";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-[1.15rem]">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-azure/15 text-white ring-1 ring-inset ring-azure/25">
          <MatinMark className="h-4 text-white" />
        </span>
        <div className="min-w-0 leading-tight">
          <div className="flex items-center gap-2">
            <span className="truncate text-[0.92rem] font-semibold tracking-tight text-white">
              Command Center
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-slate-300/70">
              Matin Ops
            </span>
            <span className="rounded bg-azure/15 px-1 py-px text-[0.55rem] font-bold uppercase tracking-wider text-azure-bright ring-1 ring-inset ring-azure/25">
              Demo
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-300/55">
              {group.label}
            </p>
            <ul className="space-y-0.5">
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
                          ? "bg-azure/12 text-white ring-1 ring-inset ring-azure/25"
                          : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-azure-bright" />
                      )}
                      <Icon
                        className={cn(
                          "h-[1.05rem] w-[1.05rem] shrink-0",
                          active ? "text-azure-bright" : "text-slate-300 group-hover:text-white",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer status card */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl border border-white/10 bg-ink-800/60 p-3">
          <div className="flex items-center gap-2">
            <LiveDot tone="success" />
            <span className="text-[0.74rem] font-semibold text-white">All systems operational</span>
          </div>
          <p className="mt-1 text-[0.68rem] leading-relaxed text-slate-300/70">
            12 integrations · 8 automations · Claude Opus 4.8 online
          </p>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-ink-900/80 backdrop-blur-md lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[82vw] border-r border-white/10 bg-ink-900 shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white"
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink/85 px-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative hidden max-w-sm flex-1 items-center sm:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-300/60" />
            <input
              type="text"
              placeholder="Search leads, listings, agents…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-16 text-[0.85rem] text-white placeholder:text-slate-300/45 transition-colors focus:border-azure/50 focus:bg-white/[0.06] focus:outline-none"
            />
            <kbd className="pointer-events-none absolute right-2.5 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[0.6rem] font-medium text-slate-300/60">
              ⌘K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* AI status chip */}
            <div className="hidden items-center gap-2 rounded-full border border-success/25 bg-success/10 px-3 py-1.5 sm:flex">
              <LiveDot tone="success" />
              <span className="text-[0.74rem] font-semibold text-success">Claude connected</span>
            </div>

            {/* Notifications */}
            <button
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Bell className="h-[1.15rem] w-[1.15rem]" />
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[0.58rem] font-bold text-white ring-2 ring-ink">
                7
              </span>
            </button>

            {/* User chip */}
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-azure to-azure-deep text-[0.66rem] font-bold text-white">
                {initials("Alicia Kelly-Smith")}
              </span>
              <div className="hidden leading-tight md:block">
                <div className="text-[0.78rem] font-semibold text-white">Alicia Kelly-Smith</div>
                <div className="text-[0.64rem] text-slate-300/70">Operations</div>
              </div>
            </div>
          </div>
        </header>

        {/* Back-to-site strip */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-ink-900/40 px-4 py-1.5 md:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-slate-300/70 transition-colors hover:text-azure-bright"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to matinrealestate.com
          </Link>
          <div className="hidden items-center gap-1 text-[0.68rem] text-slate-300/45 sm:flex">
            <span>Internal portfolio build</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-300/70">AI Systems &amp; Technology Integrator</span>
          </div>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
