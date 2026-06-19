"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Mobile sticky bottom strip — sits above the bottom nav on mobile,
 * hidden on sm+ where the sidebar widget takes over.
 */
export function BuyStickyCta() {
  return (
    <div className="sm:hidden fixed bottom-[56px] inset-x-0 z-30 bg-white border-t border-ink/[0.08] p-3">
      <Link
        href="/contact"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-[0.9rem] font-semibold text-white transition-colors hover:bg-ink-700 active:scale-[0.98]"
      >
        Ready to find your home? Get pre-approved
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
