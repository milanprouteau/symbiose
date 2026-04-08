import type { PlayerSeasonStats, PlayerProfile } from "@/types/stats";
import { formatHeight, formatWeight, calculateAge } from "@/lib/formatters";

export type StatRow = {
  label: string;
  v1: string | number;
  v2: string | number;
  better?: 1 | 2 | null;
  /** Key into the player's percentiles object */
  statKey?: string;
  /** If true, lower raw percentile = better (e.g. TO, Fouls, Def. Rating) */
  lowerIsBetter?: boolean;
};

export type StatSection = {
  title: string;
  rows: StatRow[];
};

export type PlayerPercentiles = Record<string, number | null>;

const cmp    = (a: number, b: number): 1 | 2 | null => a > b ? 1 : b > a ? 2 : null;
const cmpLow = (a: number, b: number): 1 | 2 | null => a < b ? 1 : b < a ? 2 : null;
const pct  = (v: number) => `${v.toFixed(1)}%`;
const fix1 = (v: number) => v.toFixed(1);
const fix2 = (v: number) => v.toFixed(2);

export function buildStatSections(
  p1: PlayerSeasonStats,
  p2: PlayerSeasonStats,
  profile1: PlayerProfile | null,
  profile2: PlayerProfile | null,
  pcts1?: PlayerPercentiles | null,
  pcts2?: PlayerPercentiles | null,
  tsPlus1?: number | null,
  tsPlus2?: number | null,
): StatSection[] {
  const g1 = p1.games || 1;
  const g2 = p2.games || 1;

  const ppg1 = p1.points / g1,                        ppg2 = p2.points / g2;
  const rpg1 = p1.rebounds.total / g1,                 rpg2 = p2.rebounds.total / g2;
  const apg1 = p1.assists / g1,                        apg2 = p2.assists / g2;
  const mpg1 = p1.minutes / g1,                        mpg2 = p2.minutes / g2;
  const spg1 = p1.steals / g1,                         spg2 = p2.steals / g2;
  const bpg1 = p1.blocks / g1,                         bpg2 = p2.blocks / g2;
  const topg1 = p1.turnovers / g1,                     topg2 = p2.turnovers / g2;
  const fpg1 = p1.fouls / g1,                          fpg2 = p2.fouls / g2;
  const orpg1 = p1.rebounds.offensive / g1,            orpg2 = p2.rebounds.offensive / g2;
  const drpg1 = p1.rebounds.defensive / g1,            drpg2 = p2.rebounds.defensive / g2;

  const ts1 = p1.trueShootingPct < 1 ? p1.trueShootingPct * 100 : p1.trueShootingPct;
  const ts2 = p2.trueShootingPct < 1 ? p2.trueShootingPct * 100 : p2.trueShootingPct;

  const poss1 = p1.fieldGoals.attempted + 0.44 * p1.freeThrows.attempted + p1.turnovers;
  const poss2 = p2.fieldGoals.attempted + 0.44 * p2.freeThrows.attempted + p2.turnovers;
  const ppp1 = poss1 > 0 ? p1.points / poss1 : 0;
  const ppp2 = poss2 > 0 ? p2.points / poss2 : 0;

  const age1     = profile1?.dateOfBirth ? calculateAge(profile1.dateOfBirth) : null;
  const age2     = profile2?.dateOfBirth ? calculateAge(profile2.dateOfBirth) : null;
  const height1  = formatHeight(profile1?.height);
  const height2  = formatHeight(profile2?.height);
  const weight1  = formatWeight(profile1?.weight);
  const weight2  = formatWeight(profile2?.weight);

  const row = (
    label: string,
    v1: string | number,
    v2: string | number,
    better?: 1 | 2 | null,
    statKey?: string,
    lowerIsBetter?: boolean,
  ): StatRow => ({ label, v1, v2, better, statKey, lowerIsBetter });

  return [
    {
      title: "General",
      rows: [
        row("Age",      age1 ?? "—",            age2 ?? "—"),
        row("Taille",   height1 ?? "—",          height2 ?? "—"),
        row("Poids",    weight1 ?? "—",          weight2 ?? "—"),
        row("Position", profile1?.position ?? "—", profile2?.position ?? "—"),
        row("Games",    p1.games,                p2.games),
        row("MPG",      fix1(mpg1),              fix1(mpg2)),
      ],
    },
    {
      title: "Offensive",
      rows: [
        row("PPG",        fix1(ppg1),                    fix1(ppg2),                    cmp(ppg1, ppg2),                           "ppg"),
        row("PPP",        fix2(ppp1),                    fix2(ppp2),                    cmp(ppp1, ppp2),                           "ppp"),
        row("APG",        fix1(apg1),                    fix1(apg2),                    cmp(apg1, apg2),                           "apg"),
        row("TO/G",       fix1(topg1),                   fix1(topg2),                   cmpLow(topg1, topg2),                      "topg",        true),
        row("AST/TO",     fix1(p1.assistsTurnoverRatio), fix1(p2.assistsTurnoverRatio), cmp(p1.assistsTurnoverRatio, p2.assistsTurnoverRatio), "astToRatio"),
        row("Fouls/G",    fix1(fpg1),                    fix1(fpg2),                    cmpLow(fpg1, fpg2),                        "fpg",         true),
        row("Off. Rating",fix1(p1.offensiveRating),      fix1(p2.offensiveRating),      cmp(p1.offensiveRating, p2.offensiveRating), "offRating"),
        row("Usage",      pct(p1.usage),                 pct(p2.usage),                 null,                                      "usage"),
        row("PORPAG",     fix1(p1.PORPAG),               fix1(p2.PORPAG),               cmp(p1.PORPAG, p2.PORPAG),                 "PORPAG"),
      ],
    },
    {
      title: "Tirs",
      rows: [
        row("FG%",      pct(p1.fieldGoals.pct),            pct(p2.fieldGoals.pct),            cmp(p1.fieldGoals.pct, p2.fieldGoals.pct),           "fgPct"),
        row("FGM/A",    `${p1.fieldGoals.made}/${p1.fieldGoals.attempted}`,      `${p2.fieldGoals.made}/${p2.fieldGoals.attempted}`,      null),
        row("2PT%",     pct(p1.twoPointFieldGoals.pct),    pct(p2.twoPointFieldGoals.pct),    cmp(p1.twoPointFieldGoals.pct, p2.twoPointFieldGoals.pct), "twoPtPct"),
        row("2PM/A",    `${p1.twoPointFieldGoals.made}/${p1.twoPointFieldGoals.attempted}`, `${p2.twoPointFieldGoals.made}/${p2.twoPointFieldGoals.attempted}`, null),
        row("3PT%",     pct(p1.threePointFieldGoals.pct),  pct(p2.threePointFieldGoals.pct),  cmp(p1.threePointFieldGoals.pct, p2.threePointFieldGoals.pct), "threePtPct"),
        row("3PM/A",    `${p1.threePointFieldGoals.made}/${p1.threePointFieldGoals.attempted}`, `${p2.threePointFieldGoals.made}/${p2.threePointFieldGoals.attempted}`, null),
        row("FT%",      pct(p1.freeThrows.pct),            pct(p2.freeThrows.pct),            cmp(p1.freeThrows.pct, p2.freeThrows.pct),           "ftPct"),
        row("FTM/A",    `${p1.freeThrows.made}/${p1.freeThrows.attempted}`,      `${p2.freeThrows.made}/${p2.freeThrows.attempted}`,      null),
        row("TS%",      pct(ts1),                          pct(ts2),                          cmp(ts1, ts2),                                        "tsPct"),
        row("TS+",      tsPlus1 != null ? `${tsPlus1 >= 0 ? "+" : ""}${fix1(tsPlus1)}%` : "—", tsPlus2 != null ? `${tsPlus2 >= 0 ? "+" : ""}${fix1(tsPlus2)}%` : "—", tsPlus1 != null && tsPlus2 != null ? cmp(tsPlus1, tsPlus2) : null, "tsPct"),
        row("eFG%",     pct(p1.effectiveFieldGoalPct),     pct(p2.effectiveFieldGoalPct),     cmp(p1.effectiveFieldGoalPct, p2.effectiveFieldGoalPct), "efgPct"),
        row("FT Rate",  fix1(p1.freeThrowRate),            fix1(p2.freeThrowRate),            cmp(p1.freeThrowRate, p2.freeThrowRate),              "ftRate"),
      ],
    },
    {
      title: "Défensive",
      rows: [
        row("RPG",       fix1(rpg1),                            fix1(rpg2),                            cmp(rpg1, rpg2),                                          "rpg"),
        row("ORPG",      fix1(orpg1),                           fix1(orpg2),                           cmp(orpg1, orpg2),                                        "orpg"),
        row("DRPG",      fix1(drpg1),                           fix1(drpg2),                           cmp(drpg1, drpg2),                                        "drpg"),
        row("Def. Reb %",pct(100 - p1.offensiveReboundPct),    pct(100 - p2.offensiveReboundPct),    cmp(100 - p1.offensiveReboundPct, 100 - p2.offensiveReboundPct), "drebPct"),
        row("SPG",       fix1(spg1),                            fix1(spg2),                            cmp(spg1, spg2),                                          "spg"),
        row("BPG",       fix1(bpg1),                            fix1(bpg2),                            cmp(bpg1, bpg2),                                          "bpg"),
        row("Def. Rating",fix1(p1.defensiveRating),            fix1(p2.defensiveRating),            cmpLow(p1.defensiveRating, p2.defensiveRating),            "defRating",  true),
      ],
    },
    {
      title: "Avancées",
      rows: [
        row("Net Rating",  fix1(p1.netRating),          fix1(p2.netRating),          cmp(p1.netRating, p2.netRating),               "netRating"),
        row("Win Shares",  fix1(p1.winShares.total),    fix1(p2.winShares.total),    cmp(p1.winShares.total, p2.winShares.total),   "winShares"),
        row("Off. WS",     fix1(p1.winShares.offensive),fix1(p2.winShares.offensive),cmp(p1.winShares.offensive, p2.winShares.offensive), "offWinShares"),
        row("Def. WS",     fix1(p1.winShares.defensive),fix1(p2.winShares.defensive),cmp(p1.winShares.defensive, p2.winShares.defensive), "defWinShares"),
        row("WS/40",       fix1(p1.winShares.totalPer40),fix1(p2.winShares.totalPer40),cmp(p1.winShares.totalPer40, p2.winShares.totalPer40), "winSharesPer40"),
      ],
    },
  ];
}
