"use client";

import { useState } from "react";
import {
  ClipboardList,
  Sparkles,
  ArrowRight,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Link2,
  Check,
  Copy,
  Wand2,
  Send,
  TriangleAlert,
} from "lucide-react";
import { intakeFlows, type IntakeFlow, type ReFormField, type FieldType } from "@/lib/forms";
import { cn, num } from "@/lib/utils";
import { Panel, PanelHeader, Pill, SectionLabel, Sparkline, LiveDot } from "@/components/command/ui";

/* Deterministic 8-point trend seeded by the monthly total — gives each flow a
   distinct sparkline without random hydration mismatch. */
function trend(total: number): number[] {
  const base = Math.max(4, total / 8);
  return Array.from({ length: 8 }, (_, i) => {
    const wobble = Math.sin((total + i * 7) * 1.3) * base * 0.4;
    return Math.max(1, Math.round(base * (0.7 + i * 0.05) + wobble));
  });
}

const FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "currency",
  "date",
  "select",
  "textarea",
  "checkbox",
];

export function IntakeFlows() {
  const [active, setActive] = useState<IntakeFlow | null>(null);

  return (
    <section className="space-y-4">
      <Panel>
        <PanelHeader
          title="Intake flows"
          subtitle="Structured data flows that replace Google Forms — each one captures, AI-enriches, and routes to the right place automatically."
          icon={<ClipboardList className="h-4 w-4" />}
          action={
            <span className="inline-flex items-center gap-1.5 text-[0.74rem] text-slate-300">
              <LiveDot tone="success" /> live capture
            </span>
          }
        />
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          {intakeFlows.map((flow) => (
            <FlowCard key={flow.code} flow={flow} onPreview={() => setActive(flow)} />
          ))}
        </div>
      </Panel>

      <FlowPreview flow={active} onClose={() => setActive(null)} />
    </section>
  );
}

function FlowCard({ flow, onPreview }: { flow: IntakeFlow; onPreview: () => void }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-900/70 p-4 transition-colors hover:border-azure/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-sans text-[0.95rem] font-semibold text-white">{flow.name}</h4>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.62rem] text-azure-300 ring-1 ring-inset ring-white/10">
              {flow.code}
            </span>
          </div>
          <p className="mt-1 text-[0.8rem] leading-snug text-slate-300">{flow.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <Sparkline data={trend(flow.submissionsThisMonth)} className="h-7 w-24" />
          <div className="mt-0.5 text-[0.66rem] text-slate-300/60">
            <span className="font-semibold tabular-nums text-slate-200">
              {num(flow.submissionsThisMonth)}
            </span>{" "}
            this month
          </div>
        </div>
      </div>

      {/* Pipeline: Form → AI step → routesTo */}
      <div className="mt-3.5 flex items-stretch gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2">
        <PipeNode icon={<ClipboardList className="h-3.5 w-3.5" />} label="Form" sub={`${flow.fieldsCount} fields`} />
        <PipeArrow />
        <PipeNode
          icon={<Sparkles className="h-3.5 w-3.5" />}
          label="AI step"
          sub={flow.aiStep}
          accent
        />
        <PipeArrow />
        <PipeNode icon={<ArrowRight className="h-3.5 w-3.5" />} label="Routes to" sub={flow.routesTo} />
      </div>

      {/* Replaces */}
      <div className="mt-3 flex items-center gap-1.5 text-[0.74rem] text-slate-300/80">
        <span className="text-slate-300/55">Replaces</span>
        <span className="text-slate-400 line-through decoration-danger/60 decoration-1">
          {flow.replaces}
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
        <Pill tone="azure">{flow.fieldsCount} structured fields</Pill>
        <button
          onClick={onPreview}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.78rem] font-semibold text-slate-300 transition-colors hover:border-azure/45 hover:text-white"
        >
          Preview form <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function PipeNode({
  icon,
  label,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2.5 py-2",
        accent ? "bg-azure/[0.08] ring-1 ring-inset ring-azure/20" : "bg-white/[0.02]",
      )}
    >
      <div className={cn("flex items-center gap-1", accent ? "text-azure-bright" : "text-slate-300/70")}>
        {icon}
        <span className="text-[0.62rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="line-clamp-2 text-[0.72rem] leading-snug text-slate-300">{sub}</p>
    </div>
  );
}

function PipeArrow() {
  return (
    <div className="flex shrink-0 items-center text-slate-300/35">
      <ArrowRight className="h-3.5 w-3.5" />
    </div>
  );
}

/* ── Preview modal with a live field-builder ── */

type BuilderField = ReFormField & { _id: string };
let _bseq = 0;
const buid = () => `bf-${Date.now().toString(36)}-${_bseq++}`;

function FlowPreview({ flow, onClose }: { flow: IntakeFlow | null; onClose: () => void }) {
  const open = !!flow;
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 transition-opacity duration-300 sm:p-8",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {flow && <FlowPreviewInner key={flow.code} flow={flow} onClose={onClose} />}
      </div>
    </>
  );
}

