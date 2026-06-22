/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Agent remap shim (G-A task 3)

   The local demo data was seeded with FOUR fabricated staff members that do
   NOT appear on the live Matin roster and have NO headshot on disk:

       ava-brooks · evan-carter · marcus-lee · nina-patel

   Every avatar that referenced them rendered gray initials. This module maps
   each fabricated slug to a REAL Matin agent who has a verified headshot, with
   the mapping chosen to preserve each fake's *function* (so a fake Listing
   Coordinator becomes the real Listing Coordinator, etc.). The mapping is
   deterministic and stable: the same fake always becomes the same real face,
   so the codemod that bakes these into the JSON data files is reproducible.

   The codemod in scripts/ has already rewritten every data file + adminData.ts
   so that no fabricated slug or name survives at rest. `remapAgent()` remains
   exported as a defensive runtime guard for any consumer that might still
   receive a legacy slug (e.g. an external sync, a cached record, a test
   fixture) — it is a no-op for the 40 real slugs.
   ────────────────────────────────────────────────────────────────────────── */

/** The four fabricated slugs purged everywhere (live scrape: localOnlyNotOnLiveSite). */
export const FABRICATED_AGENT_SLUGS = [
  "ava-brooks",
  "evan-carter",
  "marcus-lee",
  "nina-patel",
] as const;

export type FabricatedAgentSlug = (typeof FABRICATED_AGENT_SLUGS)[number];

/**
 * Deterministic fake-slug → real-slug map. Every target slug exists in
 * agents.json and has a confirmed /matin/agents/<slug>.jpg headshot. The
 * function of each fake is preserved:
 *   - ava-brooks  (buyer-team broker)        → chase-bright    (real buyer-focused OR broker)
 *   - marcus-lee  (Listing Coordinator)      → sierra-palmeri  (real Listing Coordinator — Sierra Seggerman)
 *   - evan-carter (Transaction Coordinator)  → paris-vollstedt (real Transaction Coordinator)
 *   - nina-patel  (Marketing Director/lead)  → kimberly-ilosvay (real OR broker serving as marketing lead)
 */
export const AGENT_REMAP: Record<FabricatedAgentSlug, string> = {
  "ava-brooks": "chase-bright",
  "marcus-lee": "sierra-palmeri",
  "evan-carter": "paris-vollstedt",
  "nina-patel": "kimberly-ilosvay",
};

/** Display-name remap (for any record that stored the fabricated name, not the slug). */
export const AGENT_NAME_REMAP: Record<string, string> = {
  "Ava Brooks": "Chase Bright",
  "Marcus Lee": "Sierra Seggerman",
  "Evan Carter": "Paris Vollstedt",
  "Nina Patel": "Kimberly Ilosvay",
};

/**
 * Resolve a possibly-fabricated agent slug to a real one.
 * No-op for the 40 real slugs (and for any unknown slug).
 */
export function remapAgent(slug: string): string {
  return (AGENT_REMAP as Record<string, string>)[slug] ?? slug;
}

/** Resolve a possibly-fabricated display name to a real one. No-op otherwise. */
export function remapAgentName(name: string): string {
  return AGENT_NAME_REMAP[name] ?? name;
}

/** True when the slug is one of the four purged fabricated staff. */
export function isFabricatedAgent(slug: string): slug is FabricatedAgentSlug {
  return (FABRICATED_AGENT_SLUGS as readonly string[]).includes(slug);
}
