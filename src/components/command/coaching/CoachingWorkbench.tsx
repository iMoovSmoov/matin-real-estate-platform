"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import type { CoachingScenario } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import {
  CalloutCard,
  ProgressTrack,
  ScoreChip,
  StatusChip,
  type TrackTone,
} from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   CoachingWorkbench — the §2.9 three-pane coaching surface.

   (1) Scenario library  — broker-approved objection drills; selected = dark-filled
   (2) Roleplay transcript — alternating light AI-Seller / Agent bubbles, ending
       in a DARK "Coach" CalloutCard (gold "Coach" label). Live via streamAi('coach').
   (3) Scorecard         — rubric ProgressTrack bars + bordered auto-coaching plan.

   Composes ONLY @/components/os primitives. Client (roleplay interactivity).
   ────────────────────────────────────────────────────────────────────────── */

type Speaker = "ai" | "agent";

type Turn = { speaker: Speaker; text: string };

type RubricRow = {
  label: string;
  value: number;
  tone: TrackTone;
};

/** Pre-seeded transcript + rubric per scenario so each drill looks complete
    before any click. Keyed by scenario id; falls back to the seller-price drill. */
type Seed = {
  persona: string;
  transcript: Turn[];
  coach: string;
  rubric: RubricRow[];
  plan: string;
};

