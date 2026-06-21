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
} from "lucide-react";
import { salesAgents, coachingScenarios } from "@/lib/data";
import { useAiSidecar } from "@/components/os";
import {
  KpiStrip,
  KpiCard,
  PaceBar,
  ProgressTrack,
  DataTable,
  TwoLineCell,
  Avatar,
  ScoreChip,
  ScoreRing,
  StatusChip,
  Dot,
  RecordDrawer,
  CalloutCard,
  AIActionCard,
  MilestoneTimeline,
  EmptyState,
  type Column,
} from "@/components/os";
import { MatinMark } from "@/components/brand/Logo";
import { streamAi } from "@/lib/ai/client";
import { CoachingWorkbench } from "@/components/command/coaching/CoachingWorkbench";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching  (ref §2.9)

   AI Coaching + Scenario Training. Renders inside AppShell (TopCommandBar owns
   the "Coaching" title — no page <h1>, only a muted subtitle). Composes
   @/components/os primitives + the CoachingWorkbench three-pane surface.

   MAKE-IT-REAL: KPI tiles drill into a real on-screen roster drawer (not the AI
   panel); leaderboard rows open a per-agent coaching-plan drawer; the plan is
   STREAMED inline via streamAi('report_agent_coach') into an AIActionCard; the
   ONLY path to the global AI sidecar is the explicit "Ask Matin" affordances.
   Real agent photos via Avatar; the live roleplay streams in the workbench.
   ────────────────────────────────────────────────────────────────────────── */

interface Standing {
  slug: string;
  name: string;
  title: string;
  scenariosRun: number;
  avgScore: number;
  goal: number; // target practice sessions this quarter
  done: number; // completed this quarter
  pace: number; // % of pace expected by now
  behind: boolean;
  weakest: string;
}

const SKILLS = ["Empathy", "Pricing explanation", "Next-step close", "CRM hygiene", "Speed to lead"];

function buildStandings(): Standing[] {
  return [...salesAgents]
    .filter((a) => !a.leadership && a.scorecardWeek)
    .slice(0, 8)
    .map((a): Standing => {
      const scenariosRun = 6 + ((a.homesSold + a.reviews) % 22);
      const avgScore = Math.min(98, 58 + Math.round((a.rating - 4.5) * 40) + (a.homesSold % 12));
      const goal = 12;
      const done = 3 + ((a.homesSold * 3 + a.reviews) % 11);
      const expected = 9; // pace marker — should be ~9 of 12 by now
      const pace = Math.round((done / goal) * 100);
      const behind = done < expected;
      const weakest = SKILLS[(a.homesSold + a.reviews) % SKILLS.length];
      return { slug: a.slug, name: a.name, title: a.title, scenariosRun, avgScore, goal, done, pace, behind, weakest };
    })
    .sort((x, y) => y.avgScore - x.avgScore || y.scenariosRun - x.scenariosRun);
}

