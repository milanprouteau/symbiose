#!/usr/bin/env node
/**
 * Compute SIS / SIS-Px scores for historical draft class bundles.
 * Reads data/players/{year}/{athleteId}.json (produced by fetch-draft-class-bundles.mjs)
 * and writes data/players/{year}/sis-scores.json
 *
 * Usage:
 *   node scripts/compute-draft-sis.mjs          # all years found
 *   node scripts/compute-draft-sis.mjs 2023     # single year
 *   node scripts/compute-draft-sis.mjs 2022 2024
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLAYERS_DIR = path.join(ROOT, "data", "players");

/* ── Parse CLI args ── */
const args = process.argv.slice(2).map(Number).filter((n) => !isNaN(n) && n > 0);
let yearFilter = null; // null = all years
if (args.length === 1) yearFilter = [args[0], args[0]];
else if (args.length >= 2) yearFilter = [Math.min(...args), Math.max(...args)];

/* ═══════════════════════════════════════════════════════
 *  SIS / SIS-Px — JavaScript port of lib/sisScore.ts
 * ═══════════════════════════════════════════════════════ */

const MIN_GAMES = 10;

function score(value, worse, better, maxPts) {
  if (better === worse) return 0;
  const pct = (value - worse) / (better - worse);
  return Math.max(0, Math.min(1, pct)) * maxPts;
}
function r1(n) { return Math.round(n * 10) / 10; }

function posGroup(raw) {
  const p = (raw ?? "").toLowerCase();
  if (p === "g" || p.startsWith("guard") || p === "pg" || p === "sg") return "G";
  if (p === "c" || p.startsWith("center") || p === "f/c" || p === "c/f"
    || p.includes("forward-center") || p.includes("center-forward")) return "BIG";
  if (p === "f" || p.startsWith("forward") || p === "pf" || p === "sf"
    || p === "g/f" || p === "f/g"
    || p.includes("guard-forward") || p.includes("forward-guard")) return "WING";
  return "WING";
}

const DEF_THRESHOLDS = {
  G:    { stl: [0.6, 3.0], blk: [0.0, 0.8], drb: [3, 12],  wsDef: [1, 12] },
  WING: { stl: [0.5, 2.4], blk: [0.0, 2.0], drb: [5, 17],  wsDef: [2, 14] },
  BIG:  { stl: [0.3, 1.6], blk: [0.3, 4.0], drb: [8, 26],  wsDef: [3, 17] },
};

const NBA_AVG_HEIGHT = { G: 75, WING: 78, BIG: 82 };

