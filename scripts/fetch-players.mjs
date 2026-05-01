#!/usr/bin/env node
/**
 * Fetch all player data from the College Basketball Data API
 * and save to data/players/{id}.json + data/players/index.json
 *
 * Usage:  node scripts/fetch-players.mjs
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

const BASE_URL = process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY = process.env.CBBD_API_KEY ?? "";
if (!API_KEY) {
  console.error("❌ CBBD_API_KEY not set. Add it to .env.local");
  process.exit(1);
}

const SEASON = 2026;
const OUT_DIR = path.join(ROOT, "data", "players");

/* ── Player list ── */
const PLAYERS = [
  { name: "AJ Dybantsa", team: "BYU", id: 198382 },
  { name: "Darryn Peterson", team: "Kansas", id: 199883 },
  { name: "Cameron Boozer", team: "Duke", id: 198977 },
  { name: "Caleb Wilson", team: "North Carolina", id: 200988 },
  { name: "Kingston Flemings", team: "Houston", id: 199596 },
  { name: "Keaton Wagler", team: "Illinois", id: 199686 },
  { name: "Nate Ament", team: "Tennessee", id: 202445 },
  { name: "Darius Acuff", team: "Arkansas", id: 198012 },
  { name: "Mikel Brown Jr.", team: "Louisville", id: 200182 },
  { name: "Labaron Philon", team: "Alabama", id: 85 },
  { name: "Hannes Steinbach", team: "Washington", id: 203279 },
  { name: "Yaxel Lendeborg", team: "Michigan", id: 3951 },
  { name: "Patrick Ngongba II", team: "Duke", id: 216 },
  { name: "Braylon Mullins", team: "Uconn", id: 202778 },
  { name: "Jayden Quaintance", team: "Kentucky", id: 7639 },
  { name: "Thomas Haugh", team: "Florida", id: 502 },
  { name: "Koa Peat", team: "Arizona", id: 197993 },
  { name: "Brayden Burries", team: "Arizona", id: 197982 },
  { name: "Bennett Stirtz", team: "Iowa", id: 3596 },
  { name: "Christian Anderson", team: "Texas Tech", id: 7593 },
  { name: "Chris Cenac Jr.", team: "Houston", id: 199595 },
  { name: "Joshua Jefferson", team: "Iowa State", id: 142 },
  { name: "Tounde Yessoufou", team: "Baylor", id: 198155 },
  { name: "Aday Mara", team: "Michigan", id: 535 },
  { name: "Cameron Carr", team: "Baylor", id: 309 },
  { name: "Morez Johnson Jr.", team: "Michigan", id: 5647 },
  { name: "Tyler Tanner", team: "Vanderbilt", id: 4562 },
  { name: "Amari Allen", team: "Alabama", id: 197881 },
  { name: "Ebuka Okorie", team: "Stanford", id: 202245 },
  { name: "Malachi Moreno", team: "Kentucky", id: 199963 },
  { name: "Isaiah Evans", team: "Duke", id: 211 },
  { name: "Dailyn Swain", team: "Texas", id: 4065 },
  { name: "Alijah Arenas", team: "USC", id: 202954 },
  { name: "Flory Bidunga", team: "Kansas", id: 53 },
  { name: "Henri Veesaar", team: "North Carolina", id: 270 },
  { name: "Meleek Thomas", team: "Arkansas", id: 198026 },
  { name: "Juke Harris", team: "Wake Forest", id: 5773 },
  { name: "Richie Saunders", team: "BYU", id: 7673 },
  { name: "Braden Smith", team: "Purdue", id: 368 },
  { name: "Alex Karaban", team: "Uconn", id: 7792 },
  { name: "Zuby Ejiofor", team: "St. John's", id: 1424 },
  { name: "Ryan Conwell", team: "Louisville", id: 4066 },
  { name: "JT Toppin", team: "Texas Tech", id: 7581 },
  { name: "Joseph Tugler", team: "Houston", id: 112 },
  { name: "Alex Condon", team: "Florida", id: 496 },
  { name: "Tarris Reed Jr.", team: "Uconn", id: 7799 },
  { name: "Motiejus Krivas", team: "Arizona", id: 274 },
  { name: "Rueben Chinyelu", team: "Florida", id: 497 },
  { name: "Bruce Thornton", team: "Ohio State", id: 420 },
  { name: "Milan Momcilovic", team: "Iowa State", id: 149 },
  { name: "Jaden Bradley", team: "Arizona", id: 269 },
  { name: "Paul McNeil Jr.", team: "NC State", id: 2862 },
  { name: "Tamin Lipsey", team: "Iowa State", id: 144 },
  { name: "Nate Bittle", team: "Oregon", id: 7241 },
  { name: "Miles Byrd", team: "San Diego State", id: 8457 },
  { name: "Keyshawn Hall", team: "Auburn", id: 334 },
  { name: "Johann Grunloh", team: "Virginia", id: 203192 },
];

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

