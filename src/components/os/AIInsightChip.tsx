import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AIInsightChip   (ref §1.8)

   Pale-gold pill (gold-soft / gold-ink) with a leading icon (default Sparkles)
   for plain-English AI-derived facts — Fello "Has 6.5% ARM, expires 2yr" style.
   Gold is sanctioned here because the chip IS an AI affordance. Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export function AIInsightChip({
  children,
  icon,
  className,
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-2.5 py-1 text-[0.76rem] font-medium leading-none text-gold-ink ring-1 ring-inset ring-gold/25",
        className,
      )}
    >
      <span className="shrink-0 text-gold-ink/80" aria-hidden>
        {icon ?? <Sparkles className="h-3.5 w-3.5" />}
      </span>
      {children}
    </span>
  );
}