function calculateSIS(bundle) {
  const ps = bundle.playerStats;
  const ts = bundle.teamStats;
  const profile = bundle.profile;

  if (!ps || !ts) return null;
  if (ps.games < MIN_GAMES) return null;

  const games   = ps.games;
  const minutes = ps.minutes || 1;
  const rawPos  = profile?.position ?? ps.position ?? "F";
  const pg      = posGroup(rawPos);
  const def     = DEF_THRESHOLDS[pg];

  // ── Computed stats ──
  const tsPercent = ps.trueShootingPct < 1 ? ps.trueShootingPct * 100 : ps.trueShootingPct;

  const indivPosBase = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted + ps.turnovers;
  const indivPPP  = indivPosBase > 0 ? ps.points / indivPosBase : 0;
  const toRate    = indivPosBase > 0 ? ps.turnovers / indivPosBase : 0;

  const stlPer40   = (ps.steals         / minutes) * 40;
  const blkPer40   = (ps.blocks         / minutes) * 40;
  const rebPer40   = (ps.rebounds.total / minutes) * 40;
  const foulsPer40 = (ps.fouls          / minutes) * 40;
  const wsDef40    = (ps.winShares.defensive / minutes) * 40 * 100;

  const defRebPctRaw =
    (ps.rebounds.defensive * ts.totalMinutes) /
    (minutes * (ts.teamStats.rebounds.defensive + ts.opponentStats.rebounds.offensive));
  const defRebPct = defRebPctRaw * 100;

  const tmShare    = minutes / ts.totalMinutes;
  const assistDenom = tmShare * ts.teamStats.fieldGoals.made - ps.fieldGoals.made;
  const assistRate  = assistDenom > 0 ? (100 * ps.assists) / assistDenom : 0;

  const minPct = (minutes / (games * 40)) * 100;

  const totalFga = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted;
  const threePAr = totalFga > 0 ? ps.threePointFieldGoals.attempted / totalFga : 0;

  // ── SIS ──
  const sis_ts    = score(tsPercent, 50,   68,   10);
  const sis_ppp   = score(indivPPP,  0.75, 1.30, 10);
  const sis_to    = score(toRate,    0.22, 0.07,  5);
  const offensiveEfficiency = sis_ts + sis_ppp + sis_to;

  const sis_wsDef = score(wsDef40,   def.wsDef[0], def.wsDef[1], 10);
  const sis_stl   = score(stlPer40,  def.stl[0],   def.stl[1],    5);
  const sis_blk   = score(blkPer40,  def.blk[0],   def.blk[1],    5);
  const sis_drb   = score(defRebPct, def.drb[0],   def.drb[1],    5);
  const defensiveImpact = sis_wsDef + sis_stl + sis_blk + sis_drb;

  const sis_porpag = score(ps.PORPAG,                1.0, 7.5, 10);
  const sis_efg    = score(ps.effectiveFieldGoalPct, 45,  65,   5);
  const sis_astTo  = score(ps.assistsTurnoverRatio,  0.4, 3.5,  5);
  const advancedEfficiency = sis_porpag + sis_efg + sis_astTo;

  const sis_reb   = score(rebPer40,   2,   13,  8);
  const sis_fouls = score(foulsPer40, 5.0,  1.5, 7);
  const hustle = sis_reb + sis_fouls;

  const sis_usage  = score(ps.usage,  15, 32, 5);
  const sis_ast    = score(assistRate, 3, 42, 5);
  const sis_minPct = score(minPct,    50, 90, 5);
  const systemWeight = sis_usage + sis_ast + sis_minPct;

  const sisTotal = r1(offensiveEfficiency + defensiveImpact + advancedEfficiency + hustle + systemWeight);

  // ── SIS-Px ──
  const heightInches = profile?.height ?? null;
  let px_height = 5;
  if (heightInches !== null) {
    px_height = score(heightInches - NBA_AVG_HEIGHT[pg], -5, 5, 10);
  }
  const px_mobility =
    score(foulsPer40, 5.0, 1.5, 5) +
    score(stlPer40 + blkPer40, 1.0, 5.0, 5);
  const pxPhysical = px_height + px_mobility;

  const px_ts    = score(tsPercent,              52,   68,   8);
  const px_ppp   = score(indivPPP,               0.80, 1.30, 8);
  const px_astTo = score(ps.assistsTurnoverRatio, 0.5, 3.5,  3);
  const px_ft    = score(ps.freeThrows.pct,      58,   90,   3);
  const px_3par  = score(threePAr * 100,          5,   60,   3);
  const pxEfficiency = px_ts + px_ppp + px_astTo + px_ft + px_3par;

  const px_stl  = score(stlPer40,   def.stl[0], def.stl[1] * 1.1, 5);
  const px_blk  = score(blkPer40,   def.blk[0], def.blk[1] * 1.1, 5);
  const px_foul = score(foulsPer40, 5.0,         1.5,              5);
  const pxDefensiveMobility = px_stl + px_blk + px_foul;

  const px_usage = score(ps.usage,  15, 33, 7);
  const px_ast2  = score(assistRate, 3, 42, 7);
  const px_por   = score(ps.PORPAG, 1.0, 7.5, 6);
  const pxProjectedRole = px_usage + px_ast2 + px_por;

  const px_pace    = score(ts.pace,                    62, 73, 5);
  const px_spacing = score(threePAr * 100,              5, 60, 5);
  const px_ftRate  = score(ps.freeThrowRate,           15, 50, 5);
  const px_efg     = score(ps.effectiveFieldGoalPct,   48, 65, 5);
  const pxNBAAdaptability = px_pace + px_spacing + px_ftRate + px_efg;

  const sisPxTotal = r1(pxPhysical + pxEfficiency + pxDefensiveMobility + pxProjectedRole + pxNBAAdaptability);

  return {
    sis: {
      total: sisTotal,
      offensiveEfficiency: r1(offensiveEfficiency),
      defensiveImpact:     r1(defensiveImpact),
      advancedEfficiency:  r1(advancedEfficiency),
      hustle:              r1(hustle),
      systemWeight:        r1(systemWeight),
    },
    sisPx: {
      total: sisPxTotal,
      pxPhysical:          r1(pxPhysical),
      pxEfficiency:        r1(pxEfficiency),
      pxDefensiveMobility: r1(pxDefensiveMobility),
      pxProjectedRole:     r1(pxProjectedRole),
      pxNBAAdaptability:   r1(pxNBAAdaptability),
    },
    posGroup: pg,
  };
}

