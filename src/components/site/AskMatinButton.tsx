"use client";

import { cn } from "@/lib/utils";
import { openAskMatin } from "./ask-matin-bus";

/**
 * The "Ask Matin" concierge CTA — the design's signature green→brass gradient
 * pill with a small Fraunces "M" chip. Faithful to the mockup's hero button:
 *   linear-gradient(135deg,#0c3a2b,#1f6b4a,#2f8a60,#c9a24b)
 *   + 0 8px 22px rgba(31,107,74,.4) glow + inset top highlight + hover sheen.
 * That treatment lives in the shared `.btn-accent` utility (globals.css), so
 * this component just adds layout + the M chip and wires the click to open the
 * floating <AskMatin /> concierge. Reuse anywhere a page wants the CTA.
 */
export function AskMatinButton({
  className,
  label = "Ask Matin",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={openAskMatin}
      aria-label="Open the Matin AI concierge"
      className={cn(
        "btn-accent inline-flex items-center gap-2 rounded-[9px] px-4 py-2.5",
        "text-[0.82rem] font-semibold leading-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright/70 focus-visible:ring-offset-2",
        className,
      )}
    >
      <span
        aria-hidden
        className="font-display inline-flex h-[17px] w-[17px] items-center justify-center rounded-[5px] bg-white/20 text-[11px] leading-none"
      >
        M
      </span>
      {label}
    </button>
  );
}
