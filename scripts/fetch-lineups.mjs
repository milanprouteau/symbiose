#!/usr/bin/env node
/**
 * Fetch team lineups from the College Basketball Data API,
 * find the top 5 lineups (by netRating) for each player,
 * and merge them into the existing data/players/{id}.json files.
 *
 * Usage:  node scripts/fetch-lineups.mjs
 *
 * Requires CBBD_API_KEY in .env.local (or set it as env var).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ── Load env from .env.local ── */
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const BASE_URL =
  process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY = process.env.CBBD_API_KEY ?? "";
if (!API_KEY) {
  console.error("❌ CBBD_API_KEY not set. Add it to .env.local");
  process.exit(1);
}

const SEASON = 2026;
const PLAYERS_DIR = path.join(ROOT, "data", "players");

/* ── API helpers ── */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(urlPath, params = {}) {
  const url = new URL(urlPath, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status} on ${urlPath}: ${text}`);
  }
  return res.json();
}

/* ── Main ── */
async function main() {
  // Read the index to know which players/teams we need
  const indexPath = path.join(PLAYERS_DIR, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.error("❌ data/players/index.json not found. Run fetch-players.mjs first.");
    process.exit(1);
  }

  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));

  // Build a map: team → [{ id, name }]
  const teamPlayers = new Map();
  for (const entry of index) {
    const playerFile = path.join(PLAYERS_DIR, `${entry.id}.json`);
    if (!fs.existsSync(playerFile)) continue;
    const data = JSON.parse(fs.readFileSync(playerFile, "utf-8"));
    const team = data.playerStats?.team ?? entry.team;
    if (!teamPlayers.has(team)) teamPlayers.set(team, []);
    teamPlayers.get(team).push({ id: entry.id, name: data.playerStats?.name ?? entry.name });
  }

  console.log(
    `\n🏀 Fetching lineups for ${index.length} players across ${teamPlayers.size} teams\n`
  );

  // Cache of team lineups so we only fetch once per team
  const teamLineupsCache = new Map();
  const errors = [];
  let updated = 0;

  let teamIdx = 0;
  for (const [team, players] of teamPlayers) {
    teamIdx++;
    console.log(`\n── [${teamIdx}/${teamPlayers.size}] ${team} (${players.length} players) ──`);

    // Fetch lineups for this team (once)
    let lineups = teamLineupsCache.get(team);
    if (!lineups) {
      try {
        console.log(`  📊 Fetching lineups...`);
        lineups = await apiFetch("/lineups/team", {
          season: String(SEASON),
          team,
        });
        teamLineupsCache.set(team, lineups);
        console.log(`  ✅ Got ${lineups.length} lineups`);
        await delay(300);
      } catch (err) {
        console.error(`  ❌ Lineups fetch failed for ${team}: ${err.message}`);
        errors.push({ team, error: err.message });
        continue;
      }
    }

    // For each player on this team, find their top 5 lineups by netRating
    for (const player of players) {
      const playerLineups = lineups.filter((lu) =>
        lu.athletes?.some((a) => a.id === player.id) &&
        (lu.totalSeconds ?? 0) > 1000
      );

      // Sort by netRating descending, take top 5
      const top5 = playerLineups
        .sort((a, b) => (b.netRating ?? 0) - (a.netRating ?? 0))
        .slice(0, 5)
        .map((lu) => ({
          idHash: lu.idHash,
          athletes: lu.athletes.map((a) => ({ id: a.id, name: a.name })),
          totalSeconds: lu.totalSeconds ?? 0,
          pace: lu.pace ?? 0,
          offenseRating: lu.offenseRating ?? 0,
          defenseRating: lu.defenseRating ?? 0,
          netRating: lu.netRating ?? 0,
          teamStats: lu.teamStats ? {
            points: lu.teamStats.points ?? 0,
            possessions: lu.teamStats.possessions ?? 0,
            trueShooting: lu.teamStats.trueShooting ?? 0,
            fgPct: lu.teamStats.fieldGoals?.pct ?? 0,
            threePtPct: lu.teamStats.threePointers?.pct ?? 0,
            ftPct: lu.teamStats.freeThrows?.pct ?? 0,
            assists: lu.teamStats.assists ?? 0,
            steals: lu.teamStats.steals ?? 0,
            blocks: lu.teamStats.blocks ?? 0,
            turnovers: lu.teamStats.turnovers ?? 0,
            offRebounds: lu.teamStats.offensiveRebounds ?? 0,
            defRebounds: lu.teamStats.defensiveRebounds ?? 0,
            eFgPct: lu.teamStats.fourFactors?.effectiveFieldGoalPct ?? 0,
          } : undefined,
          opponentStats: lu.opponentStats ? {
            points: lu.opponentStats.points ?? 0,
            possessions: lu.opponentStats.possessions ?? 0,
            trueShooting: lu.opponentStats.trueShooting ?? 0,
            fgPct: lu.opponentStats.fieldGoals?.pct ?? 0,
            threePtPct: lu.opponentStats.threePointers?.pct ?? 0,
            ftPct: lu.opponentStats.freeThrows?.pct ?? 0,
            assists: lu.opponentStats.assists ?? 0,
            steals: lu.opponentStats.steals ?? 0,
            blocks: lu.opponentStats.blocks ?? 0,
            turnovers: lu.opponentStats.turnovers ?? 0,
            offRebounds: lu.opponentStats.offensiveRebounds ?? 0,
            defRebounds: lu.opponentStats.defensiveRebounds ?? 0,
            eFgPct: lu.opponentStats.fourFactors?.effectiveFieldGoalPct ?? 0,
          } : undefined,
        }));

      // Merge into existing player JSON
      const playerFile = path.join(PLAYERS_DIR, `${player.id}.json`);
      const data = JSON.parse(fs.readFileSync(playerFile, "utf-8"));
      data.topLineups = top5;
      fs.writeFileSync(playerFile, JSON.stringify(data, null, 2));
      console.log(
        `  🎯 ${player.name}: ${playerLineups.length} lineups found → top ${top5.length} saved`
      );
      updated++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} player files with lineup data.`);
  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    for (const e of errors) console.log(`  - ${JSON.stringify(e)}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
