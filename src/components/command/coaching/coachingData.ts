/* ──────────────────────────────────────────────────────────────────────────
   MatinOS — Coaching section data (S9 ticket 2 & 3)

   The single source of truth for the Coaching surface, replacing the old
   `homesSold % 22` / magic `+2` formulas that drifted from the roster. Every
   number here is grounded in REAL data:
     • scorecards: src/lib/data/coaching-scorecards.json — per-agent
       practiceSessions / rubric / lastAttempt / managerReviewDue / GCI /
       conversion built on the real report-metrics agentLeaderboard slugs.
     • scenarios: the consolidated broker-approved drill library
       (coaching-scenarios.json) — ONE source, persona context bound to real
       Matin listings/communities (S9 ticket 3).

   Imported DIRECTLY by the Coaching page + workbench (NOT via the data.ts
   barrel, which other agents own).
   ────────────────────────────────────────────────────────────────────────── */

import scorecardsJson from "@/lib/data/coaching-scorecards.json";
import coachingScenariosJson from "@/lib/data/coaching-scenarios.json";
import type { CoachingScenario } from "@/lib/types";

/* ── Per-agent coaching standing (typed view over the JSON) ────────────────── */

export interface CoachingRubric {
  empathy: number;
  pricing: number;
  close: number;
  crm: number;
  speed: number;
}

export interface ScorecardRow {
  slug: string;
  name: string;
  title: string;
  practiceSessions: number;
  scenariosRun: number;
  rubric: CoachingRubric;
  lastAttempt: string;
  lastAttemptDaysAgo: number;
  managerReviewDue: boolean;
  weakest: string;
  closingsQtr: number;
  conversionPct: number;
  gci: number;
  conversionLift: number;
  deltaVsLastQuarter: number;
}

interface ScorecardFile {
  quarter: string;
  practiceGoal: number;
  expectedByNow: number;
  rosters: ScorecardRow[];
  pacingByMonth: {
    month: string;
    practiceCurrent: number;
    practicePrior: number;
    conversionCurrent: number;
    conversionPrior: number;
  }[];
}

const file = scorecardsJson as ScorecardFile;

export const COACHING_QUARTER = file.quarter;
export const PRACTICE_GOAL = file.practiceGoal;
export const EXPECTED_BY_NOW = file.expectedByNow;
/** Target conversion % a rep should be clearing — below this colors red. */
export const CONVERSION_TARGET = 18;
/** Average rubric score below which a manager review is also warranted. */
export const REVIEW_SCORE_FLOOR = 70;

/** Mean of the five rubric dimensions (the agent's average scorecard). */
export function rubricAvg(r: CoachingRubric): number {
  return Math.round((r.empathy + r.pricing + r.close + r.crm + r.speed) / 5);
}

/* ── The derived Coaching standing every pane binds to ─────────────────────── */

export interface CoachingStanding extends ScorecardRow {
  avgScore: number;
  goal: number;
  pace: number; // % of the quarter goal completed
  behind: boolean;
}

function toStanding(r: ScorecardRow): CoachingStanding {
  const avgScore = rubricAvg(r.rubric);
  const pace = Math.round((r.practiceSessions / PRACTICE_GOAL) * 100);
  return {
    ...r,
    avgScore,
    goal: PRACTICE_GOAL,
    pace,
    behind: r.practiceSessions < EXPECTED_BY_NOW,
  };
}

/** All standings, ranked by GCI then average scorecard (the ROI scoreboard). */
export const coachingStandings: CoachingStanding[] = file.rosters
  .map(toStanding)
  .sort((a, b) => b.gci - a.gci || b.avgScore - a.avgScore);

/** Pacing series for the recharts quarter chart (current vs prior). */
export const coachingPacing = file.pacingByMonth;

/* ── KPI roll-ups (reconcile EXACTLY to the standing rows) ─────────────────── */

