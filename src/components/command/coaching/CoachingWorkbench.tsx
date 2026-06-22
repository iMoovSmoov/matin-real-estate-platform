"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Mic,
  RotateCcw,
  CircleCheck,
  Plus,
  CalendarClock,
} from "lucide-react";
import type { CoachingScenario } from "@/lib/types";
import { streamAi } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
import { MatinMark } from "@/components/brand/Logo";
import {
  Avatar,
  CalloutCard,
  ProgressTrack,
  ScoreRing,
  StatusChip,
  type TrackTone,
} from "@/components/os";

/* ──────────────────────────────────────────────────────────────────────────
   CoachingWorkbench — the §2.9 three-pane coaching surface.

   (1) Scenario library  — broker-approved objection drills; selected = dark-filled.
       Clicking a scenario LOADS its roleplay + scorecard (real state).
   (2) Roleplay transcript — alternating light AI-Persona / Agent bubbles, ending
       in a DARK "Coach" CalloutCard (gold "Coach" label). LIVE: the agent types a
       reply → streamAi('coach') returns the persona's next line + a Coach note +
       NUDGES the live scorecard. Real streamed back-and-forth.
   (3) Scorecard — rubric ProgressTrack bars + bordered auto-coaching plan whose
       drills can be assigned to local state (inline confirmation).

   Composes ONLY @/components/os primitives. Avatar wires real persona/agent
   identity. AI presence = MatinMark (no Sparkles). Client (roleplay state).
   ────────────────────────────────────────────────────────────────────────── */

type Speaker = "ai" | "agent";

type Turn = { speaker: Speaker; text: string };

type RubricRow = {
  key: string;
  label: string;
  value: number;
  tone: TrackTone;
};

/** Pre-seeded transcript + rubric per scenario so each drill looks complete
    before any click. Keyed by scenario id; falls back to the seller-price drill. */
type Seed = {
  /** Persona display name + the listing/lead context line. */
  personaName: string;
  personaContext: string;
  /** Avatar seed — real photos exist only for real agents, so personas fall back
      to a clean initials token. A slug here would resolve a photo; we leave it
      undefined so personas render as initials (they are clients, not agents). */
  transcript: Turn[];
  coach: string;
  rubric: RubricRow[];
  plan: string;
};

const RUBRIC_KEYS = [
  "empathy",
  "pricing",
  "close",
  "crm",
  "speed",
] as const;
const RUBRIC_LABELS: Record<string, string> = {
  empathy: "Empathy",
  pricing: "Pricing explanation",
  close: "Next-step close",
  crm: "CRM hygiene",
  speed: "Speed to lead",
};

function rubric(
  empathy: number,
  pricing: number,
  close: number,
  crm: number,
  speed: number,
): RubricRow[] {
  return [
    { key: "empathy", label: RUBRIC_LABELS.empathy, value: empathy, tone: toneFor(empathy) },
    { key: "pricing", label: RUBRIC_LABELS.pricing, value: pricing, tone: toneFor(pricing) },
    { key: "close", label: RUBRIC_LABELS.close, value: close, tone: toneFor(close) },
    { key: "crm", label: RUBRIC_LABELS.crm, value: crm, tone: toneFor(crm) },
    // Speed-to-lead is the AI/active dimension — rendered in gold per the spec.
    { key: "speed", label: RUBRIC_LABELS.speed, value: speed, tone: "gold" },
  ];
}

function toneFor(v: number): TrackTone {
  return v >= 85 ? "success" : v >= 70 ? "warn" : "danger";
}

