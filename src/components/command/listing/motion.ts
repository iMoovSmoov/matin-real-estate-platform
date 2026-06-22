/* ──────────────────────────────────────────────────────────────────────────
   Listing Launch — tiny motion helpers (local to this folder)

   Premium micro-interactions that RESPECT prefers-reduced-motion. The mandate
   requires a VISIBLE result on every view/selection change: smooth-scroll the
   affected pane into view, gated on a reduced-motion check. Dependency-free so
   the workspace stays lean; JSX fade/slide transitions use `motion-safe:`
   utility classes in the components themselves.
   ────────────────────────────────────────────────────────────────────────── */

/** True when the user has asked the OS to minimize motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smooth-scroll an element (by id) into view so a pane/selection change
 * produces a VISIBLE result. Falls back to an instant jump under reduced
 * motion. Runs after a frame so a just-swapped pane is mounted first.
 */
export function scrollToId(id: string, block: ScrollLogicalPosition = "start") {
  if (typeof document === "undefined") return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior, block });
  });
}
