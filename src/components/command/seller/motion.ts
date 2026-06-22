/* ──────────────────────────────────────────────────────────────────────────
   Seller / Cash Offers — tiny motion helpers (local to this folder)

   Premium micro-interactions that RESPECT prefers-reduced-motion. The build
   reference + mandate require: smooth-scroll the affected section into view on
   a filter/view change, gated on a reduced-motion check (never animate for a
   user who asked the OS not to). These are intentionally small and dependency-
   free so the workspace stays lean; JSX transitions use `motion-safe:` utility
   classes in the components themselves.
   ────────────────────────────────────────────────────────────────────────── */

/** True when the user has asked the OS to minimize motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smooth-scroll an element (by id) into view so a filter/view change produces a
 * VISIBLE result. Falls back to an instant jump when reduced motion is on. Runs
 * after a frame so a just-swapped section is mounted before we scroll to it.
 */
export function scrollToId(id: string, block: ScrollLogicalPosition = "start") {
  if (typeof document === "undefined") return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior, block });
  });
}

/**
 * Smooth-scroll a specific element into view (when an id isn't available, e.g.
 * a ref to a streaming AI result). Reduced-motion aware.
 */
export function scrollToEl(
  el: HTMLElement | null | undefined,
  block: ScrollLogicalPosition = "nearest",
) {
  if (!el) return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  requestAnimationFrame(() => el.scrollIntoView({ behavior, block }));
}
