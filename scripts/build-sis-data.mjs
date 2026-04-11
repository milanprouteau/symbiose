#!/usr/bin/env node
/**
 * Pre-build script — génère des JSON légers utilisables par les pages Next.js
 * sans avoir à lire les bundles complets (qui incluent les shots = 272MB).
 *
 * Produit :
 *   data/sis-intermediates.json  — stats intermédiaires pour la page calibration (~60KB)
 *   data/prospects-sis.json      — scores SIS/SIS-Px des prospects 2026 (~5KB)
 *
 * Usage : node scripts/build-sis-data.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "players");

// ── Helpers (port de sisScore.ts) ────────────────────────

const NBA_AVG_HEIGHT = { G: 75, WING: 78, BIG: 82 };

function posGroup(raw) {
  const p = (raw ?? "").toLowerCase();
  if (p === "g" || p.startsWith("guard") || p === "pg" || p === "sg") return "G";
  if (p === "c" || p.startsWith("center") || p === "f/c" || p === "c/f"
    || p.includes("forward-center") || p.includes("center-forward")) return "BIG";
  return "WING";
}

function score(value, worse, better, maxPts) {
  if (better === worse) return 0;
  const pct = (value - worse) / (better - worse);
  return Math.max(0, Math.min(1, pct)) * maxPts;
}
function r1(n) { return Math.round(n * 10) / 10; }

function extractIntermediate(bundle, year, overall) {
  const ps = bundle.playerStats;
  const ts = bundle.teamStats;
  const profile = bundle.profile;
  if (!ps || !ts || ps.games < 10) return null;

  const minutes = ps.minutes || 1;
  const pg = posGroup(profile?.position ?? ps.position ?? "F");

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
  const minPct = (minutes / (ps.games * 40)) * 100;
  const totalFga = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted;
  const threePAr = totalFga > 0 ? (ps.threePointFieldGoals.attempted / totalFga) * 100 : 0;
  const heightInches = profile?.height ?? null;
  const heightVsNBA  = heightInches !== null ? heightInches - NBA_AVG_HEIGHT[pg] : 0;
  const shooting = bundle.shootingStats;
  const rimAttackRate = shooting && shooting.trackedShots > 0
    ? (shooting.layups.attempted / shooting.trackedShots) * 100
    : 25;

  return {
    id: ps.athleteId,
    name: ps.name,
    team: ps.team,
    year,
    overall: overall ?? null,
    posGroup: pg,
    games: ps.games,
    ppg: +(ps.points / ps.games).toFixed(1),
    rpg: +((ps.rebounds.total) / ps.games).toFixed(1),
    apg: +(ps.assists / ps.games).toFixed(1),
    tsPercent: +tsPercent.toFixed(2),
    indivPPP: +indivPPP.toFixed(4),
    toRate: +toRate.toFixed(4),
    stlPer40: +stlPer40.toFixed(3),
    blkPer40: +blkPer40.toFixed(3),
    wsDef40: +wsDef40.toFixed(3),
    defRebPct: +defRebPct.toFixed(3),
    rebPer40: +rebPer40.toFixed(3),
    foulsPer40: +foulsPer40.toFixed(3),
    assistRate: +assistRate.toFixed(3),
    minPct: +minPct.toFixed(3),
    threePAr: +threePAr.toFixed(3),
    PORPAG: ps.PORPAG,
    efgPct: ps.effectiveFieldGoalPct,
    astToRatio: ps.assistsTurnoverRatio,
    ftPct: ps.freeThrows.pct,
    freeThrowRate: ps.freeThrowRate,
    usage: ps.usage,
    heightVsNBA: +heightVsNBA.toFixed(1),
    rimAttackRate: +rimAttackRate.toFixed(2),
  };
}

// Calcul SIS/SIS-Px — seuils recalibrés sur percentiles p10/p90 NCAA réels
const DEF = {
  G:    { wsDef:[-5,10], stl:[0.6,2.4], blk:[0.0,0.8], drb:[3,13]  },
  WING: { wsDef:[-5,10], stl:[0.5,2.2], blk:[0.0,2.5], drb:[8,24]  },
  BIG:  { wsDef:[0, 14], stl:[0.3,1.6], blk:[0.3,4.5], drb:[10,30] },
};

function computeSIS(p) {
  const def = DEF[p.posGroup];
  const sc = (v, w, b, pts) => Math.max(0, Math.min(1, (v-w)/(b-w||1))) * pts;

  const off =
    sc(p.tsPercent, 50, 65, 10) + sc(p.indivPPP, 0.85, 1.20, 10) + sc(p.toRate, 0.22, 0.09, 5);
  const def2 =
    sc(p.wsDef40, def.wsDef[0], def.wsDef[1],  7) + // réduit (team-dépendant)
    sc(p.stlPer40, def.stl[0], def.stl[1], 5) +
    sc(p.blkPer40, def.blk[0], def.blk[1], 5) +
    sc(p.defRebPct, def.drb[0], def.drb[1], 5);     // max 22
  const adv =
    sc(p.PORPAG, 1.0, 5.5, 10) + sc(p.efgPct, 45, 62, 5) + sc(p.astToRatio, 0.4, 2.5, 5);
  const hus = sc(p.rebPer40, 2, 13, 10) + sc(p.foulsPer40, 5.0, 1.5, 8); // max 18
  const sys = sc(p.usage, 15, 32, 5) + sc(p.assistRate, 3, 35, 5) + sc(p.minPct, 50, 90, 5);
  const sis = r1(off + def2 + adv + hus + sys);

  const px_phy =
    sc(p.heightVsNBA, -5, 5, 10) + sc(p.foulsPer40, 5.0, 1.5, 5) +
    sc(p.stlPer40 + p.blkPer40, 1.0, 5.0, 5);
  const px_eff =
    sc(p.tsPercent, 52, 65, 8) + sc(p.indivPPP, 0.85, 1.20, 8) +
    sc(p.astToRatio, 0.5, 2.5, 3) + sc(p.ftPct, 58, 90, 3) + sc(p.threePAr, 5, 60, 3);
  const px_def =
    sc(p.stlPer40, def.stl[0], def.stl[1], 5) +
    sc(p.blkPer40, def.blk[0], def.blk[1], 5) +
    sc(p.foulsPer40, 5.0, 1.5, 5);
  const px_role =
    sc(p.usage, 15, 33, 7) + sc(p.assistRate, 3, 28, 7) + sc(p.PORPAG, 1.0, 5.5, 6);
  const px_nba =
    sc(p.rimAttackRate, 15, 55, 5) + sc(p.threePAr, 5, 60, 5) +
    sc(p.freeThrowRate, 15, 55, 5) + sc(p.efgPct, 48, 62, 5);
  const sisPx = r1(px_phy + px_eff + px_def + px_role + px_nba);

  return { sis, sisPx };
}

// ── Main ────────────────────────────────────────────────

function main() {
  const intermediates = [];
  const prospectsSis = [];
  let total = 0, skipped = 0;

  // Prospects 2026 (root level)
  const indexPath = path.join(DATA_DIR, "index.json");
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    for (const entry of index) {
      const fp = path.join(DATA_DIR, `${entry.id}.json`);
      if (!fs.existsSync(fp)) continue;
      try {
        const bundle = JSON.parse(fs.readFileSync(fp, "utf-8"));
        const p = extractIntermediate(bundle, null, null);
        if (!p) { skipped++; continue; }
        intermediates.push(p);
        const { sis, sisPx } = computeSIS(p);
        prospectsSis.push({
          id: p.id, name: p.name, team: p.team,
          position: p.posGroup, games: p.games,
          ppg: p.ppg, rpg: p.rpg, apg: p.apg, usage: p.usage,
          sis, sisPx,
        });
        total++;
      } catch (e) { skipped++; }
    }
    console.log(`Prospects 2026: ${total} scorés`);
  }

  // Historical draft classes
  const yearDirs = fs.readdirSync(DATA_DIR).filter((d) => /^\d{4}$/.test(d)).sort();
  for (const yearStr of yearDirs) {
    const year = parseInt(yearStr, 10);
    const yearDir = path.join(DATA_DIR, yearStr);
    const yIndexPath = path.join(yearDir, "index.json");
    if (!fs.existsSync(yIndexPath)) continue;
    const yIndex = JSON.parse(fs.readFileSync(yIndexPath, "utf-8"));
    let yCount = 0;
    for (const entry of yIndex) {
      const fp = path.join(yearDir, `${entry.id}.json`);
      if (!fs.existsSync(fp)) continue;
      try {
        const bundle = JSON.parse(fs.readFileSync(fp, "utf-8"));
        const p = extractIntermediate(bundle, year, entry.overall ?? null);
        if (!p) { skipped++; continue; }
        intermediates.push(p);
        yCount++; total++;
      } catch (e) { skipped++; }
    }
    console.log(`Draft ${year}: ${yCount} joueurs`);
  }

  // Save
  const intPath = path.join(ROOT, "data", "sis-intermediates.json");
  fs.writeFileSync(intPath, JSON.stringify(intermediates));
  const intSize = (fs.statSync(intPath).size / 1024).toFixed(1);
  console.log(`\n✅ data/sis-intermediates.json — ${intermediates.length} joueurs, ${intSize} KB`);

  const prosPath = path.join(ROOT, "data", "prospects-sis.json");
  fs.writeFileSync(prosPath, JSON.stringify(prospectsSis));
  const prosSize = (fs.statSync(prosPath).size / 1024).toFixed(1);
  console.log(`✅ data/prospects-sis.json — ${prospectsSis.length} joueurs, ${prosSize} KB`);

  console.log(`\n${total} total, ${skipped} skippés\n`);
}

main();
