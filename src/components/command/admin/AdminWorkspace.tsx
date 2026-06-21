"use client";

import { useMemo, useState } from "react";
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
   MatinOS — Admin Settings workspace (§2.12)

   Category settings sidebar → content. Each item switches the content pane via
   local state. AI presence is the Matin mark (no Sparkles). Composes the
   section view components; reuses ONLY @/components/os primitives inside them.
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

export function AdminWorkspace() {
  const [active, setActive] = useState<CategoryKey>("routing");

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
    <div className="grid gap-6 lg:grid-cols-[224px_1fr]">
      {/* Category settings sidebar */}
      <nav aria-label="Settings categories" className="lg:sticky lg:top-4 lg:self-start">
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

      {/* Content area */}
      <div className="min-w-0">{content}</div>
    </div>
  );
}
