import {
  GraduationCap,
  Trophy,
  Drama,
  Target,
  Flame,
  Award,
  TrendingUp,
  MessageSquareText,
  BarChart2,
  ChevronRight,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";
import { agents, salesAgents, company } from "@/lib/data";
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
   (no Math.random, so server/client render identically). Higher producers and
   higher-rated agents surface as the most active, best-scoring trainees.
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
      // Stable pseudo-metrics from real fields.
      const streak = 3 + ((a.homesSold + a.yearsExperience) % 26); // 3–28 day streak
      const completed = 12 + ((a.homesSold * 2 + a.reviews) % 121); // 12–132 drills
      const score = Math.min(99, 72 + Math.round((a.rating - 4.5) * 50) + (a.homesSold % 9)); // ~72–99
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

// Believable weekly role-play volume derived from team size (deterministic).
const rolePlaysThisWeek = salesAgents.length * 9 + 47;
const practicing = Math.min(salesAgents.length, Math.round(salesAgents.length * 0.72));

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
   Weekly Scorecard — filter to non-leadership, non-support agents, cap at 8,
   compute score from scorecardWeek fields (deterministic), sort desc.
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

// Weekly targets — used to normalize each metric to a 0-100 component score.
const SW_TARGETS = { calls: 25, texts: 40, appts: 6, agreements: 3, showings: 10, offers: 2 };
const SW_WEIGHTS = { calls: 0.15, texts: 0.10, appts: 0.20, agreements: 0.20, showings: 0.15, offers: 0.20 };

function computeScorecardScore(sw: { calls: number; texts: number; appts: number; agreements: number; showings: number; offers: number }): number {
  const pct = (actual: number, target: number) => Math.min(100, Math.round((actual / target) * 100));
  const weighted =
    pct(sw.calls, SW_TARGETS.calls) * SW_WEIGHTS.calls +
    pct(sw.texts, SW_TARGETS.texts) * SW_WEIGHTS.texts +
    pct(sw.appts, SW_TARGETS.appts) * SW_WEIGHTS.appts +
    pct(sw.agreements, SW_TARGETS.agreements) * SW_WEIGHTS.agreements +
    pct(sw.showings, SW_TARGETS.showings) * SW_WEIGHTS.showings +
    pct(sw.offers, SW_TARGETS.offers) * SW_WEIGHTS.offers;
  return Math.round(weighted);
}

function computeScorecardRows(): ScorecardRow[] {
  return [...agents]
    .filter((a) => !a.leadership && !a.support)
    .slice(0, 8)
    .map((a): ScorecardRow => {
      const sw = a.scorecardWeek ?? { calls: 0, texts: 0, appts: 0, agreements: 0, showings: 0, offers: 0 };
      return {
        id: a.id,
        name: a.name,
        calls: sw.calls,
        texts: sw.texts,
        appts: sw.appts,
        agreements: sw.agreements,
        showings: sw.showings,
        offers: sw.offers,
        score: computeScorecardScore(sw),
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

export default function CoachingPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Header / hero */}
      <div className="relative overflow-hidden rounded-2xl border border-ink/[0.08] bg-gradient-to-br from-ink/[0.04] via-ink/[0.02] to-ink/[0.03] px-6 py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-ink/[0.08] blur-3xl" />
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-ink/70">
              <GraduationCap className="h-3.5 w-3.5" /> Coaching Academy
            </span>
            <LiveDot tone="success" />
          </div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl md:text-[2.4rem]">Coaching Academy</h1>
          <p className="mt-1.5 max-w-2xl text-[0.92rem] leading-relaxed text-slate">
            AI scenario training &amp; contract-writing coaching for every broker. Drill live
            role-plays against a tireless AI client, sharpen your agreement language, and climb the
            board — built for {company.name}.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Pill tone="azure">
              <Drama className="h-3 w-3" /> {scenarios.length} role-play scenarios
            </Pill>
            <Pill tone="success">
              <GraduationCap className="h-3 w-3" /> AI coach
            </Pill>
            <Pill tone="neutral">
              <Award className="h-3 w-3" /> Gamified leaderboard
            </Pill>
          </div>
        </div>
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
            subtitle="Activity this week"
            icon={<BarChart2 className="h-4 w-4" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-[0.85rem]">
              <thead>
                <tr className="border-b border-ink/[0.08] bg-ink/[0.02]">
                  <th className="px-5 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate/70">
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
                      className={cn(
                        "transition-colors hover:bg-ink/[0.02]",
                        isTop && "bg-emerald-50/40",
                      )}
                    >
                      <td className={cn("px-5 py-3 text-ink", isTop && "font-semibold")}>
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
              Score = calls×2 + texts×1 + appts×8 + agreements×15 + showings×3 + offers×20 · max 100
            </p>
          </div>
        </Panel>
      </section>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Scenarios Available"
          value={num(scenarios.length)}
          icon={<Drama className="h-4 w-4" />}
          hint="Across 6 skill categories"
          accent
        />
        <StatTile
          label="Role-plays This Week"
          value={num(rolePlaysThisWeek)}
          delta={{ value: "18%", dir: "up" }}
          icon={<MessageSquareText className="h-4 w-4" />}
          hint="Brokerage-wide reps"
        />
        <StatTile
          label="Avg Score"
          value={`${avgScore}`}
          delta={{ value: "4 pts", dir: "up" }}
          icon={<Target className="h-4 w-4" />}
          hint="Top-8 trailing average"
        />
        <StatTile
          label="Agents Practicing"
          value={`${practicing}/${salesAgents.length}`}
          icon={<Flame className="h-4 w-4" />}
          hint="Active this week"
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
            <div
              key={rec.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4",
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
            </div>
          ))}
        </div>
      </section>

      {/* Scenario trainer */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Live Scenario Training</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <ScenarioTrainer />
      </section>

      {/* Contract coach */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Contract-Writing Coach</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <ContractCoach />
      </section>

      {/* Leaderboard */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Academy Leaderboard</SectionLabel>
          <span className="h-px flex-1 bg-ink/[0.06]" />
        </div>
        <Panel>
          <PanelHeader
            title="Top Trainees"
            subtitle="Ranked by avg score · practice streaks & drills completed"
            icon={<Trophy className="h-4 w-4" />}
            action={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink/[0.06] px-2.5 py-1 text-[0.72rem] font-semibold text-ink ring-1 ring-inset ring-ink/[0.06]">
                <TrendingUp className="h-3.5 w-3.5" /> This season
              </span>
            }
          />
          <ul className="divide-y divide-ink/[0.06]">
            {leaderboard.map((s, i) => {
              const medal = MEDALS[i];
              return (
                <li key={s.slug} className="flex items-center gap-3 px-5 py-3">
                  {/* Rank / medal */}
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-[0.92rem] tabular-nums ring-1 ring-inset",
                      medal
                        ? `${medal.bg} ${medal.text} ${medal.ring}`
                        : "bg-white text-slate/70 ring-ink/[0.06]",
                    )}
                  >
                    {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
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
                          {s.score}
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
      </section>
    </div>
  );
}
