#!/usr/bin/env node
/**
 * Pre-process player files into lean compare bundles.
 * - Replaces raw shots with pre-mapped coordinates
 * - Pre-computes percentiles + TS+ from data/ncaa-averages.json
 *
 * Output: data/compare/{id}.json
 * Run automatically as part of `npm run build` via prebuild.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.resolve(__dirname, "..");
const PLAYERS_DIR = path.join(ROOT, "data", "players");
const COMPARE_DIR = path.join(ROOT, "data", "compare");
const AVERAGES_PATH = path.join(ROOT, "data", "ncaa-averages.json");
const WINGSPAN_PATH = path.join(PLAYERS_DIR, "wingspan.json");

// ── Load manual wingspan map (single source of truth for wingspan display) ──
let wingspans = {};
if (fs.existsSync(WINGSPAN_PATH)) {
  try {
    wingspans = JSON.parse(fs.readFileSync(WINGSPAN_PATH, "utf-8")) || {};
    console.log(`  📏 Loaded ${Object.keys(wingspans).length} manual wingspans`);
  } catch (err) {
    console.warn(`  ⚠️  Failed to parse wingspan.json:`, err.message);
  }
}

// ── Load NCAA averages (optional — skip percentiles if missing) ──
let ncaaAverages = null;
if (fs.existsSync(AVERAGES_PATH)) {
  ncaaAverages = JSON.parse(fs.readFileSync(AVERAGES_PATH, "utf-8"));
  console.log(`  📊 NCAA averages loaded (${ncaaAverages.qualifiedCount} qualified players, avgTS%: ${ncaaAverages.avgTsPct.toFixed(2)}%)`);
} else {
  console.warn("  ⚠️  data/ncaa-averages.json not found — skipping percentiles (run fetch:ncaa-stats first)");
}

// ── Percentile helper ──
function getRawPct(value, key) {
  if (!ncaaAverages) return null;
  const arr = ncaaAverages.sorted[key];
  if (!arr || arr.length === 0) return null;
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / arr.length) * 100);
}

function normPct(v) {
  return v != null && v < 1 ? v * 100 : (v ?? 0);
}

function computePercentiles(ps) {
  if (!ncaaAverages || !ps) return null;
  const g = ps.games || 1;
  const poss = (ps.fieldGoals?.attempted ?? 0) + 0.44 * (ps.freeThrows?.attempted ?? 0) + (ps.turnovers ?? 0);

  return {
    ppg:            getRawPct(ps.points / g,                                    "ppg"),
    rpg:            getRawPct((ps.rebounds?.total ?? 0) / g,                    "rpg"),
    apg:            getRawPct((ps.assists ?? 0) / g,                            "apg"),
    spg:            getRawPct((ps.steals ?? 0) / g,                             "spg"),
    bpg:            getRawPct((ps.blocks ?? 0) / g,                             "bpg"),
    topg:           getRawPct((ps.turnovers ?? 0) / g,                          "topg"),
    fpg:            getRawPct((ps.fouls ?? 0) / g,                              "fpg"),
    orpg:           getRawPct((ps.rebounds?.offensive ?? 0) / g,                "orpg"),
    drpg:           getRawPct((ps.rebounds?.defensive ?? 0) / g,                "drpg"),
    ppp:            getRawPct(poss > 0 ? ps.points / poss : 0,                  "ppp"),
    astToRatio:     getRawPct(ps.assistsTurnoverRatio ?? 0,                     "astToRatio"),
    offRating:      getRawPct(ps.offensiveRating ?? 0,                          "offRating"),
    defRating:      getRawPct(ps.defensiveRating ?? 0,                          "defRating"),
    netRating:      getRawPct(ps.netRating ?? 0,                                "netRating"),
    usage:          getRawPct(ps.usage ?? 0,                                    "usage"),
    PORPAG:         getRawPct(ps.PORPAG ?? 0,                                   "PORPAG"),
    fgPct:          getRawPct(ps.fieldGoals?.pct ?? 0,                          "fgPct"),
    twoPtPct:       getRawPct(ps.twoPointFieldGoals?.pct ?? 0,                  "twoPtPct"),
    threePtPct:     getRawPct(ps.threePointFieldGoals?.pct ?? 0,                "threePtPct"),
    ftPct:          getRawPct(ps.freeThrows?.pct ?? 0,                          "ftPct"),
    tsPct:          getRawPct(normPct(ps.trueShootingPct),                      "tsPct"),
    efgPct:         getRawPct(normPct(ps.effectiveFieldGoalPct),                "efgPct"),
    ftRate:         getRawPct(ps.freeThrowRate ?? 0,                            "ftRate"),
    drebPct:        getRawPct(100 - (ps.offensiveReboundPct ?? 0),              "drebPct"),
    winShares:      getRawPct(ps.winShares?.total ?? 0,                         "winShares"),
    offWinShares:   getRawPct(ps.winShares?.offensive ?? 0,                     "offWinShares"),
    defWinShares:   getRawPct(ps.winShares?.defensive ?? 0,                     "defWinShares"),
    winSharesPer40: getRawPct(ps.winShares?.totalPer40 ?? 0,                    "winSharesPer40"),
  };
}

function computeTsPlus(ps) {
  if (!ncaaAverages || !ps) return null;
  const avg = ncaaAverages.avgTsPct;
  if (!avg) return null;
  const tsPct = normPct(ps.trueShootingPct);
  return +(tsPct - avg).toFixed(1);
}

// ── Shot mapping ──
const BASKET_X = 52.5, COURT_MID = 470, COURT_WIDTH_HALF = 250;

function toHalfCourt(apiX, apiY) {
  if (apiX <= COURT_MID) return { x: apiY - COURT_WIDTH_HALF, y: apiX - BASKET_X };
  return { x: COURT_WIDTH_HALF - apiY, y: (940 - BASKET_X) - apiX };
}

function classifyZone(x, y) {
  const absX = Math.abs(x), dist = Math.sqrt(x * x + y * y);
  if ((x / 60) ** 2 + ((y - 34) / 49) ** 2 < 1) return "Raquette";
  if (absX > 217 && y < 94)  return x < 0 ? "Très loin gauche"  : "Très loin droit";
  if (absX > 119 && y < 87)  return x < 0 ? "Corner gauche"     : "Corner droit";
  const midBound = absX < 60 ? 127 : 127 - (absX - 60) * 0.68;
  if (y < midBound && absX < 119) {
    if (absX < 60) return "Mi-distance face";
    return x < 0 ? "Mi-distance gauche" : "Mi-distance droite";
  }
  if (y > 193 && absX < 148) return "Logo";
  if (absX > 105 && dist > 220) return x < 0 ? "Aile gauche loin" : "Aile droite loin";
  if (absX > 217) return x < 0 ? "Très loin gauche" : "Très loin droit";
  if (absX > 105) return x < 0 ? "Aile gauche" : "Aile droite";
  return "Face au panier";
}

function mapShots(plays, playerId) {
  const shots = [];
  for (const play of plays) {
    if (play.shotInfo.shooter.id !== playerId) continue;
    const loc = play.shotInfo.location;
    if (!loc || loc.x == null || loc.y == null) continue;
    const { x, y } = toHalfCourt(loc.x, loc.y);
    shots.push({
      id: String(play.id), x, y,
      made: play.shotInfo.made,
      type: play.scoreValue === 3 ? "3PT" : play.scoreValue === 1 ? "FT" : "2PT",
      zone: classifyZone(x, y),
    });
  }
  return shots;
}

// ── Main ──
fs.mkdirSync(COMPARE_DIR, { recursive: true });

// Only pick per-player files (numeric id) — excludes index.json, wingspan.json, etc.
const files = fs.readdirSync(PLAYERS_DIR).filter((f) => /^\d+\.json$/.test(f));

let count = 0;
for (const file of files) {
  const fullPath = path.join(PLAYERS_DIR, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

  // Merge manual wingspan into profile (wingspan.json is the source of truth, never overridden)
  const manualWs = wingspans[String(data.id)];
  const baseProfile = data.profile ?? null;
  const profile = baseProfile
    ? { ...baseProfile, wingspan: manualWs ?? baseProfile.wingspan ?? null }
    : manualWs != null
      ? {
          jersey: null,
          position: null,
          height: null,
          weight: null,
          wingspan: manualWs,
          hometown: null,
          dateOfBirth: null,
        }
      : null;

  const lean = {
    id:            data.id,
    name:          data.name,
    team:          data.team,
    playerStats:   data.playerStats,
    shootingStats: data.shootingStats,
    teamStats:     data.teamStats,
    profile,
    shots:         mapShots(data.shots ?? [], data.id),
    percentiles:   computePercentiles(data.playerStats),
    tsPlusRating:  computeTsPlus(data.playerStats),
    archetypesHE:  data.archetypesHE ?? null,
  };

  fs.writeFileSync(path.join(COMPARE_DIR, file), JSON.stringify(lean));
  count++;
}

console.log(`✅ Built ${count} compare bundles → data/compare/`);
