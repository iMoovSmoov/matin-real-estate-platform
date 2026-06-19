"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  FileSignature,
  Search,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  Building2,
  Settings,
  LogOut,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { NotificationCenter } from "@/components/command/NotificationCenter";
import { CommandPalette, CommandPaletteProvider, useCommandPalette } from "@/components/command/CommandPalette";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[]; alwaysOpen?: boolean };

const NAV: NavGroup[] = [
  {
    label: "HOME",
    alwaysOpen: true,
    items: [
      { label: "Dashboard", href: "/hub", icon: LayoutDashboard },
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
    label: "AI",
    items: [
      { label: "AI Studio", href: "/hub/ai", icon: BrainCircuit },
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


function isActive(pathname: string, href: string) {
  if (href === "/hub") return pathname === "/hub";
  if (href === "/hub/ai") return pathname === "/hub/ai";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, g: NavGroup) {
  return g.items.some((i) => isActive(pathname, i.href));
}

/* Avatar circle with "AS" initials for Alicia Smith */
function UserAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const dim = size === "md" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-7 w-7 sm:h-8 sm:w-8";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-white",
        dim,
        size === "sm" ? "text-[0.62rem]" : "text-[0.7rem]",
      )}
    >
      AS
    </span>
  );
}

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border border-ink/[0.08] bg-white py-1 pl-1 pr-2 shadow-sm transition-colors hover:border-ink/20 md:pr-3",
          open && "border-ink/20 bg-paper",
        )}
      >
        <UserAvatar size="sm" />
        <div className="hidden leading-tight md:block">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="text-[0.78rem] font-semibold text-ink">Alicia Smith</span>
          </div>
          <div className="text-[0.63rem] text-slate/60">Lead Listing Specialist</div>
        </div>
        <ChevronDown
          className={cn(
            "hidden h-3 w-3 shrink-0 text-slate/40 transition-transform duration-150 md:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {/* User header */}
          <div className="flex items-center gap-2.5 border-b border-ink/[0.07] px-4 py-3">
            <UserAvatar size="sm" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[0.82rem] font-semibold text-ink">Alicia Smith</p>
              <p className="truncate text-[0.68rem] text-slate/60">Lead Listing Specialist</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/hub/settings#profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate/40" />
              My Profile
            </Link>
            <Link
              href="/hub/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-medium text-ink transition-colors hover:bg-paper"
            >
              <Settings className="h-4 w-4 shrink-0 text-slate/40" />
              Settings
            </Link>
          </div>

          {/* Divider + Sign out */}
          <div className="border-t border-ink/[0.07] py-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[0.82rem] font-medium text-slate/70 transition-colors hover:bg-paper hover:text-ink"
            >
              <LogOut className="h-4 w-4 shrink-0 text-slate/40" />
              Sign out
            </Link>
          </div>
        </div>
      )}
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
          const noCollapse = group.items.length === 1 || group.alwaysOpen;
          return (
            <div key={group.label} className="pb-1">
              {noCollapse ? (
                <span className="mb-1 flex w-full items-center px-3 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-slate/40">
                  {group.label}
                </span>
              ) : (
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
              {(noCollapse || isOpen) && (
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

      {/* Footer — settings + user */}
      <div className="border-t border-ink/[0.08] p-3 space-y-1">
        <Link
          href="/hub/settings"
          onClick={onNavigate}
          className={cn(
            "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-all duration-100",
            isActive(pathname, "/hub/settings")
              ? "border-l-[3px] border-azure bg-azure/[0.07] pl-[0.625rem] text-ink shadow-[inset_0_0_0_1px_rgb(0,0,0,0.04)]"
              : "text-slate/70 hover:bg-ink/[0.04] hover:text-ink",
          )}
        >
          <Settings
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive(pathname, "/hub/settings") ? "text-azure" : "text-slate/50 group-hover:text-ink",
            )}
          />
          <span className="truncate">Settings</span>
        </Link>
        <div className="flex items-center gap-2.5 rounded-xl border border-ink/[0.06] bg-paper/60 px-3 py-2.5">
          <UserAvatar size="sm" />
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate text-[0.78rem] font-semibold text-ink">Alicia Smith</span>
            </div>
            <span className="block text-[0.64rem] text-slate/55">Lead Listing Specialist</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setOpen: openPalette } = useCommandPalette();

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

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

          {/* Search — clicking opens the palette */}
          <button
            onClick={() => openPalette(true)}
            className="relative hidden max-w-sm flex-1 items-center sm:flex h-9 w-full rounded-lg border border-ink/[0.08] bg-white pl-9 pr-16 text-[0.85rem] text-slate/40 transition-all hover:border-azure/30 hover:ring-2 hover:ring-azure/10 cursor-text"
            aria-label="Open command palette"
          >
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate/50" />
            <span className="truncate">Search leads, listings, agents…</span>
            <kbd className="pointer-events-none absolute right-2.5 rounded border border-ink/[0.08] bg-paper px-1.5 py-0.5 text-[0.6rem] font-medium text-slate/50">
              ⌘K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => openPalette(true)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate hover:bg-ink/[0.04] hover:text-ink sm:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Notifications */}
            <NotificationCenter />

            {/* User dropdown */}
            <ProfileDropdown />
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

      {/* Global command palette */}
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
