"use client";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — scrollElementIntoView (local motion helper)

   The global `scroll-behavior: smooth` is unconditional, so this helper gates
   smooth scrolling on `prefers-reduced-motion` and falls back to an instant
   jump — honoring the build mandate ("respect prefers-reduced-motion"). Used
   when a control updates content that lives below the fold on a stacked layout
   (e.g. selecting an automation whose detail renders below the list on phone).
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

/** Scroll an element by id into view on the next frame (after a state update). */
export function scrollIdIntoView(id: string, block: ScrollLogicalPosition = "start") {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() =>
    scrollElementIntoView(document.getElementById(id), block),
  );
}
