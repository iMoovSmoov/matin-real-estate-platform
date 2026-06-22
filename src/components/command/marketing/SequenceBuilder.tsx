"use client";

import { useState } from "react";
import {
  Zap,
  Sparkle,
  ShieldCheck,
  Mail,
  Clock,
  Reply,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
   Marketing Studio — SequenceBuilder  (S8 ticket 7, Sierra automation builder)

   A node/connector automation flow:
     Trigger → AI draft → Approval → Email → Wait 3d → Follow-up
   with SOLID connectors for committed (active) steps and DASHED connectors for
   pending ones (the §2.8 "solid=committed / dashed=pending" rule), a left step
   rail (numbered, status-dotted), a green "Active" status pill, and date-range /
   granularity dropdowns in the header.

   Each node is a real button — selecting it highlights the node + its rail entry
   and shows its config summary in the inspector below. Toggling a pending node to
   committed flips its connector from dashed to solid (genuinely interactive).
   Gold is reserved for the AI-draft node's accent only. Client.
   ────────────────────────────────────────────────────────────────────────── */

type NodeState = "committed" | "pending";

type FlowNode = {
  id: string;
  label: string;
  kind: "trigger" | "ai" | "approval" | "email" | "wait" | "followup";
  icon: LucideIcon;
  detail: string;
  config: string;
  state: NodeState;
};

const INITIAL_NODES: FlowNode[] = [
  {
    id: "trigger",
    label: "Trigger",
    kind: "trigger",
    icon: Zap,
    detail: "New seller lead enters the database",
    config: "When · seller_score ≥ 80 OR cash_offer_request created",
    state: "committed",
  },
  {
    id: "ai-draft",
    label: "AI draft",
    kind: "ai",
    icon: Sparkle,
    detail: "Matin AI drafts on-brand home-value outreach",
    config: "Tool · marketing-kit · merge {{first_name}} {{address}}",
    state: "committed",
  },
  {
    id: "approval",
    label: "Approval",
    kind: "approval",
    icon: ShieldCheck,
    detail: "Listing agent reviews before anything sends",
    config: "Gate · requires 1 broker approval · client-facing copy",
    state: "committed",
  },
  {
    id: "email",
    label: "Email",
    kind: "email",
    icon: Mail,
    detail: "Branded home-value email goes out",
    config: "Channel · email · branded shell + Equal-Housing footer",
    state: "committed",
  },
  {
    id: "wait",
    label: "Wait 3d",
    kind: "wait",
    icon: Clock,
    detail: "Pause three days for a reply",
    config: "Delay · 3 days · skip if reply received",
    state: "pending",
  },
  {
    id: "followup",
    label: "Follow-up",
    kind: "followup",
    icon: Reply,
    detail: "AI follow-up or hand to a live agent",
    config: "Branch · replied → agent task · no reply → SMS nudge",
    state: "pending",
  },
];

const RANGES = ["Live (current run)", "Last 7 days", "Last 30 days"];

export function SequenceBuilder() {
  const [nodes, setNodes] = useState<FlowNode[]>(INITIAL_NODES);
  const [selected, setSelected] = useState<string>("ai-draft");
  const [range, setRange] = useState<string>(RANGES[0]);

  const active = nodes.find((n) => n.id === selected) ?? nodes[0];
  const committedCount = nodes.filter((n) => n.state === "committed").length;

  function toggleState(id: string) {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, state: n.state === "committed" ? "pending" : "committed" }
          : n,
      ),
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mist bg-cloud p-4 shadow-soft md:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="font-display text-[1.05rem] font-normal leading-tight text-ink">
            Sequence builder
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[0.7rem] font-semibold text-success ring-1 ring-inset ring-success/25">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="appearance-none rounded-full border border-mist bg-cloud px-3 py-1.5 text-[0.76rem] font-medium text-slate outline-none transition-colors hover:border-ink/20 hover:text-ink"
          >
            {RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <span className="tabular-nums text-[0.72rem] text-slate">
            {committedCount}/{nodes.length} committed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
        {/* Step rail */}
        <ol className="flex flex-col gap-1.5">
          {nodes.map((n, i) => {
            const isActive = n.id === selected;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelected(n.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 text-left transition-colors",
                    isActive
                      ? "border-ink bg-paper"
                      : "border-mist bg-cloud hover:border-ink/20",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-200 text-[0.66rem] font-semibold text-slate ring-1 ring-inset ring-mist tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.78rem] font-medium text-ink">
                    {n.label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      n.state === "committed" ? "bg-success" : "bg-warn",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>

        {/* Flow canvas + inspector */}
        <div className="flex flex-col gap-4">
          {/* Horizontally scrollable node/connector flow */}
          <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-stretch gap-0">
              {nodes.map((n, i) => (
                <div key={n.id} className="flex items-center">
                  <FlowNodeCard
                    node={n}
                    selected={n.id === selected}
                    onSelect={() => setSelected(n.id)}
                    onToggle={() => toggleState(n.id)}
                  />
                  {i < nodes.length - 1 ? (
                    <Connector
                      committed={
                        n.state === "committed" && nodes[i + 1].state === "committed"
                      }
                    />
                  ) : null}
                </div>
              ))}
              {/* Add-step affordance */}
              <div className="flex items-center">
                <Connector committed={false} />
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-mist text-slate transition-colors hover:border-ink/30 hover:text-ink"
                  aria-label="Add step"
                  title="Add step"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Inspector for the selected node */}
          <div className="rounded-xl border border-mist bg-paper/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset",
                    active.kind === "ai"
                      ? "bg-gold/15 text-gold-ink ring-gold/30"
                      : "bg-paper-200 text-slate ring-mist",
                  )}
                >
                  <active.icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div>
                  <p className="text-[0.84rem] font-semibold text-ink">{active.label}</p>
                  <p className="text-[0.72rem] text-slate">{active.detail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleState(active.id)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-[0.74rem] font-semibold transition-colors",
                  active.state === "committed"
                    ? "bg-success/12 text-success ring-1 ring-inset ring-success/25 hover:bg-success/20"
                    : "bg-warn/12 text-warn ring-1 ring-inset ring-warn/25 hover:bg-warn/20",
                )}
              >
                {active.state === "committed" ? "Committed" : "Pending — commit"}
              </button>
            </div>
            <p className="mt-3 rounded-lg border border-mist bg-cloud px-3 py-2 font-mono text-[0.72rem] leading-relaxed text-slate">
              {active.config}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlowNodeCard({
  node,
  selected,
  onSelect,
  onToggle,
}: {
  node: FlowNode;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const Icon = node.icon;
  const isAi = node.kind === "ai";
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onToggle}
      className={cn(
        "flex w-[136px] shrink-0 flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors",
        selected ? "border-ink bg-paper shadow-soft" : "border-mist bg-cloud hover:border-ink/20",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset",
            isAi ? "bg-gold/15 text-gold-ink ring-gold/30" : "bg-paper-200 text-slate ring-mist",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span
          aria-hidden
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            node.state === "committed" ? "bg-success" : "bg-warn",
          )}
        />
      </span>
      <span className="text-[0.8rem] font-semibold leading-tight text-ink">
        {node.label}
      </span>
      <span className="text-[0.68rem] leading-snug text-slate line-clamp-2">
        {node.detail}
      </span>
    </button>
  );
}

/** Connector: solid line = both ends committed; dashed = pending downstream. */
function Connector({ committed }: { committed: boolean }) {
  return (
    <span
      aria-hidden
      className="flex h-11 w-7 shrink-0 items-center justify-center"
    >
      <svg viewBox="0 0 28 12" className="h-3 w-full">
        <line
          x1="0"
          y1="6"
          x2="22"
          y2="6"
          stroke={committed ? "var(--color-ink)" : "var(--color-slate)"}
          strokeWidth="1.5"
          strokeDasharray={committed ? "0" : "3 3"}
          strokeOpacity={committed ? 0.7 : 0.5}
        />
        <path
          d="M22 2 L28 6 L22 10 Z"
          fill={committed ? "var(--color-ink)" : "var(--color-slate)"}
          fillOpacity={committed ? 0.7 : 0.5}
        />
      </svg>
    </span>
  );
}
