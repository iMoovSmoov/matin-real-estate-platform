"use client";

import { type ReactNode } from "react";
import {
  Users,
  Mic,
  Share2,
  Wallet,
  ShieldCheck,
  Loader2,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { leads, sellerLeads } from "@/lib/data";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — GenerationControls  (pane 3, ref §2.8 / wireframe 11)

   A guardrailed generation form. Audience · Tone · Channels · Budget · Approval
   — ending in a WIDE INK "Generate full campaign" (primary human action = ink;
   gold is reserved for AI). AI presence = the real Matin mark, not Sparkles.

   Every control is REAL: multi-select chips toggle page-owned state; approvers
   can be marked approved (turns the chip green, gates the generate copy). The
   est-reach number recomputes live from the selected audiences. Client.
   ────────────────────────────────────────────────────────────────────────── */

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
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

export const AUDIENCES = [
  "Seller database",
  "Lake Oswego buyers",
  "Past clients",
  "Saved-search matches",
];
export const TONES = ["Luxury", "Direct", "Local", "Warm"];
export const GEN_CHANNELS = ["Email", "Instagram", "Facebook", "Google retargeting"];

/* Reach grounded in real CRM rows where a segment maps to recorded data, scaled
   to a plausible database size (the demo CRM holds a sample of the full book). */
const SELLER_BASE = Math.max(1, sellerLeads.length) * 90;
const PAST_CLIENT_BASE =
  Math.max(1, leads.filter((l) => /past client/i.test(l.source ?? "")).length) * 90;
const LO_BUYER_BASE =
  Math.max(1, leads.filter((l) => /lake oswego/i.test(l.community ?? "")).length) * 90 + 320;
const SAVED_SEARCH_BASE =
  Math.max(1, leads.filter((l) => (l.propertyViews?.length ?? 0) > 0).length) * 24;

const AUDIENCE_REACH: Record<string, number> = {
  "Seller database": SELLER_BASE,
  "Lake Oswego buyers": LO_BUYER_BASE,
  "Past clients": PAST_CLIENT_BASE,
  "Saved-search matches": SAVED_SEARCH_BASE,
};

export type Approver = { slug: string; name: string; role: string; approved: boolean };

export function GenerationControls({
  state,
  onToggle,
  approvers,
  onToggleApprover,
  generating,
  onGenerate,
}: {
  state: GenControlsState;
  onToggle: (group: keyof GenControlsState, value: string) => void;
  approvers: Approver[];
  onToggleApprover: (slug: string) => void;
  generating: boolean;
  onGenerate: () => void;
}) {
  const reach = state.audiences.reduce((s, a) => s + (AUDIENCE_REACH[a] ?? 0), 0);
  const allApproved = approvers.every((a) => a.approved);
  const pendingCount = approvers.filter((a) => !a.approved).length;

  return (
    <div className="flex flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-4">
        <h2 className="font-display text-[1.02rem] font-normal leading-tight text-ink">
          Generation controls
        </h2>
        <span className="tabular-nums text-[0.72rem] text-slate">
          Est. reach {reach.toLocaleString("en-US")}
        </span>
      </div>

      <Section icon={Users} title="Audience" hint="Targets the copy + merge fields">
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
          {GEN_CHANNELS.map((c) => (
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
            <p className="tabular-nums text-[0.78rem] font-semibold text-ink">
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

      <Section
        icon={ShieldCheck}
        title="Approval"
        hint={allApproved ? "All clear" : `${pendingCount} pending`}
      >
        <div className="flex flex-col gap-1.5">
          {approvers.map((a) => (
            <button
              key={a.slug}
              type="button"
              onClick={() => onToggleApprover(a.slug)}
              aria-pressed={a.approved}
              className="flex items-center justify-between gap-2 rounded-lg border border-mist bg-paper px-3 py-2 text-left transition-colors hover:border-ink/20"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Avatar name={a.name} slug={a.slug} size={24} ring />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-[0.78rem] text-ink">{a.name}</span>
                  <span className="block truncate text-[0.68rem] text-slate">{a.role}</span>
                </span>
              </span>
              {a.approved ? (
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.7rem] font-medium text-success">
                  <Check className="h-3 w-3" aria-hidden />
                  Approved
                </span>
              ) : (
                <span className="shrink-0 text-[0.7rem] font-medium text-warn">
                  Tap to approve
                </span>
              )}
            </button>
          ))}
        </div>
      </Section>

      {/* Generate — wide ink primary; AI presence is the Matin mark */}
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
              <MatinMark theme="white" className="h-4 w-4" />
              Generate full campaign
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[0.7rem] leading-snug text-slate">
          {allApproved
            ? "Approvers cleared — drafts can route to send after this generate."
            : "AI drafts every channel from this brief. Drafts route to the approvers above — nothing sends automatically."}
        </p>
      </div>
    </div>
  );
}