/* ── Group players by team ── */
function groupByTeam(players) {
  const map = new Map();
  for (const p of players) {
    if (!map.has(p.team)) map.set(p.team, []);
    map.get(p.team).push(p);
  }
  return map;
}

/* ── Main ── */
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const teamGroups = groupByTeam(PLAYERS);
  const index = [];
  const errors = [];

  console.log(`\n🏀 Fetching data for ${PLAYERS.length} players across ${teamGroups.size} teams\n`);

  let teamIdx = 0;
  for (const [team, players] of teamGroups) {
    teamIdx++;
    console.log(`\n── [${teamIdx}/${teamGroups.size}] ${team} (${players.length} players) ──`);

    // Fetch team-level data (shared across all players on same team)
    let teamPlayerStats = [];
    let teamShootingStats = [];
    let teamStats = null;
    let teamRoster = [];
    let teamGames = [];

    try {
      console.log(`  📊 Fetching team stats...`);
      const teamStatsArr = await apiFetch("/stats/team/season", {
        season: String(SEASON),
        team,
      });
      teamStats = Array.isArray(teamStatsArr) ? teamStatsArr[0] : teamStatsArr;
      await delay(200);

      console.log(`  📊 Fetching player season stats...`);
      teamPlayerStats = await apiFetch("/stats/player/season", {
        season: String(SEASON),
        team,
      });
      await delay(200);

      console.log(`  📊 Fetching player shooting stats...`);
      teamShootingStats = await apiFetch("/stats/player/shooting/season", {
        season: String(SEASON),
        team,
      });
      await delay(200);

      console.log(`  📊 Fetching roster...`);
      const rosterResp = await apiFetch("/teams/roster", {
        season: String(SEASON),
        team,
      });
      const rosterObj = Array.isArray(rosterResp) ? rosterResp[0] : rosterResp;
      teamRoster = rosterObj?.players ?? [];
      await delay(200);

      console.log(`  📊 Fetching game log (regular + postseason)...`);
      const regularGames = await apiFetch("/games/players", {
        season: String(SEASON),
        team,
        seasonType: "regular",
      });
      await delay(200);
      let postseasonGames = [];
      try {
        postseasonGames = await apiFetch("/games/players", {
          season: String(SEASON),
          team,
          seasonType: "postseason",
        });
        await delay(200);
      } catch {
        // postseason may not exist yet
      }
      teamGames = [
        ...regularGames.map((g) => ({ ...g, _seasonType: "regular" })),
        ...postseasonGames.map((g) => ({ ...g, _seasonType: "postseason" })),
      ];
    } catch (err) {
      console.error(`  ❌ Team-level fetch failed for ${team}: ${err.message}`);
      errors.push({ team, error: err.message });
      continue;
    }

    // Now fetch individual player shots
    for (const player of players) {
      console.log(`  🎯 ${player.name} (id: ${player.id})...`);

      // Find this player in team stats arrays
      const playerStats = teamPlayerStats.find(
        (s) => s.athleteId === player.id
      );
      const shootingStats = teamShootingStats.find(
        (s) => s.athleteId === player.id
      );

      if (!playerStats) {
        console.warn(`    ⚠️  No season stats found for ${player.name} (id ${player.id}) — skipping`);
        errors.push({ player: player.name, id: player.id, error: "No season stats found" });
        continue;
      }

      // Fetch shots
      let shots = [];
      try {
        shots = await apiFetch(`/plays/player/${player.id}`, {
          season: String(SEASON),
          shootingPlaysOnly: "true",
        });
        await delay(300);
      } catch (err) {
        console.warn(`    ⚠️  Shots fetch failed: ${err.message}`);
        // Continue without shots — stats are more important
      }

      // Find this player in roster
      const rosterEntry = teamRoster.find(
        (r) => r.id === player.id
      );

      // Read existing file to preserve manually-set fields the API doesn't return
      const filePath = path.join(OUT_DIR, `${player.id}.json`);
      const existingProfile = fs.existsSync(filePath)
        ? (JSON.parse(fs.readFileSync(filePath, "utf-8"))?.profile ?? {})
        : {};

      // NOTE: `wingspan` is manual data. Canonical source = data/players/wingspan.json
      // (merged at build-time by build-compare-bundles.mjs and at runtime on the player page).
      // `weight` is also partially manual (the API sometimes returns null, e.g. for international
      // players). We prefer any already-stored value over the API response so that manual
      // corrections are preserved across fetches.
      const profile = rosterEntry
        ? {
            jersey: rosterEntry.jersey ?? null,
            position: rosterEntry.position ?? null,
            height: rosterEntry.height ?? null,
            weight: existingProfile.weight ?? rosterEntry.weight ?? null,
            wingspan: existingProfile.wingspan ?? rosterEntry.wingspan ?? null,
            hometown: rosterEntry.hometown
              ? {
                  city: rosterEntry.hometown.city ?? null,
                  state: rosterEntry.hometown.state ?? null,
                }
              : null,
            dateOfBirth: rosterEntry.dateOfBirth ?? existingProfile.dateOfBirth ?? null,
          }
        : existingProfile && Object.keys(existingProfile).length > 0
          ? existingProfile
          : null;

      // Extract game log for this player (match by name since athleteId varies per game)
      const gameLog = (teamGames || [])
        .filter((g) => Array.isArray(g.players))
        .map((g) => {
          const pEntry = g.players.find((p) => p.name === playerStats.name);
          if (!pEntry) return null;
          return {
            date: g.startDate ? g.startDate.slice(0, 10) : null,
            opponent: g.opponent ?? null,
            isHome: g.isHome ?? false,
            seasonType: g._seasonType ?? "regular",
            minutes: pEntry.minutes ?? 0,
            points: pEntry.points ?? 0,
            rebounds: pEntry.rebounds?.total ?? 0,
            assists: pEntry.assists ?? 0,
            steals: pEntry.steals ?? 0,
            blocks: pEntry.blocks ?? 0,
            turnovers: pEntry.turnovers ?? 0,
            fouls: pEntry.fouls ?? 0,
            fgMade: pEntry.fieldGoals?.made ?? 0,
            fgAttempted: pEntry.fieldGoals?.attempted ?? 0,
            threeMade: pEntry.threePointFieldGoals?.made ?? 0,
            threeAttempted: pEntry.threePointFieldGoals?.attempted ?? 0,
            ftMade: pEntry.freeThrows?.made ?? 0,
            ftAttempted: pEntry.freeThrows?.attempted ?? 0,
            starter: pEntry.starter ?? false,
          };
        })
        .filter(Boolean)
        .sort((a, b) => (a.date > b.date ? 1 : -1));

      // Build the player data bundle
      const bundle = {
        id: player.id,
        name: player.name,
        team: player.team,
        playerStats: playerStats || null,
        shootingStats: shootingStats || null,
        teamStats: teamStats || null,
        profile,
        shots,
        gameLog,
      };

      // Save individual file
      fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2));
      console.log(`    ✅ Saved → ${path.relative(ROOT, filePath)} (${shots.length} shots)`);

      // Add to index
      const g = playerStats.games || 1;
      index.push({
        id: player.id,
        name: playerStats.name || player.name,
        team: player.team,
        conference: playerStats.conference || "",
        position: profile?.position || playerStats.position || "",
        games: playerStats.games || 0,
        points: playerStats.points || 0,
        ppg: +(playerStats.points / g).toFixed(1),
        rpg: +((playerStats.rebounds?.total || 0) / g).toFixed(1),
        apg: +((playerStats.assists || 0) / g).toFixed(1),
        mpg: +((playerStats.minutes || 0) / g).toFixed(1),
        fgPct: playerStats.fieldGoals?.pct || 0,
        threePct: playerStats.threePointFieldGoals?.pct || 0,
        ftPct: playerStats.freeThrows?.pct || 0,
        usage: playerStats.usage || 0,
      });
    }
  }

  // Save index
  const indexPath = path.join(OUT_DIR, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`\n✅ Index saved → ${path.relative(ROOT, indexPath)} (${index.length} players)`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    for (const e of errors) console.log(`  - ${JSON.stringify(e)}`);
  }

  console.log(`\n🏁 Done! ${index.length}/${PLAYERS.length} players fetched successfully.\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
