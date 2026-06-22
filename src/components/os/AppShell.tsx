"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/command/CommandPalette";
import { SidebarNav, BOTTOM_TABS, isActive } from "./SidebarNav";
import { TopCommandBar } from "./TopCommandBar";
import { AiSidecarProvider } from "./AISidecar";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AppShell  (ref §1.3)

   The command-center spine, built ONCE and reused on every /hub route:
     • dark charcoal SidebarNav (desktop, collapsible icon rail)
     • mobile slide-in drawer + bottom tab bar (new labels)
     • sticky TopCommandBar (page H1 + search ⌘K + Create + Ask AI + bell)
     • docked dark AISidecar (Ask AI), managed via AiSidecarProvider context
     • the existing CommandPalette (⌘K) is preserved end-to-end

   Workspace canvas is --color-paper at a wide dense max-width.
   ────────────────────────────────────────────────────────────────────────── */

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { setOpen: setPaletteOpen } = useCommandPalette();

  const openPalette = useCallback(() => setPaletteOpen(true), [setPaletteOpen]);

  // ⌘K / Ctrl-K opens the command palette (preserve existing wiring).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-full bg-paper">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "relative hidden h-full shrink-0 flex-col bg-ink-900 transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-[280px]",
        )}
      >
        {/* Collapse toggle — pinned to the brand-block hairline at the rail's
            right edge (centered on the 64px brand-block divider), so it never
            overlaps the MATIN / Brokerage OS wordmark at any width. */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-8 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-mist bg-cloud text-slate shadow-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
        <SidebarNav pathname={pathname} collapsed={collapsed} />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[55] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[82vw] bg-ink-900 shadow-lift">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute right-2 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <TopCommandBar
          pathname={pathname}
          onOpenPalette={openPalette}
          onOpenMobileNav={() => setMobileOpen(true)}
        />

        {/* Back-to-website strip */}
        <div className="flex shrink-0 items-center border-b border-mist bg-paper px-4 py-1.5 md:px-6">
          <Link
            href="/"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[0.72rem] font-medium text-slate transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to website
          </Link>
        </div>

        {/* Workspace canvas — wide & dense for operator surfaces. Warm,
            faintly dotted workspace texture (replaces flat bg-paper; the
            utility bg-paper would otherwise win over the component layer). */}
        <main className="workspace-texture flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ───────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-mist bg-cloud shadow-[0_-1px_0_0_rgba(20,20,22,0.06)] lg:hidden"
      >
        {BOTTOM_TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.58rem] font-semibold uppercase tracking-wider transition-colors",
                active ? "text-ink" : "text-slate hover:text-ink",
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-ink" : "text-slate")} />
              {label}
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-ink" />
              ) : null}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="More navigation"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[0.58rem] font-semibold uppercase tracking-wider text-slate transition-colors hover:text-ink"
        >
          <Menu className="h-5 w-5 text-slate" />
          More
        </button>
      </nav>

      {/* Command palette — mounted once, toggled via context */}
      <CommandPalette />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <AiSidecarProvider>
        <ShellInner>{children}</ShellInner>
      </AiSidecarProvider>
    </CommandPaletteProvider>
  );
}
