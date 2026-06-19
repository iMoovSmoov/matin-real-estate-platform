"use client";

import { ScenarioTrainer } from "@/components/command/coaching/ScenarioTrainer";

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
      <div className="mb-5">
        <span className="inline-block rounded-full bg-azure/[0.09] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-azure mb-1.5">
          Coaching
        </span>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Agent Coach AI</h1>
        <p className="mt-1 max-w-2xl text-[0.92rem] leading-relaxed text-slate">
          Pick a scenario — the AI plays the client, you run the conversation live, then get scored.
        </p>
      </div>
      <ScenarioTrainer />
    </div>
  );
}
