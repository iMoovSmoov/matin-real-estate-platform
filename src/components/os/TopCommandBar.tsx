"use client";

import { type ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import { NAV_ITEMS } from "./SidebarNav";
import { Avatar } from "./Avatar";

/* MatinOS command bar, matched to the Claude beta shell:
   title · search/ask command · date · user avatar. Page-specific create and AI
   actions live inside workspaces, not in the global chrome. */

/** Derive the page title from the deepest matching nav route. */
export function titleFromPath(pathname: string): string {
  let best: { len: number; label: string } | null = null;
  for (const item of NAV_ITEMS) {
    const match =
      item.href === "/hub"
        ? pathname === "/hub"
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (match && (!best || item.href.length > best.len)) {
      best = { len: item.href.length, label: item.label };
    }
  }
  return best?.label ?? "MatinOS";
}

export function TopCommandBar({
  pathname,
  title,
  onOpenPalette,
  onOpenMobileNav,
}: {
  pathname: string;
  title?: ReactNode;
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  const heading = title ?? titleFromPath(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-ink/10 bg-cloud/70 px-4 shadow-[0_1px_0_rgba(20,20,15,.03)] backdrop-blur-xl md:px-[22px]">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="min-w-0 truncate text-[0.84rem] font-semibold leading-none text-ink">
        {heading}
      </h1>

      <div className="ml-auto flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search or ask Matin"
          className="hidden min-w-[340px] max-w-[340px] items-center gap-2 rounded-[9px] border border-ink/10 bg-cloud px-3 py-[7px] text-[0.82rem] text-slate shadow-[0_1px_2px_rgba(20,20,15,.03)] transition-colors hover:text-ink lg:inline-flex"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
          <span className="min-w-0 flex-1 text-left">Search or ask Matin…</span>
          <kbd className="rounded-[5px] border border-ink/10 px-1.5 py-px text-[0.68rem] font-semibold text-slate">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate transition-colors hover:bg-paper-200 hover:text-ink lg:hidden"
        >
          <Search className="h-[1.05rem] w-[1.05rem]" />
        </button>

        <span className="hidden text-[0.76rem] tabular-nums text-slate sm:inline">
          Tue, Jun 23
        </span>
        <Avatar name="Jordan Matin" slug="jordan-matin" size={31} className="rounded-lg" />
      </div>
    </header>
  );
}
