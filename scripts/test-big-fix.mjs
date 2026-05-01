#!/usr/bin/env node
/**
 * Test script — compare SISPx MAE avant/après corrections pour les Centers
 * Usage: node scripts/test-big-fix.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  G:    { stl: [0.6, 2.4], blk: [0.0, 0.8], drb: [3, 13],  wsDef: [-5, 10] },
  WING: { stl: [0.5, 2.2], blk: [0.0, 2.5], drb: [8, 24],  wsDef: [-5, 10] },
  BIG:  { stl: [0.3, 1.6], blk: [0.3, 4.5], drb: [10, 30], wsDef: [0,  14] },
};

const NBA_AVG_HEIGHT = { G: 75, WING: 78, BIG: 82 };

// ── Calcul commun (parties identiques) ───────────────────────────────────────

function computeIntermediate(bundle) {
  const ps = bundle.playerStats;
  const ts = bundle.teamStats;
  const profile = bundle.profile;
  if (!ps || !ts || ps.games < 10) return null;

  const minutes = ps.minutes || 1;
  const pg = posGroup(profile?.position ?? ps.position ?? "F");
  const def = DEF_THRESHOLDS[pg];

  const tsPercent   = ps.trueShootingPct < 1 ? ps.trueShootingPct * 100 : ps.trueShootingPct;
  const indivPosBase = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted + ps.turnovers;
  const indivPPP    = indivPosBase > 0 ? ps.points / indivPosBase : 0;
  const toRate      = indivPosBase > 0 ? ps.turnovers / indivPosBase : 0;
  const stlPer40    = (ps.steals / minutes) * 40;
  const blkPer40    = (ps.blocks / minutes) * 40;
  const rebPer40    = (ps.rebounds.total / minutes) * 40;
  const foulsPer40  = (ps.fouls / minutes) * 40;
  const wsDef40     = (ps.winShares.defensive / minutes) * 40 * 100;
  const defRebPct   = ((ps.rebounds.defensive * ts.totalMinutes) /
    (minutes * (ts.teamStats.rebounds.defensive + ts.opponentStats.rebounds.offensive))) * 100;
  const tmShare     = minutes / ts.totalMinutes;
  const assistDenom = tmShare * ts.teamStats.fieldGoals.made - ps.fieldGoals.made;
  const assistRate  = assistDenom > 0 ? (100 * ps.assists) / assistDenom : 0;
  const minPct      = (minutes / (ps.games * 40)) * 100;
  const totalFga    = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted;
  const threePAr    = totalFga > 0 ? ps.threePointFieldGoals.attempted / totalFga : 0;
  const efgPct      = ps.effectiveFieldGoalPct;
  const ftRate      = ps.freeThrowRate;
  const PORPAG      = ps.PORPAG;
  const astToRatio  = ps.assistsTurnoverRatio;
  const ftPct       = ps.freeThrows.pct;
  const heightInches = profile?.height ?? null;

  return { pg, def, tsPercent, indivPPP, toRate, stlPer40, blkPer40, rebPer40,
           foulsPer40, wsDef40, defRebPct, assistRate, minPct, threePAr,
           efgPct, ftRate, PORPAG, astToRatio, ftPct, heightInches,
           usage: ps.usage };
}

// ── VERSION ORIGINALE ─────────────────────────────────────────────────────────

function computeSisPxOriginal(s) {
  const { pg, def, tsPercent, indivPPP, stlPer40, blkPer40,
          foulsPer40, assistRate, threePAr,
          efgPct, ftRate, PORPAG, astToRatio, ftPct, heightInches, usage } = s;

  // SISPx
  const hDelta   = heightInches !== null ? score(heightInches - NBA_AVG_HEIGHT[pg], -5, 5, 10) : 5;
  const pxPhys   = hDelta + score(foulsPer40, 5.0, 1.5, 5) + score(stlPer40 + blkPer40, 1.0, 5.0, 5);
  const pxEff    = score(tsPercent, 52, 65, 8) + score(indivPPP, 0.85, 1.20, 8)
                 + score(astToRatio, 0.5, 2.5, 3) + score(ftPct, 58, 90, 3) + score(threePAr * 100, 5, 60, 3);
  const pxDef    = score(stlPer40, def.stl[0], def.stl[1], 5)
                 + score(blkPer40, def.blk[0], def.blk[1], 5)
                 + score(foulsPer40, 5.0, 1.5, 5);
  const pxRole   = score(usage, 15, 33, 7) + score(assistRate, 3, 28, 7) + score(PORPAG, 1.0, 5.5, 6);
  const pxAdapt  = 2.5 /* rimAtk fallback */
                 + score(threePAr * 100, 5, 60, 5) + score(ftRate, 15, 55, 5) + score(efgPct, 48, 62, 5);

  return r1(pxPhys + pxEff + pxDef + pxRole + pxAdapt);
}

