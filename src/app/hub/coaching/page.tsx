"use client";

import { useMemo, useRef, useState } from "react";
import {
  GraduationCap,
  Gauge,
  TrendingDown,
  ClipboardCheck,
  Activity,
  CircleCheck,
  CalendarClock,
  FileText,
} from "lucide-react";
import { useAiSidecar } from "@/components/os";
import {
  KpiStrip,
  KpiCard,
  PaceBar,
  ProgressTrack,
  Avatar,
  ScoreRing,
  StatusChip,
  Dot,
  RecordDrawer,
  CalloutCard,
  AIActionCard,
  MilestoneTimeline,
  EmptyState,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { cn, compactUsd } from "@/lib/utils";
import { CoachingWorkbench } from "@/components/command/coaching/CoachingWorkbench";
import { CoachingPacingChart } from "@/components/command/coaching/CoachingPacingChart";
import { RoiLeaderboard } from "@/components/command/coaching/RoiLeaderboard";
import { CoachingPlanDoc } from "@/components/command/coaching/CoachingPlanDoc";
import {
  coachingStandings,
  coachingScenarioLibrary,
  coachingKpis,
  teamPacing,
  rubricRowsFor,
  brokerApprovedDrillCount,
  scoreValueTone,
  COACHING_QUARTER,
  type CoachingStanding,
} from "@/components/command/coaching/coachingData";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching  (ref §2.9 · S9 tickets 1-10)

   AI Coaching + Scenario Training. Renders inside AppShell (TopCommandBar owns
   the "Coaching" title — no page <h1>, only a muted subtitle).

   Real-data: every number binds to the coaching-scorecards data module
   (coachingData) — NO `homesSold % 22` formulas, NO magic `+2` reviewsDue.
   Sisu-style ROI leaderboard (color-the-value-text) · recharts pacing chart ·
   branded coaching-plan via BrandedDocument · consolidated scenario library.

   MAKE-IT-REAL: KPI tiles drill into a real on-screen roster drawer; leaderboard
   rows open a per-agent coaching-plan drawer; the plan STREAMS inline via
   streamAi('report_agent_coach') into an AIActionCard, then renders as a branded
   document; the ONLY path to the global AI sidecar is the explicit "Ask Matin".
   ────────────────────────────────────────────────────────────────────────── */

/** Which KPI a tile drilldown opens — drives the on-screen roster drawer. */
type RosterView = "practice" | "avgScore" | "behind" | "reviews" | "scenarios";

const ROSTER_META: Record<RosterView, { title: string; sub: string }> = {
  practice: { title: "Practice sessions", sub: "Completed roleplay drills this quarter" },
  avgScore: { title: "Average scorecard", sub: "Mean rubric score across scored attempts" },
  behind: { title: "Agents behind pace", sub: "Below the quarter practice goal" },
  reviews: { title: "Manager reviews due", sub: "Attempts awaiting manager sign-off" },
  scenarios: { title: "Scenarios run", sub: "All-time drills across the team" },
};

export default function CoachingPage() {
  const { openAi } = useAiSidecar();
  const standings = coachingStandings;

  const [selected, setSelected] = useState<CoachingStanding | null>(null);
  const [drawerTab, setDrawerTab] = useState("plan");
  const [roster, setRoster] = useState<RosterView | null>(null);

  // Streamed coaching plan per agent (AIActionCard inline result).
  const [planState, setPlanState] = useState<{ running: boolean; text: string } | null>(null);
  const planRunningRef = useRef(false);

  // KPI roll-ups come from the data module (reconcile to the standing rows).
  const k = coachingKpis;
  const { teamGoal, teamDone, teamPace, teamExpected, teamForecast } = teamPacing;

  function openAgent(s: CoachingStanding) {
    setSelected(s);
    setDrawerTab("plan");
    setPlanState(null);
  }

  // Edit the drafted plan → jump to the branded Document tab where the streamed
  // text becomes the editable plan body (real "review before it ships" flow,
  // never a dead Edit button). Honors reduced-motion via the drawer's own fade.
  function editPlan() {
    setDrawerTab("document");
  }

  // Reject → discard the generated draft so the card reverts to its
  // pre-generated "Generate plan" state, and fall back to the grounded
  // auto-created plan tab below (always a visible result, never a dead click).
  function rejectPlan() {
    if (planRunningRef.current) return;
    setPlanState(null);
    setDrawerTab("plan");
  }

  // Stream the AI coaching plan INLINE (no sidecar) into the AIActionCard.
  async function runPlan(s: CoachingStanding) {
    if (planRunningRef.current) return;
    planRunningRef.current = true;
    setPlanState({ running: true, text: "" });
    try {
      await streamAi(
        {
          tool: "report_agent_coach",
          messages: [
            {
              role: "user",
              content:
                `Agent: ${s.name} (${s.title}). Quarter practice: ${s.practiceSessions} of ${s.goal} sessions ` +
                `(${s.pace}% — ${s.behind ? "behind" : "on"} pace). Average scorecard: ${s.avgScore}. ` +
                `Conversion: ${s.conversionPct.toFixed(1)}% · closings this quarter: ${s.closingsQtr} · GCI ${compactUsd(s.gci)}. ` +
                `Weakest skill: ${s.weakest}. Drills run this quarter: ${s.scenariosRun}.\n\n` +
                `Write a brief coaching note: what's going well (1 line), the one metric to fix and why, ` +
                `and one concrete drill or CRM action for this week. Under 100 words.`,
            },
          ],
        },
        (_chunk, full) => setPlanState({ running: true, text: full }),
      );
    } finally {
      planRunningRef.current = false;
      setPlanState((p) => (p ? { running: false, text: p.text } : null));
    }
  }

  // Rows the roster drawer shows for a given KPI view.
  const rosterRows = useMemo<CoachingStanding[]>(() => {
    if (!roster) return [];
    switch (roster) {
      case "behind":
        return standings.filter((r) => r.behind);
      case "reviews":
        return standings.filter((r) => r.managerReviewDue);
      case "avgScore":
        return [...standings].sort((a, b) => b.avgScore - a.avgScore);
      case "scenarios":
        return [...standings].sort((a, b) => b.scenariosRun - a.scenariosRun);
      case "practice":
      default:
        return [...standings].sort((a, b) => b.practiceSessions - a.practiceSessions);
    }
  }, [roster, standings]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-4 md:px-6">
      {/* Subtitle / eyebrow (no h1 — TopCommandBar owns the section title) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] leading-snug text-slate">
          Coach agents and brokers with scorecards, roleplay, and real CRM outcomes · {COACHING_QUARTER}.
        </p>
        {/* The ONLY explicit "Ask Matin" entry into the global AI sidecar. */}
        <button
          type="button"
          onClick={() => openAi("Coaching / Team performance overview")}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
        >
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          Ask Matin
        </button>
      </div>

      {/* KPI strip — each tile drills into the on-screen roster drawer.
          R4: 5 tiles is odd, so a 2-up phone grid would orphan the 5th tile;
          use a horizontal scroll-snap RAIL on phone (no orphan) that reverts to
          a clean 3-up grid at sm and a 5-up row at lg. */}
      <KpiStrip cols={5} rail>
        <KpiCard
          label="Practice sessions"
          value={k.practiceSessions}
          icon={<GraduationCap className="h-4 w-4" aria-hidden />}
          delta={`${k.avgScoreDelta >= 0 ? "+" : ""}${k.avgScoreDelta} vs last qtr`}
          deltaTone={k.avgScoreDelta >= 0 ? "up" : "down"}
          hint="Completed roleplay drills across the team"
          onDrill={() => setRoster("practice")}
        />
        <KpiCard
          label="Avg scorecard"
          value={k.avgScorecard}
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          valueTone={k.avgScorecard >= 80 ? "success" : "ink"}
          delta="rubric-weighted"
          deltaTone="flat"
          hint="Mean across all scored attempts"
          onDrill={() => setRoster("avgScore")}
        />
        <KpiCard
          label="Agents behind pace"
          value={k.agentsBehind}
          icon={<TrendingDown className="h-4 w-4" aria-hidden />}
          valueTone={k.agentsBehind > 0 ? "danger" : "success"}
          delta={`of ${k.activeAgents} active`}
          deltaTone="down"
          hint="Below the quarter practice goal"
          onDrill={() => setRoster("behind")}
        />
        <KpiCard
          label="Reviews due"
          value={k.reviewsDue}
          icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
          valueTone={k.reviewsDue > 0 ? "danger" : "ink"}
          delta="manager sign-off"
          deltaTone={k.reviewsDue > 0 ? "down" : "up"}
          hint="Attempts awaiting manager review"
          onDrill={() => setRoster("reviews")}
        />
        <KpiCard
          label="Scenarios run"
          value={k.scenariosRun}
          icon={<Activity className="h-4 w-4" aria-hidden />}
          delta="all-time"
          deltaTone="up"
          hint={`Across ${brokerApprovedDrillCount} broker-approved drills`}
          onDrill={() => setRoster("scenarios")}
        />
      </KpiStrip>

      {/* Three-pane coaching workbench (live roleplay streams inline here).
          Consolidated scenario library (S9 ticket 3) — one source. */}
      <CoachingWorkbench
        scenarios={coachingScenarioLibrary}
        onAskAi={(ctx) => openAi(ctx)}
      />

      {/* Leadership goal-pacing + ROI leaderboard. Split at xl, not lg: at the
          1024–1279 band the 280px app sidebar leaves too little width to fit the
          pacing chart beside a 6-column ROI table without horizontal scroll, so
          below xl they stack full-width (each readable on its own row). */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        {/* Goal pacing (leadership view) + real recharts pacing chart */}
        <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-[1rem] font-normal text-ink">Team practice goal</h2>
            <StatusChip tone={teamPace >= teamExpected ? "success" : "danger"} variant="soft">
              {teamPace >= teamExpected ? "On pace" : "Behind pace"}
            </StatusChip>
          </div>
          <PaceBar
            value={teamPace}
            pace={teamExpected}
            forecast={teamForecast}
            headline={
              <>
                Team completed{" "}
                <span className="font-semibold tabular-nums text-ink">{teamDone}</span> of{" "}
                <span className="font-semibold tabular-nums text-ink">{teamGoal}</span> quarter
                practice sessions —{" "}
                {teamPace >= teamExpected ? (
                  <span className="font-semibold text-success">ahead of pace</span>
                ) : (
                  <span className="font-semibold text-danger">
                    {teamExpected - teamPace} pts behind pace
                  </span>
                )}
                .
              </>
            }
          />

          {/* Real per-quarter pacing chart (recharts) — practice vs conversion */}
          <div className="mt-4 border-t border-mist pt-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="eyebrow text-slate">Practice & conversion · this qtr vs prior</p>
            </div>
            <CoachingPacingChart />
          </div>

          <div className="mt-4 border-t border-mist pt-3">
            <CalloutCard
              tone="ai"
              title="Coaching focus this week"
              action={
                <button
                  type="button"
                  onClick={() => openAi("Coaching / Team pacing & focus")}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  Ask Matin
                </button>
              }
            >
              {k.agentsBehind} agents are behind on practice and the lowest team rubric is{" "}
              <span className="text-cloud">Next-step close</span>. Recommend assigning the{" "}
              <span className="text-cloud">&ldquo;Buyer refuses agreement&rdquo;</span> and{" "}
              <span className="text-cloud">&ldquo;Cash offer explanation&rdquo;</span> drills, each
              tied to a CRM task in Today.
            </CalloutCard>
          </div>
        </section>

        {/* ROI leaderboard (Sisu color-as-data) */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <h2 className="font-display text-[1.15rem] font-normal text-ink">Team Coaching ROI</h2>
            <span className="text-[0.72rem] text-slate">Closings · conversion · GCI by agent</span>
          </div>
          <RoiLeaderboard onSelectAgent={openAgent} />
        </section>
      </div>

      {/* ── Roster drawer — opened from a KPI tile drilldown (real on-screen) ── */}
      <RecordDrawer
        open={roster !== null}
        onClose={() => setRoster(null)}
        title={roster ? ROSTER_META[roster].title : ""}
        subtitle={roster ? ROSTER_META[roster].sub : undefined}
      >
        {roster ? (
          rosterRows.length > 0 ? (
            <ul className="space-y-1.5">
              {rosterRows.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setRoster(null);
                      openAgent(r);
                    }}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-mist bg-cloud px-3 py-2.5 text-left transition-colors hover:border-ink/20 hover:bg-paper-200/50"
                  >
                    <Avatar name={r.name} slug={r.slug} size={34} ring />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.86rem] font-semibold text-ink">{r.name}</p>
                      <p className="truncate text-[0.74rem] text-slate">{r.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-[0.95rem] font-bold tabular-nums",
                          rosterValueTone(roster, r),
                        )}
                      >
                        {rosterValue(roster, r)}
                      </p>
                      <p className="text-[0.66rem] uppercase tracking-[0.1em] text-slate">
                        {rosterLabel(roster, r)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<CircleCheck className="h-6 w-6" aria-hidden />}
              title="Nobody in this bucket"
              body="Every active agent is on pace and above the review threshold this quarter."
            />
          )
        ) : null}
      </RecordDrawer>

      {/* ── Per-agent coaching-plan drawer (real content + inline AI + branded) ── */}
      <RecordDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.title} · Coaching plan` : undefined}
        tabs={[
          { key: "plan", label: "Plan" },
          { key: "document", label: "Document" },
          { key: "rubric", label: "Rubric" },
          { key: "history", label: "Attempts" },
        ]}
        activeTab={drawerTab}
        onTab={setDrawerTab}
        actions={
          selected ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-[40px] rounded-lg border border-mist px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openAi(`Coaching / ${selected.name} coaching plan`)}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <MatinMark theme="dark" className="h-3.5 w-3.5" />
                Ask Matin
              </button>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className="space-y-5">
            {/* Hero score — identity + ring + ROI line. R: wrap-safe row. */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-mist bg-paper-200/40 px-4 py-3.5">
              <Avatar name={selected.name} slug={selected.slug} size={46} ring />
              <ScoreRing value={selected.avgScore} size={56} />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Quarter goal
                </p>
                <p className="mt-0.5 font-sans text-[1.4rem] font-bold leading-none tabular-nums text-ink">
                  {selected.practiceSessions}
                  <span className="text-[0.9rem] font-medium text-slate">/{selected.goal}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusChip tone={selected.behind ? "danger" : "success"} variant="soft">
                    <Dot tone={selected.behind ? "danger" : "success"} />
                    {selected.behind ? "Behind pace" : "On pace"}
                  </StatusChip>
                  <span
                    className={cn(
                      "text-[0.78rem] font-bold tabular-nums",
                      selected.conversionPct >= 18 ? "text-success" : "text-danger",
                    )}
                  >
                    {selected.conversionPct.toFixed(1)}% conv
                  </span>
                  <span className="text-[0.78rem] font-bold text-success tabular-nums">
                    {compactUsd(selected.gci)} GCI
                  </span>
                </div>
              </div>
            </div>

            {drawerTab === "plan" ? (
              <>
                {/* AI coaching plan — streamed INLINE into the AIActionCard */}
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                    <MatinMark theme="dark" className="h-3.5 w-3.5" />
                    AI coaching plan
                  </p>
                  <AIActionCard
                    title={`Draft a weekly plan for ${selected.name.split(" ")[0]}`}
                    riskTag="Ready"
                    evidence={`Weakest skill is ${selected.weakest} (${selected.avgScore} avg); ${selected.practiceSessions}/${selected.goal} practice sessions this quarter${selected.behind ? " — behind pace." : "."}`}
                    confidence="High"
                    runLabel={planState?.text ? "Regenerate" : "Generate plan"}
                    running={planState?.running ?? false}
                    result={planState?.text ? planState.text : undefined}
                    onRun={() => runPlan(selected)}
                    onEdit={editPlan}
                    onReject={rejectPlan}
                  />
                </div>

                {/* Static fallback plan summary + CRM downstream chips */}
                <div className="rounded-xl border border-mist bg-paper-200/40 p-4">
                  <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                    Auto-created coaching plan
                  </p>
                  <p className="text-[0.84rem] leading-relaxed text-ink">
                    Weakest skill is <span className="font-semibold">{selected.weakest}</span> (
                    {selected.avgScore} avg). Plan: 3 practice calls on{" "}
                    {selected.weakest.toLowerCase()}, one manager review, and a CRM task to call two
                    active sellers today.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <StatusChip tone="info" variant="soft">
                      <CalendarClock className="h-3 w-3" aria-hidden />
                      Added to today&apos;s tasks
                    </StatusChip>
                    <StatusChip tone="success" variant="soft">
                      Logged to the agent&apos;s file
                    </StatusChip>
                    <button
                      type="button"
                      onClick={() => setDrawerTab("document")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-cloud px-2.5 py-1 text-[0.72rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
                    >
                      <FileText className="h-3 w-3" aria-hidden />
                      View branded plan
                    </button>
                  </div>
                </div>
              </>
            ) : null}

            {drawerTab === "document" ? (
              <div>
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Matin coaching-plan document
                </p>
                {/* Branded, printable coaching plan — merges the live AI plan when run */}
                <CoachingPlanDoc standing={selected} planText={planState?.text} />
              </div>
            ) : null}

            {drawerTab === "rubric" ? (
              <div>
                <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Skill rubric
                </p>
                <div className="space-y-3">
                  {rubricRowsFor(selected).map((r) => (
                    <ProgressTrack
                      key={r.label}
                      label={r.label}
                      value={r.value}
                      tone={r.tone}
                      valueRight={<span className="tabular-nums">{r.value}</span>}
                    />
                  ))}
                </div>
                <p className="mt-3 text-[0.72rem] leading-snug text-slate/70">
                  Rubric-weighted from {selected.scenariosRun} scored drills · saved to the agent&apos;s
                  file and shown in Reports.
                </p>
              </div>
            ) : null}

            {drawerTab === "history" ? (
              <div>
                <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Recent attempts
                </p>
                <MilestoneTimeline
                  milestones={[
                    {
                      id: "m1",
                      title: selected.lastAttempt,
                      dateLabel: selected.lastAttemptDaysAgo <= 1 ? "Today" : `${selected.lastAttemptDaysAgo} days ago`,
                      tone: selected.avgScore >= 85 ? "success" : selected.avgScore >= 70 ? "warn" : "danger",
                    },
                    {
                      id: "m2",
                      title: `${selected.weakest} drill · scored ${Math.max(40, selected.avgScore - 18)}`,
                      dateLabel: `${selected.lastAttemptDaysAgo + 2} days ago`,
                      tone: "warn",
                    },
                    {
                      id: "m3",
                      title: "Manager review — Jordan Matin",
                      dateLabel: "Last week",
                      tone: selected.managerReviewDue ? "danger" : "info",
                    },
                    {
                      id: "m4",
                      title: "Buyer refuses agreement · scored 54",
                      dateLabel: "Last week",
                      tone: "danger",
                      terminal: true,
                    },
                  ]}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </RecordDrawer>
    </div>
  );
}

/* ── Roster-drawer per-view value/label/tone helpers ───────────────────────── */

function rosterValue(view: RosterView, r: CoachingStanding): string {
  switch (view) {
    case "scenarios":
      return String(r.scenariosRun);
    case "practice":
      return `${r.practiceSessions}/${r.goal}`;
    default:
      return String(r.avgScore);
  }
}

function rosterLabel(view: RosterView, r: CoachingStanding): string {
  switch (view) {
    case "scenarios":
      return "drills";
    case "practice":
      return "sessions";
    case "behind":
      return `${r.pace}% pace`;
    default:
      return "avg score";
  }
}

function rosterValueTone(view: RosterView, r: CoachingStanding): string {
  if (view === "practice" || view === "scenarios") return "text-ink";
  if (view === "behind") return r.behind ? "text-danger" : "text-success";
  const t = scoreValueTone(r.avgScore);
  return t === "success" ? "text-success" : t === "warn" ? "text-warn" : "text-danger";
}
