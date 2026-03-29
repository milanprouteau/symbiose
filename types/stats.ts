/* ─────────────────────────────────────────────
 *  TypeScript models for College Basketball Data API
 *  Mirrors the JSON shapes returned by:
 *    • /stats/player/season
 *    • /stats/player/shooting/season
 *    • /stats/team/season
 * ───────────────────────────────────────────── */

// ── Shared sub-types ──

export type FgSplit = {
  made: number;
  attempted: number;
  pct: number;
};

export type ReboundSplit = {
  offensive: number;
  defensive: number;
  total: number;
};

export type WinSharesSplit = {
  offensive: number;
  defensive: number;
  total: number;
  totalPer40: number;
};

// ── Player Season Stats (/stats/player/season) ──

export type PlayerSeasonStats = {
  season: number;
  seasonLabel: string;
  teamId: number;
  team: string;
  conference: string;
  athleteId: number;
  athleteSourceId: string;
  name: string;
  position: string;
  games: number;
  starts: number;
  minutes: number;
  points: number;
  turnovers: number;
  fouls: number;
  assists: number;
  steals: number;
  blocks: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  PORPAG: number;
  usage: number;
  assistsTurnoverRatio: number;
  offensiveReboundPct: number;
  freeThrowRate: number;
  effectiveFieldGoalPct: number;
  trueShootingPct: number;
  fieldGoals: FgSplit;
  twoPointFieldGoals: FgSplit;
  threePointFieldGoals: FgSplit;
  freeThrows: FgSplit;
  rebounds: ReboundSplit;
  winShares: WinSharesSplit;
};

// ── Player Shooting Stats (/stats/player/shooting/season) ──

export type ShotTypeSplit = {
  attempted: number;
  made: number;
  pct: number;
  assisted?: number;
  assistedPct?: number;
};

export type AttemptsBreakdown = {
  dunks: number;
  layups: number;
  tipIns: number;
  twoPointJumpers: number;
  threePointJumpers: number;
};

export type PlayerShootingStats = {
  season: number;
  teamId: number;
  team: string;
  conference: string;
  athleteId: number;
  athleteName: string;
  trackedShots: number;
  freeThrowRate: number;
  assistedPct: number;
  dunks: ShotTypeSplit;
  layups: ShotTypeSplit;
  tipIns: ShotTypeSplit;
  twoPointJumpers: ShotTypeSplit;
  threePointJumpers: ShotTypeSplit;
  freeThrows: Pick<ShotTypeSplit, "attempted" | "made" | "pct">;
  attemptsBreakdown: AttemptsBreakdown;
};

// ── Team Season Stats (/stats/team/season) ──

export type TurnoverSplit = {
  total: number;
  teamTotal: number;
};

export type FoulSplit = {
  total: number;
  technical: number;
  flagrant: number;
};

export type PointsSplit = {
  total: number;
  inPaint: number;
  offTurnovers: number;
  fastBreak: number;
};

export type FourFactors = {
  effectiveFieldGoalPct: number;
  turnoverRatio: number;
  offensiveReboundPct: number;
  freeThrowRate: number;
};

export type TeamStatsBlock = {
  assists: number;
  blocks: number;
  steals: number;
  possessions: number;
  trueShooting: number;
  rating: number;
  fieldGoals: FgSplit;
  twoPointFieldGoals: FgSplit;
  threePointFieldGoals: FgSplit;
  freeThrows: FgSplit;
  rebounds: ReboundSplit;
  turnovers: TurnoverSplit;
  fouls: FoulSplit;
  points: PointsSplit;
  fourFactors: FourFactors;
};

export type TeamSeasonStats = {
  season: number;
  seasonLabel: string;
  teamId: number;
  team: string;
  conference: string;
  games: number;
  wins: number;
  losses: number;
  totalMinutes: number;
  pace: number;
  teamStats: TeamStatsBlock;
  opponentStats: TeamStatsBlock;
};

// ── Player Profile (from /teams/roster) ──

export type PlayerProfile = {
  jersey: string | null;
  position: string | null;
  height: number | null;       // in inches
  weight: number | null;       // in lbs
  hometown: {
    city: string | null;
    state: string | null;
  } | null;
  dateOfBirth: string | null;
};

// ── Game Log Entry (from /games/players) ──

export type GameLogEntry = {
  date: string | null;
  opponent: string | null;
  isHome: boolean;
  seasonType: "regular" | "postseason";
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  starter: boolean;
};

// ── Combined player data bundle (what we cache locally) ──

export type PlayerDataBundle = {
  playerStats: PlayerSeasonStats;
  shootingStats: PlayerShootingStats;
  teamStats: TeamSeasonStats;
  profile?: PlayerProfile | null;
  gameLog?: GameLogEntry[];
};
