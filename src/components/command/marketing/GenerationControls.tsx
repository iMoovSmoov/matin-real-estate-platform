"use client";

import { type ReactNode } from "react";
import {
  Users,
  Mic,
  Share2,
  Wallet,
  ShieldCheck,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — GenerationControls  (pane 3, ref §2.8 / wireframe 11)

   A guardrailed generation form. Five sections — Audience · Tone · Channels ·
   Budget · Approval — ending in a WIDE INK "Generate full campaign" button
   (primary human action = ink; gold is reserved for AI affordances). The AI
   obeys brand + compliance: every section makes the guardrail visible (locked
   budget cap, required approvers) so a generate can't run off-brand or
   over-budget. Multi-select chips toggle local state owned by the page. Client.
   ────────────────────────────────────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Users;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-mist px-5 py-4 last:border-b-0">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-paper-200 text-slate ring-1 ring-inset ring-mist">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <h3 className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-ink">
          {title}
        </h3>
        {hint ? <span className="ml-auto text-[0.7rem] text-slate">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30",
        active
          ? "border-ink bg-ink text-cloud"
          : "border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink",
      )}
    >
      {active ? <Check className="h-3 w-3" aria-hidden /> : null}
      {children}
    </button>
  );
}

export type GenControlsState = {
  audiences: string[];
  tones: string[];
  channels: string[];
};

const AUDIENCES = [
  "Seller database",
  "Lake Oswego buyers",
  "Past clients",
  "Saved-search matches",
];
const TONES = ["Luxury", "Direct", "Local", "Warm"];
const CHANNELS = ["Email", "Instagram", "Facebook", "Google retargeting"];

export function GenerationControls({
  state,
  onToggle,
  generating,
  onGenerate,
}: {
  state: GenControlsState;
  onToggle: (group: keyof GenControlsState, value: string) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  const reach =
    (state.audiences.includes("Seller database") ? 1286 : 0) +
    (state.audiences.includes("Lake Oswego buyers") ? 410 : 0) +
    (state.audiences.includes("Past clients") ? 540 : 0) +
    (state.audiences.includes("Saved-search matches") ? 288 : 0);

  return (
    <div className="flex flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Generation controls
        </h2>
        <span className="text-[0.72rem] text-slate tabular-nums">
          Est. reach {reach.toLocaleString("en-US")}
        </span>
      </div>

      <Section icon={Users} title="Audience" hint="Targets the kit copy + merge fields">
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => (
            <ToggleChip
              key={a}
              active={state.audiences.includes(a)}
              onClick={() => onToggle("audiences", a)}
            >
              {a}
            </ToggleChip>
          ))}
        </div>
      </Section>

      <Section icon={Mic} title="Tone" hint="Brand voice presets">
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <ToggleChip
              key={t}
              active={state.tones.includes(t)}
              onClick={() => onToggle("tones", t)}
            >
              {t}
            </ToggleChip>
          ))}
        </div>
      </Section>

      <Section icon={Share2} title="Channels">
        <div className="flex flex-wrap gap-1.5">
          {CHANNELS.map((c) => (
            <ToggleChip
              key={c}
              active={state.channels.includes(c)}
              onClick={() => onToggle("channels", c)}
            >
              {c}
            </ToggleChip>
          ))}
        </div>
      </Section>

      <Section icon={Wallet} title="Budget" hint="Approved campaign cap">
        <div className="flex items-center justify-between rounded-lg border border-mist bg-paper px-3 py-2.5">
          <div className="leading-tight">
            <p className="text-[0.78rem] font-semibold text-ink tabular-nums">
              $3,500 <span className="font-normal text-slate">/ campaign cap</span>
            </p>
            <p className="text-[0.7rem] text-slate">Locked by broker · paid channels only</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.7rem] font-medium text-ink ring-1 ring-inset ring-ink/[0.12]">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Capped
          </span>
        </div>
      </Section>

      <Section icon={ShieldCheck} title="Approval" hint="Required before any send">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between rounded-lg border border-mist bg-paper px-3 py-2">
            <span className="text-[0.78rem] text-ink">Broker — Jordan Matin</span>
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-warn">
              Pending
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-mist bg-paper px-3 py-2">
            <span className="text-[0.78rem] text-ink">Listing agent — Ava Brooks</span>
            <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-warn">
              Pending
            </span>
          </div>
        </div>
      </Section>

      {/* Generate — wide ink primary */}
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-3 text-[0.86rem] font-semibold text-cloud transition-colors hover:bg-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating full campaign…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-gold" aria-hidden />
              Generate full campaign
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[0.7rem] leading-snug text-slate">
          AI drafts every channel from this brief. Drafts route to the approvers above —
          nothing sends automatically.
        </p>
      </div>
    </div>
  );
}
