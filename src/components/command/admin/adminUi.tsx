"use client";

import {
  useCallback,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { agents } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Admin section shared UI + helpers (section-scoped)

   Small atoms (ink/ghost buttons, toggle, field) plus two domain helpers the
   Admin views reuse:
     • slugForName()    — resolve a person's display name → real agent slug so
                          <Avatar> can load the real headshot (used for audit-log
                          actor names; initials fallback for "System").
     • useInlineAi()    — drives ONE streamAi() call into local state so AI
                          helpers stream INLINE (never the global sidecar).
   ────────────────────────────────────────────────────────────────────────── */

/* ── name → agent slug (real headshots) ────────────────────────────────────── */

const NAME_TO_SLUG: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const a of agents) map[a.name.toLowerCase()] = a.slug;
  return map;
})();

/** Resolve a display name to a real agent slug, or undefined (→ initials). */
export function slugForName(name: string): string | undefined {
  return NAME_TO_SLUG[name.trim().toLowerCase()];
}

/* ── Inline AI streaming hook (NEVER opens the global sidecar) ─────────────── */

export type InlineAiState = {
  running: boolean;
  result: string;
  done: boolean;
  error: boolean;
};

const IDLE: InlineAiState = { running: false, result: "", done: false, error: false };

/** Stream a single AI tool/message into local state, rendered inline by the
 *  caller (AIActionCard.result, a dark callout body, etc.). */
export function useInlineAi() {
  const [state, setState] = useState<InlineAiState>(IDLE);

  const run = useCallback(
    async (req: {
      tool: string;
      input?: Record<string, unknown>;
      messages?: { role: "user" | "assistant"; content: string }[];
    }) => {
      setState({ running: true, result: "", done: false, error: false });
      try {
        await streamAi(req, (_chunk, full) => {
          setState((s) => ({ ...s, result: full }));
        });
        setState((s) => ({ ...s, running: false, done: true }));
      } catch {
        setState({
          running: false,
          result: "Matin AI is unavailable right now. Please try again in a moment.",
          done: true,
          error: true,
        });
      }
    },
    [],
  );

  const reset = useCallback(() => setState(IDLE), []);

  return { state, run, reset };
}

/* ── Button atoms (human action = ink; gold is reserved for AI) ────────────── */

export function InkButton({
  children,
  onClick,
  icon,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = "default",
  ariaLabel,
  active = false,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "default" | "danger";
  ariaLabel?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border bg-cloud px-2.5 py-1.5 text-[0.78rem] font-medium transition-colors",
        active
          ? "border-ink/25 bg-paper text-ink"
          : tone === "danger"
            ? "border-mist text-danger hover:border-danger/30 hover:bg-danger/[0.05]"
            : "border-mist text-slate hover:bg-paper hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Small on/off switch (ink when on) for the alerts/automation grids. */
export function MiniToggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25",
        on ? "bg-ink" : "bg-mist",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-0.5 h-4 w-4 rounded-full bg-cloud shadow-sm transition-transform",
          on ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[0.78rem] font-semibold text-ink">{label}</span>
        {hint ? <span className="text-[0.72rem] text-slate">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

/** Styled text input / select wrappers used across the Admin form drawers. */
export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-mist bg-paper px-3 py-2 text-[0.86rem] text-ink placeholder:text-slate/60 focus:border-ink/30 focus:bg-cloud focus:outline-none",
        props.className,
      )}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-mist bg-paper px-3 py-2 text-[0.86rem] text-ink focus:border-ink/30 focus:bg-cloud focus:outline-none",
        props.className,
      )}
    />
  );
}
