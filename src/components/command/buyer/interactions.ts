"use client";

/* ──────────────────────────────────────────────────────────────────────────
   Buyer Agreements — local interaction helpers (R1/R2 micro-interactions)

   Small, self-contained helpers that give every selection/filter a VISIBLE
   result: smooth-scroll the affected region into view and respect the user's
   reduced-motion preference. Kept inside the buyer folder per file ownership.
   ────────────────────────────────────────────────────────────────────────── */

/** True when the user asked the OS to minimise motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Copy `text` to the clipboard, resolving `true` on success. Falls back to a
 * hidden-textarea + execCommand for non-secure contexts so a "Copy" button is
 * never a dead end.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  if (typeof document === "undefined") return false;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
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
 * content/pane swap. Deferred two frames so the new pane has mounted/laid out
 * first — pass a getter when the node mounts on the same tick. Honors
 * prefers-reduced-motion (jumps instantly instead of animating).
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
  // Two rAFs: one for state→DOM, one for layout, so the scroll lands on the
  // freshly-rendered pane rather than the pre-swap position.
  window.requestAnimationFrame(() => window.requestAnimationFrame(run));
}
