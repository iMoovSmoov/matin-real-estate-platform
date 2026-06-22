"use client";

import type { ReactNode } from "react";
import {
  RefreshCw,
  KeyRound,
  Loader2,
  CircleCheck,
  Database,
  Activity,
  TriangleAlert,
} from "lucide-react";
import {
  RecordDrawer,
  StatusChip,
  Dot,
  PropertyThumb,
  type ChipTone,
} from "@/components/os";
import type { Integration, IntegrationHealth } from "@/lib/types";
import { cn } from "@/lib/utils";
import { HEALTH_TONE, fmtRecords, integrationSeed } from "./systemsModel";

/* ──────────────────────────────────────────────────────────────────────────
   Systems Health — IntegrationDrawer (ref §2.11)

   Integration row-click → this drawer. Shows the connection's sync detail,
   field mapping, and live record count. The "Test connection" and
   "Reauthorize" buttons run a short simulated probe and then MUTATE the
   integration's status in parent state (e.g. Needs auth → Healthy) with an
   inline confirmation banner. Property-data connectors carry a real exterior
   photo so the drawer feels like a real record, not a placeholder.
   ────────────────────────────────────────────────────────────────────────── */

export type ProbeState =
  | { phase: "idle" }
  | { phase: "testing" }
  | { phase: "reauth" }
  | { phase: "done"; message: string };

const PROPERTY_CONNECTORS = new Set([
  "MatinRealEstate.com IDX",
  "RMLS / NWMLS",
]);

export function IntegrationDrawer({
  integration,
  onClose,
  probe,
  onTest,
  onReauthorize,
}: {
  integration: Integration | null;
  onClose: () => void;
  probe: ProbeState;
  onTest: () => void;
  onReauthorize: () => void;
}) {
  const i = integration;
  const busy = probe.phase === "testing" || probe.phase === "reauth";
  const needsAuth = i?.status === "Needs auth" || i?.status === "Failing";
  const tone: ChipTone | null = i ? HEALTH_TONE[i.status] : null;
  const showPhoto = i ? PROPERTY_CONNECTORS.has(i.name) : false;

  return (
    <RecordDrawer
      open={i != null}
      onClose={onClose}
      title={i?.name ?? "Integration"}
      subtitle={i ? `${i.provider ?? i.name} · ${i.category}` : undefined}
      actions={
        i ? (
          <>
            <button
              type="button"
              onClick={onTest}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-[0.8rem] font-semibold text-cloud transition-colors hover:bg-ink-800 disabled:opacity-60"
            >
              {probe.phase === "testing" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {probe.phase === "testing" ? "Testing…" : "Test connection"}
            </button>
            {needsAuth ? (
              <button
                type="button"
                onClick={onReauthorize}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-mist bg-cloud px-3 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-paper disabled:opacity-60"
              >
                {probe.phase === "reauth" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                {probe.phase === "reauth" ? "Reauthorizing…" : "Reauthorize"}
              </button>
            ) : null}
          </>
        ) : undefined
      }
    >
      {i ? (
        <div className="space-y-5">
          {showPhoto ? (
            <PropertyThumb
              seedIndex={integrationSeed(i.name)}
              ratio="wide"
              alt={`${i.name} property feed`}
            />
          ) : null}

          {/* Status hero */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow text-[0.64rem] text-slate">Connection</p>
              <p className="mt-1 text-[0.86rem] text-slate">{i.description}</p>
            </div>
            {tone ? (
              <StatusChip tone={tone}>
                <Dot tone={tone} />
                {i.status}
              </StatusChip>
            ) : null}
          </div>

          {/* Inline confirmation after a probe */}
          {probe.phase === "done" ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-success/25 bg-success/[0.07] px-3.5 py-2.5">
              <CircleCheck className="mt-px h-4 w-4 shrink-0 text-success" />
              <p className="text-[0.78rem] font-medium leading-snug text-success">
                {probe.message}
              </p>
            </div>
          ) : null}

          {/* Sync facts */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-mist bg-mist">
            <FactCell
              icon={<Database className="h-3.5 w-3.5" />}
              label="Records synced"
              value={fmtRecords(i.recordsSynced ?? i.records)}
            />
            <FactCell
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              label="Last sync"
              value={i.lastSync ?? "—"}
              danger={i.status !== "Healthy"}
            />
            <FactCell
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Direction"
              value={i.category === "AI Models" ? "Outbound only" : "Two-way sync"}
            />
            <FactCell
              icon={<TriangleAlert className="h-3.5 w-3.5" />}
              label="Errors (24h)"
              value={String(i.errors ?? 0)}
              danger={(i.errors ?? 0) > 0}
            />
          </dl>

          {/* Where this connector's data lands — the transparency note */}
          <div>
            <p className="eyebrow mb-2 text-[0.64rem] text-slate">Where the data lands</p>
            <div className="overflow-hidden rounded-xl border border-mist bg-paper px-3.5 py-3">
              <code className="block break-words font-mono text-[0.74rem] leading-relaxed text-ink">
                {i.name} <span className="text-slate">→</span> Contacts ·
                Properties · Activity log
              </code>
              <p className="mt-1.5 text-[0.72rem] text-slate">
                Each record keeps a link back to the source system, so every
                sync can be traced and replayed.
              </p>
            </div>
          </div>

          {/* Health note */}
          <HealthNote status={i.status} />
        </div>
      ) : null}
    </RecordDrawer>
  );
}

function FactCell({
  icon,
  label,
  value,
  danger,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-cloud px-3.5 py-2.5">
      <p className="flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-wide text-slate">
        <span className="text-slate">{icon}</span>
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[0.92rem] font-semibold tabular-nums",
          danger ? "text-danger" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function HealthNote({ status }: { status: IntegrationHealth }) {
  if (status === "Healthy") {
    return (
      <p className="text-[0.76rem] leading-relaxed text-slate">
        This connection is healthy. Run a manual test any time to confirm the
        token is live and the record counts reconcile.
      </p>
    );
  }
  if (status === "Needs auth") {
    return (
      <p className="text-[0.76rem] leading-relaxed text-warn">
        The OAuth token expired. Reauthorize to restore two-way sync — no data
        is lost; the next sync backfills the gap.
      </p>
    );
  }
  return (
    <p className="text-[0.76rem] leading-relaxed text-danger">
      Recent runs failed. Test the connection to capture a fresh error, then
      open the failing workflow run to retry it.
    </p>
  );
}
