/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — real-asset path primitives

   Single source of truth for the demo's real imagery, all served from
   /public/matin/*. Components (Avatar, PropertyThumb, listing cards, drawers)
   resolve photos through these helpers so paths stay consistent and pools can
   grow in one place.

   Pools reflect the files that actually exist on disk:
     • agents      — /matin/agents/<slug>.jpg            (real headshots)
     • exteriors   — /matin/exteriors/exteriors-00..21   (22 files)
     • interiors   — /matin/interiors/interiors-00..15   (16 files)
     • scenics     — /matin/scenics/scenics-00..06       (7 files)

   Missing files are handled at the component layer (onError fallbacks); these
   helpers only build paths.
   ────────────────────────────────────────────────────────────────────────── */

/** Build a zero-padded pool: `${dir}/${dir}-00.jpg` … `${dir}-NN.jpg`. */
function pool(dir: string, count: number): string[] {
  return Array.from(
    { length: count },
    (_, i) => `/matin/${dir}/${dir}-${String(i).padStart(2, "0")}.jpg`,
  );
}

/** Real exterior photography pool (22 files). */
export const EXTERIORS: string[] = pool("exteriors", 22);

/** Real interior photography pool (16 files). */
export const INTERIORS: string[] = pool("interiors", 16);

/** Real scenic / neighborhood pool (7 files). */
export const SCENICS: string[] = pool("scenics", 7);

/**
 * Path to a real agent headshot by slug, e.g. "jordan-matin" →
 * "/matin/agents/jordan-matin.jpg". Synthetic agents have no file on disk —
 * callers (Avatar) fall back to an initials token via onError.
 */
export function agentPhoto(slug: string): string {
  return `/matin/agents/${slug}.jpg`;
}

/**
 * Deterministic listing photo for a given seed index, cycled across the
 * exteriors pool so the same record always renders the same image.
 */
export function listingPhoto(seedIndex: number): string {
  const safe = Number.isFinite(seedIndex) ? Math.abs(Math.trunc(seedIndex)) : 0;
  return EXTERIORS[safe % EXTERIORS.length];
}