const SEEDS: Record<string, Seed> = {
  "CS-001": {
    persona: "AI Seller — Sarah Mitchell · 1248 NW Cedar Hills Dr",
    transcript: [
      {
        speaker: "ai",
        text: "My neighbor's place sold for $1.05M last spring, so I want to list at $995,000. That's already under what they got.",
      },
      {
        speaker: "agent",
        text: "I hear you — that sale is a fair anchor and I want to get you every dollar the market supports. Can I walk you through the three closest comps from the last 90 days?",
      },
      {
        speaker: "ai",
        text: "I guess, but I don't want to leave money on the table by going too low.",
      },
      {
        speaker: "agent",
        text: "Totally fair. Two of those comps closed at $905K and $918K, and homes priced above $960K in Cedar Hills are sitting 41 days. If we list right, we create competition instead of chasing the market down with price drops.",
      },
    ],
    coach: "Good empathy. Improve by explaining absorption rate and net outcome — show her the dollars she nets after a 41-day stale period and a likely $30K reduction, vs. a clean sale in week one.",
    rubric: [
      { label: "Empathy", value: 85, tone: "success" },
      { label: "Pricing explanation", value: 62, tone: "warn" },
      { label: "Next-step close", value: 54, tone: "danger" },
      { label: "CRM hygiene", value: 92, tone: "success" },
      { label: "Speed to lead", value: 78, tone: "gold" },
    ],
    plan: "3 practice calls, one manager review, and a CRM task to call two active sellers today.",
  },
  "CS-002": {
    persona: "AI Buyer — Daniel Cho · Lake Oswego search",
    transcript: [
      {
        speaker: "ai",
        text: "Why do I have to sign anything before you even show me a house? Feels like a commitment trap.",
      },
      {
        speaker: "agent",
        text: "Great question — and it's a fair one. The buyer agreement actually protects you: it locks in what I'm responsible for and that you owe nothing extra out of pocket on most deals.",
      },
      {
        speaker: "ai",
        text: "But what if I find an agent I like better next week?",
      },
      {
        speaker: "agent",
        text: "It's short-term and we can scope it to just the homes we tour this weekend. That way you're never stuck, and I can pull off-market listings that only represented buyers see.",
      },
    ],
    coach: "Solid reframe to buyer-benefit. Improve the close — name the exact term length and offer a 7-day scoped agreement on the spot instead of leaving it open. Get the signature before the first showing.",
    rubric: [
      { label: "Empathy", value: 80, tone: "success" },
      { label: "Pricing explanation", value: 71, tone: "warn" },
      { label: "Next-step close", value: 58, tone: "danger" },
      { label: "CRM hygiene", value: 88, tone: "success" },
      { label: "Speed to lead", value: 74, tone: "gold" },
    ],
    plan: "2 practice calls on scoped agreements, draft a 7-day OREF C-565, and a CRM task to send Daniel Cho the agreement explainer today.",
  },
  "ZILLOW-GHOST": {
    persona: "AI Lead — Zillow inquiry · gone cold 17 days",
    transcript: [
      {
        speaker: "agent",
        text: "Hi Megan — following up on the 3-bed you saved on Zillow. Are you still hoping to be in before the school year?",
      },
      {
        speaker: "ai",
        text: "(no response — lead has not replied to 2 texts and 1 call over 17 days)",
      },
      {
        speaker: "agent",
        text: "No worries if the timing shifted. I just pulled two new listings in your range under $650K — want me to send them over, or should I check back in the spring?",
      },
    ],
    coach: "The break-up + value text is the right move on a ghosting lead. Improve speed to lead — this inquiry sat 4 hours before first contact. Auto-enroll Zillow leads in a 5-minute first-touch sequence so they never go cold.",
    rubric: [
      { label: "Empathy", value: 76, tone: "warn" },
      { label: "Pricing explanation", value: 64, tone: "warn" },
      { label: "Next-step close", value: 60, tone: "danger" },
      { label: "CRM hygiene", value: 84, tone: "success" },
      { label: "Speed to lead", value: 41, tone: "danger" },
    ],
    plan: "1 practice call on re-engagement, enable the 5-minute Zillow first-touch automation, and a CRM task to break-up-text 3 ghosting leads today.",
  },
  "CS-003": {
    persona: "AI Listing Agent — inspection negotiation",
    transcript: [
      {
        speaker: "ai",
        text: "My sellers won't touch the roof. The home was priced for its condition — your buyers knew that going in.",
      },
      {
        speaker: "agent",
        text: "Understood, and I'm not trying to re-trade the price. The inspector flagged active flashing leaks — that's a lender and safety item, not cosmetics. Let's find a number that keeps this closing on time.",
      },
      {
        speaker: "ai",
        text: "So what are you actually asking for?",
      },
      {
        speaker: "agent",
        text: "A $6,500 repair credit at closing — cheaper for your sellers than a re-list, and my buyers stay. We have 4 days before the contingency expires; can we paper an addendum today?",
      },
    ],
    coach: "Strong framing of safety vs. cosmetic and a concrete ask. Improve next-step close — you named the deadline but didn't pin a callback time. Set a 'respond by 5pm' so the contingency clock works for you.",
    rubric: [
      { label: "Empathy", value: 72, tone: "warn" },
      { label: "Pricing explanation", value: 81, tone: "success" },
      { label: "Next-step close", value: 66, tone: "warn" },
      { label: "CRM hygiene", value: 90, tone: "success" },
      { label: "Speed to lead", value: 79, tone: "gold" },
    ],
    plan: "2 practice calls on contingency negotiation, draft the repair-credit addendum, and a CRM task to confirm the inspection deadline on TX-8912 today.",
  },
  "CS-004": {
    persona: "AI Seller — commission objection",
    transcript: [
      {
        speaker: "ai",
        text: "A discount brokerage quoted me 1%. Why would I pay you almost three times that?",
      },
      {
        speaker: "agent",
        text: "Fair to compare — let's look at net, not rate. Last quarter my listings sold for 3.8% over the discount-model average in this zip. On your home that's roughly $34,000 more in your pocket, after my fee.",
      },
      {
        speaker: "ai",
        text: "That's a nice number, but how do I know that holds for my house?",
      },
      {
        speaker: "agent",
        text: "Here's the net sheet both ways, side by side. Professional photos, the pre-list prep, and multiple-offer negotiation are where that spread comes from — and you only pay if I deliver the sale.",
      },
    ],
    coach: "Excellent move to net-proceeds math and no defensiveness. Improve pricing explanation — walk her line-by-line through the net sheet rather than citing one aggregate number; specificity beats averages.",
    rubric: [
      { label: "Empathy", value: 83, tone: "success" },
      { label: "Pricing explanation", value: 69, tone: "warn" },
      { label: "Next-step close", value: 64, tone: "warn" },
      { label: "CRM hygiene", value: 91, tone: "success" },
      { label: "Speed to lead", value: 77, tone: "gold" },
    ],
    plan: "2 practice calls on value defense, build a side-by-side net sheet template, and a CRM task to send the comparison to two listing prospects today.",
  },
  "CS-005": {
    persona: "AI Homeowner — cash offer vs. traditional sale",
    transcript: [
      {
        speaker: "ai",
        text: "I got an instant cash offer for $720K with no showings. That sounds easier than listing.",
      },
      {
        speaker: "agent",
        text: "Easier, yes — and I want you to choose with clear eyes. That offer usually nets less after their 7% fee and repair deductions. Can I show you both net sheets so 'easy' has a real price tag?",
      },
      {
        speaker: "ai",
        text: "Okay, what would I actually walk away with each way?",
      },
      {
        speaker: "agent",
        text: "Cash: about $658K net after fees. Traditional at $755K list, even with concessions, nets you roughly $711K. That's $53K for about three extra weeks of work I handle for you.",
      },
    ],
    coach: "Great net-sheet framing and you quantified convenience. Improve next-step close — end with a single clear ask ('want me to start the listing prep this week?') so the conversation converts.",
    rubric: [
      { label: "Empathy", value: 79, tone: "warn" },
      { label: "Pricing explanation", value: 84, tone: "success" },
      { label: "Next-step close", value: 57, tone: "danger" },
      { label: "CRM hygiene", value: 89, tone: "success" },
      { label: "Speed to lead", value: 80, tone: "gold" },
    ],
    plan: "2 practice calls on cash-vs-traditional, build the dual net-sheet, and a CRM task to call two cash-offer leads with the comparison today.",
  },
};

