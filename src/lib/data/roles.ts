/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Real role-slots (G-A task 2)

   The section scripts previously hardcoded invented coordinator/marketing
   staff (the four fabricated slugs purged in agent-remap.ts). This module is
   the SINGLE source of truth for "who fills each operational role" — every slug
   here is a REAL Matin
   agent (verified on the live /agents roster, with a headshot on disk and a
   real published title/license). Sections import role slugs from here instead
   of hardcoding names.

   Role assignments (grounded in real live-site titles):
     - principalBroker        jordan-matin     (Owner · OR Principal / WA Managing Broker)
     - leadership             jordan-matin, alicia-smith (OR Principal + WA Managing brokers)
     - listingCoordinators    sierra-palmeri   (Sierra Seggerman — real "Listing Coordinator")
     - transactionCoordinators paris-vollstedt  (real "Transaction Coordinator")
     - marketingLead          kimberly-ilosvay (real OR broker serving as marketing lead)
   ────────────────────────────────────────────────────────────────────────── */

export interface RoleSlots {
  /** Brokerage owner / principal broker (final compliance + AI approval). */
  principalBroker: string;
  /** Leadership roster — broker-review, coaching, escalation defaults. */
  leadership: string[];
  /** Real listing-side coordinators (Listing Launch / Forms listing packets). */
  listingCoordinators: string[];
  /** Real transaction coordinators (Transactions / Forms closing packets). */
  transactionCoordinators: string[];
  /** Real marketing lead (Marketing Studio campaign owner / approvals). */
  marketingLead: string;
}

export const roles: RoleSlots = {
  principalBroker: "jordan-matin",
  leadership: ["jordan-matin", "alicia-smith"],
  listingCoordinators: ["sierra-palmeri"],
  transactionCoordinators: ["paris-vollstedt"],
  marketingLead: "kimberly-ilosvay",
};

/** Convenience: the single default listing coordinator slug. */
export const defaultListingCoordinator = roles.listingCoordinators[0];
/** Convenience: the single default transaction coordinator slug. */
export const defaultTransactionCoordinator = roles.transactionCoordinators[0];

/** True when a slug is a leadership/broker-review approver. */
export function isLeadership(slug: string): boolean {
  return roles.leadership.includes(slug);
}
