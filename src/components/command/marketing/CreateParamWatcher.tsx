"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ──────────────────────────────────────────────────────────────────────────
   CreateParamWatcher — deep-link bridge for the shared "+ Create" command-bar
   menu. The bar links to /hub/marketing?create=campaign; this renders nothing
   but reads that `create` param on mount and, when it matches `value`, fires
   `onMatch` exactly once (a ref guards against re-firing) to open the section's
   existing create drawer. It then strips the param with router.replace so a
   refresh or Back doesn't pop the drawer open again.

   Lives in its own client component so the page can wrap it in a <Suspense>
   boundary — required for useSearchParams on a statically prerendered route.
   ────────────────────────────────────────────────────────────────────────── */
export function CreateParamWatcher({
  value,
  onMatch,
}: {
  /** The `create` param value this section answers to (e.g. "campaign"). */
  value: string;
  /** Opens the section's existing create drawer/form. */
  onMatch: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    if (searchParams.get("create") === value) {
      firedRef.current = true;
      onMatch();
      // Clean the param so a refresh/back doesn't reopen the drawer.
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, value, onMatch, router, pathname]);

  return null;
}