function scoreValueTone(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warn";
  return "text-danger";
}

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
  const standings = useMemo(buildStandings, []);

  const [selected, setSelected] = useState<Standing | null>(null);
  const [drawerTab, setDrawerTab] = useState("plan");
  const [roster, setRoster] = useState<RosterView | null>(null);

  // Streamed coaching plan per agent (AIActionCard inline result).
  const [planState, setPlanState] = useState<{ running: boolean; text: string } | null>(null);
  const planRunningRef = useRef(false);

  // KPI roll-ups reconcile to the standings rows below them.
  const totalScenariosRun = standings.reduce((s, r) => s + r.scenariosRun, 0);
  const practiceSessions = standings.reduce((s, r) => s + r.done, 0);
  const avgScorecard = Math.round(
    standings.reduce((s, r) => s + r.avgScore, 0) / (standings.length || 1),
  );
  const agentsBehind = standings.filter((r) => r.behind).length;
  const reviewsDue = standings.filter((r) => r.avgScore < 75).length + 2;

  // Leadership goal pacing — team practice-session completion vs. quarter target.
  const teamGoal = standings.reduce((s, r) => s + r.goal, 0);
  const teamDone = practiceSessions;
  const teamPace = Math.round((teamDone / teamGoal) * 100);
  const teamExpected = 75; // dashed Pace marker
  const teamForecast = Math.min(100, Math.round(teamPace * (12 / 9))); // straight-line forecast

  function openAgent(s: Standing) {
    setSelected(s);
    setDrawerTab("plan");
    setPlanState(null);
  }

  // Stream the AI coaching plan INLINE (no sidecar) into the AIActionCard.
  async function runPlan(s: Standing) {
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
                `Agent: ${s.name} (${s.title}). Quarter practice: ${s.done} of ${s.goal} sessions ` +
                `(${s.pace}% — ${s.behind ? "behind" : "on"} pace). Average scorecard: ${s.avgScore}. ` +
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

  const columns: Column<Standing>[] = [
    {
      key: "name",
      header: "Agent",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.name} slug={r.slug} size={32} ring />
          <TwoLineCell title={r.name} sub={r.title} />
        </div>
      ),
    },
    {
      key: "scenariosRun",
      header: "Drills",
      align: "right",
      sortable: true,
      render: (r) => <span className="tabular-nums text-ink">{r.scenariosRun}</span>,
    },
    {
      key: "weakest",
      header: "Weakest skill",
      render: (r) => (
        <StatusChip tone="warn" variant="soft">
          {r.weakest}
        </StatusChip>
      ),
    },
    {
      key: "done",
      header: "Goal pace",
      width: "150px",
      render: (r) => (
        <ProgressTrack
          label=""
          value={r.pace}
          tone={r.behind ? "danger" : "success"}
          valueRight={
            <span className="tabular-nums">
              {r.done}/{r.goal}
            </span>
          }
        />
      ),
    },
    {
      key: "avgScore",
      header: "Avg score",
      align: "right",
      sortable: true,
      render: (r) => <ScoreChip score={r.avgScore} suffix="" />,
    },
  ];

  // Rows the roster drawer shows for a given KPI view.
  const rosterRows = useMemo<Standing[]>(() => {
    if (!roster) return [];
    switch (roster) {
      case "behind":
        return standings.filter((r) => r.behind);
      case "reviews":
        return standings.filter((r) => r.avgScore < 75);
      case "avgScore":
        return [...standings].sort((a, b) => b.avgScore - a.avgScore);
      case "scenarios":
        return [...standings].sort((a, b) => b.scenariosRun - a.scenariosRun);
      case "practice":
      default:
        return [...standings].sort((a, b) => b.done - a.done);
    }
  }, [roster, standings]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-4 md:px-6">
      {/* Subtitle / eyebrow (no h1 — TopCommandBar owns the section title) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] leading-snug text-slate">
          Coach agents and brokers with scorecards, roleplay, and real CRM outcomes.
        </p>
        {/* The ONLY explicit "Ask Matin" entry into the global AI sidecar. */}
        <button
          type="button"
          onClick={() => openAi("Coaching / Team performance overview")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.78rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
        >
          <MatinMark theme="dark" className="h-3.5 w-3.5" />
          Ask Matin
        </button>
      </div>

      {/* KPI strip — each tile drills into the on-screen roster drawer */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Practice sessions"
          value={practiceSessions}
          icon={<GraduationCap className="h-4 w-4" aria-hidden />}
          delta="this quarter"
          deltaTone="up"
          hint="Completed roleplay drills across the team"
          onDrill={() => setRoster("practice")}
        />
        <KpiCard
          label="Avg scorecard"
          value={avgScorecard}
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          valueTone={avgScorecard >= 80 ? "success" : "ink"}
          delta="rubric-weighted"
          deltaTone="flat"
          hint="Mean across all scored attempts"
          onDrill={() => setRoster("avgScore")}
        />
        <KpiCard
          label="Agents behind pace"
          value={agentsBehind}
          icon={<TrendingDown className="h-4 w-4" aria-hidden />}
          valueTone={agentsBehind > 0 ? "danger" : "success"}
          delta={`of ${standings.length} active`}
          deltaTone="down"
          hint="Below the quarter practice goal"
          onDrill={() => setRoster("behind")}
        />
        <KpiCard
          label="Reviews due"
          value={reviewsDue}
          icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
          valueTone="ink"
          delta="manager review"
          deltaTone="flat"
          hint="Attempts awaiting manager sign-off"
          onDrill={() => setRoster("reviews")}
        />
        <KpiCard
          label="Scenarios run"
          value={totalScenariosRun}
          icon={<Activity className="h-4 w-4" aria-hidden />}
          delta="all-time"
          deltaTone="up"
          hint={`Across ${coachingScenarios.length + 1} broker-approved drills`}
          onDrill={() => setRoster("scenarios")}
        />
      </KpiStrip>

      {/* Three-pane coaching workbench (live roleplay streams inline here) */}
      <CoachingWorkbench
        scenarios={coachingScenarios}
        onAskAi={(ctx) => openAi(ctx)}
      />

      {/* Leadership goal-pacing + leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Goal pacing (leadership view) */}
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
          <div className="mt-4 border-t border-mist pt-3">
            <CalloutCard
              tone="ai"
              title="Coaching focus this week"
              action={
                <button
                  type="button"
                  onClick={() => openAi("Coaching / Team pacing & focus")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                >
                  <MatinMark theme="dark" className="h-3.5 w-3.5" />
                  Ask Matin
                </button>
              }
            >
              {agentsBehind} agents are behind on practice and the lowest team rubric is{" "}
              <span className="text-cloud">Next-step close</span>. Recommend assigning the{" "}
              <span className="text-cloud">&ldquo;Buyer refuses agreement&rdquo;</span> and{" "}
              <span className="text-cloud">&ldquo;Cash offer explanation&rdquo;</span> drills, each
              tied to a CRM task in Today.
            </CalloutCard>
          </div>
        </section>

        {/* Per-agent leaderboard */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="font-display text-[1rem] font-normal text-ink">Agent leaderboard</h2>
            <span className="text-[0.72rem] text-slate">Click a row for the coaching plan</span>
          </div>
          <DataTable<Standing>
            columns={columns}
            rows={standings}
            getRowId={(r) => r.slug}
            onRowClick={openAgent}
            utilityLeft={<span className="text-[0.78rem] text-slate">Showing {standings.length} active agents</span>}
          />
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
                    className="flex w-full items-center gap-3 rounded-xl border border-mist bg-cloud px-3 py-2.5 text-left transition-colors hover:border-ink/20 hover:bg-paper-200/50"
                  >
                    <Avatar name={r.name} slug={r.slug} size={34} ring />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.86rem] font-semibold text-ink">{r.name}</p>
                      <p className="truncate text-[0.74rem] text-slate">{r.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-[0.95rem] font-bold tabular-nums ${scoreValueTone(r.avgScore)}`}>
                        {roster === "scenarios" ? r.scenariosRun : roster === "practice" ? `${r.done}/${r.goal}` : r.avgScore}
                      </p>
                      <p className="text-[0.66rem] uppercase tracking-[0.1em] text-slate">
                        {roster === "scenarios" ? "drills" : roster === "practice" ? "sessions" : roster === "behind" ? `${r.pace}% pace` : "avg score"}
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

      {/* ── Per-agent coaching-plan drawer (real content + inline AI plan) ── */}
      <RecordDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.title} · Coaching plan` : undefined}
        tabs={[
          { key: "plan", label: "Plan" },
          { key: "rubric", label: "Rubric" },
          { key: "history", label: "Attempts" },
        ]}
        activeTab={drawerTab}
        onTab={setDrawerTab}
        actions={
          selected ? (
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-mist px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openAi(`Coaching / ${selected.name} coaching plan`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
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
            {/* Hero score — identity + ring */}
            <div className="flex items-center gap-4 rounded-xl border border-mist bg-paper-200/40 px-4 py-3.5">
              <Avatar name={selected.name} slug={selected.slug} size={46} ring />
              <ScoreRing value={selected.avgScore} size={56} />
              <div className="min-w-0">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Quarter goal
                </p>
                <p className="mt-0.5 font-sans text-[1.4rem] font-bold leading-none tabular-nums text-ink">
                  {selected.done}
                  <span className="text-[0.9rem] font-medium text-slate">/{selected.goal}</span>
                </p>
                <div className="mt-1.5">
                  <StatusChip tone={selected.behind ? "danger" : "success"} variant="soft">
                    <Dot tone={selected.behind ? "danger" : "success"} />
                    {selected.behind ? "Behind pace" : "On pace"}
                  </StatusChip>
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
                    evidence={`Weakest skill is ${selected.weakest} (${selected.avgScore} avg); ${selected.done}/${selected.goal} practice sessions this quarter${selected.behind ? " — behind pace." : "."}`}
                    confidence="High"
                    runLabel={planState?.text ? "Regenerate" : "Generate plan"}
                    running={planState?.running ?? false}
                    result={planState?.text ? planState.text : undefined}
                    onRun={() => runPlan(selected)}
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
                      Appears in Today
                    </StatusChip>
                    <StatusChip tone="success" variant="soft">
                      Writes activity_event
                    </StatusChip>
                  </div>
                </div>
              </>
            ) : null}

            {drawerTab === "rubric" ? (
              <div>
                <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Skill rubric
                </p>
                <div className="space-y-3">
                  {agentRubric(selected).map((r) => (
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
                  Rubric-weighted from {selected.scenariosRun} scored drills · stored to the agent
                  record and surfaced in Reports.
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
                    { id: "m1", title: "Commission objection · scored 88", dateLabel: "Today", tone: "success" },
                    {
                      id: "m2",
                      title: `${selected.weakest} drill · scored ${Math.max(40, selected.avgScore - 18)}`,
                      dateLabel: "2 days ago",
                      tone: "warn",
                    },
                    { id: "m3", title: "Manager review — Jordan Matin", dateLabel: "Last week", tone: "info" },
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

/* Deterministic per-agent rubric for the drawer — derived from the standing. */
function agentRubric(s: Standing) {
  const base = s.avgScore;
  const wobble = (n: number) => Math.max(38, Math.min(98, base + n));
  const tone = (v: number) =>
    v >= 85 ? ("success" as const) : v >= 70 ? ("warn" as const) : ("danger" as const);
  const rows = [
    { label: "Empathy", value: wobble(8) },
    { label: "Pricing explanation", value: wobble(-6) },
    { label: "Next-step close", value: wobble(-14) },
    { label: "CRM hygiene", value: wobble(11) },
    { label: "Speed to lead", value: wobble(-2) },
  ];
  return rows.map((r) => ({
    ...r,
    value: r.label === s.weakest ? Math.min(r.value, base - 16) : r.value,
    tone: r.label === "Speed to lead" ? ("gold" as const) : tone(r.value),
  }));
}
