"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { aiActions } from "@/lib/data";
import { MatinMark } from "@/components/brand/Logo";
import {
  CommandPalette,
  CommandPaletteProvider,
  useCommandPalette,
} from "@/components/command/CommandPalette";
import { SidebarNav, BOTTOM_TABS, isActive } from "./SidebarNav";
import { TopCommandBar } from "./TopCommandBar";
import { AiSidecarProvider, useAiSidecar } from "./AISidecar";

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
    queueMicrotask(() => setMobileOpen(false));
  }, [pathname]);

  return (
    <div className="flex h-full bg-paper">
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="relative hidden h-full w-[210px] shrink-0 flex-col bg-ink-900 lg:flex"
      >
        <SidebarNav pathname={pathname} collapsed={false} />
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
          <aside className="absolute inset-y-0 left-0 w-[268px] max-w-[82vw] bg-ink-900 shadow-lift">
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

        {/* Workspace canvas — wide & dense for operator surfaces. Warm,
            faintly dotted workspace texture (replaces flat bg-paper; the
            utility bg-paper would otherwise win over the component layer). */}
        <main className="workspace-texture flex-1 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>

      <AIActionRail />

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

function AIActionRail() {
  const { openAi } = useAiSidecar();
  const actions = aiActions.slice(0, 3);

  return (
    <aside className="surface-ai hidden h-full w-[300px] shrink-0 flex-col overflow-hidden border-l border-white/[0.08] text-slate-300 xl:flex">
      <div className="relative flex items-start justify-between gap-3 border-b border-white/[0.07] px-4 py-4">
        <span aria-hidden className="ai-bloom -left-20 -top-20 opacity-80" />
        <div className="relative flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success text-cloud shadow-[0_0_20px_rgba(31,107,74,.35)]">
            <MatinMark theme="white" className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[0.95rem] font-semibold leading-none text-cloud">Matin AI</h2>
            <p className="mt-1.5 truncate text-[0.66rem] text-slate-400">Context · Today</p>
          </div>
        </div>
        <span className="relative mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-1 text-[0.62rem] font-semibold text-[#7fce9f]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7fce9f]" />
          Live
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Proposed actions · approve to run
        </div>
        <div className="space-y-3">
          {actions.map((a) => (
            <article
              key={a.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.03)]"
            >
              <h3 className="text-[0.83rem] font-semibold leading-snug text-cloud">{a.title}</h3>
              <p className="mt-1 text-[0.63rem] text-slate-500">{a.context}</p>
              <div className="mt-3 flex gap-2 rounded-lg border border-success/20 bg-success/10 px-2.5 py-2">
                <span className="shrink-0 pt-px text-[0.58rem] font-bold uppercase tracking-[0.08em] text-[#7fce9f]">
                  Why
                </span>
                <p className="line-clamp-3 text-[0.72rem] leading-relaxed text-slate-300">
                  {a.evidence}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="rounded-full bg-success/15 px-2 py-1 text-[0.63rem] font-semibold text-[#7fce9f]">
                  {a.confidence} confidence
                </span>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    aria-label={`Edit AI action: ${a.title}`}
                    onClick={() => openAi(a.context, `Edit this proposed action before it runs: ${a.title}\n\nEvidence: ${a.evidence}`)}
                    className="rounded-lg border border-white/[0.14] px-2.5 py-1.5 text-[0.7rem] font-semibold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-cloud"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    aria-label={`Approve AI action: ${a.title}`}
                    onClick={() => openAi(a.context, `Approve and prepare the next safe step for: ${a.title}\n\nUse this evidence: ${a.evidence}`)}
                    className="rounded-lg bg-[linear-gradient(135deg,#1f6b4a,#2f8a60)] px-2.5 py-1.5 text-[0.7rem] font-semibold text-cloud shadow-[0_4px_12px_rgba(31,107,74,.35)]"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <form
        className="border-t border-white/[0.07] p-4"
        onSubmit={(e) => {
          e.preventDefault();
          openAi("Today", "Review today's brokerage priorities and recommend the safest order to work them.");
        }}
      >
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3 text-left text-[0.8rem] text-slate-400 transition-colors hover:border-success/35 hover:text-cloud"
        >
          <MatinMark theme="white" className="h-3.5 w-3.5 opacity-80" />
          <span className="min-w-0 flex-1 truncate">Ask Matin anything...</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-success text-cloud">↑</span>
        </button>
      </form>
    </aside>
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
