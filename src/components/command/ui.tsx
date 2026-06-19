import type { ReactNode } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Matin Hub — server-safe primitives (dark / tech / data-dense).
   These are pure presentational components: no state, no client hooks, so
   they can be used in server components and inside client islands alike.
   ────────────────────────────────────────────────────────────────────────── */

/** Glass surface card — the base panel used across the dashboard. */
export function Panel({
  className,
  children,
  glow = false,
  as: Tag = "div",
}: {
  className?: string;
  children: ReactNode;
  glow?: boolean;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={cn(
        "relative rounded-2xl border border-ink/[0.07] bg-white shadow-soft",
        glow && "shadow-lift",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** Panel header: title (+ optional eyebrow / icon) and a right-aligned action slot. */
export function PanelHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-ink/[0.08] px-5 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-ink ring-1 ring-inset ring-ink/[0.06]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-sans text-[0.95rem] font-semibold tracking-tight text-ink">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-[0.78rem] text-slate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Tiny uppercase section label. */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/80",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Tiny inline tag. */
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "azure" | "success" | "danger" | "warn" | "neutral";
  className?: string;
}) {
  const tones: Record<string, string> = {
    azure: "bg-ink/[0.06] text-ink ring-ink/[0.08]",
    success: "bg-success/12 text-success ring-success/25",
    danger: "bg-danger/12 text-danger ring-danger/25",
    warn: "bg-warn/15 text-warn ring-warn/25",
    neutral: "bg-white text-slate ring-ink/[0.06]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.66rem] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type Delta = { value: string; dir?: "up" | "down" | "flat" };

/** KPI stat tile: label, big value, optional delta + icon, optional sparkline child. */
export function StatTile({
  label,
  value,
  delta,
  icon,
  hint,
  className,
  accent = false,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: Delta;
  icon?: ReactNode;
  hint?: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  const dir = delta?.dir ?? "up";
  const deltaColor =
    dir === "up" ? "text-success" : dir === "down" ? "text-danger" : "text-slate";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-soft transition-colors hover:border-ink/15",
        accent && "bg-white",
        className,
      )}
    >
      {accent && (
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-ink/[0.08] blur-2xl" />
      )}
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[0.72rem] font-medium uppercase tracking-wider text-slate">
          {label}
        </p>
        {icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink ring-1 ring-inset ring-ink/[0.06]">
            {icon}
          </span>
        )}
      </div>
      <div className="relative mt-2 flex items-end gap-2">
        <span className="font-display text-2xl leading-none text-ink tabular-nums">
          {value}
        </span>
        {delta && (
          <span className={cn("mb-0.5 inline-flex items-center gap-0.5 text-[0.74rem] font-semibold tabular-nums", deltaColor)}>
            {dir === "up" ? <ArrowUp className="h-3 w-3" /> : dir === "down" ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="relative mt-1 text-[0.72rem] text-slate/70">{hint}</p>}
    </div>
  );
}

/** A horizontal progress bar (azure fill on dark track). */
export function ProgressBar({
  value,
  className,
  tone = "azure",
}: {
  value: number;
  className?: string;
  tone?: "azure" | "success" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    azure: "bg-ink",
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger",
  };
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-paper", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/** A small live "pulse" dot used to signal real-time / active state. */
export function LiveDot({
  tone = "success",
  className,
}: {
  tone?: "success" | "azure" | "warn" | "danger";
  className?: string;
}) {
  const tones: Record<string, string> = {
    success: "bg-success",
    azure: "bg-ink",
    warn: "bg-warn",
    danger: "bg-danger",
  };
  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span
        className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-70", tones[tone])}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", tones[tone])} />
    </span>
  );
}

/** A pure-SVG sparkline (no deps, server-safe). */
export function Sparkline({
  data,
  className,
  stroke = "#1a1a1a",
  fill = true,
}: {
  data: number[];
  className?: string;
  stroke?: string;
  fill?: boolean;
}) {
  const w = 100;
  const h = 28;
  if (data.length === 0) return <svg className={className} viewBox={`0 0 ${w} ${h}`} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((d, i) => {
    const x = i * step;
    const y = h - ((d - min) / span) * (h - 4) - 2;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Decorative azure glow blob to drop behind hero content. */
export function GlowBlob({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full bg-ink/[0.08] blur-3xl",
        className,
      )}
    />
  );
}
