import {
  GraduationCap,
  Trophy,
  Drama,
  Target,
  Flame,
  Award,
  TrendingUp,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { salesAgents, company } from "@/lib/data";
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

export default function CoachingPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* Header / hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.05] px-6 py-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-azure/20 blur-3xl" />
        <div className="grid-tech pointer-events-none absolute inset-0 opacity-[0.5]" />
        <div className="relative">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-azure-300/80">
              <GraduationCap className="h-3.5 w-3.5" /> Coaching Academy
            </span>
            <LiveDot tone="success" />
          </div>
          <h1 className="font-display text-3xl text-white md:text-[2.4rem]">Coaching Academy</h1>
          <p className="mt-1.5 max-w-2xl text-[0.92rem] leading-relaxed text-slate-300">
            AI scenario training &amp; contract-writing coaching for every broker. Drill live
            role-plays against a tireless AI client, sharpen your agreement language, and climb the
            board — built for {company.name}.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Pill tone="azure">
              <Drama className="h-3 w-3" /> {scenarios.length} role-play scenarios
            </Pill>
            <Pill tone="success">
              <Sparkles className="h-3 w-3" /> AI coach
            </Pill>
            <Pill tone="neutral">
              <Award className="h-3 w-3" /> Gamified leaderboard
            </Pill>
          </div>
        </div>
      </div>

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

      {/* Scenario trainer */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Live Scenario Training</SectionLabel>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <ScenarioTrainer />
      </section>

      {/* Contract coach */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Contract-Writing Coach</SectionLabel>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <ContractCoach />
      </section>

      {/* Leaderboard */}
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <SectionLabel>Academy Leaderboard</SectionLabel>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <Panel>
          <PanelHeader
            title="Top Trainees"
            subtitle="Ranked by avg score · practice streaks & drills completed"
            icon={<Trophy className="h-4 w-4" />}
            action={
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-azure/12 px-2.5 py-1 text-[0.72rem] font-semibold text-azure-bright ring-1 ring-inset ring-azure/20">
                <TrendingUp className="h-3.5 w-3.5" /> This season
              </span>
            }
          />
          <ul className="divide-y divide-white/[0.06]">
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
                        : "bg-white/[0.05] text-slate-300/70 ring-white/10",
                    )}
                  >
                    {i < 3 ? <Trophy className="h-4 w-4" /> : i + 1}
                  </span>

                  {/* Avatar initials */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-azure/20 to-azure-deep/30 text-[0.7rem] font-bold text-white ring-1 ring-inset ring-white/10">
                    {initials(s.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[0.86rem] font-semibold text-white">{s.name}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Pill tone="warn">
                          <Flame className="h-3 w-3" /> {s.streak}d
                        </Pill>
                        <span className="font-display text-[0.95rem] text-white tabular-nums">
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
                      <span className="shrink-0 text-[0.7rem] text-slate-300/70 tabular-nums">
                        {num(s.completed)} drills
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3">
            <p className="text-[0.72rem] text-slate-300/55">
              Scores blend conversation grades, completion, and streak consistency.
            </p>
            <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-azure-bright">
              <LiveDot tone="azure" /> Updates as agents drill
            </span>
          </div>
        </Panel>
      </section>
    </div>
  );
}
