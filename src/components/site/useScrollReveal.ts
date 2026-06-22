"use client";

/**
 * Small client-side helpers for the public marketing site's interactive
 * surfaces. Kept inside src/components/site so site components can share
 * premium, reduced-motion-aware scroll + feedback behavior without touching
 * shared infra (src/lib, src/components/os).
 */

/** True when the user has asked the OS to minimize non-essential motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smoothly bring an element into view after a state change (e.g. a generated
 * result, a freshly filtered list). On narrow screens the affected section is
 * often far below the control that triggered it, so this makes the result
 * VISIBLE. Respects prefers-reduced-motion by jumping instantly instead.
 *
 * @param el        target element (or null — safely no-ops)
 * @param opts.block scroll alignment, default "start"
 * @param opts.onlyBelowLg when true, only scroll on screens narrower than the
 *        lg breakpoint (1024px) where the result would otherwise be off-screen.
 */
export function scrollIntoViewSafe(
  el: HTMLElement | null,
  opts: { block?: ScrollLogicalPosition; onlyBelowLg?: boolean } = {},
): void {
  if (!el || typeof window === "undefined") return;

  const { block = "start", onlyBelowLg = false } = opts;
  if (onlyBelowLg && window.matchMedia("(min-width: 1024px)").matches) return;

  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";

  // Defer to the next frame so layout/content has rendered before we measure.
  requestAnimationFrame(() => {
    try {
      el.scrollIntoView({ behavior, block, inline: "nearest" });
    } catch {
      el.scrollIntoView();
    }
  });
}
