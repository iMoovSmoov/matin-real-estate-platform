"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Reports — ViewTransition  (local micro-interaction helper, owned by this
   folder per the file-ownership rule)

   A tasteful, PREMIUM content swap: when the dataset tab or metric toggle
   changes, the affected surface re-mounts under a fresh React key and plays a
   short fade-up. Motion is gated on Tailwind's `motion-safe:` variant so it
   fully respects prefers-reduced-motion (reduced-motion users get an instant,
   static swap — no transform, no opacity animation).

   The keyframe is defined in a scoped <style> here (we can't touch the shared
   globals.css), and the wrapping <div> only references it under `motion-safe:`.

   Usage:
     <ViewTransition swapKey={dataset}>…surface…</ViewTransition>

   The `swapKey` change is what re-triggers the animation (React remounts the
   subtree). Keep swaps subtle — this is an operator workspace, not a marketing
   page (no shimmer / no sparkles, per the anti-slop rules).
   ────────────────────────────────────────────────────────────────────────── */

export function ViewTransition({
  swapKey,
  children,
  className,
}: {
  /** Changing this value remounts + replays the fade-up. */
  swapKey: string | number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <style>{`
        @keyframes matinReportSwap {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
      <div
        key={swapKey}
        className={cn(
          // Reduced-motion: no animation at all (instant swap). Motion-safe: a
          // short, calm fade + 6px rise — premium, not gimmicky.
          "motion-safe:[animation:matinReportSwap_300ms_ease-out_both]",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