function FlowPreviewInner({ flow, onClose }: { flow: IntakeFlow; onClose: () => void }) {
  const [fields, setFields] = useState<BuilderField[]>(() =>
    flow.fields.map((f) => ({ ...f, _id: buid() })),
  );
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = flow.code.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const link = `forms.matinrealestate.com/${slug}`;

  function add() {
    setFields((p) => [...p, { _id: buid(), name: `field_${p.length}`, label: "New field", type: "text" }]);
  }
  function remove(id: string) {
    setFields((p) => p.filter((f) => f._id !== id));
  }
  function move(id: string, dir: -1 | 1) {
    setFields((p) => {
      const i = p.findIndex((f) => f._id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function rename(id: string, label: string) {
    setFields((p) => p.map((f) => (f._id === id ? { ...f, label } : f)));
  }
  function retype(id: string, type: FieldType) {
    setFields((p) => p.map((f) => (f._id === id ? { ...f, type } : f)));
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`https://${link}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative my-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-ink-900 shadow-[0_30px_90px_rgba(0,0,0,.6)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-azure-bright" />
            <SectionLabel>Intake flow · {flow.code}</SectionLabel>
          </div>
          <h2 className="mt-1 font-display text-xl text-white">{flow.name}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Google-Forms-replacement banner */}
      <div className="flex items-center gap-2 border-b border-warn/20 bg-warn/[0.08] px-5 py-2.5">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warn" />
        <p className="text-[0.78rem] text-slate-200">
          This replaces a Google Form →{" "}
          <span className="text-slate-300/70 line-through decoration-danger/60">{flow.replaces}</span>. Same
          intake, now structured, branded, and AI-routed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1.1fr_0.9fr]">
        {/* Live form preview */}
        <div className="space-y-3.5 border-b border-white/10 px-5 py-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-300/60">
              Live preview
            </span>
            <span className="inline-flex items-center gap-1 text-[0.7rem] text-azure-bright">
              <Wand2 className="h-3 w-3" /> {flow.aiStep.split(".")[0]}.
            </span>
          </div>

          {fields.map((f) => (
            <div key={f._id} className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-[0.74rem] font-medium text-slate-300">
                {f.label}
                {f.required && <span className="text-danger">*</span>}
              </label>
              <PreviewControl field={f} />
            </div>
          ))}

          <button className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-azure px-4 py-2.5 text-[0.84rem] font-semibold text-white shadow-glow transition-colors hover:bg-azure-bright">
            <Send className="h-3.5 w-3.5" /> Submit
          </button>
        </div>

        {/* Field builder */}
        <div className="space-y-3 px-5 py-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-300/60">
              Field builder
            </span>
            <button
              onClick={add}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.72rem] font-semibold text-slate-300 transition-colors hover:border-azure/45 hover:text-white"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
          </div>

          <div className="space-y-1.5">
            {fields.map((f, i) => (
              <div
                key={f._id}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-1.5"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => move(f._id, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="text-slate-300/50 transition-colors hover:text-white disabled:opacity-25"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => move(f._id, 1)}
                    disabled={i === fields.length - 1}
                    aria-label="Move down"
                    className="text-slate-300/50 transition-colors hover:text-white disabled:opacity-25"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <input
                  value={f.label}
                  onChange={(e) => rename(f._id, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[0.78rem] text-white focus:border-azure/40 focus:bg-white/[0.04] focus:outline-none"
                  aria-label="Field label"
                />
                <select
                  value={f.type}
                  onChange={(e) => retype(f._id, e.target.value as FieldType)}
                  className="rounded border border-white/10 bg-ink-800 px-1 py-0.5 text-[0.66rem] text-slate-300 focus:outline-none"
                  aria-label="Field type"
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-ink-800">
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => remove(f._id)}
                  aria-label="Remove field"
                  className="text-slate-300/50 transition-colors hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[0.68rem] leading-snug text-slate-300/50">
            Drag-free reorder, rename, retype, add or remove — every flow is fully customizable, no developer
            needed.
          </p>
        </div>
      </div>

      {/* Publish bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-ink-800/50 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[0.78rem] text-slate-300">
          <Link2 className="h-3.5 w-3.5 text-slate-300/60" />
          <code className="rounded bg-white/[0.06] px-2 py-1 font-mono text-[0.74rem] text-azure-300">
            {link}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.78rem] font-semibold text-slate-300 transition-colors hover:border-azure/45 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </button>
          <button
            onClick={() => {
              setPublished(true);
              setTimeout(() => setPublished(false), 2600);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-azure px-3.5 py-1.5 text-[0.8rem] font-semibold text-white shadow-glow transition-colors hover:bg-azure-bright"
          >
            {published ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {published ? "Published" : "Publish"}
          </button>
        </div>
      </div>
      {published && (
        <p className="px-5 pb-3 text-[0.74rem] font-medium text-success">
          Published live · submissions now flow to {flow.routesTo}.
        </p>
      )}
    </div>
  );
}

function PreviewControl({ field }: { field: ReFormField }) {
  const cls =
    "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[0.82rem] text-white placeholder:text-slate-300/40 focus:border-azure/50 focus:bg-white/[0.05] focus:outline-none";
  if (field.type === "textarea")
    return <textarea rows={3} placeholder="Your answer…" className={cn(cls, "resize-y")} />;
  if (field.type === "select")
    return (
      <select className={cls} defaultValue="">
        <option value="" className="bg-ink-800">
          Select…
        </option>
        {field.options?.map((o) => (
          <option key={o} value={o} className="bg-ink-800">
            {o}
          </option>
        ))}
      </select>
    );
  if (field.type === "checkbox")
    return (
      <label className="inline-flex items-center gap-2 text-[0.82rem] text-slate-300">
        <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent text-azure" /> Yes
      </label>
    );
  return (
    <input
      type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
      placeholder={field.type === "currency" ? "$0" : "Your answer…"}
      className={cls}
    />
  );
}
