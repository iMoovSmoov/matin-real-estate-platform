"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — premium micro-interaction helpers (local to /hub)

   Two tiny, dependency-free utilities the page composes so a control NEVER
   changes something off-screen with no visible feedback (MANDATE 1):

     • prefersReducedMotion()  — single source of truth for the OS setting; all
       motion below is gated on it (the global `scroll-behavior: smooth` and the
       `motion-safe:` Tailwind utilities also respect it, but JS scroll calls
       must check it explicitly).
     • smoothScrollTo(el)      — scrollIntoView({behavior, block:"start"}) that
       degrades to "auto" under reduced-motion; null-safe.
     • useViewFade()           — returns a `key`-able token + a `bump()` that
       briefly flips an `entering` flag so a view swap can play a short
       fade/slide-in (motion-safe only). Used when a tab / filter changes the
       rendered content so the user SEES the result change.

   Kept in the page's own folder per file-ownership; shared os/* is untouched.
   ────────────────────────────────────────────────────────────────────────── */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Smooth-scroll an element to the top of the viewport region; reduced-motion safe. */
export function smoothScrollTo(el: HTMLElement | null, block: ScrollLogicalPosition = "start") {
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block,
  });
}

/**
 * Brief enter-transition token for view swaps. Call `bump()` whenever the
 * rendered content changes (tab switch, filter change); spread `fadeProps`
 * onto the swapped container. `entering` is true for one short frame window so
 * a `motion-safe:` fade/translate plays, then settles. No-op when the user
 * prefers reduced motion.
 */
export function useViewFade(durationMs = 260) {
  const [token, setToken] = useState(0);
  const [entering, setEntering] = useState(false);
  const timer = useRef<number | null>(null);

  const bump = useCallback(() => {
    if (prefersReducedMotion()) {
      setToken((t) => t + 1);
      return;
    }
    setEntering(true);
    setToken((t) => t + 1);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setEntering(false), durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return { token, entering, bump };
}
