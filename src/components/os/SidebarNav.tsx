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
import { roles, getAgent, derived, sellerLeads } from "@/lib/data";
import { Avatar } from "./Avatar";
import { useAiSidecar } from "./AISidecar";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — SidebarNav  (ref §1.3)

   Fixed full-height charcoal rail matched to the Claude MatinOS beta.

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
  { label: "Cash-Offer Pipeline", href: "/hub/cash-offer", icon: HandCoins },
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

/* ── Live nav badges — REAL counts only (design's segmented nav with counts).
   Every value is a derived count off the canonical rows (anti-fabrication §3.2),
   so a badge can never drift from the section it summarizes. `warn` tone is
   carried by color only when a section holds a real blocker. */
type NavBadge = { count: number; tone?: "warn" };
const NAV_BADGES: Record<string, NavBadge> = {
  "/hub/crm": { count: derived.newLeads }, // leads in "New" stage
  "/hub/cash-offer": { count: sellerLeads.length }, // active cash-offer opportunities
  "/hub/listing-launch": {
    count: derived.listingLaunches, // launches still in flight
    tone: derived.launchesBlocked > 0 ? "warn" : undefined,
  },
  "/hub/buyer-agreements": { count: derived.agreementsAwaitingSignature }, // awaiting e-sign
  "/hub/transactions": { count: derived.openTransactions }, // open deals
};

/** Real brokerage owner (principal broker) — the signed-in operator. */
const OWNER_NAME = getAgent(roles.principalBroker)?.name ?? "Jordan Matin";

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
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      {/* Brand block — white M chip + quiet MatinOS wordmark (design treatment:
          the brand mark flips to a bright chip on the charcoal rail). */}
      <div
        className={cn(
          "flex h-14 items-center",
          collapsed ? "justify-center px-0" : "gap-2.5 px-3.5",
        )}
      >
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-cloud shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          <MatinMark className="h-[1.05rem] w-[1.05rem]" theme="dark" />
        </span>
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <span className="block truncate font-sans text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-cloud">
              MatinOS
            </span>
            <span className="block truncate text-[0.62rem] font-medium tracking-wide text-[#6c6c74]">
              Brokerage OS
            </span>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav
        aria-label="Primary"
        className={cn("flex-1 overflow-y-auto py-3", collapsed ? "px-2" : "px-2.5")}
      >
        <ul className="space-y-px">
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
        <div className={cn("my-3 border-t border-white/[0.06]", collapsed ? "mx-1" : "mx-2")} />

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

      {/* Bottom block — design's Ask-Matin pill (preserves openAi) over the
          signed-in operator identity (real principal broker). */}
      <div className={cn("border-t border-white/[0.06]", collapsed ? "p-2" : "p-3")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5">
            <button
              type="button"
              onClick={() => openAi("Working on: Matin Brokerage OS")}
              title="Ask Matin"
              aria-label="Ask Matin"
              className="btn-accent flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <MatinMark theme="white" className="h-4 w-4" />
            </button>
            <Avatar
              name={OWNER_NAME}
              slug={roles.principalBroker}
              size={30}
              className="rounded-full ring-1 ring-white/10"
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAi("Working on: Matin Brokerage OS")}
              className="btn-accent flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left"
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white/[0.16]">
                <MatinMark theme="white" className="h-3 w-3" />
              </span>
              <span className="text-[0.8rem] font-semibold text-[#eaf6ee]">
                Ask Matin
              </span>
            </button>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar
                name={OWNER_NAME}
                slug={roles.principalBroker}
                size={30}
                className="rounded-full ring-1 ring-white/10"
              />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[0.74rem] font-semibold text-cloud">
                  {OWNER_NAME}
                </div>
                <div className="truncate text-[0.62rem] text-[#6c6c74]">
                  Principal Broker · West Linn
                </div>
              </div>
            </div>
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
  const badge = NAV_BADGES[item.href];
  const showBadge = Boolean(badge && badge.count > 0);

  if (collapsed) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={onNavigate}
          title={item.label}
          aria-current={active ? "page" : undefined}
          className={cn(
            "group relative flex items-center justify-center rounded-lg py-2 transition-colors",
            active
              ? "bg-[rgba(47,138,96,0.15)] text-[#86d2a4]"
              : "text-slate-300/70 hover:bg-cloud/[0.06] hover:text-cloud",
          )}
        >
          {active ? (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold-bright"
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
          "group relative flex items-center gap-2.5 rounded-lg px-3 py-[0.46rem] text-[0.78rem] font-medium transition-colors",
          active
            ? "bg-[rgba(47,138,96,0.15)] text-[#86d2a4]"
            : cn(
                "hover:bg-cloud/[0.06] hover:text-cloud",
                deemphasized ? "text-slate-300/50" : "text-slate-300/75",
              ),
        )}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gold-bright"
          />
        ) : null}
        <Icon
          className={cn(
            "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors",
            active ? "text-[#86d2a4]" : "text-slate-300/45 group-hover:text-cloud",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {showBadge ? (
          <span
            className={cn(
              "shrink-0 tabular-nums text-[0.62rem] font-semibold",
              active
                ? "text-[#86d2a4]"
                : badge!.tone === "warn"
                  ? "text-warn"
                  : "text-slate-300/45",
            )}
          >
            {badge!.count}
          </span>
        ) : null}
      </Link>
    </li>
  );
}
