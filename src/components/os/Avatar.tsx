"use client";

import { useState } from "react";
import { cn, initials } from "@/lib/utils";
import { agentPhoto } from "@/lib/assets";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Avatar

   Round identity token used in CRM rows, drawers, leaderboards, and assignment
   chips. Resolves a real headshot from `src` (explicit) or `slug`
   (→ /matin/agents/<slug>.jpg). When the file is missing — synthetic agents
   such as ava-brooks have no photo — it falls back gracefully to an initials
   token in a neutral circle. No layout shift: the circle is always rendered;
   the <img> overlays it and is hidden on error.
   ────────────────────────────────────────────────────────────────────────── */

export function Avatar({
  name,
  slug,
  src,
  size = 28,
  ring = false,
  className,
}: {
  name: string;
  /** agent slug → /matin/agents/<slug>.jpg (used when `src` is absent) */
  slug?: string;
  /** explicit image path; overrides slug resolution */
  src?: string;
  /** rendered px diameter (default 28) */
  size?: number;
  /** subtle hairline ring around the avatar */
  ring?: boolean;
  className?: string;
}) {
  const resolved = src ?? (slug ? agentPhoto(slug) : undefined);
  const [failed, setFailed] = useState(false);

  // Reset the error flag during render when the source changes (e.g. a row is
  // re-used in a virtualized list) — the official "adjust state on prop change"
  // pattern, no effect / extra repaint.
  const [lastSrc, setLastSrc] = useState(resolved);
  if (resolved !== lastSrc) {
    setLastSrc(resolved);
    setFailed(false);
  }

  const showImg = Boolean(resolved) && !failed;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-paper-200 font-sans font-semibold uppercase text-slate",
        ring && "ring-1 ring-inset ring-mist",
        className,
      )}
      style={{
        width: size,
        height: size,
        // Keep initials readable across sizes (~40% of the diameter).
        fontSize: Math.max(9, Math.round(size * 0.4)),
        lineHeight: 1,
      }}
      aria-label={name}
      title={name}
    >
      {/* Fallback initials always sit underneath the image. */}
      <span aria-hidden={showImg}>{initials(name)}</span>

      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- runtime onError fallback to initials; next/image can't swap on a missing public file
        <img
          src={resolved}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full rounded-full object-cover"
        />
      ) : null}
    </span>
  );
}
