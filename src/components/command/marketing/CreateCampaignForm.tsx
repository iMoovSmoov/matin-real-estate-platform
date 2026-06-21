"use client";

import { type ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { TEMPLATES, type PreviewChannel } from "./marketing-data";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — CreateCampaignForm  (RecordDrawer body)

   The body of the "+ New campaign" form drawer. Label-above-field intake; on
   submit the page appends the new campaign to local state and it appears in the
   table immediately. Every field maps to a Campaign property so the new row is
   a real record (id, name, channel, audience, status: draft). Controlled by the
   page — no internal data state. Client.
   ────────────────────────────────────────────────────────────────────────── */

export type NewCampaignDraft = {
  name: string;
  templateKey: string;
  audience: string;
  channels: PreviewChannel[];
};

const CHANNEL_OPTIONS: PreviewChannel[] = [
  "Email",
  "Social",
  "Flyer",
  "Ad",
  "Web page",
];

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-slate">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[0.7rem] text-slate">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.84rem] text-ink outline-none transition-colors focus:border-ink/40 focus-visible:ring-2 focus-visible:ring-ink/20";

export function CreateCampaignForm({
  draft,
  onChange,
}: {
  draft: NewCampaignDraft;
  onChange: (next: NewCampaignDraft) => void;
}) {
  function toggleChannel(c: PreviewChannel) {
    const set = new Set(draft.channels);
    if (set.has(c)) set.delete(c);
    else set.add(c);
    onChange({ ...draft, channels: Array.from(set) });
  }

  return (
    <div className="space-y-4">
      <p className="text-[0.78rem] leading-snug text-slate">
        Start from an approved template — Matin AI drafts every channel on-brand,
        then routes the kit to your approvers. Nothing sends automatically.
      </p>

      <Field label="Campaign name">
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="e.g. 1248 NW Cedar Hills Launch"
          className={inputCls}
        />
      </Field>

      <Field label="Template" hint="Locks the brand kit + asset set">
        <select
          value={draft.templateKey}
          onChange={(e) => onChange({ ...draft, templateKey: e.target.value })}
          className={inputCls}
        >
          {TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label} · {t.assetCount} assets
            </option>
          ))}
        </select>
      </Field>

      <Field label="Audience">
        <input
          type="text"
          value={draft.audience}
          onChange={(e) => onChange({ ...draft, audience: e.target.value })}
          placeholder="e.g. Beaverton buyer list + matched IDX searches"
          className={inputCls}
        />
      </Field>

      <Field label="Channels">
        <div className="flex flex-wrap gap-1.5">
          {CHANNEL_OPTIONS.map((c) => {
            const active = draft.channels.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleChannel(c)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-medium leading-none transition-colors ${
                  active
                    ? "border-ink bg-ink text-cloud"
                    : "border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink"
                }`}
              >
                {active ? <CircleCheck className="h-3 w-3" aria-hidden /> : null}
                {c}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="rounded-lg border border-mist bg-paper px-3 py-2.5">
        <p className="font-mono text-[0.68rem] leading-relaxed text-slate">
          <span className="font-semibold text-ink">New record writes</span>
          <br />
          campaigns (status: draft) &gt; marketing_assets (AI-drafted) &gt;
          approval_queue
        </p>
      </div>
    </div>
  );
}
