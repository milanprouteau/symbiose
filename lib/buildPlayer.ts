import type { PlayerDataBundle } from "@/types/stats";
import type { Player } from "@/types/player";

/** Convert height in inches to a "6'3"" string */
function formatHeight(inches: number | null | undefined): string | null {
  if (!inches) return null;
  const totalCm = Math.round(inches * 2.54);
  const m = Math.floor(totalCm / 100);
  const cm = totalCm % 100;
  return `${m}m${cm.toString().padStart(2, "0")}`;
}


function formatWeight(lbs: number | null | undefined): string | null {
  if (!lbs) return null;
  return `${Math.round(lbs * 0.453592)} kg`;
}

/** Build a team logo slug from the team name */
function teamSlug(team: string): string {
  return team.toLowerCase().replace(/ /g, "-");
}

/** Format ISO date string to readable format */
function formatDob(dob: string | null | undefined): string | null {
  if (!dob) return null;
  try {
    const d = new Date(dob);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dob;
  }
}

/**
 * Build a centralized, formatted Player model
 * from the raw PlayerDataBundle fetched at build time.
 */
export function buildPlayer(bundle: PlayerDataBundle): Player {
  const s = bundle.playerStats;
  const p = bundle.profile;
  const games = s.games || 1;

  return {
    // Identity
    id: s.athleteId,
    name: s.name,
    jersey: p?.jersey ?? null,
    position: p?.position ?? s.position,
    team: s.team,
    conference: s.conference,
    athleteId: s.athleteId,

    // Bio
    height: formatHeight(p?.height),
    heightInches: p?.height ?? null,
    weight: formatWeight(p?.weight),
    weightRaw: p?.weight ?? null,
    hometown: p?.hometown
      ? [p.hometown.city, p.hometown.state].filter(Boolean).join(", ") || null
      : null,
    dateOfBirth: formatDob(p?.dateOfBirth),

    // Image paths
    photoUrl: `/players/${s.athleteId}.png`,
    teamLogoUrl: `/uni/${teamSlug(s.team)}.png`,

    // Per-game averages
    ppg: (s.points / games).toFixed(1),
    rpg: (s.rebounds.total / games).toFixed(1),
    apg: (s.assists / games).toFixed(1),
    mpg: (s.minutes / games).toFixed(1),
    spg: (s.steals / games).toFixed(1),
    bpg: (s.blocks / games).toFixed(1),
    topg: (s.turnovers / games).toFixed(1),
    fpg: (s.fouls / games).toFixed(1),

    // Season totals
    games: s.games,
    starts: s.starts,
    minutes: s.minutes,
    points: s.points,
    assists: s.assists,
    steals: s.steals,
    blocks: s.blocks,
    turnovers: s.turnovers,
    fouls: s.fouls,

    // Rebounds
    reboundsTotal: s.rebounds.total,
    reboundsOffensive: s.rebounds.offensive,
    reboundsDefensive: s.rebounds.defensive,

    // Shooting
    fgPct: s.fieldGoals.pct,
    fgMade: s.fieldGoals.made,
    fgAttempted: s.fieldGoals.attempted,
    twoPtPct: s.twoPointFieldGoals.pct,
    twoPtMade: s.twoPointFieldGoals.made,
    twoPtAttempted: s.twoPointFieldGoals.attempted,
    threePtPct: s.threePointFieldGoals.pct,
    threePtMade: s.threePointFieldGoals.made,
    threePtAttempted: s.threePointFieldGoals.attempted,
    ftPct: s.freeThrows.pct,
    ftMade: s.freeThrows.made,
    ftAttempted: s.freeThrows.attempted,

    // Advanced
    trueShootingPct: s.trueShootingPct < 1 ? s.trueShootingPct * 100 : s.trueShootingPct,
    effectiveFieldGoalPct: s.effectiveFieldGoalPct,
    usage: s.usage,
    offensiveRating: s.offensiveRating,
    defensiveRating: s.defensiveRating,
    netRating: s.netRating,
    assistsTurnoverRatio: s.assistsTurnoverRatio,
    offensiveReboundPct: s.offensiveReboundPct,
    freeThrowRate: s.freeThrowRate,
    PORPAG: s.PORPAG,

    // Win shares
    winSharesTotal: s.winShares.total,
    winSharesOffensive: s.winShares.offensive,
    winSharesDefensive: s.winShares.defensive,
    winSharesPer40: s.winShares.totalPer40,
  };
}