export const coachingKpis = (() => {
  const rows = coachingStandings;
  const practiceSessions = rows.reduce((s, r) => s + r.practiceSessions, 0);
  const scenariosRun = rows.reduce((s, r) => s + r.scenariosRun, 0);
  const avgScorecard = Math.round(
    rows.reduce((s, r) => s + r.avgScore, 0) / (rows.length || 1),
  );
  const agentsBehind = rows.filter((r) => r.behind).length;
  // Reviews due is a REAL field on the data (managerReviewDue) — no magic +2.
  const reviewsDue = rows.filter((r) => r.managerReviewDue).length;
  // Average delta-vs-last-quarter (scorecard points) for the headline KPI delta.
  const avgScoreDelta = Math.round(
    rows.reduce((s, r) => s + r.deltaVsLastQuarter, 0) / (rows.length || 1),
  );
  // Real practice-sessions change vs the prior quarter, from the same pacing
  // series the chart uses (this-qtr practice total reconciles to practiceSessions).
  const practiceDelta = file.pacingByMonth.reduce(
    (s, m) => s + m.practiceCurrent - m.practicePrior,
    0,
  );
  return {
    practiceSessions,
    scenariosRun,
    avgScorecard,
    agentsBehind,
    reviewsDue,
    avgScoreDelta,
    practiceDelta,
    activeAgents: rows.length,
  };
})();

/** Team goal-pacing roll-up for the leadership PaceBar. */
export const teamPacing = (() => {
  const teamGoal = coachingStandings.reduce((s, r) => s + r.goal, 0);
  const teamDone = coachingKpis.practiceSessions;
  const teamPace = Math.round((teamDone / teamGoal) * 100);
  // Expected = the proportion of the goal that should be done by now.
  const teamExpected = Math.round((EXPECTED_BY_NOW / PRACTICE_GOAL) * 100);
  const teamForecast = Math.min(
    100,
    Math.round(teamPace * (PRACTICE_GOAL / EXPECTED_BY_NOW)),
  );
  return { teamGoal, teamDone, teamPace, teamExpected, teamForecast };
})();

/* ── Consolidated scenario library (S9 ticket 3 — ONE source) ──────────────── */

/** Synthetic "Zillow lead ghosting" drill, surfaced beside the broker-approved
    coaching_scenarios records (kept in sync with the workbench seed map). */
export const ZILLOW_SCENARIO: CoachingScenario = {
  id: "ZILLOW-GHOST",
  title: "Zillow lead ghosting",
  category: "Lead Conversion",
  prompt:
    "A Zillow inquiry went cold after two texts and a missed call over 17 days. Re-engage with a value-first break-up message that earns a reply without sounding desperate.",
};

/** The single ordered scenario library the page + workbench share. */
export const coachingScenarioLibrary: CoachingScenario[] = (() => {
  const records = coachingScenariosJson as CoachingScenario[];
  const byId = new Map(records.map((s) => [s.id, s]));
  const order = ["CS-001", "CS-002", "ZILLOW-GHOST", "CS-003", "CS-004", "CS-005", "CS-006"];
  return order
    .map((id) => (id === "ZILLOW-GHOST" ? ZILLOW_SCENARIO : byId.get(id)))
    .filter((s): s is CoachingScenario => Boolean(s));
})();

/** Total broker-approved drills (excludes the synthetic Zillow drill). */
export const brokerApprovedDrillCount = (coachingScenariosJson as CoachingScenario[]).length;

/* ── Per-agent rubric rows for the drawer (from REAL rubric, no wobble) ────── */

export type RubricTone = "success" | "warn" | "danger" | "gold";

export function rubricRowsFor(s: CoachingStanding): {
  label: string;
  value: number;
  tone: RubricTone;
}[] {
  const tone = (v: number): RubricTone =>
    v >= 85 ? "success" : v >= 70 ? "warn" : "danger";
  return [
    { label: "Empathy", value: s.rubric.empathy, tone: tone(s.rubric.empathy) },
    { label: "Pricing explanation", value: s.rubric.pricing, tone: tone(s.rubric.pricing) },
    { label: "Next-step close", value: s.rubric.close, tone: tone(s.rubric.close) },
    { label: "CRM hygiene", value: s.rubric.crm, tone: tone(s.rubric.crm) },
    // Speed-to-lead is the AI/active dimension — rendered in gold per the spec.
    { label: "Speed to lead", value: s.rubric.speed, tone: "gold" },
  ];
}

/* ── ROI scoreboard helpers (color-the-value-text, S9 ticket 1) ────────────── */

/** Tone for a conversion % value — green at/above target, red below. */
export function conversionTone(pct: number): "success" | "danger" {
  return pct >= CONVERSION_TARGET ? "success" : "danger";
}

/** Tone for an average scorecard value (green good / warn mid / red low). */
export function scoreValueTone(score: number): "success" | "warn" | "danger" {
  if (score >= 85) return "success";
  if (score >= 70) return "warn";
  return "danger";
}
