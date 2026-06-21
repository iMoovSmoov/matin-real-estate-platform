"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Trophy,
  Drama,
  Target,
  Flame,
  BarChart2,
  ChevronRight,
  Clock,
  Users,
  DollarSign,
  X,
} from "lucide-react";
import { agents, salesAgents } from "@/lib/data";
import { cn, initials, num } from "@/lib/utils";
import {
  Panel,
  PanelHeader,
  StatTile,
  ProgressBar,
  Pill,
  LiveDot,
  SectionLabel,
} from "@/components/command/ui";
import { ScenarioTrainer } from "@/components/command/coaching/ScenarioTrainer";
import { ContractCoach } from "@/components/command/coaching/ContractCoach";
import { scenarios } from "@/components/command/coaching/scenarios";

/* ──────────────────────────────────────────────────────────────────────────
   Deterministic leaderboard — derived purely from each agent's stable stats
   ────────────────────────────────────────────────────────────────────────── */
interface Standing {
  slug: string;
  name: string;
  streak: number;
  completed: number;
  score: number;
}

function buildLeaderboard(): Standing[] {
  return [...salesAgents]
    .map((a): Standing => {
      const streak = 3 + ((a.homesSold + a.yearsExperience) % 26);
      const completed = 12 + ((a.homesSold * 2 + a.reviews) % 121);
      const score = Math.min(99, 72 + Math.round((a.rating - 4.5) * 50) + (a.homesSold % 9));
      return { slug: a.slug, name: a.name, streak, completed, score };
    })
    .sort((x, y) => y.score - x.score || y.completed - x.completed)
    .slice(0, 8);
}

const leaderboard = buildLeaderboard();
const topCompleted = Math.max(...leaderboard.map((s) => s.completed), 1);

const avgScore = Math.round(
  leaderboard.reduce((sum, s) => sum + s.score, 0) / (leaderboard.length || 1),
);


const MEDALS: Record<number, { ring: string; bg: string; text: string }> = {
  0: { ring: "ring-amber-300/40", bg: "bg-amber-300/15", text: "text-amber-300" },
  1: { ring: "ring-slate-200/40", bg: "bg-slate-200/12", text: "text-slate-200" },
  2: { ring: "ring-orange-400/40", bg: "bg-orange-400/12", text: "text-orange-300" },
};

function scoreTone(score: number): "success" | "warn" | "azure" {
  if (score >= 90) return "success";
  if (score >= 80) return "azure";
  return "warn";
}

/* ──────────────────────────────────────────────────────────────────────────
   Weekly Scorecard
   ────────────────────────────────────────────────────────────────────────── */
interface ScorecardRow {
  id: string;
  name: string;
  calls: number;
  texts: number;
  appts: number;
  agreements: number;
  showings: number;
  offers: number;
  score: number;
}

function computeScorecardRows(): ScorecardRow[] {
  return [...agents]
    .filter((a) => !a.leadership && !a.support)
    .slice(0, 8)
    .map((a): ScorecardRow => {
      const sw = a.scorecardWeek ?? { calls: 0, texts: 0, appts: 0, agreements: 0, showings: 0, offers: 0 };
      const raw =
        sw.calls * 2 +
        sw.texts * 1 +
        sw.appts * 8 +
        sw.agreements * 15 +
        sw.showings * 3 +
        sw.offers * 20;
      return {
        id: a.id,
        name: a.name,
        calls: sw.calls,
        texts: sw.texts,
        appts: sw.appts,
        agreements: sw.agreements,
        showings: sw.showings,
        offers: sw.offers,
        score: Math.min(100, raw),
      };
    })
    .sort((x, y) => y.score - x.score);
}

const scorecardRows = computeScorecardRows();

function scorecardScoreTone(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warn";
  return "text-danger";
}

/* ──────────────────────────────────────────────────────────────────────────
   ScorecardSlideOver — agent drill-down panel
   ────────────────────────────────────────────────────────────────────────── */
