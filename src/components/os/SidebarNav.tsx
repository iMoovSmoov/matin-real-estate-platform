"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  HandCoins,
  Building2,
  FileSignature,
  Handshake,
  FileText,
  Megaphone,
  GraduationCap,
  BarChart3,
  Activity,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import { useAiSidecar } from "./AISidecar";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — SidebarNav  (ref §1.3)

   Fixed full-height charcoal rail (~280px), collapsible to a ~64px icon rail.
   Quiet brand block: MATIN over "Brokerage OS". Canonical nav order — DO NOT
   reorder — then a divider, then de-emphasized Admin. Active = solid white
   pill, ink text; inactive = slate-300; hover = white 6% wash. Bottom block =
   Role/Team context line + gold-outline "AI Assist: Ready" pill.

   NAV_ITEMS / BOTTOM_TABS are exported so the command bar can derive the page
   H1 from the route and the mobile bottom bar can reuse the new labels.
   ────────────────────────────────────────────────────────────────────────── */

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** below-the-line, de-emphasized (Admin) */
  admin?: boolean;
};

// Canonical order (build-reference §1.3 / wireframe 02). Routes map to the
// EXISTING /hub paths — relabeled. marketing + systems-health are linked now
// and built next phase.
export const NAV_ITEMS: NavItem[] = [
  { label: "Today", href: "/hub", icon: LayoutDashboard },
  { label: "CRM & Leads", href: "/hub/crm", icon: Users },
  { label: "Seller / Cash Offers", href: "/hub/cash-offer", icon: HandCoins },
  { label: "Listing Launch", href: "/hub/listing-launch", icon: Building2 },
  { label: "Buyer Agreements", href: "/hub/buyer-agreements", icon: FileSignature },
  { label: "Transactions", href: "/hub/transactions", icon: Handshake },
  { label: "Forms & Docs", href: "/hub/forms", icon: FileText },
  { label: "Marketing Studio", href: "/hub/marketing", icon: Megaphone },
  { label: "Coaching", href: "/hub/coaching", icon: GraduationCap },
  { label: "Reports", href: "/hub/reporting", icon: BarChart3 },
  { label: "Systems Health", href: "/hub/systems-health", icon: Activity },
  { label: "Admin", href: "/hub/settings", icon: SlidersHorizontal, admin: true },
];

/** Mobile bottom-tab destinations + a "More" trigger handled by the shell. */
export const BOTTOM_TABS: NavItem[] = [
  { label: "Today", href: "/hub", icon: LayoutDashboard },
  { label: "CRM", href: "/hub/crm", icon: Users },
  { label: "Deals", href: "/hub/transactions", icon: Handshake },
  { label: "Listings", href: "/hub/listing-launch", icon: Building2 },
];

export function isActive(pathname: string, href: string) {
  if (href === "/hub") return pathname === "/hub";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  pathname,
  collapsed = false,
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const primary = NAV_ITEMS.filter((i) => !i.admin);
  const admin = NAV_ITEMS.filter((i) => i.admin);
  const { openAi } = useAiSidecar();

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-ink-800 to-ink-900 text-slate-300">
      {/* Brand block — quiet wordmark. Right padding leaves room for the
          collapse toggle that floats on the rail's edge (never overlaps). */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-ink-700",
          collapsed ? "justify-center px-0" : "gap-2.5 pl-5 pr-9",
        )}
      >
        {/* Brand mark seated in a faceted chip — subtle gradient + brass
            ring + inset highlight for depth on the dark rail. */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink-700 to-ink-900 ring-1 ring-brass/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <MatinMark className="h-[1.1rem] w-[1.1rem]" theme="white" />
        </span>
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <span className="block truncate font-sans text-[0.92rem] font-bold uppercase tracking-[0.14em] text-cloud">
              Matin
            </span>
            <span className="block truncate text-[0.66rem] font-medium tracking-wide text-slate-300/70">
              Brokerage OS
            </span>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary"
        className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-3")}
      >
        <ul className="space-y-0.5">
          {primary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>

        {/* Divider */}
        <div className={cn("my-3 border-t border-ink-700", collapsed ? "mx-1" : "mx-2")} />

        {/* Admin — below the line, de-emphasized */}
        <ul className="space-y-0.5">
          {admin.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              onNavigate={onNavigate}
              deemphasized
            />
          ))}
        </ul>
      </nav>

      {/* Bottom context block */}
      <div className={cn("border-t border-ink-700", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openAi("Working on: Matin Brokerage OS")}
              title="Ask Matin"
              aria-label="Ask Matin"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/35 bg-gold/[0.10] shadow-[0_6px_16px_-6px_rgba(31,107,74,0.5)] transition-colors hover:bg-gold/[0.18]"
            >
              <MatinMark theme="white" className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <p className="px-1 text-[0.68rem] leading-tight text-slate-300/60">
              <span className="text-slate-300/90">Jordan Matin</span> · Principal Broker
            </p>
            <button
              type="button"
              onClick={() => openAi("Working on: Matin Brokerage OS")}
              className="mt-2 inline-flex w-full items-center gap-2 rounded-lg border border-gold/35 bg-gold/[0.10] px-3 py-2 text-left shadow-[0_6px_18px_-6px_rgba(31,107,74,0.5)] transition-colors hover:bg-gold/[0.16]"
            >
              <MatinMark theme="white" className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[0.74rem] font-semibold text-gold-bright">
                Ask Matin
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onNavigate,
  deemphasized = false,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  deemphasized?: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onNavigate}
          title={item.label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex items-center justify-center rounded-lg py-2.5 transition-colors",
            active
              ? "bg-cloud text-ink"
              : "text-slate-300/70 hover:bg-cloud/[0.06] hover:text-cloud",
          )}
        >
          {active ? (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-bright to-gold"
            />
          ) : null}
          <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" />
          {/* Tooltip */}
          <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[0.72rem] font-medium text-cloud opacity-0 shadow-lift transition-opacity group-hover:opacity-100">
            {item.label}
          </span>
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.84rem] font-medium transition-colors",
          active
            ? "bg-cloud text-ink shadow-soft"
            : cn(
                "hover:bg-cloud/[0.06] hover:text-cloud",
                deemphasized ? "text-slate-300/55" : "text-slate-300/85",
              ),
        )}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-gold-bright to-gold"
          />
        ) : null}
        <Icon
          className={cn(
            "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors",
            active ? "text-ink" : "text-slate-300/55 group-hover:text-cloud",
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}
