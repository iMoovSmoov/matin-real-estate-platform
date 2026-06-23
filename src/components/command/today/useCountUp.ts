"use client";

import { useEffect, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — count-up hook (image-led redesign, §6 motion)

   Animates a number from 0 → target once on mount (cubic ease-out), so the
   hero figure, KPI values, and the goal-pace radial "settle" on load. The
   value is REAL — only the reveal is animated. Honors prefers-reduced-motion
   (collapses the duration so the final value lands on the first frame). SSR-safe:
   the server snapshot and the first client render both start at 0, and every
   state update happens inside a requestAnimationFrame callback (never
   synchronously in the effect body), so there is no hydration mismatch and no
   cascading-render lint violation.
   ────────────────────────────────────────────────────────────────────────── */

export function useCountUp(target: number, duration = 850): number {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(target)) return;

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dur = reduce || duration <= 0 ? 0 : duration;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setVal(t >= 1 ? target : target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}
