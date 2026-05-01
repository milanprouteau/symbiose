#!/usr/bin/env node
/**
 * Fetch multi-year NCAA stats for every player in draft-history.json.
 *
 * Strategy: one API call per season year (all D1 players at once) → cache
 * then look up each drafted player by athleteSourceId across all their seasons.
 *
 * Output: data/draft-history-multiyear.json
 * Format per player:
 *   { name, team, draftYear, overall, athleteSourceId, position, seasons: [...] }
 *   seasons: sorted oldest→newest, each entry has all NCAA stats + yearsBeforeDraft
 *
 * Run: node scripts/fetch-draft-multiyear.mjs
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
if (!API_KEY) { console.error("❌ CBBD_API_KEY not set. Add it to .env.local"); process.exit(1); }

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(urlPath, params = {}) {
  const url = new URL(urlPath, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Normalise a pct that may come as 0-1 or 0-100 ──
const normPct = (v) =>
  v == null ? null : v < 1 ? +(v * 100).toFixed(1) : +v.toFixed(1);

// ── Extract the stats we want from one API player entry ──
function extractStats(p) {
  const g = Math.max(p.games || 1, 1);
  return {
    games:         p.games ?? null,
    minutes:       p.minutes != null ? +(p.minutes / g).toFixed(1) : null,
    points:        p.points  != null ? +(p.points  / g).toFixed(1) : null,
    assists:       p.assists != null ? +(p.assists / g).toFixed(1) : null,
    rebounds:      p.rebounds?.total    != null ? +(p.rebounds.total    / g).toFixed(1) : null,
    oreb:          p.rebounds?.offensive != null ? +(p.rebounds.offensive / g).toFixed(1) : null,
    dreb:          p.rebounds?.defensive != null ? +(p.rebounds.defensive / g).toFixed(1) : null,
    steals:        p.steals  != null ? +(p.steals  / g).toFixed(1) : null,
    blocks:        p.blocks  != null ? +(p.blocks  / g).toFixed(1) : null,
    turnovers:     p.turnovers != null ? +(p.turnovers / g).toFixed(1) : null,
    fouls:         p.fouls   != null ? +(p.fouls   / g).toFixed(1) : null,
    usage:         p.usage   != null ? +p.usage.toFixed(1) : null,
    tsPct:         normPct(p.trueShootingPct),
    efgPct:        normPct(p.effectiveFieldGoalPct),
    fgPct:         p.fieldGoals?.pct            != null ? +p.fieldGoals.pct.toFixed(1)            : null,
    threePtPct:    p.threePointFieldGoals?.pct  != null ? +p.threePointFieldGoals.pct.toFixed(1)  : null,
    ftPct:         p.freeThrows?.pct            != null ? +p.freeThrows.pct.toFixed(1)            : null,
    ftRate:        p.freeThrowRate              != null ? +p.freeThrowRate.toFixed(2)              : null,
    astToRatio:    p.assistsTurnoverRatio       != null ? +p.assistsTurnoverRatio.toFixed(2)       : null,
    orebPct:       p.offensiveReboundPct        != null ? +p.offensiveReboundPct.toFixed(1)        : null,
    offRating:     p.offensiveRating            != null ? +p.offensiveRating.toFixed(1)            : null,
    defRating:     p.defensiveRating            != null ? +p.defensiveRating.toFixed(1)            : null,
    netRating:     p.netRating                  != null ? +p.netRating.toFixed(1)                  : null,
    PORPAG:        p.PORPAG                     != null ? +p.PORPAG.toFixed(2)                     : null,
    winShares:     p.winShares?.total           != null ? +p.winShares.total.toFixed(2)            : null,
    team:          p.team   ?? null,
    conference:    p.conference ?? null,
    position:      p.position  ?? null,
  };
}

// ── Fetch all D1 players for a given season (single call or per-conference fallback) ──
const CONFERENCES = [
  "ACC", "Big 12", "Big Ten", "SEC", "Pac-12",
  "American", "Atlantic 10", "Big East", "Mountain West", "Missouri Valley",
  "West Coast", "Conference USA", "Sun Belt", "MAC", "Southern",
  "Big West", "Horizon", "Ivy", "MAAC", "OVC",
  "Patriot", "SoCon", "Southland", "Summit", "WAC",
  "Big South", "CAA", "NEC", "MEAC", "SWAC",
];

async function fetchAllPlayersForSeason(season) {
  // Try global call first
  try {
    const data = await apiFetch("/stats/player/season", { season: String(season) });
    if (Array.isArray(data) && data.length > 100) {
      return data;
    }
  } catch { /* fall through */ }

  // Fallback: per conference
  const all = [];
  for (const conf of CONFERENCES) {
    try {
      const data = await apiFetch("/stats/player/season", {
        season: String(season),
        conference: conf,
      });
      if (Array.isArray(data)) all.push(...data);
      await delay(150);
    } catch { /* skip */ }
  }
  return all;
}