const SEEDS: Record<string, Seed> = {
  "CS-001": {
    personaName: "Sarah Mitchell",
    personaContext: "AI Seller · 1248 NW Cedar Hills Dr · listing interview",
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
    rubric: rubric(85, 62, 54, 92, 78),
    plan: "3 practice calls on pricing conversations, one manager review, and a CRM task to call two active sellers today.",
  },
  "CS-002": {
    personaName: "Daniel Cho",
    personaContext: "AI Buyer · Lake Oswego search · pre-approved $780K",
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
    rubric: rubric(80, 71, 58, 88, 74),
    plan: "2 practice calls on scoped agreements, draft a 7-day OREF C-565, and a CRM task to send Daniel Cho the agreement explainer today.",
  },
  "ZILLOW-GHOST": {
    personaName: "Megan Pratt",
    personaContext: "AI Lead · Zillow inquiry · gone cold 17 days",
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
    rubric: rubric(76, 64, 60, 84, 41),
    plan: "1 practice call on re-engagement, enable the 5-minute Zillow first-touch automation, and a CRM task to break-up-text 3 ghosting leads today.",
  },
  "CS-003": {
    personaName: "Listing Agent — Pat Reyes",
    personaContext: "AI Listing Agent · TX-8912 · inspection negotiation",
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
    rubric: rubric(72, 81, 66, 90, 79),
    plan: "2 practice calls on contingency negotiation, draft the repair-credit addendum, and a CRM task to confirm the inspection deadline on TX-8912 today.",
  },
  "CS-004": {
    personaName: "Karen Whitfield",
    personaContext: "AI Seller · West Linn · commission objection",
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
    rubric: rubric(83, 69, 64, 91, 77),
    plan: "2 practice calls on value defense, build a side-by-side net sheet template, and a CRM task to send the comparison to two listing prospects today.",
  },
  "CS-005": {
    personaName: "Robert Nguyen",
    personaContext: "AI Homeowner · Tigard · cash offer vs. traditional sale",
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
    rubric: rubric(79, 84, 57, 89, 80),
    plan: "2 practice calls on cash-vs-traditional, build the dual net-sheet, and a CRM task to call two cash-offer leads with the comparison today.",
  },
  "CS-006": {
    personaName: "Diane Salazar",
    personaContext: "AI Seller · Happy Valley · 4 offers on the table",
    transcript: [
      {
        speaker: "ai",
        text: "Just take the highest number, right? $812K beats everything else — why are we even talking?",
      },
      {
        speaker: "agent",
        text: "It's the biggest number, but not automatically the strongest deal. The $812K offer is FHA with a 5% down payment and asks for $9K in closing help. Let me show you which offer actually clears escrow cleanest.",
      },
      {
        speaker: "ai",
        text: "So which one do you actually like?",
      },
      {
        speaker: "agent",
        text: "The $798K cash offer with a 14-day close and an inspection waiver. You net within $4K of the top bid with near-zero fall-through risk. Want me to counter it up $6K and lock it tonight?",
      },
    ],
    coach: "Excellent — you reframed 'highest' to 'strongest' and gave a clear recommendation. Improve next-step close by pre-drafting the counter so she can approve it in one tap instead of waiting on you.",
    rubric: rubric(81, 86, 68, 90, 82),
    plan: "2 practice calls on multiple-offer strategy, build an offer-comparison net sheet, and a CRM task to counter the strongest offer on the Happy Valley listing today.",
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

/** Initial live-score map from a seed's rubric (typed Record, not inferred). */
function scoresFromSeed(seed: Seed): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of seed.rubric) out[r.key] = r.value;
  return out;
}

/** Per-turn scoring nudge — derived from the agent's typed reply so the live
    scorecard moves believably as the roleplay progresses (no model round-trip
    needed for the visible bars; the model still streams the persona + Coach). */