function ScorecardSlideOver({
  agent,
  onClose,
}: {
  agent: ScorecardRow | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!agent) return;
    const stored = typeof window !== "undefined"
      ? localStorage.getItem(`coaching_note_${agent.id}`) ?? ""
      : "";
    setNote(stored);
    setSaved(false);
  }, [agent?.id]);

  if (!agent) return null;

  function saveNote() {
    if (!agent) return;
    localStorage.setItem(`coaching_note_${agent.id}`, note);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const scorePb: "success" | "warn" | "danger" =
    agent.score >= 80 ? "success" : agent.score >= 50 ? "warn" : "danger";

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 bg-ink/[0.15]"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl sm:max-w-[480px] sm:border-l sm:border-ink/[0.08]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.08] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azure/20 to-azure-deep/30 text-[0.7rem] font-bold text-ink ring-1 ring-inset ring-ink/[0.06]">
              {initials(agent.name)}
            </span>
            <div className="leading-tight">
              <p className="font-semibold text-ink">{agent.name}</p>
              <p className="text-[0.72rem] text-slate/60">Weekly Drill-Down</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/[0.08] text-slate transition-colors hover:border-ink/20 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Score */}
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/60">
                Weekly Score
              </p>
              <span className={cn("font-display text-2xl tabular-nums", scorecardScoreTone(agent.score))}>
                {agent.score}
              </span>
            </div>
            <ProgressBar value={agent.score} tone={scorePb} />
          </div>

          {/* Activity breakdown */}
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/60">
              Activity This Week
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Calls", value: agent.calls },
                { label: "Texts", value: agent.texts },
                { label: "Appts", value: agent.appts },
                { label: "Agreements", value: agent.agreements },
                { label: "Showings", value: agent.showings },
                { label: "Offers", value: agent.offers },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center rounded-xl border border-ink/[0.08] bg-ink/[0.02] py-2"
                >
                  <span className="font-display text-xl tabular-nums text-ink">{item.value}</span>
                  <span className="text-[0.65rem] font-medium text-slate/60">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coaching Notes */}
          <div>
            <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate/60">
              Coaching Notes
            </p>
            <textarea
              ref={noteRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Add a note from your 1:1 with this agent…"
              className="w-full resize-none rounded-xl border border-ink/10 bg-white px-3 py-2 text-[0.86rem] text-ink placeholder:text-slate/35 focus:border-ink/30 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={saveNote}
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-700"
              >
                Save note
              </button>
              {saved && (
                <span className="text-sm font-medium text-success">Saved</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   LeaderboardPanel — extracted for sticky sidebar + metric selector
   ────────────────────────────────────────────────────────────────────────── */
type LbMetric = "score" | "streak" | "drills";

function LeaderboardPanel() {
  const [lbMetric, setLbMetric] = useState<LbMetric>("score");

  const sorted = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      if (lbMetric === "score") return b.score - a.score || b.completed - a.completed;
      if (lbMetric === "streak") return b.streak - a.streak || b.score - a.score;
      return b.completed - a.completed || b.score - a.score;
    });
  }, [lbMetric]);

  return (
    <Panel>
      <PanelHeader
        title="Top Trainees"
        subtitle="Ranked by avg score · practice streaks & drills completed"
        icon={<Trophy className="h-4 w-4" />}
        action={
          <div className="flex items-center gap-1 rounded-xl border border-ink/[0.08] bg-ink/[0.03] p-1">
            {(["score", "streak", "drills"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLbMetric(m)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold capitalize transition-colors",
                  lbMetric === m ? "bg-ink text-white" : "text-slate hover:text-ink",
                )}
              >
                {m === "score" ? "Score" : m === "streak" ? "Streak" : "Drills"}
              </button>
            ))}
          </div>
        }
      />
      <ul className="divide-y divide-ink/[0.06]">
        {sorted.map((s, i) => {
          const origRank = leaderboard.findIndex((x) => x.slug === s.slug);
          const medal = MEDALS[origRank];
          return (
            <li key={s.slug} className="flex items-center gap-3 px-5 py-3 transition-all duration-200">
              {/* Rank / medal */}
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-[0.92rem] tabular-nums ring-1 ring-inset",
                  medal
                    ? `${medal.bg} ${medal.text} ${medal.ring}`
                    : "bg-white text-slate/70 ring-ink/[0.06]",
                )}
              >
                {origRank < 3 ? <Trophy className="h-4 w-4" /> : origRank + 1}
              </span>

              {/* Avatar initials */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azure/20 to-azure-deep/30 text-[0.7rem] font-bold text-ink ring-1 ring-inset ring-ink/[0.06]">
                {initials(s.name)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[0.86rem] font-semibold text-ink">{s.name}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone="warn">
                      <Flame className="h-3 w-3" /> {s.streak}d
                    </Pill>
                    <span className="font-display text-[0.95rem] text-ink tabular-nums">
                      {lbMetric === "score" ? s.score : lbMetric === "streak" ? `${s.streak}d` : num(s.completed)}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <ProgressBar
                    value={(s.completed / topCompleted) * 100}
                    tone={scoreTone(s.score)}
                    className="flex-1"
                  />
                  <span className="shrink-0 text-[0.7rem] text-slate/70 tabular-nums">
                    {num(s.completed)} drills
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-ink/[0.08] px-5 py-3">
        <p className="text-[0.72rem] text-slate/55">
          Scores blend conversation grades, completion, and streak consistency.
        </p>
        <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-ink">
          <LiveDot tone="azure" /> Updates as agents drill
        </span>
      </div>
    </Panel>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────────────────────────────────── */
export default function CoachingPage() {
  const [selectedAgent, setSelectedAgent] = useState<ScorecardRow | null>(null);
  const [pendingScenario, setPendingScenario] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 px-4 pt-3 md:px-6">
      <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
        <h1 className="font-display text-[1.05rem] font-semibold text-ink">Coaching Academy</h1>
        <LiveDot tone="success" />
      </div>

      {/* Weekly Scorecards */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Weekly Agent Scorecards</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <Panel>
          <PanelHeader
            title="Weekly Agent Scorecards"
            subtitle="Activity this week · click a row to drill down"
            icon={<BarChart2 className="h-4 w-4" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[0.85rem]">
              <thead>
                <tr className="border-b border-ink/[0.08] bg-ink/[0.02]">
                  <th className="sticky left-0 z-10 bg-ink/[0.02] px-5 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Agent
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Calls
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Texts
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Appts
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Agreements
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Showings
                  </th>
                  <th className="px-3 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Offers
                  </th>
                  <th className="px-5 py-2.5 text-right text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {scorecardRows.map((row, i) => {
                  const isTop = i === 0;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedAgent(row)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-ink/[0.02]",
                        isTop && "bg-emerald-50/40",
                      )}
                    >
                      <td
                        className={cn(
                          "sticky left-0 z-10 px-5 py-3 text-ink",
                          isTop ? "bg-emerald-50/40 font-semibold" : "bg-white font-normal",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azure/20 to-azure-deep/30 text-[0.62rem] font-bold text-ink ring-1 ring-inset ring-ink/[0.06]">
                            {initials(row.name)}
                          </span>
                          {row.name}
                        </span>
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.calls}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.texts}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.appts}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.agreements}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.showings}
                      </td>
                      <td className={cn("px-3 py-3 text-right tabular-nums text-ink", isTop && "font-semibold")}>
                        {row.offers}
                      </td>
                      <td
                        className={cn(
                          "px-5 py-3 text-right font-display tabular-nums",
                          isTop && "font-semibold",
                          scorecardScoreTone(row.score),
                        )}
                      >
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-ink/[0.08] px-5 py-3">
            <p className="text-[0.72rem] text-slate/55">
              Score = calls×2 + texts×1 + appts×8 + agreements×15 + showings×3 + offers×20 · max 100 · click any row for drill-down
            </p>
          </div>
        </Panel>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
        <StatTile
          label="Scenarios Available"
          value={num(scenarios.length)}
          icon={<Drama className="h-4 w-4" />}
          hint="Across 6 skill categories"
          accent
        />
        <StatTile
          label="Avg Score"
          value={`${avgScore}`}
          icon={<Target className="h-4 w-4" />}
          hint="Top-8 trailing average"
        />
      </div>

      {/* Recommended This Week */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Recommended This Week</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              icon: <Clock className="h-4 w-4 text-amber-600" />,
              bg: "bg-amber-50/60 border-amber-200/60",
              iconBg: "bg-amber-100",
              label: "Appt-set rate below avg",
              scenario: "Lead wants to wait 6 months",
              id: "wait-6-months",
            },
            {
              icon: <Users className="h-4 w-4 text-blue-600" />,
              bg: "bg-blue-50/60 border-blue-200/60",
              iconBg: "bg-blue-100",
              label: "Buyer agreement conversion low",
              scenario: "Buyer refuses to sign buyer agreement",
              id: "buyer-agreement-refusal",
            },
            {
              icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
              bg: "bg-emerald-50/60 border-emerald-200/60",
              iconBg: "bg-emerald-100",
              label: "Listing appt prep",
              scenario: "Seller thinks Zillow is too high",
              id: "zillow-high",
            },
          ].map((rec) => (
            <button
              key={rec.id}
              type="button"
              onClick={() => {
                setPendingScenario(rec.id);
                document
                  .querySelector("[data-scenario-trainer]")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition-opacity hover:opacity-80",
                rec.bg,
              )}
            >
              <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", rec.iconBg)}>
                {rec.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-slate/60">
                  {rec.label}
                </p>
                <p className="mt-0.5 text-[0.86rem] font-semibold text-ink leading-snug">
                  {rec.scenario}
                </p>
              </div>
              <span className="mt-0.5 shrink-0 text-[0.72rem] font-semibold text-slate/50 flex items-center gap-0.5 whitespace-nowrap">
                Practice now <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Training + Leaderboard split (desktop: side-by-side) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Scenario trainer */}
          <section data-scenario-trainer>
            <div className="mb-2.5 flex items-center gap-2">
              <SectionLabel>Live Scenario Training</SectionLabel>
              <span className="h-px flex-1 bg-ink/[0.06]" />
            </div>
            <ScenarioTrainer
              startScenarioId={pendingScenario}
              onStarted={() => setPendingScenario(null)}
            />
          </section>

          {/* Contract coach */}
          <section>
            <div className="mb-2.5 flex items-center gap-2">
              <SectionLabel>Contract-Writing Coach</SectionLabel>
              <span className="h-px flex-1 bg-ink/[0.06]" />
            </div>
            <ContractCoach />
          </section>
        </div>

        {/* Leaderboard sidebar — sticky on desktop */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2.5 flex items-center gap-2 lg:hidden">
            <SectionLabel>Academy Leaderboard</SectionLabel>
            <span className="h-px flex-1 bg-ink/[0.06]" />
          </div>
          <LeaderboardPanel />
        </aside>
      </div>

      {/* Scorecard slide-over */}
      <ScorecardSlideOver
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
}
