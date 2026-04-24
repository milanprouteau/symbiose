import draftData from "@/data/nba-draft-2026.json";
import type { TeamAbbr } from "./nbaTeams";

export type PickOwnership = {
  pick: number;
  round: 1 | 2;
  origin: TeamAbbr;
  owner: TeamAbbr;
  note?: string;
};

export type LotteryTeam = { rank: number; team: TeamAbbr; odds: number };

type SwapRule =
  | { type: "conditionalOutsideTop4"; origin: TeamAbbr; to: TeamAbbr; note: string }
  | { type: "mostFavorableOf"; origins: TeamAbbr[]; bestTo: TeamAbbr; worstTo: TeamAbbr; note: string };

const LOTTERY_TEAMS = draftData.lottery.teams as LotteryTeam[];
const BASE_OWNERS   = draftData.lottery.baseOwners as Record<TeamAbbr, TeamAbbr>;
const SWAP_RULES    = draftData.lottery.swapRules as SwapRule[];
const FIXED_PICKS   = draftData.picks as PickOwnership[];

// Official NBA lottery probabilities (post-2019 reform).
// Rows = pre-lottery standings rank (1 = worst). Cols = final lottery position.
// Source: NBA.com / Tankathon.
const LOTTERY_ODDS: Record<number, Record<number, number>> = {
  1:  { 1: 14.0, 2: 13.4, 3: 12.7, 4: 12.0, 5: 47.9 },
  2:  { 1: 14.0, 2: 13.4, 3: 12.7, 4: 12.0, 5: 27.8, 6: 20.0 },
  3:  { 1: 14.0, 2: 13.4, 3: 12.7, 4: 12.0, 5: 14.8, 6: 26.0, 7:  7.0 },
  4:  { 1: 11.5, 2: 11.4, 3: 11.2, 4: 10.9, 5:  7.2, 6: 25.7, 7: 19.6, 8:  2.5 },
  5:  { 1:  8.5, 2:  8.7, 3:  8.8, 4:  8.9, 5:  2.9, 6: 22.6, 7: 26.7, 8: 11.5, 9:  1.2 },
  6:  { 1:  6.8, 2:  7.1, 3:  7.3, 4:  7.5, 6: 34.5, 7: 32.1, 8:  4.2, 9:  0.5 },
  7:  { 1:  6.7, 2:  7.0, 3:  7.2, 4:  7.4, 7: 19.7, 8: 34.0, 9: 17.7, 10: 0.3 },
  8:  { 1:  6.0, 2:  6.3, 3:  6.6, 4:  6.9, 8: 34.4, 9: 32.0, 10: 1.8,  11: 0.1 },
  9:  { 1:  4.5, 2:  4.8, 3:  5.2, 4:  5.5, 9: 37.2, 10: 34.8, 11: 7.7, 12: 0.2 },
  10: { 1:  3.0, 2:  3.3, 3:  3.6, 4:  3.9, 10: 40.7, 11: 32.3, 12: 12.6, 13: 0.5 },
  11: { 1:  2.0, 2:  2.2, 3:  2.4, 4:  2.7, 11: 47.1, 12: 25.5, 13: 15.7, 14: 2.2 },
  12: { 1:  1.5, 2:  1.7, 3:  1.9, 4:  2.1, 12: 51.3, 13: 32.1, 14: 9.3 },
  13: { 1:  1.0, 2:  1.1, 3:  1.3, 4:  1.5, 13: 48.8, 14: 46.3 },
  14: { 1:  0.5, 2:  0.6, 3:  0.7, 4:  0.8, 14: 97.4 },
};

export type PickSlot = {
  pick: number;
  round: 1 | 2;
  origin: TeamAbbr;
  owner: TeamAbbr;
  /** Only set for picks 1-14. Lottery rank (1 = worst regular-season record). */
  lotteryRank?: number;
  /** Only set for picks 1-14. Odds of this team landing at this pick. */
  lotteryOdds?: number;
  /** True if this pick has a conditional transfer that hasn't fired (stayed with origin). */
  isProtected?: boolean;
  /** Human-readable description of the protection / swap condition. */
  protectionNote?: string;
};

/**
 * Build the full 60-pick ordering for a given lottery outcome.
 * `lotteryResult` is an array of 14 teams in final lottery order (position 1 = 1st overall pick).
 */