function nudgeFromReply(text: string): Partial<Record<string, number>> {
  const t = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const nudge: Partial<Record<string, number>> = {};
  // Empathy — acknowledgement / validating language.
  if (/\b(i hear you|i understand|fair|great question|i get it|makes sense|totally)\b/.test(t))
    nudge.empathy = 6;
  // Pricing explanation — concrete numbers / comps / net.
  if (/\$|\d{2,}|comp|net sheet|absorption|days on market|price/.test(t)) nudge.pricing = 7;
  // Next-step close — a concrete ask / scheduling.
  if (/\?|today|this week|sign|schedule|tonight|let's|can we|want me to|book/.test(t))
    nudge.close = 8;
  // CRM hygiene — note-taking / follow-up discipline language.
  if (/\b(follow up|log|note|crm|send (you|over)|i'll email|reminder)\b/.test(t)) nudge.crm = 4;
  // Speed to lead — brevity rewards quick, decisive replies.
  if (words > 0 && words <= 45) nudge.speed = 5;
  else if (words > 80) nudge.speed = -3;
  return nudge;
}

export function CoachingWorkbench({
  scenarios,
  onAskAi,
}: {
  scenarios: CoachingScenario[];
  /** Explicit "Ask Matin" affordance — the ONLY path allowed to open the global
      AI sidecar (the live roleplay itself streams inline, never the sidecar). */
  onAskAi?: (context: string) => void;
}) {
  // Library = broker-approved records + the synthetic Zillow ghosting drill,
  // ordered to match the wireframe storyline.
  const library = useMemo<CoachingScenario[]>(() => {
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const order = ["CS-001", "CS-002", "ZILLOW-GHOST", "CS-003", "CS-004", "CS-005", "CS-006"];
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
  const [practicing, setPracticing] = useState(false);
  const streamingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Live scorecard — starts at the seed rubric, nudged by each agent reply.
  const [liveScores, setLiveScores] = useState<Record<string, number>>(() =>
    scoresFromSeed(seed),
  );
  const [agentTurnCount, setAgentTurnCount] = useState(0);

  // Drills the agent has assigned from the auto-plan (local state + confirmation).
  const [assignedDrills, setAssignedDrills] = useState<string[]>([]);

  const transcript = [...seed.transcript, ...liveTurns];

  function selectScenario(id: string) {
    setActiveId(id);
    setLiveTurns([]);
    setLiveCoach(null);
    setDraft("");
    setPracticing(false);
    setAgentTurnCount(0);
    setLiveScores(scoresFromSeed(seedFor(id)));
  }

  function startPractice() {
    setPracticing(true);
    requestAnimationFrame(() => {
      composerRef.current?.focus();
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function sendResponse(text: string) {
    if (!text.trim() || streamingRef.current) return;
    streamingRef.current = true;
    setStreaming(true);
    setPracticing(true);
    setLiveTurns((t) => [...t, { speaker: "agent", text: text.trim() }]);
    setDraft("");
    setLiveCoach(null);
    setAgentTurnCount((n) => n + 1);

    // Nudge the live scorecard from the agent's reply (clamped 0–100).
    const nudge = nudgeFromReply(text);
    setLiveScores((prev) => {
      const next = { ...prev };
      for (const k of RUBRIC_KEYS) {
        const d = nudge[k];
        if (typeof d === "number") next[k] = Math.max(0, Math.min(100, (next[k] ?? 60) + d));
      }
      return next;
    });

    // Build the conversation for the coach tool: scenario prompt + the running
    // transcript. AI plays the persona and returns the next line + scoring cues.
    const history = [...seed.transcript, ...liveTurns, { speaker: "agent" as const, text: text.trim() }];
    const messages = [
      {
        role: "user" as const,
        content:
          `Coaching roleplay. Scenario: "${active?.title}" — ${active?.prompt}\n\n` +
          `You play the persona (${seed.personaName} — ${seed.personaContext}). Reply IN CHARACTER with one short objection or response, ` +
          `then on a new line starting with "COACH:" give the agent one specific improvement.\n\n` +
          `Transcript so far:\n` +
          history
            .map((h) => `${h.speaker === "ai" ? "Persona" : "Agent"}: ${h.text}`)
            .join("\n"),
      },
    ];

    // Add an empty AI turn we stream into.
    setLiveTurns((t) => [...t, { speaker: "ai", text: "" }]);
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
    );

    try {
      await streamAi({ tool: "coach", messages }, (_chunk, full) => {
        // Split persona reply vs COACH note.
        const idx = full.indexOf("COACH:");
        const reply = idx >= 0 ? full.slice(0, idx).trim() : full;
        const coachNote = idx >= 0 ? full.slice(idx + "COACH:".length).trim() : null;
        setLiveTurns((t) => {
          const next = [...t];
          next[next.length - 1] = { speaker: "ai", text: reply || "…" };
          return next;
        });
        if (coachNote) setLiveCoach(coachNote);
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    } finally {
      streamingRef.current = false;
      setStreaming(false);
    }
  }

  function resetRoleplay() {
    setLiveTurns([]);
    setLiveCoach(null);
    setDraft("");
    setPracticing(false);
    setAgentTurnCount(0);
    setLiveScores(scoresFromSeed(seed));
  }

  function toggleDrill(label: string) {
    setAssignedDrills((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  }

  const coachText = liveCoach ?? seed.coach;

  // Live rubric rows (seed labels + live values).
  const liveRubric: RubricRow[] = seed.rubric.map((r) => ({
    ...r,
    value: liveScores[r.key] ?? r.value,
    tone: r.key === "speed" ? "gold" : toneFor(liveScores[r.key] ?? r.value),
  }));
  const overallScore = overall(liveRubric);

  // Drills that the auto-plan exposes as assignable CRM tasks.
  const planDrills = useMemo(() => buildPlanDrills(active?.title ?? "", seed), [active, seed]);

  return (
    // R8: real responsive Tailwind — 1-col phone, md two-column, lg three-column.
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[260px_minmax(0,1fr)_330px]">
      {/* ── Pane 1 — Scenario library ──────────────────────────────────── */}
      <section className="rounded-2xl border border-mist bg-cloud shadow-soft md:self-start">
        <div className="flex items-center gap-2 border-b border-mist px-4 py-3.5">
          <GraduationCap className="h-4 w-4 text-slate" aria-hidden />
          <h2 className="font-display text-[1rem] font-normal text-ink">Scenario library</h2>
        </div>
        <p className="px-4 pt-3 text-[0.72rem] leading-snug text-slate">
          Broker-approved objection drills. Select one to load its roleplay and scorecard.
        </p>
        <ul className="space-y-1.5 p-3">
          {library.map((s) => {
            const isActive = s.id === activeId;
            const sSeed = seedFor(s.id);
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
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-[0.84rem] font-semibold leading-snug",
                        isActive ? "text-cloud" : "text-ink",
                      )}
                    >
                      {s.title}
                    </p>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[0.66rem] font-semibold tabular-nums",
                        isActive
                          ? "bg-cloud/15 text-cloud"
                          : "bg-gold-soft text-gold-ink ring-1 ring-inset ring-gold/25",
                      )}
                    >
                      {overall(sSeed.rubric)}
                    </span>
                  </div>
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

      {/* ── Pane 2 — Roleplay transcript (spans both cols at md) ───────── */}
      <section className="flex min-h-[30rem] flex-col rounded-2xl border border-mist bg-cloud shadow-soft md:order-3 md:col-span-2 lg:order-none lg:col-span-1">
        <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate" aria-hidden />
            <h2 className="font-display text-[1rem] font-normal text-ink">Roleplay transcript</h2>
          </div>
          <StatusChip tone="gold" variant="soft">
            <MatinMark theme="dark" className="h-3 w-3" />
            AI roleplay
          </StatusChip>
        </div>

        {/* Persona identity strip */}
        <div className="flex items-center gap-2.5 border-b border-mist px-4 py-3">
          <Avatar name={seed.personaName} size={32} ring />
          <div className="min-w-0">
            <p className="truncate text-[0.82rem] font-semibold leading-tight text-ink">
              {seed.personaName}
            </p>
            <p className="truncate text-[0.7rem] leading-tight text-slate">{seed.personaContext}</p>
          </div>
          {(liveTurns.length > 0 || practicing) && (
            <button
              type="button"
              onClick={resetRoleplay}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-mist px-2.5 py-1 text-[0.72rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Reset
            </button>
          )}
        </div>

        {/* Bubbles */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-3">
          {transcript.map((turn, i) => (
            <div
              key={i}
              className={cn("flex gap-2", turn.speaker === "agent" ? "flex-row-reverse" : "flex-row")}
            >
              {turn.speaker === "ai" ? (
                <Avatar name={seed.personaName} size={26} className="mt-4" />
              ) : (
                <span className="mt-4 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-[0.6rem] font-bold text-cloud">
                  YOU
                </span>
              )}
              <div className="max-w-[78%]">
                <p
                  className={cn(
                    "mb-1 text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-slate/70",
                    turn.speaker === "agent" ? "text-right" : "text-left",
                  )}
                >
                  {turn.speaker === "agent" ? "Agent (you)" : seed.personaName}
                </p>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed ring-1 ring-inset",
                    turn.speaker === "agent"
                      ? "rounded-tr-sm bg-paper-200 text-ink ring-mist"
                      : "rounded-tl-sm bg-cloud text-ink ring-mist",
                  )}
                >
                  {turn.text || (streaming ? <TypingDots /> : "")}
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
                <span className="text-cloud">
                  {liveCoach ? "Live feedback" : "Scored feedback"}
                </span>
              </span>
            }
            action={
              onAskAi ? (
                <button
                  type="button"
                  onClick={() => onAskAi(`Coaching / ${active?.title} roleplay`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  Ask Matin
                </button>
              ) : undefined
            }
          >
            {coachText}
          </CalloutCard>
        </div>

        {/* Composer — practice this scenario live */}
        {practicing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendResponse(draft);
            }}
            className="border-t border-mist px-4 py-3"
          >
            <div className="flex items-end gap-2 rounded-xl border border-mist bg-paper-200/50 px-3 py-2 focus-within:border-ink/30">
              <textarea
                ref={composerRef}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendResponse(draft);
                  }
                }}
                placeholder={`Reply to ${seed.personaName.split(" ")[0]}…`}
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
                ? `${seed.personaName} is responding in character and the scorecard is updating…`
                : `Press Enter to send · ${agentTurnCount} live ${agentTurnCount === 1 ? "turn" : "turns"} this session.`}
            </p>
          </form>
        ) : (
          <div className="border-t border-mist px-4 py-4">
            <button
              type="button"
              onClick={startPractice}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-[0.86rem] font-semibold text-cloud transition-colors hover:bg-ink-800"
            >
              <Mic className="h-4 w-4" aria-hidden />
              Practice this scenario
            </button>
            <p className="mt-2 text-center text-[0.7rem] leading-snug text-slate/70">
              {seed.personaName} plays the {active?.category.toLowerCase()} objection. Reply in
              character — Matin AI answers back and scores each turn live.
            </p>
          </div>
        )}
      </section>

      {/* ── Pane 3 — Scorecard ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 md:order-2 md:self-start lg:order-none">
        <div className="rounded-2xl border border-mist bg-cloud shadow-soft">
          <div className="flex items-center justify-between gap-2 border-b border-mist px-4 py-3.5">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-slate" aria-hidden />
              <h2 className="font-display text-[1rem] font-normal text-ink">Scorecard</h2>
            </div>
            {agentTurnCount > 0 ? (
              <StatusChip tone="gold" variant="soft">
                Live
              </StatusChip>
            ) : (
              <StatusChip tone="info" variant="soft">
                Last attempt
              </StatusChip>
            )}
          </div>
          <div className="flex items-center gap-4 border-b border-mist px-4 py-4">
            <ScoreRing value={overallScore} size={64} />
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                Overall
              </p>
              <p className="mt-0.5 text-[0.78rem] leading-snug text-slate">
                {overallScore >= 85
                  ? "Strong — interview-ready on this drill."
                  : overallScore >= 70
                    ? "Solid — tighten the weakest rubric below."
                    : "Needs reps — assign the plan and re-run."}
              </p>
            </div>
          </div>
          <div className="space-y-3.5 p-4">
            {liveRubric.map((r) => (
              <ProgressTrack
                key={r.key}
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

        {/* Auto-created coaching plan — assignable CRM tasks */}
        <div className="rounded-2xl border border-mist bg-paper-200/40 p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/15 ring-1 ring-inset ring-gold/30">
              <MatinMark theme="dark" className="h-3 w-3" />
            </span>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate">
              Auto-created coaching plan
            </p>
          </div>
          <p className="text-[0.84rem] leading-relaxed text-ink">{seed.plan}</p>

          {/* Each drill is an assignable CRM task — click to assign + confirm. */}
          <ul className="mt-3 space-y-1.5">
            {planDrills.map((d) => {
              const assigned = assignedDrills.includes(d);
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => toggleDrill(d)}
                    aria-pressed={assigned}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[0.78rem] transition-colors",
                      assigned
                        ? "border-success/30 bg-success/[0.07] text-ink"
                        : "border-mist bg-cloud text-slate hover:border-ink/20 hover:text-ink",
                    )}
                  >
                    {assigned ? (
                      <CircleCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                    ) : (
                      <Plus className="h-4 w-4 shrink-0 text-slate" aria-hidden />
                    )}
                    <span className="flex-1">{d}</span>
                    {assigned ? (
                      <span className="shrink-0 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-success">
                        Assigned
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {assignedDrills.length > 0 ? (
              <StatusChip tone="success" variant="soft">
                <CalendarClock className="h-3 w-3" aria-hidden />
                {assignedDrills.length} task{assignedDrills.length === 1 ? "" : "s"} in Today
              </StatusChip>
            ) : (
              <StatusChip tone="info" variant="soft">
                Click a drill to add it to Today
              </StatusChip>
            )}
            <StatusChip tone="success" variant="soft">
              Writes activity_event
            </StatusChip>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Turn the plan sentence into discrete, assignable CRM-task drills. */
function buildPlanDrills(_title: string, seed: Seed): string[] {
  // Split the seed plan on commas/"and" into concrete, checkable tasks.
  return seed.plan
    .replace(/\.$/, "")
    .split(/,\s*|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
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

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/25"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}
