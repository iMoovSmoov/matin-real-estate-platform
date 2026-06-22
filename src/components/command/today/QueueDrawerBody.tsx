"use client";

import { MapPin, CircleCheck } from "lucide-react";
import { MatinMark } from "@/components/brand/Logo";
import {
  StatusChip,
  Dot,
  ScoreChip,
  Avatar,
  PropertyThumb,
  ActivityTimeline,
  AIActionCard,
  AIInsightChip,
  type ChipTone,
} from "@/components/os";
import type { WorkQueueItem, AIAction, WorkflowRun } from "@/lib/types";
import { CATEGORY_TONE } from "./workQueueMeta";
import { enrich, personSlugFor, activityFor } from "./queueEnrich";
import { brandedDraftFor, BrandedDraftPreview } from "./BrandedDraftPreview";

/* ──────────────────────────────────────────────────────────────────────────
   Today Command Center — RecordDrawer body for a work-queue item

   Renders the FULL real record behind the row:
     • identity header — owner/person avatar OR property photo + facts grid
     • "why this is here" + source provenance (real, not lorem)
     • AI-derived insight chips (gold) when the row is AI-touched
     • a real activity timeline
     • for Failed-Automation rows: the step-by-step run with the failed step
     • Preview vs AI-draft tab: a streaming AIActionCard + inline result

   The page owns interaction state (draft text, running flag, tab); this is the
   presentational body so the page file stays focused on orchestration.
   ────────────────────────────────────────────────────────────────────────── */

export function QueueDrawerBody({
  item,
  tab,
  linkedAction,
  failedRun,
  resolved,
  draft,
  drafting,
  onRunDraft,
  onReject,
  onAskAi,
}: {
  item: WorkQueueItem;
  tab: "preview" | "draft";
  linkedAction?: AIAction;
  failedRun?: WorkflowRun;
  resolved?: boolean;
  draft?: string;
  drafting?: boolean;
  onRunDraft: () => void;
  onReject: () => void;
  onAskAi: () => void;
}) {
  const rec = enrich(item);
  const personSlug = personSlugFor(item);
  const isProperty = rec.thumbSrc != null || rec.thumbSeed != null;
  const activity = activityFor(item, rec);
  const isBrandedDraft = brandedDraftFor(item, linkedAction);

  return (
    <div className="space-y-5">
      {/* ── Identity header ──────────────────────────────────────────────── */}
      {isProperty ? (
        <div className="overflow-hidden rounded-xl border border-mist">
          <PropertyThumb
            src={rec.thumbSrc}
            seedIndex={rec.thumbSeed}
            ratio="wide"
            rounded={false}
            alt={rec.address ?? item.subject}
          />
          <div className="flex items-center justify-between gap-3 bg-cloud px-3.5 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-[0.86rem] font-semibold text-ink">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
                {rec.address ?? item.subject}
              </p>
              {rec.provenance ? (
                <p className="mt-0.5 truncate text-[0.76rem] text-slate">{rec.provenance}</p>
              ) : null}
            </div>
            {rec.score != null ? (
              <ScoreChip score={rec.score} suffix={rec.scoreLabel} className="shrink-0" />
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Avatar
            name={rec.personName ?? rec.ownerName}
            slug={personSlug ?? rec.ownerSlug}
            size={48}
            ring
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] font-semibold text-ink">
              {rec.personName ?? item.subject}
            </p>
            {rec.provenance ? (
              <p className="mt-0.5 truncate text-[0.78rem] text-slate">{rec.provenance}</p>
            ) : null}
          </div>
          {rec.score != null ? (
            <ScoreChip score={rec.score} suffix={rec.scoreLabel} className="shrink-0" />
          ) : null}
        </div>
      )}

      {/* ── Why this is here ─────────────────────────────────────────────── */}
      <div>
        <p className="eyebrow text-slate">Why this is here</p>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink">{item.why}</p>
      </div>

      {/* ── AI insight chips (gold = AI affordance) ──────────────────────── */}
      {linkedAction ? (
        <div className="flex flex-wrap gap-2">
          <AIInsightChip>{linkedAction.confidence} confidence</AIInsightChip>
          <AIInsightChip>{linkedAction.riskTag}</AIInsightChip>
        </div>
      ) : null}

      {/* ── Facts grid ───────────────────────────────────────────────────── */}
      {rec.facts.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-mist bg-paper-200/40 p-3.5">
          {rec.facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[0.68rem] font-medium uppercase tracking-[0.1em] text-slate">
                {f.label}
              </dt>
              <dd className="mt-0.5 truncate text-[0.84rem] font-medium text-ink">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* ── Category chip ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip tone={CATEGORY_TONE[item.category]}>{item.category}</StatusChip>
      </div>

      {/* ── Failed-automation step detail ────────────────────────────────── */}
      {failedRun ? (
        <div className="rounded-xl border border-mist bg-paper-200/50 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow text-slate">Automation: {failedRun.name}</p>
            {resolved ? (
              <StatusChip tone="success">
                <CircleCheck className="h-3 w-3" aria-hidden />
                Resolved
              </StatusChip>
            ) : null}
          </div>
          <p className="mt-1 text-[0.82rem] text-ink">
            {resolved ? (
              <>
                Re-run succeeded ·{" "}
                <span className="font-semibold text-success">all steps green</span>
              </>
            ) : (
              <>
                Failed at{" "}
                <span className="font-semibold text-danger">{failedRun.failedStep}</span> ·
                started {failedRun.startedLabel}
              </>
            )}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {failedRun.steps.map((s, i) => {
              const sTone: ChipTone = resolved
                ? "success"
                : s.status === "succeeded"
                  ? "success"
                  : s.status === "failed"
                    ? "danger"
                    : "info";
              return (
                <li key={i} className="flex items-start gap-2">
                  <Dot tone={sTone} className="mt-1.5" />
                  <span className="min-w-0 flex-1">
                    <span className="text-[0.8rem] font-medium text-ink">{s.name}</span>
                    <span className="block text-[0.74rem] text-slate">
                      {resolved && s.status !== "succeeded"
                        ? "Completed on retry"
                        : s.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* ── Preview: activity timeline · Draft: streaming AI card ─────────── */}
      {linkedAction && tab === "draft" ? (
        <div className="space-y-3">
          <AIActionCard
            title={linkedAction.title}
            riskTag={linkedAction.riskTag}
            evidence={linkedAction.evidence}
            confidence={linkedAction.confidence}
            runLabel={draft ? "Regenerate draft" : "Approve & draft"}
            running={Boolean(drafting)}
            onRun={onRunDraft}
            onEdit={onAskAi}
            onReject={onReject}
            result={
              draft && !isBrandedDraft ? (
                <span>
                  <span className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold/90">
                    <MatinMark theme="white" className="h-3 w-3" />
                    Draft — review before sending
                  </span>
                  {draft}
                </span>
              ) : undefined
            }
          />
          {/* Client-facing drafts render inside the Matin letterhead (G-B/S1.7) */}
          {isBrandedDraft ? (
            <div>
              <p className="eyebrow pb-2 text-slate">Branded preview — what the client receives</p>
              <BrandedDraftPreview item={item} action={linkedAction} draft={draft} />
            </div>
          ) : !draft && !drafting ? (
            <p className="text-[0.8rem] leading-relaxed text-slate">
              Generate an editable draft from the cited evidence above. Nothing sends
              until you approve it.
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <p className="eyebrow text-slate">Activity</p>
          <ActivityTimeline items={activity} className="mt-1" />
        </div>
      )}
    </div>
  );
}
