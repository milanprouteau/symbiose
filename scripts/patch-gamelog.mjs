#!/usr/bin/env node
/**
 * Fetch game log data for AJ Dybantsa (id: 198382) from the CBBD API
 * and patch data/players/198382.json with the gameLog array.
 *
 * Usage:  node scripts/patch-gamelog.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load .env.local
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const BASE_URL = process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY = process.env.CBBD_API_KEY ?? "";
if (!API_KEY) {
  console.error("❌ CBBD_API_KEY not set. Add it to .env.local");
  process.exit(1);
}

async function apiFetch(p, params) {
  const url = new URL(p, BASE_URL);
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const PLAYER_ID = 198382;
const PLAYER_NAME = "AJ Dybantsa";
const TEAM = "BYU";
const SEASON = "2026";

(async () => {
  console.log(`📊 Fetching game log for ${PLAYER_NAME} (${TEAM}, season ${SEASON})...`);

  const regularGames = await apiFetch("/games/players", {
    season: SEASON,
    team: TEAM,
    seasonType: "regular",
  });
  console.log(`   Regular season: ${regularGames.length} team games`);

  let postseasonGames = [];
  try {
    postseasonGames = await apiFetch("/games/players", {
      season: SEASON,
      team: TEAM,
      seasonType: "postseason",
    });
    console.log(`   Postseason: ${postseasonGames.length} team games`);
  } catch (_) {
    console.log(`   Postseason: none available`);
  }

  const allGames = [
    ...regularGames.map((g) => ({ ...g, _st: "regular" })),
    ...postseasonGames.map((g) => ({ ...g, _st: "postseason" })),
  ];

  function extractEntry(g) {
    const p = g.players?.find((x) => x.name === PLAYER_NAME);
    if (!p) return null;
    return {
      date: g.startDate ? g.startDate.slice(0, 10) : null,
      opponent: g.opponent ?? null,
      isHome: g.isHome ?? false,
      seasonType: g._st,
      minutes: p.minutes ?? 0,
      points: p.points ?? 0,
      rebounds: p.rebounds?.total ?? 0,
      assists: p.assists ?? 0,
      steals: p.steals ?? 0,
      blocks: p.blocks ?? 0,
      turnovers: p.turnovers ?? 0,
      fouls: p.fouls ?? 0,
      fgMade: p.fieldGoals?.made ?? 0,
      fgAttempted: p.fieldGoals?.attempted ?? 0,
      threeMade: p.threePointFieldGoals?.made ?? 0,
      threeAttempted: p.threePointFieldGoals?.attempted ?? 0,
      ftMade: p.freeThrows?.made ?? 0,
      ftAttempted: p.freeThrows?.attempted ?? 0,
      starter: p.starter ?? false,
    };
  }

  const gameLog = allGames
    .map(extractEntry)
    .filter(Boolean)
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // Patch existing JSON
  const fp = path.join(ROOT, "data", "players", `${PLAYER_ID}.json`);
  const data = JSON.parse(fs.readFileSync(fp, "utf-8"));
  data.gameLog = gameLog;
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));

  console.log(`✅ Patched ${PLAYER_ID}.json with ${gameLog.length} game log entries`);
  console.log(`   Last game: ${gameLog[gameLog.length - 1]?.date} vs ${gameLog[gameLog.length - 1]?.opponent}`);
})();
