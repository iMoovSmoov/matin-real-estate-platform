"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Building2,
  Route,
  FileText,
  Palette,
  Bell,
  ScrollText,
  ShieldCheck,
  BrainCircuit,
} from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { settingsCategories, type CategoryKey } from "./adminData";
import { RoutingView, AlertsAutomationGrid } from "./RoutingView";
import {
  UsersView,
  TeamsView,
  TemplatesView,
  BrandKitView,
  AiPolicyView,
  NotificationsView,
  AuditView,
} from "./AdminViews";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin Settings workspace (§2.12 · S12 tickets 8 & 11)

   Category settings sidebar → content. The active category can be CONTROLLED
   by the parent (the settings page wires KPI onDrill to switch it — S12 #8) or
   left uncontrolled. Mobile (S12 #11): the sidebar collapses to a horizontally
   scrollable pill row < lg. AI presence is the Matin mark (no Sparkles).
   ────────────────────────────────────────────────────────────────────────── */

const CATEGORY_ICON: Record<CategoryKey, typeof Users> = {
  users: Users,
  teams: Building2,
  routing: Route,
  templates: FileText,
  brand: Palette,
  "ai-policies": BrainCircuit,
  notifications: Bell,
  audit: ScrollText,
};

export function AdminWorkspace({
  active: controlled,
  onActiveChange,
}: {
  active?: CategoryKey;
  onActiveChange?: (key: CategoryKey) => void;
} = {}) {
  const [internal, setInternal] = useState<CategoryKey>("routing");
  const active = controlled ?? internal;

  // Below the split breakpoint the content pane sits beneath the category pill
  // row; switching categories should smooth-scroll the freshly-swapped content
  // into view so the tap produces a visible result instead of an off-screen
  // change (R1) — whether the change came from a pill click OR a KPI drilldown
  // on the page (which sets `active` via the controlled prop). An effect that
  // watches `active` covers both paths; we skip the initial mount. Honors
  // prefers-reduced-motion and only fires below the xl split.
  const contentRef = useRef<HTMLDivElement>(null);
  const prevActive = useRef<CategoryKey | null>(null);

  useEffect(() => {
    if (prevActive.current === null) {
      prevActive.current = active;
      return; // don't scroll on first render
    }
    if (prevActive.current === active) return;
    prevActive.current = active;
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (!window.matchMedia("(max-width: 1279px)").matches) return; // only below the xl split
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [active]);

  function setActive(key: CategoryKey) {
    if (onActiveChange) onActiveChange(key);
    else setInternal(key);
  }

  const content = useMemo(() => {
    switch (active) {
      case "users":
        return <UsersView />;
      case "teams":
        return <TeamsView />;
      case "routing":
        return <RoutingView />;
      case "templates":
        return <TemplatesView />;
      case "brand":
        return <BrandKitView />;
      case "ai-policies":
        return <AiPolicyView />;
      case "notifications":
        return <NotificationsView alertsGrid={<AlertsAutomationGrid />} />;
      case "audit":
        return <AuditView />;
      default:
        return <RoutingView />;
    }
  }, [active]);

  return (
    // Split the category rail beside content only at xl. At the 1024–1279 band
    // the 280px app sidebar plus a 224px settings rail would leave the content
    // pane too narrow (a 6-column routing table would overflow), so below xl the
    // categories collapse to the scrollable pill row and content takes the full
    // width.
    <div className="grid gap-6 xl:grid-cols-[224px_1fr]">
      {/* Mobile category pill row (R1/R6) — horizontally scrollable < xl */}
      <nav
        aria-label="Settings categories (mobile)"
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:hidden"
      >
        {settingsCategories.map((c) => {
          const Icon = CATEGORY_ICON[c.key];
          const isActive = c.key === active;
          const isAi = c.key === "ai-policies";
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setActive(c.key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[0.82rem] font-medium transition-colors",
                isActive
                  ? "border-ink bg-ink text-cloud"
                  : "border-mist bg-cloud text-slate hover:text-ink",
              )}
            >
              {isAi ? (
                <MatinMark theme={isActive ? "white" : "dark"} className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {c.label}
              {c.count != null ? (
                <span
                  className={cn(
                    "tabular-nums text-[0.7rem] font-semibold",
                    isActive ? "text-cloud/70" : "text-slate/60",
                  )}
                >
                  {c.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Desktop category settings sidebar (xl+) */}
      <nav
        aria-label="Settings categories"
        className="hidden xl:sticky xl:top-4 xl:block xl:self-start"
      >
        <p className="eyebrow mb-2 px-2 text-slate">Settings</p>
        <ul className="space-y-0.5">
          {settingsCategories.map((c) => {
            const Icon = CATEGORY_ICON[c.key];
            const isActive = c.key === active;
            const isAi = c.key === "ai-policies";
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => setActive(c.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    isActive ? "bg-ink text-cloud" : "text-slate hover:bg-paper-200 hover:text-ink",
                  )}
                >
                  {isAi ? (
                    <MatinMark theme={isActive ? "white" : "dark"} className="h-4 w-4 shrink-0" />
                  ) : (
                    <Icon className="h-4 w-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.84rem] font-medium">{c.label}</span>
                    <span
                      className={cn(
                        "block truncate text-[0.7rem]",
                        isActive ? "text-slate-300" : "text-slate/70",
                      )}
                    >
                      {c.desc}
                    </span>
                  </span>
                  {c.count != null ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[0.66rem] font-semibold tabular-nums",
                        isActive ? "bg-cloud/15 text-cloud" : "bg-paper-200 text-slate",
                      )}
                    >
                      {c.count}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-lg border border-mist bg-cloud p-3">
          <p className="flex items-center gap-1.5 text-[0.72rem] font-medium text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Compliance mode on
          </p>
          <p className="mt-1 text-[0.7rem] leading-snug text-slate">
            Dangerous changes require a confirm dialog and audit note.
          </p>
        </div>
      </nav>

      {/* Content area — scroll-target on mobile + cross-fade on category swap. */}
      <div ref={contentRef} className="min-w-0 scroll-mt-20">
        <div key={active} className="motion-safe:animate-fade">
          {content}
        </div>
      </div>
    </div>
  );
}
