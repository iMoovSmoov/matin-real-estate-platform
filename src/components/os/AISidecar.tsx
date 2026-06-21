"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Sparkles, X, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — AISidecar  (ref §1.8)

   AI is a DOCKED dark sidecar beside the real record — never a separate page
   and never a floating chatbot bubble. Visual law: AI/system surfaces are DARK
   (ink-800/-900, light text) docked beside the LIGHT workspace.

   This module ships:
     • AiSidecarProvider — shell-level context that owns open state + the
       binding `Context:` line for the current surface.
     • useAiSidecar()    — pages call openAi("Context: …") to dock the panel to
       the record they are viewing (lead, listing, deal …).
     • AISidecar         — the dark panel itself (header + context line + chat
       scroll + proposed-action affordance + composer). Gold is sanctioned here
       because the whole surface is an AI affordance.

   The panel is presentational scaffolding for the shell; section pages pass
   richer evidence-backed AIActionCards into it next phase. Esc + backdrop
   close; body scroll locked while open.
   ────────────────────────────────────────────────────────────────────────── */

const DEFAULT_CONTEXT = "Context: Matin Brokerage OS";

type AiSidecarValue = {
  open: boolean;
  context: string;
  openAi: (context?: string) => void;
  closeAi: () => void;
  setContext: (context: string) => void;
};

const AiSidecarContext = createContext<AiSidecarValue>({
  open: false,
  context: DEFAULT_CONTEXT,
  openAi: () => {},
  closeAi: () => {},
  setContext: () => {},
});

export function useAiSidecar() {
  return useContext(AiSidecarContext);
}

export function AiSidecarProvider({
  children,
  defaultContext = DEFAULT_CONTEXT,
}: {
  children: ReactNode;
  defaultContext?: string;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(defaultContext);

  const openAi = useCallback(
    (next?: string) => {
      if (next) setContext(next);
      setOpen(true);
    },
    [],
  );
  const closeAi = useCallback(() => setOpen(false), []);

  const value = useMemo<AiSidecarValue>(
    () => ({ open, context, openAi, closeAi, setContext }),
    [open, context, openAi, closeAi],
  );

  return (
    <AiSidecarContext.Provider value={value}>
      {children}
      <AISidecar />
    </AiSidecarContext.Provider>
  );
}

/* ── The dark docked panel ───────────────────────────────────────────────── */

type Turn = { role: "ai" | "user"; text: ReactNode };

const PRIMER: Turn[] = [
  {
    role: "ai",
    text:
      "I'm bound to whatever you're looking at — a lead, a listing, a deal. Ask me to summarize, draft a reply, or surface risk, and I'll propose actions you approve before anything runs.",
  },
];

export function AISidecar() {
  const { open, context, closeAi } = useAiSidecar();
  const [turns] = useState<Turn[]>(PRIMER);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAi();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeAi]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Matin AI"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Matin AI"
        onClick={closeAi}
        className="absolute inset-0 bg-ink/40"
      />

      {/* Dark panel — figure/ground against the light workspace */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-ink-900 text-slate-300 shadow-lift">
        {/* Header — gold accent rail signals an AI surface */}
        <div className="flex items-start justify-between gap-3 border-b border-ink-700 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-inset ring-gold/30">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h2 className="font-sans text-[0.95rem] font-semibold text-cloud">Matin AI</h2>
            </div>
            <p className="mt-2 truncate font-mono text-[0.72rem] leading-none text-gold/90">
              {context}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAi}
            aria-label="Close"
            className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-ink-700 hover:text-cloud"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chat scroll */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {turns.map((t, i) =>
            t.role === "ai" ? (
              <div
                key={i}
                className="rounded-xl rounded-tl-sm bg-ink-800 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-slate-300 ring-1 ring-inset ring-ink-700"
              >
                {t.text}
              </div>
            ) : (
              <div
                key={i}
                className="ml-8 rounded-xl rounded-tr-sm bg-ink-700 px-3.5 py-2.5 text-[0.82rem] leading-relaxed text-cloud"
              >
                {t.text}
              </div>
            ),
          )}

          {/* Proposed-actions affordance — pages dock real AIActionCards here */}
          <div className="rounded-xl border border-dashed border-ink-700 px-3.5 py-3">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-300/60">
              Proposed actions
            </p>
            <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-300/80">
              Open a lead, listing, or deal and Matin AI will propose evidence-backed
              actions here — each with citations and an approve / edit / reject gate.
            </p>
          </div>
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDraft("");
          }}
          className="shrink-0 border-t border-ink-700 px-4 py-3"
        >
          <div className="flex items-end gap-2 rounded-xl bg-ink-800 px-3 py-2 ring-1 ring-inset ring-ink-700 focus-within:ring-gold/40">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about this record…"
              className="max-h-28 flex-1 resize-none bg-transparent text-[0.84rem] leading-relaxed text-cloud outline-none placeholder:text-slate-300/45"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!draft.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold text-ink transition-opacity hover:bg-gold-bright disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[0.66rem] leading-none text-slate-300/50">
            Drafts only — nothing sends or overwrites without your approval.
          </p>
        </form>
      </div>
    </div>
  );
}
