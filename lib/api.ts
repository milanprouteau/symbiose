/**
 * Server-side API calls to College Basketball Data API.
 * These functions use the bearer token from env and should only
 * be called from server components / server actions.
 */

const BASE_URL = process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY = process.env.CBBD_API_KEY ?? "";

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

/* ── Response types (subset of what the API returns) ── */

export type ShotLocation = {
  x: number;
  y: number;
};

export type ShooterRef = {
  id: number | null;
  name: string | null;
};

export type ShotInfo = {
  shooter: ShooterRef;
  made: boolean;
  range: string;           // "rim" | "jumper" | "three_pointer" | "free_throw"
  assisted: boolean;
  assistedBy: ShooterRef;
  location: ShotLocation | null;
};

export type PlayRaw = {
  id: number;
  gameId: number;
  season: number;
  playType: string;
  scoreValue: number;
  playText: string;
  shotInfo: ShotInfo;
  team: string;
  opponent: string;
  period: number;
  clock: string;
  gameStartDate: string;
};

/* ── Public API functions ── */

/** Get all shooting plays for a given player + season */
export async function getPlayerShootingPlays(
  playerId: number,
  season = 2026
): Promise<PlayRaw[]> {
  return apiFetch<PlayRaw[]>(`/plays/player/${playerId}`, {
    season: String(season),
    shootingPlaysOnly: "true",
  });
}

/** Get team season stats */
export async function getTeamSeasonStats(team: string, season = 2026) {
  return apiFetch(`/stats/team/season`, { season: String(season), team });
}

/** Get player season stats for a team */
export async function getPlayerSeasonStats(team: string, season = 2026) {
  return apiFetch(`/stats/player/season`, { season: String(season), team });
}

/** Get player profile overview */
export async function getPlayerOverview(team: string, season = 2026) {
  return apiFetch(`/teams/roster`, { season: String(season), team });
}

/** Get team game-level player stats */
export async function getPlayerGameLog(team: string, season = 2026) {
  return apiFetch(`/games/players`, { season: String(season), team, seasonType: "regular" });
}

/** Get player shooting stats for a team */
export async function getPlayerShootingStats(team: string, season = 2026) {
  return apiFetch(`/stats/player/shooting/season`, {
    season: String(season),
    team,
  });
}