// ── VERSION MODIFIÉE ──────────────────────────────────────────────────────────
// Changements pour BIG uniquement :
//   1. pxEff : TS% et PPP réduits (8→5 pts chacun) — scoring traduit moins bien en NBA
//   2. pxRole : assistRate (3→28, 7pts) → rebPer40 (8→16, 10pts)
//      → Les rebonds sont l'indicateur de rôle NBA pour les intérieurs
//   3. Multiplicateur de translation basé sur REB/40 (0.75–1.10)
//      → Les intérieurs non-dominants au rebond sont pénalisés

function computeSisPxModified(s) {
  const { pg, def, tsPercent, indivPPP, stlPer40, blkPer40, rebPer40,
          foulsPer40, assistRate, threePAr,
          efgPct, ftRate, PORPAG, astToRatio, ftPct, heightInches, usage } = s;

  const isBig = pg === "BIG";

  // SISPx physique (inchangé)
  const hDelta  = heightInches !== null ? score(heightInches - NBA_AVG_HEIGHT[pg], -5, 5, 10) : 5;
  const pxPhys  = hDelta + score(foulsPer40, 5.0, 1.5, 5) + score(stlPer40 + blkPer40, 1.0, 5.0, 5);

  // pxEff : pour BIG, scoring traduit moins bien (8→5 pts) ; reste inchangé pour G/WING
  const tsPts  = score(tsPercent, 52, 65, isBig ? 5 : 8);
  const pppPts = score(indivPPP, 0.85, 1.20, isBig ? 5 : 8);
  const pxEff  = tsPts + pppPts + score(astToRatio, 0.5, 2.5, 3) + score(ftPct, 58, 90, 3)
               + score(threePAr * 100, 5, 60, 3);

  const pxDef  = score(stlPer40, def.stl[0], def.stl[1], 5)
               + score(blkPer40, def.blk[0], def.blk[1], 5)
               + score(foulsPer40, 5.0, 1.5, 5);

  // pxRole : pour BIG, remplace assistRate par rebPer40 (dominance au rebond = rôle NBA)
  const rolePts = isBig
    ? score(rebPer40, 8, 16, 10)
    : score(assistRate, 3, 28, 7);
  const usagePts = score(usage, 15, 33, isBig ? 5 : 7);
  const pxRole   = usagePts + rolePts + score(PORPAG, 1.0, 5.5, 6);

  // pxAdapt (inchangé — double pénalité 3PAr reste pour les bigs qui tentent des 3)
  const pxAdapt = 2.5 + score(threePAr * 100, 5, 60, 5) + score(ftRate, 15, 55, 5)
               + score(efgPct, 48, 62, 5);

  const rawScore = pxPhys + pxEff + pxDef + pxRole + pxAdapt;

  // Multiplicateur de translation : les intérieurs non-dominants au rebond sont pénalisés
  // REB/40 < 9 → ×0.75 ; REB/40 ≥ 13 → ×1.10 (reward Edey/Clingan tier)
  let finalScore = rawScore;
  if (isBig) {
    const rebClamped = Math.max(9, Math.min(13, rebPer40));
    const rebMult    = 0.75 + 0.35 * ((rebClamped - 9) / (13 - 9));
    finalScore = rawScore * rebMult;
  }

  return r1(finalScore);
}

