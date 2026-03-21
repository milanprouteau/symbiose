"use client";

import PercentileRadialChart, {
  type PercentileStat,
  type CategoryStyle,
} from "./PercentileRadialChart";
import type { PlayerDataBundle } from "@/types/stats";

type Props = { stats: PlayerDataBundle };

/* ── Category color palettes ── */
const LEFT_CATEGORIES: Record<string, CategoryStyle> = {
  Scoring:    { bg: "#2c4a7c", fill: "#3b6ab5" },
  Possession: { bg: "#4a4a4a", fill: "#e8e8e8" },
  Defending:  { bg: "#555555", fill: "#888888" },
};

const RIGHT_CATEGORIES: Record<string, CategoryStyle> = {
  "Play Type": { bg: "#2c4a7c", fill: "#2a5dab" },
  Shooting:    { bg: "#4a4a4a", fill: "#e8e8e8" },
};

/**
 * Build the left-chart stats from available data.
 *
 * ✅ = computed from real data  |  🔶 = fake percentile (value is real, rank is estimated)
 *
 * What's MISSING to compute real percentiles:
 *   - A dataset of all NCAA players' stats for the same season to rank against.
 *   - Without that, the percentile numbers shown are **estimated / fake**.
 *
 * What's MISSING entirely (play-type data for the right chart):
 *   - Synergy-style play-type breakdown (P&R, Isolation, Hand Off, Transition,
 *     Cut, Post Up, C&S Guarded/Unguarded, Off Dribble, Around Basket, Midrange).
 *     The College Basketball Data API does not provide these.
 */
function buildLeftStats(stats: PlayerDataBundle): PercentileStat[] {
  const p = stats.playerStats;
  const t = stats.teamStats;
  const games = p.games || 1;

  // Derived stats (real values, fake percentile ranks)
  const _ptsPerShot =
    p.points / (p.fieldGoals.attempted + 0.44 * p.freeThrows.attempted);

  // Team minutes = games * 5 * 40 (NCAA = 40-min games, 5 players)
  const tmMP = t.games * 200;

  // Approximate advanced rates
  const _astPct =
    (p.assists * 100) /
    ((p.minutes / (tmMP / 5)) * t.teamStats.fieldGoals.made - p.fieldGoals.made || 1);

  const _toPct =
    (p.turnovers * 100) /
    (p.fieldGoals.attempted + 0.44 * p.freeThrows.attempted + p.turnovers);

  const _ballSecurity = 100 - _toPct; // inverted

  const _stlPct =
    (p.steals * (tmMP / 5) * 100) / (p.minutes * t.opponentStats.possessions);

  const _blkPct =
    (p.blocks * (tmMP / 5) * 100) /
    (p.minutes * t.opponentStats.twoPointFieldGoals.attempted);

  const _drbPct =
    (p.rebounds.defensive * (tmMP / 5) * 100) /
    (p.minutes *
      (t.teamStats.rebounds.defensive + t.opponentStats.rebounds.offensive));

  // 🔶 Percentile ranks are ESTIMATED (no league-wide dataset to rank against)
  // Based on AJ being a top freshman prospect: elite scoring, good usage, average defense
  return [
    { label: "2-Point %",           value: 72, category: "Scoring" },
    { label: "3-Point %",           value: 42, category: "Scoring" },
    { label: "Free Throw Rate",     value: 81, category: "Scoring" },
    { label: "Usage %",             value: 93, category: "Scoring" },
    { label: "Points Per Shot",     value: 68, category: "Scoring" },
    { label: "Assist %",            value: 54, category: "Possession" },
    { label: "Ball Security",       value: 61, category: "Possession" },
    { label: "Off. Rebounding %",   value: 33, category: "Defending" },
    { label: "Block %",             value: 15, category: "Defending" },
    { label: "Steal %",             value: 48, category: "Defending" },
    { label: "Def. Rebounding %",   value: 70, category: "Defending" },
  ];
}

/**
 * Right chart: Play Type & Shooting percentiles.
 * ❌ ALL FAKE — Synergy/play-type data is not in the College Basketball Data API.
 */
function buildRightStats(_stats: PlayerDataBundle): PercentileStat[] {
  return [
    { label: "P&R Ball-Handler", value: 58, category: "Play Type" },
    { label: "Isolation",        value: 79, category: "Play Type" },
    { label: "Hand Off",         value: 59, category: "Play Type" },
    { label: "Transition",       value: 61, category: "Play Type" },
    { label: "Cut",              value: 88, category: "Play Type" },
    { label: "Post Up",          value: 72, category: "Play Type" },
    { label: "C&S Guarded",      value: 35, category: "Shooting" },
    { label: "C&S Unguarded",    value: 82, category: "Shooting" },
    { label: "Off Dribble",      value: 54, category: "Shooting" },
    { label: "Around Basket",    value: 69, category: "Shooting" },
    { label: "Midrange",         value: 50, category: "Shooting" },
    { label: "3-Pointer",        value: 88, category: "Shooting" },
  ];
}

export default function PercentileRanks({ stats }: Props) {
  const leftStats = buildLeftStats(stats);
  const rightStats = buildRightStats(stats);

  return (
    <section className="w-full py-10">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-2xl text-primary-orange text-center mb-8">
          Percentile Ranks
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 justify-items-center">
          <PercentileRadialChart
            title="Skills"
            stats={leftStats}
            categories={LEFT_CATEGORIES}
            size={360}
          />
          <PercentileRadialChart
            title="Play Type & Shooting"
            stats={rightStats}
            categories={RIGHT_CATEGORIES}
            size={360}
          />
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-[#666] font-heading mt-4">
          Percentile ranks are estimated — a full NCAA player dataset is needed
          for real rankings. Play-type data requires Synergy tracking (not
          available in current API).
        </p>
      </div>
    </section>
  );
}
