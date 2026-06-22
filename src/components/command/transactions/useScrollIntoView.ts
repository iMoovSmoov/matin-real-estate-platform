"use client";

/* ──────────────────────────────────────────────────────────────────────────
   Transactions — scrollElementIntoView (local motion helper)

   The global `scroll-behavior: smooth` is unconditional, so this helper gates
   smooth scrolling on `prefers-reduced-motion` and falls back to an instant
   jump — honoring the build mandate ("respect prefers-reduced-motion"). Used
   when selecting a deal whose screen renders below the list on a stacked
   (sub-lg) layout, so the tap produces an immediate visible result.
   ────────────────────────────────────────────────────────────────────────── */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Smooth-scroll an element into view, respecting prefers-reduced-motion. */
export function scrollElementIntoView(
  el: HTMLElement | null,
  block: ScrollLogicalPosition = "start",
) {
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block,
  });
}
