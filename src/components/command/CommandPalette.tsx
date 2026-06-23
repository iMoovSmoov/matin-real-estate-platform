"use client";

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Users,
  HandCoins,
  FileSignature,
  Handshake,
  FileText,
  Building2,
  Megaphone,
  GraduationCap,
  BarChart3,
  Activity,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { leads, agents } from "@/lib/data";

// ─── Context ────────────────────────────────────────────────────────────────

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: false,
  setOpen: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

// ─── Pages data ─────────────────────────────────────────────────────────────

type IconComponent = React.ComponentType<{ className?: string }>;

interface ResultItem {
  id: string;
  href: string;
  label: string;
  subtitle?: string;
  badge?: string;
  icon: IconComponent;
  group: "Pages" | "Leads" | "Listings" | "Agents";
}

const PAGES: Omit<ResultItem, "id" | "group">[] = [
  { label: "Today",                href: "/hub",                  icon: LayoutDashboard },
  { label: "CRM & Leads",          href: "/hub/crm",              icon: Users },
  { label: "Seller / Cash Offers", href: "/hub/cash-offer",       icon: HandCoins },
  { label: "Listing Launch",       href: "/hub/listing-launch",   icon: Building2 },
  { label: "Buyer Agreements",     href: "/hub/buyer-agreements", icon: FileSignature },
  { label: "Transactions",         href: "/hub/transactions",     icon: Handshake },
  { label: "Forms & Docs",         href: "/hub/forms",            icon: FileText },
  { label: "Marketing Studio",     href: "/hub/marketing",        icon: Megaphone },
  { label: "Coaching",             href: "/hub/coaching",         icon: GraduationCap },
  { label: "Reports",              href: "/hub/reporting",        icon: BarChart3 },
  { label: "Systems Health",       href: "/hub/systems-health",   icon: Activity },
  { label: "Admin",                href: "/hub/settings",         icon: SlidersHorizontal },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 80) return "Hot";
  if (score >= 55) return "Warm";
  return "Cool";
}

function matchesQuery(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

function buildResults(query: string): { group: string; items: ResultItem[] }[] {
  const q = query.trim();

  // Pages — always shown when empty; filtered when query present
  const pageResults: ResultItem[] = (
    q === ""
      ? PAGES
      : PAGES.filter((p) => matchesQuery(p.label, q))
  ).map((p, i) => ({ ...p, id: `page-${i}`, group: "Pages" as const }));

  // Leads — only shown when there's a query
  const leadResults: ResultItem[] = q === "" ? [] : leads
    .filter((l) => matchesQuery(l.name, q) || matchesQuery(l.email, q))
    .slice(0, 5)
    .map((l) => ({
      id: `lead-${l.id}`,
      href: `/hub/crm?lead=${l.id}`,
      label: l.name,
      subtitle: l.email,
      badge: scoreLabel(l.score),
      icon: Users,
      group: "Leads" as const,
    }));

  // Agents — only shown when there's a query
  const agentResults: ResultItem[] = q === "" ? [] : agents
    .filter((a) => matchesQuery(a.name, q))
    .slice(0, 3)
    .map((a) => ({
      id: `agent-${a.id}`,
      href: `/hub/crm?agent=${a.slug}`,
      label: a.name,
      subtitle: a.title,
      icon: User,
      group: "Agents" as const,
    }));

  const groups: { group: string; items: ResultItem[] }[] = [];
  if (pageResults.length)  groups.push({ group: "Pages",  items: pageResults });
  if (leadResults.length)  groups.push({ group: "Leads",  items: leadResults });
  if (agentResults.length) groups.push({ group: "Agents", items: agentResults });
  return groups;
}

// ─── Result row ──────────────────────────────────────────────────────────────

function ResultRow({
  item,
  highlighted,
  onClose,
}: {
  item: ResultItem;
  highlighted: boolean;
  onClose: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition-colors",
        highlighted ? "bg-paper" : "hover:bg-paper",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate/60" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{item.label}</div>
        {item.subtitle && (
          <div className="truncate text-xs text-slate">{item.subtitle}</div>
        )}
      </div>
      {item.badge && (
        <span className="shrink-0 rounded bg-ink/[0.06] px-1.5 py-0.5 text-xs text-slate">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Main palette ─────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const groups = buildResults(query);
  // Flat list for keyboard nav
  const flatItems: ResultItem[] = groups.flatMap((g) => g.items);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlightedIndex(0);
  }, [setOpen]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Use rAF to ensure the element is mounted before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[highlightedIndex];
        if (item) {
          router.push(item.href);
          close();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, flatItems, highlightedIndex, close, router]);

  if (!open) return null;

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        aria-hidden
        onClick={close}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center border-b border-ink/[0.08]">
          <Search className="ml-5 h-4 w-4 shrink-0 text-slate/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, leads, agents…"
            className="w-full px-3 py-4 text-lg text-ink outline-none placeholder:text-slate/50"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mr-3 flex h-6 w-6 items-center justify-center rounded-md text-slate/40 hover:bg-ink/[0.06] hover:text-slate"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto divide-y divide-ink/[0.04]">
          {groups.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate/50">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {groups.map(({ group, items }) => (
            <div key={group}>
              <div className="sticky top-0 bg-white/95 px-5 py-1.5 text-[0.6rem] font-bold uppercase tracking-widest text-slate/40 backdrop-blur-sm">
                {group}
              </div>
              <div className="divide-y divide-ink/[0.04]">
                {items.map((item) => {
                  const idx = cursor++;
                  return (
                    <ResultRow
                      key={item.id}
                      item={item}
                      highlighted={idx === highlightedIndex}
                      onClose={close}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-ink/[0.06] bg-paper/60 px-5 py-2">
          <span className="text-[0.65rem] text-slate/40">
            <kbd className="rounded border border-ink/[0.10] bg-white px-1 py-0.5 font-mono text-[0.6rem]">↑↓</kbd>
            {" "}navigate
          </span>
          <span className="text-[0.65rem] text-slate/40">
            <kbd className="rounded border border-ink/[0.10] bg-white px-1 py-0.5 font-mono text-[0.6rem]">↵</kbd>
            {" "}open
          </span>
          <span className="text-[0.65rem] text-slate/40">
            <kbd className="rounded border border-ink/[0.10] bg-white px-1 py-0.5 font-mono text-[0.6rem]">esc</kbd>
            {" "}close
          </span>
        </div>
      </div>
    </div>
  );
}
