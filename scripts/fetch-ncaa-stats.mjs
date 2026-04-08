#!/usr/bin/env node
/**
 * Fetch all D1 player season stats and compute NCAA-wide distributions.
 * Used to calculate percentiles and TS+ for our player pool.
 *
 * Filters: games >= 15 AND minutes/games >= 10
 *
 * Output: data/ncaa-averages.json
 *
 * Run once per season (not part of regular build):
 *   node scripts/fetch-ncaa-stats.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Load env ──
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const BASE_URL = process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY  = process.env.CBBD_API_KEY ?? "";
if (!API_KEY) { console.error("❌ CBBD_API_KEY not set"); process.exit(1); }

const SEASON        = 2026;
const MIN_GAMES     = 15;
const MIN_MPG       = 10;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(urlPath, params = {}) {
  const url = new URL(urlPath, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${urlPath}`);
  return res.json();
}

// ── Normalize a percentage that could be 0-1 or 0-100 ──
const normPct = (v) => (v != null && v < 1 ? v * 100 : v ?? 0);

// ── Compute per-player stat values from raw API entry ──
function extractStats(p) {
  const g = p.games || 1;
  const poss = (p.fieldGoals?.attempted ?? 0) + 0.44 * (p.freeThrows?.attempted ?? 0) + (p.turnovers ?? 0);
  return {
    ppg:            p.points / g,
    rpg:            (p.rebounds?.total ?? 0) / g,
    apg:            (p.assists ?? 0) / g,
    spg:            (p.steals ?? 0) / g,
    bpg:            (p.blocks ?? 0) / g,
    topg:           (p.turnovers ?? 0) / g,
    fpg:            (p.fouls ?? 0) / g,
    orpg:           (p.rebounds?.offensive ?? 0) / g,
    drpg:           (p.rebounds?.defensive ?? 0) / g,
    ppp:            poss > 0 ? p.points / poss : 0,
    astToRatio:     p.assistsTurnoverRatio ?? 0,
    offRating:      p.offensiveRating ?? 0,
    defRating:      p.defensiveRating ?? 0,
    netRating:      p.netRating ?? 0,
    usage:          p.usage ?? 0,
    PORPAG:         p.PORPAG ?? 0,
    fgPct:          p.fieldGoals?.pct ?? 0,
    twoPtPct:       p.twoPointFieldGoals?.pct ?? 0,
    threePtPct:     p.threePointFieldGoals?.pct ?? 0,
    ftPct:          p.freeThrows?.pct ?? 0,
    tsPct:          normPct(p.trueShootingPct),
    efgPct:         normPct(p.effectiveFieldGoalPct),
    ftRate:         p.freeThrowRate ?? 0,
    drebPct:        100 - (p.offensiveReboundPct ?? 0),
    winShares:      p.winShares?.total ?? 0,
    offWinShares:   p.winShares?.offensive ?? 0,
    defWinShares:   p.winShares?.defensive ?? 0,
    winSharesPer40: p.winShares?.totalPer40 ?? 0,
  };
}

async function main() {
  console.log("🏀 Fetching all D1 player stats...");

  let allPlayers = [];

  // Try without team filter first (returns all D1 players if supported)
  try {
    allPlayers = await apiFetch("/stats/player/season", { season: String(SEASON) });
    console.log(`  → ${allPlayers.length} players returned from direct call`);
  } catch (err) {
    console.warn(`  ⚠️  Direct call failed (${err.message}), falling back to per-conference...`);

    // Fallback: fetch by conference
    const CONFERENCES = [
      "ACC", "Big 12", "Big Ten", "SEC", "Pac-12",
      "American", "Atlantic 10", "Big East", "Mountain West", "Missouri Valley",
      "West Coast", "Conference USA", "Sun Belt", "MAC", "Southern",
      "Big West", "Horizon", "Ivy", "MAAC", "OVC",
      "Patriot", "SoCon", "Southland", "Summit", "WAC",
      "Big South", "CAA", "NEC", "MEAC", "SWAC",
    ];

    for (const conf of CONFERENCES) {
      try {
        const data = await apiFetch("/stats/player/season", {
          season: String(SEASON),
          conference: conf,
        });
        allPlayers.push(...data);
        process.stdout.write(`  ${conf}: ${data.length} players\n`);
        await delay(250);
      } catch (e) {
        console.warn(`  ⚠️  ${conf}: ${e.message}`);
      }
    }
    console.log(`  → ${allPlayers.length} total players fetched`);
  }

  // ── Filter: D1 only (no division field, assume all returned are D1) ──
  // Filter: games >= 15 AND mpg >= 10
  const qualified = allPlayers.filter((p) => {
    const g = p.games ?? 0;
    const mpg = g > 0 ? (p.minutes ?? 0) / g : 0;
    return g >= MIN_GAMES && mpg >= MIN_MPG;
  });

  console.log(`\n✅ Qualified players (≥${MIN_GAMES} games, ≥${MIN_MPG} MPG): ${qualified.length}`);

  // ── Extract per-player values ──
  const statValues = {};
  for (const p of qualified) {
    const s = extractStats(p);
    for (const [key, val] of Object.entries(s)) {
      if (!statValues[key]) statValues[key] = [];
      if (typeof val === "number" && isFinite(val)) {
        statValues[key].push(val);
      }
    }
  }

  // ── Sort each stat array ascending ──
  const sorted = {};
  for (const [key, arr] of Object.entries(statValues)) {
    sorted[key] = arr.sort((a, b) => a - b);
  }

  // ── Average TS% ──
  const tsPctValues = sorted.tsPct ?? [];
  const avgTsPct = tsPctValues.length
    ? tsPctValues.reduce((sum, v) => sum + v, 0) / tsPctValues.length
    : 54.0;

  const output = {
    season: SEASON,
    qualifiedCount: qualified.length,
    minGames: MIN_GAMES,
    minMpg: MIN_MPG,
    avgTsPct: +avgTsPct.toFixed(4),
    sorted,
  };

  const outPath = path.join(ROOT, "data", "ncaa-averages.json");
  fs.writeFileSync(outPath, JSON.stringify(output));
  console.log(`\n✅ Saved → data/ncaa-averages.json`);
  console.log(`   avgTsPct: ${avgTsPct.toFixed(2)}%`);
  console.log(`   Stats tracked: ${Object.keys(sorted).length}`);
  console.log(`   File size: ${(fs.statSync(outPath).size / 1024).toFixed(0)}KB\n`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
