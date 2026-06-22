"use client";

import { useCallback, useRef } from "react";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching · scroll-into-view micro-interaction helper

   Small, folder-local helper (allowed by the file-ownership rule) used to give
   filter/selection changes a VISIBLE result on narrow screens: after a control
   swaps the content, smooth-scroll the affected section into view so the user
   SEES the change instead of it happening off-screen below a tall list.

   Respects prefers-reduced-motion (falls back to an instant jump). Returns a
   ref to attach to the target element + a `scrollTo` callback to fire after the
   state change (wrap in requestAnimationFrame so the DOM has painted first).
   ────────────────────────────────────────────────────────────────────────── */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns `[ref, scrollIntoView]`. Attach `ref` to the section you want brought
 * into view; call `scrollIntoView()` right after the state update that should be
 * surfaced. By default it only scrolls below the split breakpoint (where panes
 * stack and the result would otherwise be off-screen); at/above the split the
 * multi-pane grid keeps it visible so the scroll is skipped.
 *
 * `splitMaxWidth` is the max viewport width (px) at which panes are still
 * stacked — i.e. one less than the grid's split breakpoint. Defaults to 1279
 * (the `xl` split, since the app's 280px sidebar pushes 3-pane splits to xl).
 * Pass `{ always: true }` to scroll at every width.
 */
export function useScrollIntoView<T extends HTMLElement = HTMLDivElement>(
  splitMaxWidth = 1279,
) {
  const ref = useRef<T | null>(null);

  const scrollIntoView = useCallback(
    (opts?: { always?: boolean; block?: ScrollLogicalPosition }) => {
      if (typeof window === "undefined" || !window.matchMedia) return;
      // While stacked, the swapped content is off-screen — that's when surfacing
      // it matters. At/above the split the grid keeps it in view, so skip unless
      // the caller forces it.
      const belowSplit = window.matchMedia(`(max-width: ${splitMaxWidth}px)`).matches;
      if (!opts?.always && !belowSplit) return;

      requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: opts?.block ?? "start",
        });
      });
    },
    [splitMaxWidth],
  );

  return [ref, scrollIntoView] as const;
}
