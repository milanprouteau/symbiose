import type { PlayerSeasonStats, PlayerProfile } from "@/types/stats";
import { formatHeight, formatWeight, calculateAge } from "@/lib/formatters";

export type StatRow = {
  label: string;
  v1: string | number;
  v2: string | number;
  better?: 1 | 2 | null;
};

export type StatSection = {
  title: string;
  rows: StatRow[];
};

const cmp = (a: number, b: number): 1 | 2 | null =>
  a > b ? 1 : b > a ? 2 : null;

const cmpLow = (a: number, b: number): 1 | 2 | null =>
  a < b ? 1 : b < a ? 2 : null;

const pct = (v: number) => `${v.toFixed(1)}%`;
const fix1 = (v: number) => v.toFixed(1);

export function buildStatSections(
  p1: PlayerSeasonStats,
  p2: PlayerSeasonStats,
  profile1: PlayerProfile | null,
  profile2: PlayerProfile | null,
): StatSection[] {
  const g1 = p1.games || 1;
  const g2 = p2.games || 1;

  const ppg1 = p1.points / g1, ppg2 = p2.points / g2;
  const rpg1 = p1.rebounds.total / g1, rpg2 = p2.rebounds.total / g2;
  const apg1 = p1.assists / g1, apg2 = p2.assists / g2;
  const mpg1 = p1.minutes / g1, mpg2 = p2.minutes / g2;
  const spg1 = p1.steals / g1, spg2 = p2.steals / g2;
  const bpg1 = p1.blocks / g1, bpg2 = p2.blocks / g2;
  const topg1 = p1.turnovers / g1, topg2 = p2.turnovers / g2;
  const fpg1 = p1.fouls / g1, fpg2 = p2.fouls / g2;
  const orpg1 = p1.rebounds.offensive / g1, orpg2 = p2.rebounds.offensive / g2;
  const drpg1 = p1.rebounds.defensive / g1, drpg2 = p2.rebounds.defensive / g2;
  const age1 = profile1?.dateOfBirth ? calculateAge(profile1.dateOfBirth) : null;
  const age2 = profile2?.dateOfBirth ? calculateAge(profile2.dateOfBirth) : null;
  const height1 = formatHeight(profile1?.height);
  const height2 = formatHeight(profile2?.height);
  const weight1 = formatWeight(profile1?.weight);
  const weight2 = formatWeight(profile2?.weight);
  const position1 = profile1?.position ?? "—";
  const position2 = profile2?.position ?? "—";

  const ts1 = p1.trueShootingPct < 1 ? p1.trueShootingPct * 100 : p1.trueShootingPct;
  const ts2 = p2.trueShootingPct < 1 ? p2.trueShootingPct * 100 : p2.trueShootingPct;

  const poss1 = p1.fieldGoals.attempted + 0.44 * p1.freeThrows.attempted + p1.turnovers;
  const poss2 = p2.fieldGoals.attempted + 0.44 * p2.freeThrows.attempted + p2.turnovers;
  const ppp1 = poss1 > 0 ? p1.points / poss1 : 0;
  const ppp2 = poss2 > 0 ? p2.points / poss2 : 0;

  return [
    {
      title: "General",
      rows: [
        { label: "Age", v1: age1 ?? "—", v2: age2 ?? "—", better: null },
        { label: "Taille", v1: height1 ?? "—", v2: height2 ?? "—", better: null },
        { label: "Poids", v1: weight1 ?? "—", v2: weight2 ?? "—", better: null },
        { label: "Position", v1: position1, v2: position2, better: null },
        { label: "Games", v1: p1.games, v2: p2.games, better: null },
        { label: "MPG", v1: fix1(mpg1), v2: fix1(mpg2), better: null },
      ],
    },
    {
      title: "Offensive",
      rows: [
        { label: "PPG", v1: fix1(ppg1), v2: fix1(ppg2), better: cmp(ppg1, ppg2) },
        { label: "PPP", v1: ppp1.toFixed(2), v2: ppp2.toFixed(2), better: cmp(ppp1, ppp2) },
        { label: "APG", v1: fix1(apg1), v2: fix1(apg2), better: cmp(apg1, apg2) },
        { label: "TO/G", v1: fix1(topg1), v2: fix1(topg2), better: cmpLow(topg1, topg2) },
        { label: "AST/TO", v1: fix1(p1.assistsTurnoverRatio), v2: fix1(p2.assistsTurnoverRatio), better: cmp(p1.assistsTurnoverRatio, p2.assistsTurnoverRatio) },
        { label: "Fouls/G", v1: fix1(fpg1), v2: fix1(fpg2), better: cmpLow(fpg1, fpg2) },
        { label: "Off. Rating", v1: fix1(p1.offensiveRating), v2: fix1(p2.offensiveRating), better: cmp(p1.offensiveRating, p2.offensiveRating) },
        { label: "Usage", v1: pct(p1.usage), v2: pct(p2.usage), better: null },
        { label: "PORPAG", v1: fix1(p1.PORPAG), v2: fix1(p2.PORPAG), better: cmp(p1.PORPAG, p2.PORPAG) },
      ],
    },
    {
      title: "Tirs",
      rows: [
        { label: "FG%", v1: pct(p1.fieldGoals.pct), v2: pct(p2.fieldGoals.pct), better: cmp(p1.fieldGoals.pct, p2.fieldGoals.pct) },
        { label: "FGM/A", v1: `${p1.fieldGoals.made}/${p1.fieldGoals.attempted}`, v2: `${p2.fieldGoals.made}/${p2.fieldGoals.attempted}`, better: null },
        { label: "2PT%", v1: pct(p1.twoPointFieldGoals.pct), v2: pct(p2.twoPointFieldGoals.pct), better: cmp(p1.twoPointFieldGoals.pct, p2.twoPointFieldGoals.pct) },
        { label: "2PM/A", v1: `${p1.twoPointFieldGoals.made}/${p1.twoPointFieldGoals.attempted}`, v2: `${p2.twoPointFieldGoals.made}/${p2.twoPointFieldGoals.attempted}`, better: null },
        { label: "3PT%", v1: pct(p1.threePointFieldGoals.pct), v2: pct(p2.threePointFieldGoals.pct), better: cmp(p1.threePointFieldGoals.pct, p2.threePointFieldGoals.pct) },
        { label: "3PM/A", v1: `${p1.threePointFieldGoals.made}/${p1.threePointFieldGoals.attempted}`, v2: `${p2.threePointFieldGoals.made}/${p2.threePointFieldGoals.attempted}`, better: null },
        { label: "FT%", v1: pct(p1.freeThrows.pct), v2: pct(p2.freeThrows.pct), better: cmp(p1.freeThrows.pct, p2.freeThrows.pct) },
        { label: "FTM/A", v1: `${p1.freeThrows.made}/${p1.freeThrows.attempted}`, v2: `${p2.freeThrows.made}/${p2.freeThrows.attempted}`, better: null },
        { label: "TS%", v1: pct(ts1), v2: pct(ts2), better: cmp(ts1, ts2) },
        { label: "eFG%", v1: pct(p1.effectiveFieldGoalPct), v2: pct(p2.effectiveFieldGoalPct), better: cmp(p1.effectiveFieldGoalPct, p2.effectiveFieldGoalPct) },
        { label: "FT Rate", v1: fix1(p1.freeThrowRate), v2: fix1(p2.freeThrowRate), better: cmp(p1.freeThrowRate, p2.freeThrowRate) },
      ],
    },
    {
      title: "Défensive",
      rows: [
        { label: "RPG", v1: fix1(rpg1), v2: fix1(rpg2), better: cmp(rpg1, rpg2) },
        { label: "ORPG", v1: fix1(orpg1), v2: fix1(orpg2), better: cmp(orpg1, orpg2) },
        { label: "DRPG", v1: fix1(drpg1), v2: fix1(drpg2), better: cmp(drpg1, drpg2) },
        { label: "Def. Reb %", v1: pct(100 - p1.offensiveReboundPct), v2: pct(100 - p2.offensiveReboundPct), better: cmp(100 - p1.offensiveReboundPct, 100 - p2.offensiveReboundPct) },
        { label: "SPG", v1: fix1(spg1), v2: fix1(spg2), better: cmp(spg1, spg2) },
        { label: "BPG", v1: fix1(bpg1), v2: fix1(bpg2), better: cmp(bpg1, bpg2) },
        { label: "Def. Rating", v1: fix1(p1.defensiveRating), v2: fix1(p2.defensiveRating), better: cmpLow(p1.defensiveRating, p2.defensiveRating) },
      ],
    },
    {
      title: "Avancées",
      rows: [
        { label: "Net Rating", v1: fix1(p1.netRating), v2: fix1(p2.netRating), better: cmp(p1.netRating, p2.netRating) },
        { label: "Win Shares", v1: fix1(p1.winShares.total), v2: fix1(p2.winShares.total), better: cmp(p1.winShares.total, p2.winShares.total) },
        { label: "Off. WS", v1: fix1(p1.winShares.offensive), v2: fix1(p2.winShares.offensive), better: cmp(p1.winShares.offensive, p2.winShares.offensive) },
        { label: "Def. WS", v1: fix1(p1.winShares.defensive), v2: fix1(p2.winShares.defensive), better: cmp(p1.winShares.defensive, p2.winShares.defensive) },
        { label: "WS/40", v1: fix1(p1.winShares.totalPer40), v2: fix1(p2.winShares.totalPer40), better: cmp(p1.winShares.totalPer40, p2.winShares.totalPer40) },
      ],
    },
  ];
}
