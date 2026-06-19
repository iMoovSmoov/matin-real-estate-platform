"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Send,
  Mail,
  Phone,
  MapPin,
  Wallet,
  CalendarClock,
  Flame,
  RefreshCw,
} from "lucide-react";
import type { Lead } from "@/lib/types";
import { getAgent } from "@/lib/data";
import { streamAi } from "@/lib/ai/client";
import { cn, usd, initials } from "@/lib/utils";
import { Pill } from "@/components/command/ui";
import { stageTone, scoreTone } from "@/components/command/crm/leadStyles";

export function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  // Reset transient state whenever a different lead is opened.
  const [activeId, setActiveId] = useState<string | null>(null);
  if (lead && lead.id !== activeId) {
    setActiveId(lead.id);
    setDraft("");
    setBusy(false);
    setSent(false);
  }

  const agent = lead ? getAgent(lead.assignedAgent) : undefined;

  async function generate() {
    if (!lead || busy) return;
    setBusy(true);
    setDraft("");
    setSent(false);
    try {
      await streamAi(
        {
          tool: "lead-responder",
          input: {
            name: lead.name,
            intent: lead.intent,
            area: lead.community,
            budget: `$${Math.round(lead.budgetMin / 1000)}k–$${Math.round(lead.budgetMax / 1000)}k`,
            timeline: lead.tags.includes("Urgent") ? "ASAP" : "—",
            source: lead.source,
            message: lead.aiSummary,
          },
        },
        (_chunk, full) => setDraft(full),
      );
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  }

  const open = !!lead;

  return (
    <>
      {/* Scrim */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/55 backdrop-blur-md transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-[min(540px,94vw)] flex-col border-l border-white/10 bg-ink-900 shadow-[0_0_80px_rgba(0,0,0,.6)] transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="relative shrink-0 border-b border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 px-5 py-5">
              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3 pr-8">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base font-bold text-white">
                  {initials(lead.name)}
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl text-white">{lead.name}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={cn("rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset", stageTone(lead.stage))}>
                      {lead.stage}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ring-inset", scoreTone(lead.score))}>
                      {lead.score >= 80 && <Flame className="h-3 w-3" />} Score {lead.score}
                    </span>
                    <Pill tone="neutral">{lead.source}</Pill>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* Contact + facts */}
              <div className="grid grid-cols-2 gap-2.5">
                <Fact icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={lead.email} />
                <Fact icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={lead.phone} />
                <Fact icon={<MapPin className="h-3.5 w-3.5" />} label="Area" value={lead.community} />
                <Fact icon={<Wallet className="h-3.5 w-3.5" />} label="Budget" value={`${usd(lead.budgetMin)}–${usd(lead.budgetMax)}`} />
                <Fact icon={<Sparkles className="h-3.5 w-3.5" />} label="Intent" value={lead.intent} />
                <Fact icon={<CalendarClock className="h-3.5 w-3.5" />} label="Last contact" value={lead.lastContactDaysAgo === 0 ? "today" : `${lead.lastContactDaysAgo}d ago`} />
              </div>

              {/* Tags */}
              {lead.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((t) => (
                    <Pill key={t} tone="azure">
                      {t}
                    </Pill>
                  ))}
                </div>
              )}

              {/* Assigned agent */}
              {agent && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3">
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                    <Image src={agent.photo} alt={agent.name} fill sizes="36px" className="object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] uppercase tracking-wider text-slate-300/55">Assigned to</p>
                    <p className="truncate text-[0.86rem] font-semibold text-white">{agent.name}</p>
                  </div>
                </div>
              )}

              {/* AI summary */}
              <div className="rounded-xl border border-azure/20 bg-azure/[0.06] px-4 py-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                  <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-white/80">AI lead summary</span>
                </div>
                <p className="text-[0.86rem] leading-relaxed text-slate-300">{lead.aiSummary}</p>
              </div>

              {/* ── AI reply generator — the flagship demo ── */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04]">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-[0.84rem] font-semibold text-white">AI first reply</span>
                  </div>
                  {draft && !busy && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={copy} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[0.7rem] text-slate-300 hover:text-white">
                        {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button onClick={generate} className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[0.7rem] text-slate-300 hover:text-white">
                        <RefreshCw className="h-3 w-3" /> Redo
                      </button>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3">
                  {!draft && !busy ? (
                    <button
                      onClick={generate}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[0.85rem] font-semibold text-ink transition-colors hover:bg-paper-200"
                    >
                      <Sparkles className="h-4 w-4" /> Draft AI reply
                    </button>
                  ) : (
                    <>
                      <div className="min-h-[7rem] whitespace-pre-wrap rounded-lg border border-white/10 bg-ink/60 px-3.5 py-3 text-[0.86rem] leading-relaxed text-slate-200">
                        {draft}
                        {busy && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-white align-middle" />}
                      </div>
                      {!busy && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSent(true);
                              setTimeout(() => setSent(false), 2400);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-[0.82rem] font-semibold text-white transition-colors hover:brightness-110"
                          >
                            <Send className="h-3.5 w-3.5" /> Send to {lead.firstName}
                          </button>
                          {busy ? (
                            <span className="inline-flex items-center gap-1.5 text-[0.76rem] text-slate-300">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> drafting…
                            </span>
                          ) : (
                            sent && (
                              <span className="inline-flex items-center gap-1.5 text-[0.78rem] font-medium text-success">
                                <Check className="h-3.5 w-3.5" /> Sent via SMS + email
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {busy && !draft && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] text-slate-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> AI is drafting a personalized reply…
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-1.5 text-slate-300/55">
        {icon}
        <span className="text-[0.64rem] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-0.5 truncate text-[0.82rem] font-medium text-white">{value}</p>
    </div>
  );
}
