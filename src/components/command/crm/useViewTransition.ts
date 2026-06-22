"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   CRM & Leads — premium micro-interaction helpers (local to /hub/crm)

   Mirrors the Today helper so a control NEVER changes something off-screen with
   no visible feedback (MANDATE 1). Dependency-free, reduced-motion aware.

     • prefersReducedMotion() — OS setting; JS scroll calls must check it (the
       global `scroll-behavior: smooth` only covers anchor/programmatic CSS).
     • smoothScrollTo(el)     — scrollIntoView smooth → auto under reduced-motion.
     • useViewFade()          — short fade/slide token for content swaps so a
       KPI drill / saved-view change visibly transitions the list.

   Kept in the page's own folder per file-ownership; shared os/* is untouched.
   ────────────────────────────────────────────────────────────────────────── */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function smoothScrollTo(el: HTMLElement | null, block: ScrollLogicalPosition = "start") {
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block,
  });
}

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
