import type { ReactNode } from "react";
import { TriangleAlert, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — CalloutCard   (ref §1.8)

   Standalone DARK block (ink-800 / ink-900, light text) for AI/system
   commentary that lives beside the light workspace — "AI overnight summary",
   "AI Risk Note", system notices. Light cards = data; dark cards = AI/system.

   tone leading glyph:
     ai     — Matin "M" mark (white on dark badge)  e.g. "AI overnight summary"
     risk   — TriangleAlert (danger)                e.g. "AI Risk Note"
     system — Activity (info/slate)                 e.g. "Automation notice"

   AI brand presence is the real Matin mark, not a cheesy icon. Title in
   font-display (light). Body text-slate-300. Optional action slot at the
   bottom-right (a suggested action — every callout should end with one).
   Server-safe.
   ────────────────────────────────────────────────────────────────────────── */

export type CalloutTone = "ai" | "risk" | "system";

const ICON_TONE: Record<CalloutTone, string> = {
  ai: "bg-gold/15 text-gold ring-gold/30",
  risk: "bg-danger/15 text-danger ring-danger/30",
  system: "bg-ink-700 text-slate-300 ring-ink-600",
};

/** The leading glyph per tone. AI = the real Matin mark on its dark badge. */
function CalloutGlyph({ tone }: { tone: CalloutTone }) {
  if (tone === "ai") return <MatinMark theme="white" className="h-4 w-4" />;
  if (tone === "risk") return <TriangleAlert className="h-4 w-4" aria-hidden />;
  return <Activity className="h-4 w-4" aria-hidden />;
}

export function CalloutCard({
  tone = "ai",
  title,
  children,
  action,
  className,
}: {
  tone?: CalloutTone;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-700 bg-ink-800 p-5 text-slate-300 shadow-soft",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            ICON_TONE[tone],
          )}
        >
          <CalloutGlyph tone={tone} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[1.02rem] font-normal leading-tight text-cloud">
            {title}
          </h3>
          <div className="mt-2 text-[0.84rem] leading-relaxed text-slate-300">
            {children}
          </div>
          {action != null ? (
            <div className="mt-3.5 flex items-center justify-end">{action}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
