"use client";

/* ──────────────────────────────────────────────────────────────────────────
   Forms & Docs — local interaction helpers (R1/R2 micro-interactions)

   Every packet/document selection + filter must produce a VISIBLE result:
   smooth-scroll the affected pane into view, with reduced-motion respected.
   Kept inside the forms folder per file ownership.
   ────────────────────────────────────────────────────────────────────────── */

/** True when the user asked the OS to minimise motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A scroll target: a node, an element id, or a getter resolved post-render. */
type ScrollTarget =
  | HTMLElement
  | string
  | null
  | undefined
  | (() => HTMLElement | null);

/**
 * Smooth-scroll a node (by ref, id, or deferred getter) into view after a
 * content/pane swap. Deferred two frames so the swapped-in pane has laid out
 * first — pass a getter when the node mounts on the same tick. Honors
 * prefers-reduced-motion.
 */
export function scrollIntoView(
  target: ScrollTarget,
  block: ScrollLogicalPosition = "start",
) {
  if (typeof window === "undefined") return;
  const run = () => {
    const el =
      typeof target === "function"
        ? target()
        : typeof target === "string"
          ? document.getElementById(target)
          : target ?? null;
    if (!el) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block,
      inline: "nearest",
    });
  };
  window.requestAnimationFrame(() => window.requestAnimationFrame(run));
}
