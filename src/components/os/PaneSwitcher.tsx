"use client";

import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — PaneSwitcher / usePaneSwitcher   (ref G-D · R1)

   The mobile pattern for any 2-/3-/4-pane operator workspace. Below the split
   breakpoint (default `lg`) a multi-pane DOM dump forces the user to scroll
   past a 47-row table to reach the detail. Instead, sections render a
   SEGMENTED PANE-SWITCHER (e.g. `List · Detail · Actions`) that shows ONE pane
   at a time; the full multi-pane grid renders only at `lg` and up.

   ── Section usage pattern (the contract every section ticket follows) ──
   1. const pane = usePaneSwitcher(["list", "detail", "actions"], "list");
   2. Below lg: render <PaneSwitcher {...pane.switcherProps} /> then show only
      the active pane (gate each pane with `pane.is("detail")` or use the CSS
      helper classes below). Selecting a list row should call
      `pane.go("detail")` so the tap produces an immediate visible result
      (R1/R2) — never update a panel rendered 40 rows down.
   3. At lg and up: ignore `pane` and render the real multi-pane grid
      (`hidden lg:grid lg:grid-cols-[...]`). The switcher itself is hidden at
      lg via `lg:hidden` (built in), so the same JSX is safe to always mount.

   Two ways to gate panes below lg:
     • JS: `{pane.is("detail") && <DetailPane/>}` (best — only mounts active).
     • CSS: wrap each pane in `<div className={pane.paneClass("detail")}>` which
       toggles `hidden`/`block` below lg and always shows at lg+ (use when you
       want all panes to stay mounted, e.g. to preserve scroll/form state).

   Tap targets are ≥ 44px (R5); the strip scrolls horizontally when the labels
   overflow a narrow phone (R6) and never wraps to a broken second line.

   ────────────────────────────────────────────────────────────────────────────
   G-D MOBILE CHECKLIST — every section ticket MUST pass (verify at 360/768/1280)
   ────────────────────────────────────────────────────────────────────────────
   R1  Multi-pane → mobile: split no later than `lg`; below `lg` use this
       PaneSwitcher (ONE pane at a time). Selecting a row jumps to Detail.
   R2  Master-detail on phone = full-width slide-over `RecordDrawer`
       (`w-full` phone / `w-full max-w-[440px]` desktop) with an immediate
       visible result — never a panel rendered 40 rows down.
   R3  Tables with > 3 columns → stacked full-width cards under `lg`
       (DataTable `responsive` prop); the single most important column
       (score / next-best-action / attributed $) stays visible without
       horizontal scroll. Dense table returns at `lg+`.
   R4  KPI strips never orphan a tile at 2-up: `grid-cols-2 sm:grid-cols-3
       lg:grid-cols-N` OR a scroll-snap rail for 5–6 tiles (KpiStrip
       `responsive`). Tighter tile padding on phone; hide icon chip `< sm`.
   R5  Every interactive control ≥ 44px on phone; remove hover-only reveals
       (`opacity-0 group-hover:opacity-100`) — show a persistent affordance;
       `flex-wrap` on every action-bar row.
   R6  Tab strips & filters horizontally scrollable (`overflow-x-auto snap`)
       on phone, never wrap with a broken underline; search inputs not
       fixed-narrow (`w-32`) in flex-wrap headers.
   R7  Drawers/toasts clear the fixed `h-16` mobile tab bar (safe-area bottom
       padding; raise toast z-index above the nav).
   R8  No fixed pixel grids that override responsive intent
       (inline `gridTemplateColumns: repeat(N, …)`, hard 3-col grids with no
       breakpoint) — use real responsive Tailwind classes.
   ────────────────────────────────────────────────────────────────────────── */

export type Pane = {
  /** Stable key used for switching + CSS helpers. */
  key: string;
  /** Visible label in the segmented control. */
  label: ReactNode;
  /** Optional count badge (e.g. row count for the List pane). */
  count?: number;
  /** Optional leading glyph. */
  icon?: ReactNode;
};

export type PaneSwitcherController = {
  /** The currently active pane key. */
  active: string;
  /** Switch to a pane key (no-op if it isn't in the list). */
  go: (key: string) => void;
  /** True when `key` is the active pane. */
  is: (key: string) => boolean;
  /** The list of panes (pass-through for convenience). */
  panes: Pane[];
  /**
   * Tailwind class that hides a pane below `lg` unless it's active, and always
   * shows it at `lg` and up — for keeping every pane mounted below the split.
   * Usage: `<div className={paneClass("detail")}>…</div>`.
   */
  paneClass: (key: string) => string;
  /** Spread straight into <PaneSwitcher /> below the split breakpoint. */
  switcherProps: {
    panes: Pane[];
    active: string;
    onChange: (key: string) => void;
  };
};

/**
 * Headless controller for the mobile single-pane pattern. Pass the pane list
 * (objects or bare string keys) and an optional initial key. Returns the active
 * key, `go`/`is` helpers, a `paneClass` CSS helper, and `switcherProps` to
 * spread into <PaneSwitcher/>.
 */
export function usePaneSwitcher(
  panes: Array<Pane | string>,
  initial?: string,
): PaneSwitcherController {
  const normalized: Pane[] = panes.map((p) =>
    typeof p === "string" ? { key: p, label: p } : p,
  );
  const firstKey = normalized[0]?.key ?? "";
  const [active, setActive] = useState<string>(initial ?? firstKey);

  // Serialized key set so `go` only commits to a pane that exists, without a
  // fragile dependency on the (re-created-each-render) `normalized` array.
  const keySet = normalized.map((p) => p.key).join("|");
  const go = useCallback(
    (key: string) => {
      if (keySet.split("|").includes(key)) setActive(key);
    },
    [keySet, setActive],
  );

  const is = (key: string) => key === active;

  const paneClass = (key: string) =>
    key === active ? "block lg:block" : "hidden lg:block";

  return {
    active,
    go,
    is,
    panes: normalized,
    paneClass,
    switcherProps: { panes: normalized, active, onChange: go },
  };
}

/**
 * Segmented control that shows below the split breakpoint (`lg:hidden` baked
 * in). Renders ONE-pane-at-a-time tabs with ≥ 44px touch targets and horizontal
 * scroll when labels overflow. Pair with usePaneSwitcher.
 */
export function PaneSwitcher({
  panes,
  active,
  onChange,
  className,
  ariaLabel = "Switch pane",
}: {
  panes: Pane[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        // R1: only below the split breakpoint; the full grid takes over at lg+
        "lg:hidden",
        // R6: horizontal scroll, never wrap to a broken second line
        "-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "snap-x snap-mandatory",
        "rounded-2xl border border-mist bg-paper-200/70 p-1",
        className,
      )}
    >
      {panes.map((p) => {
        const isActive = p.key === active;
        return (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(p.key)}
            className={cn(
              // R5: ≥ 44px tap target (min-h-11 = 44px)
              "snap-start inline-flex min-h-11 flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 text-[0.82rem] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
              isActive
                ? "bg-cloud text-ink shadow-soft"
                : "text-slate hover:text-ink",
            )}
          >
            {p.icon ? <span className="shrink-0">{p.icon}</span> : null}
            <span>{p.label}</span>
            {typeof p.count === "number" ? (
              <span
                className={cn(
                  "tabular-nums text-[0.72rem] font-semibold",
                  isActive ? "text-slate" : "text-slate/70",
                )}
              >
                {p.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