const DEFAULT_SEED_KEY = "CS-001";

/** Synthetic "Zillow lead ghosting" drill — added per the build spec alongside
    the broker-approved coaching_scenarios records. */
const ZILLOW_SCENARIO: CoachingScenario = {
  id: "ZILLOW-GHOST",
  title: "Zillow lead ghosting",
  category: "Lead Conversion",
  prompt:
    "A Zillow inquiry went cold after two texts and a missed call over 17 days. Re-engage with a value-first break-up message that earns a reply without sounding desperate.",
};

function seedFor(id: string): Seed {
  return SEEDS[id] ?? SEEDS[DEFAULT_SEED_KEY];
}

export function CoachingWorkbench({
  scenarios,
  onOpenAi,
}: {
  scenarios: CoachingScenario[];
  onOpenAi?: (context: string) => void;
}) {
  // Library = broker-approved records + the synthetic Zillow ghosting drill,
  // ordered to match the wireframe storyline.
  const library = useMemo<CoachingScenario[]>(() => {
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const order = ["CS-001", "CS-002", "ZILLOW-GHOST", "CS-003", "CS-004", "CS-005"];
    return order
      .map((id) => (id === "ZILLOW-GHOST" ? ZILLOW_SCENARIO : byId.get(id)))
      .filter((s): s is CoachingScenario => Boolean(s));
  }, [scenarios]);

  const [activeId, setActiveId] = useState<string>(library[0]?.id ?? DEFAULT_SEED_KEY);
  const active = library.find((s) => s.id === activeId) ?? library[0];
  const seed = seedFor(activeId);

  // Live roleplay state — layered ON TOP of the pre-seeded transcript.
  const [liveTurns, setLiveTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [liveCoach, setLiveCoach] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const transcript = [...seed.transcript, ...liveTurns];

  function selectScenario(id: string) {
    setActiveId(id);
    setLiveTurns([]);
    setLiveCoach(null);
    setDraft("");
  }

  async function sendResponse(text: string) {
    if (!text.trim() || streamingRef.current) return;
    streamingRef.current = true;
    setStreaming(true);
    setLiveTurns((t) => [...t, { speaker: "agent", text: text.trim() }]);
    setDraft("");
    setLiveCoach(null);

    // Build the conversation for the coach tool: scenario prompt + the running
    // transcript. AI plays the persona and returns the next line + scoring cues.
    const history = [...seed.transcript, ...liveTurns, { speaker: "agent" as const, text: text.trim() }];
    const messages = [
      {
        role: "user" as const,
        content:
          `Coaching roleplay. Scenario: "${active?.title}" — ${active?.prompt}\n\n` +
          `You play the persona (${seed.persona}). Reply IN CHARACTER with one short objection or response, ` +
          `then on a new line starting with "COACH:" give the agent one specific improvement.\n\n` +
          `Transcript so far:\n` +
          history
            .map((h) => `${h.speaker === "ai" ? "Persona" : "Agent"}: ${h.text}`)
            .join("\n"),
      },
    ];

    // Add an empty AI turn we stream into.
    setLiveTurns((t) => [...t, { speaker: "ai", text: "" }]);

    try {
      await streamAi({ tool: "coach", messages }, (_chunk, full) => {
        // Split persona reply vs COACH note.
        const idx = full.indexOf("COACH:");
        const reply = idx >= 0 ? full.slice(0, idx).trim() : full;
        const coachNote = idx >= 0 ? full.slice(idx + "COACH:".length).trim() : null;
        setLiveTurns((t) => {
          const next = [...t];
          // last turn is the streaming AI turn
          next[next.length - 1] = { speaker: "ai", text: reply || "…" };
          return next;
        });
        if (coachNote) setLiveCoach(coachNote);
      });
    } finally {
      streamingRef.current = false;
      setStreaming(false);
    }
  }

  const coachText = liveCoach ?? seed.coach;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      {/* ── Pane 1 — Scenario library ──────────────────────────────────── */}
      <section className="rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center gap-2 border-b border-mist px-4 py-3.5">
          <GraduationCap className="h-4 w-4 text-slate" aria-hidden />
          <h2 className="font-display text-[1rem] font-normal text-ink">Scenario library</h2>
        </div>
        <p className="px-4 pt-3 text-[0.72rem] leading-snug text-slate">
          Broker-approved objection drills. Selected drill loads the roleplay.
        </p>
        <ul className="space-y-1.5 p-3">
          {library.map((s) => {
            const isActive = s.id === activeId;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectScenario(s.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-ink bg-ink text-cloud"
                      : "border-mist bg-cloud text-ink hover:border-ink/20 hover:bg-paper-200/60",
                  )}
                >
                  <p
                    className={cn(
                      "text-[0.84rem] font-semibold leading-snug",
                      isActive ? "text-cloud" : "text-ink",
                    )}
                  >
                    {s.title}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-[0.7rem] font-medium uppercase tracking-[0.1em]",
                      isActive ? "text-cloud/60" : "text-slate/70",
                    )}
                  >
                    {s.category}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Pane 2 — Roleplay transcript ───────────────────────────────── */}
      <section className="flex flex-col rounded-2xl border border-mist bg-cloud shadow-soft">
        <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate" aria-hidden />
            <h2 className="font-display text-[1rem] font-normal text-ink">Roleplay transcript</h2>
          </div>
          <StatusChip tone="gold" variant="soft">
            <Sparkles className="h-3 w-3" aria-hidden />
            AI roleplay
          </StatusChip>
        </div>

        <div className="px-4 pb-3 pt-3">
          <p className="text-[0.72rem] leading-snug text-slate">
            <span className="font-semibold text-ink">{active?.title}</span> ·{" "}
            <span className="font-mono text-[0.7rem]">{seed.persona}</span>
          </p>
        </div>

        {/* Bubbles */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {transcript.map((turn, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                turn.speaker === "agent" ? "justify-end" : "justify-start",
              )}
            >
              <div className="max-w-[82%]">
                <p
                  className={cn(
                    "mb-1 text-[0.64rem] font-semibold uppercase tracking-[0.14em]",
                    turn.speaker === "agent" ? "text-right text-slate/70" : "text-slate/70",
                  )}
                >
                  {turn.speaker === "agent" ? "Agent" : "AI Seller"}
                </p>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed ring-1 ring-inset",
                    turn.speaker === "agent"
                      ? "rounded-tr-sm bg-paper-200 text-ink ring-mist"
                      : "rounded-tl-sm bg-cloud text-ink ring-mist",
                  )}
                >
                  {turn.text || (streaming ? "…" : "")}
                </div>
              </div>
            </div>
          ))}

          {/* Coach feedback — DARK callout, gold "Coach" label */}
          <CalloutCard
            tone="ai"
            title={
              <span className="inline-flex items-center gap-2">
                <span className="rounded-md bg-gold px-2 py-0.5 text-[0.66rem] font-bold uppercase tracking-[0.12em] text-ink">
                  Coach
                </span>
                <span className="text-cloud">Scored feedback</span>
              </span>
            }
            action={
              onOpenAi ? (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAi(`Context: Coaching / ${active?.title} roleplay`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Open in Matin AI
                </button>
              ) : undefined
            }
          >
            {coachText}
          </CalloutCard>
        </div>

        {/* Composer — practice this scenario live */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendResponse(draft);
          }}
          className="border-t border-mist px-4 py-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-mist bg-paper-200/50 px-3 py-2 focus-within:border-ink/30">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendResponse(draft);
                }
              }}
              placeholder="Type your response to practice this scenario…"
              className="max-h-28 flex-1 resize-none bg-transparent text-[0.84rem] leading-relaxed text-ink outline-none placeholder:text-slate/50"
            />
            <button
              type="submit"
              aria-label="Send response"
              disabled={!draft.trim() || streaming}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-cloud transition-colors hover:bg-ink-800 disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-[0.66rem] leading-none text-slate/60">
            {streaming
              ? "Matin AI is responding in character and scoring your reply…"
              : "Press Enter to send · AI plays the persona and grades each turn."}
          </p>
        </form>
      </section>

      {/* ── Pane 3 — Scorecard ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate" aria-hidden />
              <h2 className="font-display text-[1rem] font-normal text-ink">Scorecard</h2>
            </div>
            <ScoreChip score={overall(seed.rubric)} suffix="" />
          </div>
          <div className="space-y-3.5 p-4">
            {seed.rubric.map((r) => (
              <ProgressTrack
                key={r.label}
                label={r.label}
                value={r.value}
                tone={r.tone}
                valueRight={
                  <span className={cn("font-semibold tabular-nums", scoreTextTone(r.tone))}>
                    {r.value}
                  </span>
                }
              />
            ))}
          </div>
          <div className="border-t border-mist px-4 py-3">
            <p className="text-[0.7rem] leading-snug text-slate/70">
              Rubric-based · scores stored to the agent record and surfaced in Reports.
            </p>
          </div>
        </div>

        {/* Auto-created coaching plan — bordered note converting scores → CRM tasks */}
        <div className="rounded-2xl border border-mist bg-paper-200/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15 text-gold ring-1 ring-inset ring-gold/30">
              <Sparkles className="h-3 w-3" aria-hidden />
            </span>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate">
              Auto-created coaching plan
            </p>
          </div>
          <p className="text-[0.84rem] leading-relaxed text-ink">{seed.plan}</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusChip tone="info" variant="soft">
              Appears in Today
            </StatusChip>
            <StatusChip tone="success" variant="soft">
              Writes activity_event
            </StatusChip>
          </div>
        </div>
      </section>
    </div>
  );
}

function overall(rubric: RubricRow[]): number {
  if (!rubric.length) return 0;
  return Math.round(rubric.reduce((s, r) => s + r.value, 0) / rubric.length);
}

function scoreTextTone(tone: TrackTone): string {
  switch (tone) {
    case "success":
      return "text-success";
    case "danger":
      return "text-danger";
    case "warn":
      return "text-warn";
    case "gold":
      return "text-gold-ink";
    default:
      return "text-ink";
  }
}