// ── Main ──
async function main() {
  const historyPath = path.join(ROOT, "data", "draft-history.json");
  const outPath     = path.join(ROOT, "data", "draft-history-multiyear.json");

  const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
  console.log(`\n🏀 Building multi-year dataset for ${history.length} drafted players\n`);

  // Determine the range of seasons to fetch
  const draftYears = history.map((p) => p.draftYear).filter(Boolean);
  const minSeason  = Math.min(...draftYears) - 3; // up to 4 NCAA seasons before draft
  const maxSeason  = Math.max(...draftYears);
  console.log(`📅 Seasons to fetch: ${minSeason} → ${maxSeason} (${maxSeason - minSeason + 1} calls)\n`);

  // Build season cache: season → Map<athleteSourceId, stats>
  // Also build a secondary index: season → Map<"name__team", stats>
  const seasonCache = new Map(); // season → Map<srcId, rawEntry>
  const seasonByName = new Map(); // season → Map<"name__team", rawEntry>

  for (let season = minSeason; season <= maxSeason; season++) {
    process.stdout.write(`  Fetching season ${season}...`);
    try {
      const players = await fetchAllPlayersForSeason(season);
      const byId   = new Map();
      const byName = new Map();

      for (const p of players) {
        if (p.athleteSourceId) byId.set(String(p.athleteSourceId), p);
        if (p.name && p.team) {
          const key = `${p.name.toLowerCase().trim()}__${p.team.toLowerCase().trim()}`;
          byName.set(key, p);
        }
      }

      seasonCache.set(season, byId);
      seasonByName.set(season, byName);
      process.stdout.write(` ${players.length} players cached\n`);
      await delay(300);
    } catch (err) {
      process.stdout.write(` ❌ ${err.message}\n`);
      seasonCache.set(season, new Map());
      seasonByName.set(season, new Map());
      await delay(300);
    }
  }

  console.log(`\n✅ Cache built. Now building per-player history...\n`);

  // For each player, look up their stats across all seasons
  let withMultiple = 0;
  let withOne      = 0;
  let withNone     = 0;

  const result = history.map((player) => {
    const { name, team, draftYear, overall, athleteSourceId, position } = player;
    const srcId = athleteSourceId ? String(athleteSourceId) : null;

    const seasons = [];

    for (let lookback = 3; lookback >= 0; lookback--) {
      const season = draftYear - lookback;
      if (season < minSeason) continue;

      const byId   = seasonCache.get(season);
      const byName = seasonByName.get(season);
      if (!byId && !byName) continue;

      let raw = null;

      // Match by athleteSourceId (most reliable)
      if (srcId && byId?.has(srcId)) {
        raw = byId.get(srcId);
      }

      // Fallback: exact name + team match
      if (!raw && byName) {
        const key = `${(name || "").toLowerCase().trim()}__${(team || "").toLowerCase().trim()}`;
        raw = byName.get(key) ?? null;
      }

      // Fallback: name only (player may have transferred)
      if (!raw && byName) {
        const nameLower = (name || "").toLowerCase().trim();
        for (const [k, v] of byName) {
          if (k.startsWith(nameLower + "__")) { raw = v; break; }
        }
      }

      if (!raw) continue;

      // Skip if too few games (injured season / redshirt)
      if ((raw.games ?? 0) < 5) continue;

      seasons.push({
        season,
        yearsBeforeDraft: lookback,
        ...extractStats(raw),
      });
    }

    if (seasons.length > 1) withMultiple++;
    else if (seasons.length === 1) withOne++;
    else withNone++;

    return {
      name,
      team,
      draftYear,
      overall,
      athleteSourceId: srcId,
      position,
      nbaStats: {
        nba_pts:     player.nba_pts     ?? null,
        nba_reb:     player.nba_reb     ?? null,
        nba_ast:     player.nba_ast     ?? null,
        nba_mpg:     player.nba_mpg     ?? null,
        nba_stl:     player.nba_stl     ?? null,
        nba_blk:     player.nba_blk     ?? null,
        nba_fg_pct:  player.nba_fg_pct  ?? null,
        nba_fg3_pct: player.nba_fg3_pct ?? null,
      },
      seasons,
    };
  });

  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log(`✅ Saved → data/draft-history-multiyear.json`);
  console.log(`   ${withMultiple} players with 2+ seasons  (trajectory calculable)`);
  console.log(`   ${withOne}      players with 1 season    (freshmen / data gap)`);
  console.log(`   ${withNone}     players with 0 seasons   (no API data)`);
  console.log(`   Total: ${result.length} players\n`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
