"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Users, Loader2, Sparkles } from "lucide-react";
import type { Agent } from "@/lib/types";
import { compactUsd } from "@/lib/utils";
import { Pill, ProgressBar, SectionLabel } from "@/components/command/ui";
import { AiMarkdown } from "@/components/command/AiMarkdown";
import { streamAi } from "@/lib/ai/client";

export function AgentDetailPanel({
  agent,
  onClose,
  className,
}: {
  agent: Agent | null;
  onClose: () => void;
  className?: string;
}) {
  const [coachText, setCoachText] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);

  // Reset coaching output whenever agent changes
  useEffect(() => {
    setCoachText("");
    setCoachLoading(false);
  }, [agent?.slug]);

  async function handleCoach() {
    if (!agent) return;
    setCoachLoading(true);
    setCoachText("");
    await streamAi(
      {
        tool: "report_agent_coach",
        input: {
          agentName: agent.name,
          volume: agent.volume,
          homesSold: agent.homesSold,
          activeListings: agent.activeListings,
          responseTimeMins: agent.responseTimeMins ?? 0,
          rating: agent.rating,
          dateRange: "YTD",
          scorecardWeek: agent.scorecardWeek ?? {
            calls: 0,
            texts: 0,
            appts: 0,
            agreements: 0,
            showings: 0,
            offers: 0,
          },
        },
      },
      (_chunk, full) => setCoachText(full),
    );
    setCoachLoading(false);
  }

  /* ── No agent selected ── */
  if (!agent) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className ?? ""}`}>
        <Users className="h-8 w-8 text-slate/30" />
        <p className="text-[0.82rem] text-slate/50">Select an agent to view their detail</p>
      </div>
    );
  }

  const respMins = agent.responseTimeMins ?? 0;
  const respTone: "success" | "warn" | "danger" =
    respMins <= 5 ? "success" : respMins <= 15 ? "warn" : "danger";

  const goalPct = Math.min(100, Math.round((agent.homesSold / 200) * 100));
  const sw = agent.scorecardWeek;

  return (
    <div className={className}>
      {/* Avatar + identity */}
      <div className="flex items-start gap-3">
        <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-ink/[0.08]">
          <Image src={agent.photo} alt={agent.name} fill sizes="64px" className="object-cover" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl text-ink leading-tight">{agent.name}</p>
          <p className="mt-0.5 text-sm text-slate">{agent.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {agent.licenses.map((l) => (
              <Pill key={l} tone="neutral">{l}</Pill>
            ))}
            {agent.yearsExperience > 0 && (
              <Pill tone="azure">{agent.yearsExperience}yr exp</Pill>
            )}
          </div>
        </div>
      </div>

      {/* 3-col stat grid */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Volume", value: compactUsd(agent.volume) },
          { label: "Sold", value: String(agent.homesSold) },
          { label: "Active", value: String(agent.activeListings) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-[#f4f4f3] p-3 text-center">
            <p className="text-[0.66rem] uppercase tracking-wider text-slate/70">{label}</p>
            <p className="mt-1 font-display text-lg text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Response time */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[0.78rem] text-slate">Response time</span>
        <Pill tone={respTone}>{respMins} min</Pill>
      </div>

      {/* This week's scorecard */}
      {sw && (
        <div className="mt-4">
          <SectionLabel className="mb-2">This Week&apos;s Activity</SectionLabel>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "Calls", value: sw.calls },
              { label: "Texts", value: sw.texts },
              { label: "Appts", value: sw.appts },
              { label: "Agreements", value: sw.agreements },
              { label: "Showings", value: sw.showings },
              { label: "Offers", value: sw.offers },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-[#f4f4f3] px-2 py-2 text-center">
                <p className="text-[0.62rem] uppercase tracking-wider text-slate/60">{label}</p>
                <p className="mt-0.5 text-[0.9rem] font-semibold text-ink">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annual pacing */}
      <div className="mt-4">
        <SectionLabel className="mb-2">Annual Pacing</SectionLabel>
        <ProgressBar value={goalPct} tone={goalPct >= 75 ? "success" : goalPct >= 40 ? "warn" : "azure"} />
        <p className="mt-1.5 text-[0.74rem] text-slate">
          {agent.homesSold} / 200 homes &middot; {goalPct}% of goal
        </p>
      </div>

      {/* AI Coaching Brief */}
      <div className="mt-5">
        <SectionLabel className="mb-2">AI Coaching Brief</SectionLabel>
        <button
          onClick={handleCoach}
          disabled={coachLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[0.84rem] font-semibold text-white transition-opacity disabled:opacity-70"
        >
          {coachLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating&hellip;</>
          ) : coachText ? (
            <><Sparkles className="h-4 w-4" /> Regenerate Brief</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Generate Coaching Brief</>
          )}
        </button>
        {coachLoading && !coachText && (
          <div className="mt-3 rounded-xl bg-[#f4f4f3] p-4 text-[0.82rem] text-slate">
            Analyzing performance data&hellip;
          </div>
        )}
        {coachText && (
          <div className="mt-3 rounded-xl bg-[#f4f4f3] p-4 text-[0.84rem]">
            <AiMarkdown text={coachText} />
          </div>
        )}
      </div>
    </div>
  );
}
