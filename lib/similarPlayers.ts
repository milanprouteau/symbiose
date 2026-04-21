import sispxMlAll from "@/data/sispx_ml_all.json";

export type MLPlayer = {
  name: string;
  team: string;
  draftYear: number;
  overall: number | null;
  draftTeam: string | null;
  position: string | null;
  posGroup: string;
  sisPx: number;
  sisPx_raw: number;
  sisPx_pts: number;
  sisPx_reb: number;
  sisPx_ast: number;
  sisPx_mpg: number;
  sisPx_stl: number;
  sisPx_blk: number;
  sisPx_porpag: number;
  proj_pts: number;
  proj_reb: number;
  proj_ast: number;
  proj_mpg: number;
  proj_stl: number | null;
  proj_blk: number | null;
};

export type SimilarPlayer = MLPlayer & { distance: number };

export const ALL_STAT_KEYS = [
  "sisPx_pts",
  "sisPx_reb",
  "sisPx_ast",
  "sisPx_mpg",
  "sisPx_stl",
  "sisPx_blk",
  "sisPx_porpag",
] as const;

export type StatKey = (typeof ALL_STAT_KEYS)[number];
export type StatWeights = Record<StatKey, number>;

export const DEFAULT_WEIGHTS: StatWeights = {
  sisPx_pts:    1,
  sisPx_reb:    1,
  sisPx_ast:    1,
  sisPx_mpg:    1,
  sisPx_stl:    1,
  sisPx_blk:    1,
  sisPx_porpag: 1,
};

// Weight applied to the total sisPx when computing distance — fixed, not user-adjustable.
// High enough to keep matches at a similar level, but not so high as to ignore profile shape.
const SISPX_TOTAL_WEIGHT = 3;

const validPlayers = (sispxMlAll as unknown as MLPlayer[]).filter(
  (p) => p.sisPx != null && p.posGroup != null,
);

type ZParams = Record<string, { mean: number; std: number }>;

function computeZParams(): ZParams {
  const result: ZParams = {};

  for (const key of ALL_STAT_KEYS) {
    const values = validPlayers
      .map((p) => p[key])
      .filter((v): v is number => v != null);
    const n = values.length || 1;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
    result[key] = { mean, std: Math.sqrt(variance) || 1 };
  }

  // Z-params for total sisPx
  const sisPxVals = validPlayers.map((p) => p.sisPx).filter((v) => v != null);
  const n = sisPxVals.length || 1;
  const mean = sisPxVals.reduce((a, b) => a + b, 0) / n;
  const variance = sisPxVals.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  result["sisPx"] = { mean, std: Math.sqrt(variance) || 1 };

  return result;
}

const zParams = computeZParams();

function zNorm(value: number, key: string): number {
  return (value - zParams[key].mean) / zParams[key].std;
}

function weightedDistance(
  current: Record<StatKey, number>,
  currentSisPx: number,
  historical: MLPlayer,
  weights: StatWeights,
): number {
  let sum = 0;
  let totalWeight = 0;

  for (const key of ALL_STAT_KEYS) {
    const w = weights[key] ?? 0;
    if (w === 0) continue;
    const hVal = historical[key];
    if (hVal == null) continue;
    const zC = zNorm(current[key], key);
    const zH = zNorm(hVal, key);
    sum += w * (zC - zH) ** 2;
    totalWeight += w;
  }

  // Total sisPx — anchors matches to a similar performance level
  const zCS = zNorm(currentSisPx, "sisPx");
  const zHS = zNorm(historical.sisPx, "sisPx");
  sum += SISPX_TOTAL_WEIGHT * (zCS - zHS) ** 2;
  totalWeight += SISPX_TOTAL_WEIGHT;

  return totalWeight > 0 ? Math.sqrt(sum / totalWeight) : Infinity;
}

export function distanceToScore(distance: number): number {
  return Math.max(0, Math.round(100 - distance * 20));
}

export function findSimilarPlayersWeighted(
  scores: Record<StatKey, number>,
  sisPxTotal: number,
  posGroup: string,
  weights: StatWeights,
  n = 5,
  filterByPos = true,
): SimilarPlayer[] {
  const pool = filterByPos
    ? validPlayers.filter((p) => p.posGroup === posGroup)
    : validPlayers;

  const scored = pool.map((p) => ({
    ...p,
    distance: weightedDistance(scores, sisPxTotal, p, weights),
  }));

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, n);
}
