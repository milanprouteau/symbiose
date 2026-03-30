import draftHistory from "@/data/draft-history.json";

export type DraftedPlayer = {
  name: string;
  team: string;
  overall: number;
  draftTeam: string;
  draftYear: number;
  athleteSourceId: string | null;
  position: string | null;
  points: number | null;
  assists: number | null;
  rebounds: number | null;
  steals: number | null;
  blocks: number | null;
  usage: number | null;
  fieldGoalsPct: number | null;
};

export type SimilarPlayer = DraftedPlayer & {
  distance: number;
};

const STAT_KEYS = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "fieldGoalsPct",
  "usage",
] as const;

type StatKey = (typeof STAT_KEYS)[number];

/** Only keep players with all 7 stats defined */
const validPlayers = (draftHistory as DraftedPlayer[]).filter((p) =>
  STAT_KEYS.every((k) => p[k] != null)
);

/** Pre-compute mean and std for each stat */
function computeZParams(): { mean: Record<StatKey, number>; std: Record<StatKey, number> } {
  const n = validPlayers.length;
  const mean = {} as Record<StatKey, number>;
  const std = {} as Record<StatKey, number>;

  for (const key of STAT_KEYS) {
    const values = validPlayers.map((p) => p[key] as number);
    const m = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((a, v) => a + (v - m) ** 2, 0) / n;
    mean[key] = m;
    std[key] = Math.sqrt(variance) || 1; // avoid division by zero
  }

  return { mean, std };
}

const { mean, std } = computeZParams();

/** Z-normalize a single stat value */
function zNorm(value: number, key: StatKey): number {
  return (value - mean[key]) / std[key];
}

/** Compute Euclidean distance between two z-normalized stat vectors */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
}

/**
 * Find the N most similar historical drafted players to the given stats.
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
  n = 5
): SimilarPlayer[] {
  const currentVector = [
    zNorm(parseFloat(playerStats.ppg), "points"),
    zNorm(parseFloat(playerStats.rpg), "rebounds"),
    zNorm(parseFloat(playerStats.apg), "assists"),
    zNorm(parseFloat(playerStats.spg), "steals"),
    zNorm(parseFloat(playerStats.bpg), "blocks"),
    zNorm(playerStats.fgPct, "fieldGoalsPct"),
    zNorm(playerStats.usage, "usage"),
  ];

  const scored = validPlayers.map((p) => {
    const historicalVector = STAT_KEYS.map((k) => zNorm(p[k] as number, k));
    return {
      ...p,
      distance: euclideanDistance(currentVector, historicalVector),
    };
  });

  scored.sort((a, b) => a.distance - b.distance);
  return scored.slice(0, n);
}
