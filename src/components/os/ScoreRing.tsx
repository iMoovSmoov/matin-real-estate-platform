import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — ScoreRing   (ref §1.8)

   0–100 circular score ring: gold arc on a neutral track, centered tabular
   number. Used for AI lead/seller-intent priority. Gold here is sanctioned —
   it is an AI score visualization. Pure SVG, server-safe, no animation.
   ────────────────────────────────────────────────────────────────────────── */

export function ScoreRing({
  value,
  size = 56,
  label,
  className,
}: {
  value: number;
  size?: number;
  label?: string;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = Math.max(4, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  const num = Math.round(size * 0.32);

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-1", className)}
      role="img"
      aria-label={`${label ? `${label}: ` : ""}${Math.round(v)} of 100`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          {/* neutral track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-mist)"
            strokeWidth={stroke}
          />
          {/* gold arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-gold-bright)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-sans font-semibold leading-none text-ink tabular-nums"
          style={{ fontSize: num }}
        >
          {Math.round(v)}
        </span>
      </div>
      {label ? (
        <span className="text-[0.66rem] font-medium uppercase tracking-[0.14em] text-slate">
          {label}
        </span>
      ) : null}
    </div>
  );
}
