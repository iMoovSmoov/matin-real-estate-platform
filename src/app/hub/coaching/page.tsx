"use client";

import { useMemo, useState } from "react";
import {
  Dumbbell,
  Gauge,
  TrendingDown,
  ClipboardCheck,
  Drama,
  Sparkles,
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
  InitialsToken,
  ScoreChip,
  StatusChip,
  RecordDrawer,
  CalloutCard,
  MilestoneTimeline,
  type Column,
} from "@/components/os";
import { CoachingWorkbench } from "@/components/command/coaching/CoachingWorkbench";

/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching  (ref §2.9)

   AI Coaching + Scenario Training. The page renders inside AppShell, so the
   TopCommandBar already shows the "Coaching" section name — no page <h1> here,
   only a muted subtitle. Composes @/components/os primitives + the
   CoachingWorkbench three-pane surface.
   ────────────────────────────────────────────────────────────────────────── */

/* ── Deterministic per-agent coaching standing, derived from real agent stats ── */
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
      return {
        slug: a.slug,
        name: a.name,
        title: a.title,
        scenariosRun,
        avgScore,
        goal,
        done,
        pace,
        behind,
        weakest,
      };
    })
    .sort((x, y) => y.avgScore - x.avgScore || y.scenariosRun - x.scenariosRun);
}

function scoreValueTone(score: number): string {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warn";
  return "text-danger";
}

export default function CoachingPage() {
  const { openAi } = useAiSidecar();
  const standings = useMemo(buildStandings, []);
  const [selected, setSelected] = useState<Standing | null>(null);

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

  const columns: Column<Standing>[] = [
    {
      key: "name",
      header: "Agent",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <InitialsToken name={r.name} />
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

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-4 md:px-6">
      {/* Subtitle / eyebrow (no h1 — TopCommandBar owns the section title) */}
      <p className="text-[0.8rem] leading-snug text-slate">
        Coach agents and brokers with scorecards, roleplay, and real CRM outcomes.
      </p>

      {/* KPI strip */}
      <KpiStrip className="xl:grid-cols-5">
        <KpiCard
          label="Practice sessions"
          value={practiceSessions}
          icon={<Dumbbell className="h-4 w-4" aria-hidden />}
          delta="this quarter"
          deltaTone="up"
          hint="Completed roleplay drills across the team"
          onDrill={() => openAi("Context: Coaching / Practice sessions this quarter")}
        />
        <KpiCard
          label="Avg scorecard"
          value={avgScorecard}
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          valueTone={avgScorecard >= 80 ? "success" : "ink"}
          delta="rubric-weighted"
          deltaTone="flat"
          hint="Mean across all scored attempts"
          onDrill={() => openAi("Context: Coaching / Average scorecard")}
        />
        <KpiCard
          label="Agents behind pace"
          value={agentsBehind}
          icon={<TrendingDown className="h-4 w-4" aria-hidden />}
          valueTone={agentsBehind > 0 ? "danger" : "success"}
          delta={`of ${standings.length} active`}
          deltaTone="down"
          hint="Below the quarter practice goal"
          onDrill={() => openAi("Context: Coaching / Agents behind pace")}
        />
        <KpiCard
          label="Reviews due"
          value={reviewsDue}
          icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
          valueTone="ink"
          delta="manager review"
          deltaTone="flat"
          hint="Attempts awaiting manager sign-off"
          onDrill={() => openAi("Context: Coaching / Manager reviews due")}
        />
        <KpiCard
          label="Scenarios run"
          value={totalScenariosRun}
          icon={<Drama className="h-4 w-4" aria-hidden />}
          delta="all-time"
          deltaTone="up"
          hint={`Across ${coachingScenarios.length + 1} broker-approved drills`}
          onDrill={() => openAi("Context: Coaching / Scenarios run")}
        />
      </KpiStrip>

      {/* Three-pane coaching workbench */}
      <CoachingWorkbench scenarios={coachingScenarios} onOpenAi={openAi} />

      {/* Leadership goal-pacing + leaderboard */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Goal pacing (leadership view) */}
        <section className="rounded-2xl border border-mist bg-cloud p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-[1rem] font-normal text-ink">
              Team practice goal
            </h2>
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
                  onClick={() => openAi("Context: Coaching / Team pacing & focus")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[0.76rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Assign drills
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
            onRowClick={(r) => setSelected(r)}
            utilityLeft={<span className="text-[0.78rem] text-slate">active agents</span>}
          />
        </section>
      </div>

      {/* Per-agent coaching-plan drawer */}
      <RecordDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected ? `${selected.title} · Coaching plan` : undefined}
        actions={
          selected ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-mist px-3 py-2 text-[0.8rem] font-medium text-slate transition-colors hover:border-ink/20 hover:text-ink"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  openAi(`Context: Coaching / ${selected.name} coaching plan`);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-[0.8rem] font-semibold text-ink transition-colors hover:bg-gold-bright"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Generate plan in Matin AI
              </button>
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <div className="space-y-5">
            {/* Hero score */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-mist bg-paper-200/40 px-4 py-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Avg scorecard
                </p>
                <p
                  className={`mt-1 font-sans text-[1.7rem] font-bold leading-none tabular-nums ${scoreValueTone(
                    selected.avgScore,
                  )}`}
                >
                  {selected.avgScore}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                  Quarter goal
                </p>
                <p className="mt-1 font-sans text-[1.7rem] font-bold leading-none tabular-nums text-ink">
                  {selected.done}
                  <span className="text-[1rem] font-medium text-slate">/{selected.goal}</span>
                </p>
              </div>
            </div>

            {/* Rubric breakdown */}
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
            </div>

            {/* Auto coaching plan */}
            <div className="rounded-xl border border-mist bg-paper-200/40 p-4">
              <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                Auto-created coaching plan
              </p>
              <p className="text-[0.84rem] leading-relaxed text-ink">
                Weakest skill is{" "}
                <span className="font-semibold">{selected.weakest}</span> ({selected.avgScore} avg).
                Plan: 3 practice calls on {selected.weakest.toLowerCase()}, one manager review, and a
                CRM task to call two active sellers today.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <StatusChip tone="info" variant="soft">
                  Appears in Today
                </StatusChip>
                <StatusChip tone="success" variant="soft">
                  Writes activity_event
                </StatusChip>
              </div>
            </div>

            {/* Attempt history */}
            <div>
              <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate">
                Recent attempts
              </p>
              <MilestoneTimeline
                milestones={[
                  {
                    id: "m1",
                    title: "Commission objection · scored 88",
                    dateLabel: "Today",
                    tone: "success",
                  },
                  {
                    id: "m2",
                    title: `${selected.weakest} drill · scored ${Math.max(40, selected.avgScore - 18)}`,
                    dateLabel: "2 days ago",
                    tone: "warn",
                  },
                  {
                    id: "m3",
                    title: "Manager review — Jordan Matin",
                    dateLabel: "Last week",
                    tone: "info",
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
  // Force the agent's declared weakest skill to be the lowest bar (gold tone on speed).
  return rows.map((r) => ({
    ...r,
    value: r.label === s.weakest ? Math.min(r.value, base - 16) : r.value,
    tone: r.label === "Speed to lead" ? ("gold" as const) : tone(r.value),
  }));
}