/* ── Discover year directories ── */
function getYearDirs() {
  return fs
    .readdirSync(PLAYERS_DIR)
    .filter((d) => /^\d{4}$/.test(d))
    .map(Number)
    .filter((y) => {
      if (!yearFilter) return true;
      return y >= yearFilter[0] && y <= yearFilter[1];
    })
    .sort();
}

/* ── Main ── */
function main() {
  const years = getYearDirs();
  if (years.length === 0) {
    console.log("No year directories found. Run fetch-draft-class-bundles.mjs first.");
    process.exit(0);
  }

  console.log(`\n🏀 Computing SIS/SIS-Px for draft classes: ${years.join(", ")}\n`);

  const allScores = [];
  let grandTotal = 0;
  let grandSkipped = 0;

  for (const year of years) {
    const yearDir = path.join(PLAYERS_DIR, String(year));
    const files = fs.readdirSync(yearDir).filter((f) => /^\d+\.json$/.test(f));

    console.log(`── Draft ${year} (${files.length} bundles) ──`);

    const yearScores = [];
    let skipped = 0;

    for (const file of files) {
      const bundle = JSON.parse(fs.readFileSync(path.join(yearDir, file), "utf-8"));
      const result = calculateSIS(bundle);

      if (!result) {
        skipped++;
        continue;
      }

      const g = bundle.playerStats?.games || 1;
      const entry = {
        id: bundle.id,
        name: bundle.name,
        team: bundle.team,
        year,
        overall: bundle.draftMeta?.overall ?? null,
        draftTeam: bundle.draftMeta?.draftTeam ?? null,
        position: bundle.profile?.position ?? bundle.playerStats?.position ?? null,
        games: bundle.playerStats?.games ?? 0,
        ppg: +((bundle.playerStats?.points ?? 0) / g).toFixed(1),
        rpg: +((bundle.playerStats?.rebounds?.total ?? 0) / g).toFixed(1),
        apg: +((bundle.playerStats?.assists ?? 0) / g).toFixed(1),
        usage: bundle.playerStats?.usage ?? 0,
        ...result,
      };

      yearScores.push(entry);
      allScores.push(entry);

      console.log(
        `  ${entry.name.padEnd(24)} #${String(entry.overall ?? "?").padStart(2)}  ` +
        `SIS ${String(entry.sis.total).padStart(4)}  SIS-Px ${entry.sisPx.total}`
      );
    }

    // Sort by draft pick
    yearScores.sort((a, b) => (a.overall ?? 99) - (b.overall ?? 99));

    const outPath = path.join(yearDir, "sis-scores.json");
    fs.writeFileSync(outPath, JSON.stringify(yearScores, null, 2));
    console.log(`  → Saved ${yearScores.length} scores (${skipped} skipped) to ${path.relative(ROOT, outPath)}\n`);

    grandTotal += yearScores.length;
    grandSkipped += skipped;
  }

  // Also write a combined file for easy cross-year comparison
  allScores.sort((a, b) => b.sisPx.total - a.sisPx.total);
  const combinedPath = path.join(PLAYERS_DIR, "draft-sis-all.json");
  fs.writeFileSync(combinedPath, JSON.stringify(allScores, null, 2));
  console.log(`✅ Combined file → ${path.relative(ROOT, combinedPath)}`);
  console.log(`   ${grandTotal} players scored, ${grandSkipped} skipped (< ${MIN_GAMES} games)\n`);

  // Quick stats: SIS-Px distribution by draft position tier
  const lottery = allScores.filter((p) => p.overall != null && p.overall <= 14);
  const mid     = allScores.filter((p) => p.overall != null && p.overall >= 15 && p.overall <= 30);
  const second  = allScores.filter((p) => p.overall != null && p.overall > 30);

  console.log("  SIS-Px averages by pick range:");
  console.log(`  Lottery (#1-14)  : SIS ${avgKey(lottery, "sis.total")}  SIS-Px ${avgKey(lottery, "sisPx.total")}  (n=${lottery.length})`);
  console.log(`  Mid 1st (#15-30) : SIS ${avgKey(mid, "sis.total")}  SIS-Px ${avgKey(mid, "sisPx.total")}  (n=${mid.length})`);
  console.log(`  2nd round (#31+) : SIS ${avgKey(second, "sis.total")}  SIS-Px ${avgKey(second, "sisPx.total")}  (n=${second.length})`);

  console.log("\n🏁 Done!\n");
}

function getNestedKey(obj, keyPath) {
  return keyPath.split(".").reduce((o, k) => o?.[k], obj) ?? 0;
}

function avgKey(arr, keyPath) {
  if (!arr.length) return "—";
  const sum = arr.reduce((s, p) => s + getNestedKey(p, keyPath), 0);
  return (sum / arr.length).toFixed(1);
}

main();