// ── Lecture et matching ───────────────────────────────────────────────────────

function loadBundles(year) {
  const dir = path.join(ROOT, "data", "players", String(year));
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /^\d+\.json$/.test(f))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")); }
      catch { return null; }
    })
    .filter(Boolean);
}

function normalize(name) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

function run(year) {
  const comparison = JSON.parse(fs.readFileSync(
    path.join(ROOT, "data", `draft_${year}_comparison.json`), "utf-8"
  ));
  const bundles = loadBundles(year);

  const results = [];

  for (const row of comparison) {
    const bundle = bundles.find(b => normalize(b.name) === normalize(row.name));
    if (!bundle) {
      console.warn(`  ⚠ bundle introuvable : ${row.name}`);
      continue;
    }

    const inter = computeIntermediate(bundle);
    if (!inter) continue;

    const predOrig = computeSisPxOriginal(inter);
    const predNew  = computeSisPxModified(inter);
    const real     = row.sisPxReal;

    results.push({
      name: row.name,
      pos: row.posGroup,
      pg: inter.pg,
      overall: row.overall,
      real,
      predOrig,
      predNew,
      ecartOrig: real - predOrig,
      ecartNew:  real - predNew,
    });
  }

  return results;
}

// ── Affichage ─────────────────────────────────────────────────────────────────

function mae(arr, key) {
  return (arr.reduce((s, r) => s + Math.abs(r[key]), 0) / arr.length).toFixed(1);
}

function printResults(label, rows) {
  const bigs  = rows.filter(r => r.pg === "BIG");
  const other = rows.filter(r => r.pg !== "BIG");

  console.log(`\n${"═".repeat(70)}`);
  console.log(` ${label}`);
  console.log(`${"═".repeat(70)}`);
  console.log(`${"Nom".padEnd(22)} ${"Pos".padEnd(7)} ${"#".padStart(3)}  ${"Réel".padStart(5)}  ${"Orig".padStart(5)}  ${"Nouv".padStart(5)}  ${"ΔOrig".padStart(6)}  ${"ΔNouv".padStart(6)}  Δgain`);
  console.log(`${"─".repeat(70)}`);

  for (const r of rows.sort((a, b) => a.overall - b.overall)) {
    const gain = (Math.abs(r.ecartOrig) - Math.abs(r.ecartNew)).toFixed(1);
    const marker = r.pg === "BIG" ? " ◀" : "";
    console.log(
      `${r.name.padEnd(22)} ${r.pos.padEnd(7)} ${String(r.overall).padStart(3)}  ` +
      `${String(r.real).padStart(5)}  ${String(r.predOrig).padStart(5)}  ${String(r.predNew).padStart(5)}  ` +
      `${(r.ecartOrig > 0 ? "+" : "") + r.ecartOrig.toFixed(1).padStart(5)}  ` +
      `${(r.ecartNew > 0 ? "+" : "") + r.ecartNew.toFixed(1).padStart(5)}  ` +
      `${gain > 0 ? "+" : ""}${gain}${marker}`
    );
  }

  console.log(`${"─".repeat(70)}`);
  console.log(`MAE total    — orig: ${mae(rows, "ecartOrig")}  nouv: ${mae(rows, "ecartNew")}`);
  console.log(`MAE Centers  — orig: ${mae(bigs, "ecartOrig")}  nouv: ${mae(bigs, "ecartNew")}`);
  console.log(`MAE Guards/W — orig: ${mae(other, "ecartOrig")}  nouv: ${mae(other, "ecartNew")}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const r2024 = run(2024);
const r2025 = run(2025);
const all   = [...r2024, ...r2025];

printResults("Draft 2024", r2024);
printResults("Draft 2025", r2025);
printResults("2024 + 2025 combinés", all);
