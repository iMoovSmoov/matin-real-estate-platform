import type { ReactNode } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — KpiCard / KpiStrip / SegmentedKpis   (ref §1.4)

   The most reused atom. Two valid renders:
     (A) Separate tiles — KpiCard in a KpiStrip row (default section KPI rows)
     (B) Segmented single card — SegmentedKpis (tight financial strips)

   Color-as-data (§1.1): a money/positive value gets valueTone="success" (green
   number, no badge); a cost/at-risk value gets valueTone="danger". Delta caption
   supports two-value breakdowns ("Yes 28 · No 6"), not just %.

   Every tile drills down to its source records (onDrill) — a KPI with no
   drilldown is a §3 anti-slop violation, so onDrill makes the whole tile a
   button when provided. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type DeltaTone = "up" | "down" | "flat";
export type ValueTone = "ink" | "success" | "danger";

const VALUE_TONE: Record<ValueTone, string> = {
  ink: "text-ink",
  success: "text-success",
  danger: "text-danger",
};

function DeltaCaption({ delta, tone }: { delta: ReactNode; tone: DeltaTone }) {
  const color =
    tone === "up" ? "text-success" : tone === "down" ? "text-danger" : "text-slate";
  const Icon = tone === "up" ? ArrowUp : tone === "down" ? ArrowDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[0.72rem] font-medium leading-none tabular-nums",
        color,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {delta}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  deltaTone = "flat",
  icon,
  valueTone = "ink",
  hint,
  onDrill,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  icon?: ReactNode;
  valueTone?: ValueTone;
  hint?: ReactNode;
  onDrill?: () => void;
  className?: string;
}) {
  const interactive = typeof onDrill === "function";
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.74rem] font-medium leading-none text-slate">{label}</p>
        {/* R4: hide the icon chip on the smallest screens to tighten tiles. */}
        {icon ? (
          <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-paper-200 text-slate ring-1 ring-inset ring-mist sm:flex">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <span
          className={cn(
            "font-sans text-[1.9rem] font-bold leading-none tabular-nums",
            VALUE_TONE[valueTone],
          )}
        >
          {value}
        </span>
        {delta != null ? <span className="mb-1"><DeltaCaption delta={delta} tone={deltaTone} /></span> : null}
      </div>
      {hint != null ? (
        <p className="mt-1.5 text-[0.72rem] leading-tight text-slate">{hint}</p>
      ) : null}
    </>
  );

  // R4: tighter padding on phone, full padding from sm up.
  const base =
    "rounded-2xl border border-mist bg-cloud p-4 text-left shadow-soft sm:p-5";

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onDrill}
        className={cn(
          base,
          "group transition-colors hover:border-ink/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
          className,
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={cn(base, className)}>{body}</div>;
}

/* Large-screen column counts → literal Tailwind classes (no dynamic interp so
   the JIT keeps them). Phone is always 2-up, sm always 3-up (R4: never orphan
   a tile at 2-up regardless of N). */
const LG_COLS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/**
 * Row wrapper for separate KPI tiles. Backward-compatible: with no props it
 * keeps the prior `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6`
 * behavior.
 *
 * R4 responsive controls (all optional):
 * - `cols`: how many tiles per row at `lg+` (3–6, default keeps legacy 4/6).
 * - `rail`: on phone, render a horizontal scroll-snap RAIL instead of a 2-up
 *   grid — ideal for 5–6 tiles that would otherwise orphan/cramp; tiles get a
 *   min-width and snap. Reverts to the grid at `sm+`.
 */
export function KpiStrip({
  children,
  className,
  cols,
  rail = false,
}: {
  children: ReactNode;
  className?: string;
  cols?: 3 | 4 | 5 | 6;
  rail?: boolean;
}) {
  // Large-screen track: explicit `cols` wins; otherwise the legacy 4→6 ramp.
  const lgTrack = cols ? LG_COLS[cols] : "lg:grid-cols-4 xl:grid-cols-6";

  if (rail) {
    return (
      <div
        className={cn(
          // Phone: horizontal scroll-snap rail (R4/R6). sm+: equal-column grid.
          "-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "sm:mx-0 sm:grid sm:snap-none sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-3",
          lgTrack,
          // Direct children become fixed-width snap items on phone, auto in grid.
          "[&>*]:min-w-[44vw] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:min-w-0 sm:[&>*]:shrink",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3",
        lgTrack,
        className,
      )}
    >
      {children}
    </div>
  );
}

export type SegmentItem = {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: ValueTone;
};

/** Variant B: ONE bordered card divided into N cells by thin vertical rules
    (Lofty/Fello/SkySlope). Use for tight financial strips. Revenue cell green. */
export function SegmentedKpis({
  items,
  className,
}: {
  items: SegmentItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid divide-y divide-mist overflow-hidden rounded-2xl border border-mist bg-cloud shadow-soft sm:divide-x sm:divide-y-0",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((it, i) => (
        <div key={i} className="px-5 py-4">
          <p className="text-[0.74rem] font-medium leading-none text-slate">{it.label}</p>
          <p
            className={cn(
              "mt-2 font-sans text-[1.7rem] font-bold leading-none tabular-nums",
              VALUE_TONE[it.tone ?? "ink"],
            )}
          >
            {it.value}
          </p>
          {it.sub != null ? (
            <p className="mt-1.5 text-[0.72rem] leading-tight text-slate">{it.sub}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
