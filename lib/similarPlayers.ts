import draftHistory from "@/data/draft-history.json";

export type DraftedPlayer = {
  name: string;
  team: string;
  overall: number;
  draftTeam: string;
  draftYear: number;
  athleteSourceId: string | null;
  position: string | null;
  // Original 7 stats
  points: number | null;
  assists: number | null;
  rebounds: number | null;
  steals: number | null;
  blocks: number | null;
  usage: number | null;
  fieldGoalsPct: number | null;
  // Enriched stats
  threePtPct: number | null;
  ftPct: number | null;
  topg: number | null;
  tsPct: number | null;
  orebPct: number | null;
  astToRatio: number | null;
};

export type SimilarPlayer = DraftedPlayer & { distance: number };

export const ALL_STAT_KEYS = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "fieldGoalsPct",
  "usage",
  "threePtPct",
  "ftPct",
  "topg",
  "tsPct",
  "orebPct",
  "astToRatio",
] as const;

export type StatKey = (typeof ALL_STAT_KEYS)[number];

export type StatWeights = Record<StatKey, number>;

export const DEFAULT_WEIGHTS: StatWeights = {
  points:      1,
  rebounds:    1,
  assists:     1,
  steals:      1,
  blocks:      1,
  fieldGoalsPct: 1,
  usage:       1,
  threePtPct:  1,
  ftPct:       1,
  topg:        1,
  tsPct:       1,
  orebPct:     1,
  astToRatio:  1,
};

// Keep players that have all 7 original stats
const validPlayers = (draftHistory as DraftedPlayer[]).filter(
  (p) =>
    p.points != null &&
    p.rebounds != null &&
    p.assists != null &&
    p.steals != null &&
    p.blocks != null &&
    p.fieldGoalsPct != null &&
    p.usage != null,
);

// Compute z-params per stat from non-null values
type ZParams = Record<StatKey, { mean: number; std: number }>;

function computeZParams(): ZParams {
  const result = {} as ZParams;
  for (const key of ALL_STAT_KEYS) {
    const values = validPlayers
      .map((p) => p[key] as number | null)
      .filter((v): v is number => v != null);
    const n = values.length || 1;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
    result[key] = { mean, std: Math.sqrt(variance) || 1 };
  }
  return result;
}

const zParams = computeZParams();

function zNorm(value: number, key: StatKey): number {
  return (value - zParams[key].mean) / zParams[key].std;
}

/**
 * Weighted Euclidean distance with null-skipping.
 * Normalizes by total active weight so distances stay comparable
 * regardless of how many stats are available for a historical player.
 */
function weightedDistance(
  current: Record<StatKey, number>,
  historical: DraftedPlayer,
  weights: StatWeights,
): number {
  let sum = 0;
  let totalWeight = 0;

  for (const key of ALL_STAT_KEYS) {
    const w = weights[key] ?? 0;
    if (w === 0) continue;

    const hVal = historical[key] as number | null;
    if (hVal == null) continue; // skip missing historical stats

    const zC = zNorm(current[key], key);
    const zH = zNorm(hVal, key);
    sum += w * (zC - zH) ** 2;
    totalWeight += w;
  }

  return totalWeight > 0 ? Math.sqrt(sum / totalWeight) : Infinity;
}

/** Convert distance to 0–100 match score */
export function distanceToScore(distance: number): number {
  return Math.max(0, Math.round(100 - distance * 20));
}

/**
 * Find the N most similar historical drafted players.
 * Backward-compatible wrapper using default weights.
 */
export function findSimilarPlayers(
  playerStats: {
    ppg: string;
    rpg: string;
    apg: string;
    spg: string;
    bpg: string;
    fgPct: number;
    usage: number;
  },
  n = 5,
): SimilarPlayer[] {
  return findSimilarPlayersWeighted(
    {
      points:        parseFloat(playerStats.ppg),
      rebounds:      parseFloat(playerStats.rpg),
      assists:       parseFloat(playerStats.apg),
      steals:        parseFloat(playerStats.spg),
      blocks:        parseFloat(playerStats.bpg),
      fieldGoalsPct: playerStats.fgPct,
      usage:         playerStats.usage,
      threePtPct:    0,
      ftPct:         0,
      topg:          0,
      tsPct:         0,
      orebPct:       0,
      astToRatio:    0,
    },
    { ...DEFAULT_WEIGHTS, threePtPct: 0, ftPct: 0, topg: 0, tsPct: 0, orebPct: 0, astToRatio: 0 },
    n,
  );
}

/**
 * Full weighted similarity with all 13 stats.
 */
export function findSimilarPlayersWeighted(
  stats: Record<StatKey, number>,
  weights: StatWeights,
  n = 5,
): SimilarPlayer[] {
  const scored = validPlayers.map((p) => ({
    ...p,
    distance: weightedDistance(stats, p, weights),
  }));

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, n);
}