function resolveLotteryOwnership(lotteryResult: TeamAbbr[]): PickSlot[] {
  const originByFinalPos = new Map<number, TeamAbbr>();
  lotteryResult.forEach((team, i) => originByFinalPos.set(i + 1, team));

  // Resolve swaps — they operate on "final pick positions" (not original standings).
  const owners: Record<TeamAbbr, TeamAbbr> = { ...BASE_OWNERS };
  const protectionByOrigin = new Map<TeamAbbr, string>();
  const swapNoteByOrigin   = new Map<TeamAbbr, string>();

  for (const rule of SWAP_RULES) {
    if (rule.type === "conditionalOutsideTop4") {
      const pos = [...originByFinalPos.entries()].find(([, t]) => t === rule.origin)?.[0];
      if (pos != null && pos > 4) {
        owners[rule.origin] = rule.to;
        swapNoteByOrigin.set(rule.origin, rule.note);
      } else {
        protectionByOrigin.set(rule.origin, "Top-4 protected (→ LAC si hors top 4)");
      }
    } else if (rule.type === "mostFavorableOf") {
      const positions = rule.origins.map((t) => ({
        team: t,
        pos: [...originByFinalPos.entries()].find(([, x]) => x === t)?.[0] ?? 999,
      }));
      positions.sort((a, b) => a.pos - b.pos);
      const [best, worst] = positions;
      owners[best.team]  = rule.bestTo;
      owners[worst.team] = rule.worstTo;
      swapNoteByOrigin.set(best.team,  rule.note);
      swapNoteByOrigin.set(worst.team, rule.note);
    }
  }

  const teamToStandingsRank = new Map<TeamAbbr, number>();
  LOTTERY_TEAMS.forEach((t) => teamToStandingsRank.set(t.team, t.rank));

  const oddsByTeam = new Map<TeamAbbr, number>();
  LOTTERY_TEAMS.forEach((t) => oddsByTeam.set(t.team, t.odds));

  const lotterySlots: PickSlot[] = lotteryResult.map((team, i) => {
    const pick = i + 1;
    const rank = teamToStandingsRank.get(team);
    // lotteryOdds = probabilité de l'équipe d'origine d'obtenir le #1 (baseline pré-lottery).
    const odds = oddsByTeam.get(team) ?? 0;
    const protectionNote = protectionByOrigin.get(team) ?? swapNoteByOrigin.get(team);
    return {
      pick,
      round: 1,
      origin: team,
      owner: owners[team] ?? team,
      lotteryRank: rank,
      lotteryOdds: odds,
      isProtected: protectionByOrigin.has(team),
      protectionNote,
    };
  });

  const rest: PickSlot[] = FIXED_PICKS.map((p) => ({
    pick: p.pick,
    round: p.round,
    origin: p.origin,
    owner: p.owner,
  }));

  return [...lotterySlots, ...rest];
}

/** Pre-lottery ordering: teams are seeded 1..14 by standings (no rerolling). */
export function getPreLotteryOrder(): PickSlot[] {
  return resolveLotteryOwnership(LOTTERY_TEAMS.map((t) => t.team));
}

/** Weighted random draw — returns one team from `pool` according to its odds. */
function weightedPick(pool: { team: TeamAbbr; weight: number }[]): TeamAbbr {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= p.weight;
    if (r <= 0) return p.team;
  }
  return pool[pool.length - 1].team;
}

/**
 * Simulate the NBA lottery: draw picks 1-4 using weighted odds (14% for worst 3,
 * decreasing down to 0.5%), then fill 5-14 in ascending standings rank.
 */
export function simulateLottery(): PickSlot[] {
  const remaining = LOTTERY_TEAMS.map((t) => ({ team: t.team, weight: t.odds }));
  const winners: TeamAbbr[] = [];

  for (let i = 0; i < 4; i++) {
    const winner = weightedPick(remaining);
    winners.push(winner);
    const idx = remaining.findIndex((r) => r.team === winner);
    remaining.splice(idx, 1);
  }

  // Fill 5-14 by ascending standings rank (worst remaining first).
  const rankOf = new Map<TeamAbbr, number>();
  LOTTERY_TEAMS.forEach((t) => rankOf.set(t.team, t.rank));
  const tail = remaining
    .map((r) => r.team)
    .sort((a, b) => (rankOf.get(a) ?? 0) - (rankOf.get(b) ?? 0));

  return resolveLotteryOwnership([...winners, ...tail]);
}

export { LOTTERY_TEAMS, LOTTERY_ODDS };
