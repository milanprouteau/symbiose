#!/usr/bin/env node
/**
 * Fetch full data bundles for historical NBA draft picks (2022–2025).
 * For each drafted player, saves the same PlayerDataBundle structure as
 * fetch-players.mjs, allowing SIS/SIS-Px computation on historical classes.
 *
 * Output: data/players/{year}/{cbbd_athleteId}.json
 *         data/players/{year}/index.json
 *
 * Usage:
 *   node scripts/fetch-draft-class-bundles.mjs          # 2022-2025
 *   node scripts/fetch-draft-class-bundles.mjs 2023     # single year
 *   node scripts/fetch-draft-class-bundles.mjs 2022 2024 # range
 *
 * Requires CBBD_API_KEY in .env.local (or env var).
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

/* ── Parse CLI args for year range ── */
const args = process.argv.slice(2).map(Number).filter((n) => !isNaN(n) && n > 0);
let START_YEAR = 2022;
let END_YEAR = 2025;
if (args.length === 1) {
  START_YEAR = END_YEAR = args[0];
} else if (args.length >= 2) {
  START_YEAR = Math.min(args[0], args[1]);
  END_YEAR = Math.max(args[0], args[1]);
}

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

/* ── Match a draft pick to a stats row ── */
function matchPickToStats(pick, teamPlayerStats) {
  // 1. Try ESPN athleteId → athleteSourceId
  if (pick.athleteId != null) {
    const found = teamPlayerStats.find(
      (s) => s.athleteSourceId != null &&
             String(s.athleteSourceId) === String(pick.athleteId)
    );
    if (found) return found;
  }

  // 2. Exact name match
  const pickName = pick.name.toLowerCase().trim();
  const exact = teamPlayerStats.find(
    (s) => s.name && s.name.toLowerCase().trim() === pickName
  );
  if (exact) return exact;

  // 3. Last name match (only if unique)
  const lastName = pick.name.split(" ").pop().toLowerCase();
  const candidates = teamPlayerStats.filter(
    (s) => s.name && s.name.toLowerCase().includes(lastName)
  );
  if (candidates.length === 1) return candidates[0];

  return null;
}

/* ── Process a single draft year ── */
async function processYear(year) {
  const yearDir = path.join(PLAYERS_DIR, String(year));
  fs.mkdirSync(yearDir, { recursive: true });

  console.log(`\n${"═".repeat(56)}`);
  console.log(`  Draft class ${year}`);
  console.log(`${"═".repeat(56)}`);

  // 1. Fetch draft picks
  let picks;
  try {
    picks = await apiFetch("/draft/picks", { year: String(year) });
    await delay(300);
  } catch (err) {
    console.error(`  ❌ Failed to fetch draft picks for ${year}: ${err.message}`);
    return;
  }

  // Only keep picks that played in college (have a sourceTeamCollegeId)
  const collegePicks = picks.filter((p) => p.sourceTeamCollegeId != null);
  console.log(`  📋 ${picks.length} picks total, ${collegePicks.length} with college data\n`);

  if (collegePicks.length === 0) return;

  // 2. Group picks by college team
  const teamMap = new Map();
  for (const pick of collegePicks) {
    const team = pick.sourceTeamLocation;
    if (!team) continue;
    if (!teamMap.has(team)) teamMap.set(team, []);
    teamMap.get(team).push(pick);
  }

  const index = [];
  const errors = [];

  let teamIdx = 0;
  for (const [team, teamPicks] of teamMap) {
    teamIdx++;
    console.log(`\n── [${teamIdx}/${teamMap.size}] ${team} (${teamPicks.length} picks) ──`);

    // 3. Fetch team-level data (season = draft year = player's last college season)
    let teamPlayerStats = [];
    let teamShootingStats = [];
    let teamStats = null;
    let teamRoster = [];
    let teamGames = [];

    try {
      console.log(`  📊 Team stats...`);
      const teamStatsArr = await apiFetch("/stats/team/season", {
        season: String(year),
        team,
      });
      teamStats = Array.isArray(teamStatsArr) ? teamStatsArr[0] : teamStatsArr;
      await delay(200);

      console.log(`  📊 Player season stats...`);
      teamPlayerStats = await apiFetch("/stats/player/season", {
        season: String(year),
        team,
      });
      await delay(200);

      console.log(`  📊 Player shooting stats...`);
      teamShootingStats = await apiFetch("/stats/player/shooting/season", {
        season: String(year),
        team,
      });
      await delay(200);

      console.log(`  📊 Roster...`);
      const rosterResp = await apiFetch("/teams/roster", {
        season: String(year),
        team,
      });
      const rosterObj = Array.isArray(rosterResp) ? rosterResp[0] : rosterResp;
      teamRoster = rosterObj?.players ?? [];
      await delay(200);

      console.log(`  📊 Game log (regular + postseason)...`);
      const regularGames = await apiFetch("/games/players", {
        season: String(year),
        team,
        seasonType: "regular",
      });
      await delay(200);
      let postseasonGames = [];
      try {
        postseasonGames = await apiFetch("/games/players", {
          season: String(year),
          team,
          seasonType: "postseason",
        });
        await delay(200);
      } catch (_) {
        // postseason may not exist
      }
      teamGames = [
        ...regularGames.map((g) => ({ ...g, _seasonType: "regular" })),
        ...postseasonGames.map((g) => ({ ...g, _seasonType: "postseason" })),
      ];
    } catch (err) {
      console.error(`  ❌ Team-level fetch failed for ${team} (${year}): ${err.message}`);
      errors.push({ year, team, error: err.message });
      continue;
    }

    // 4. For each pick, match to stats and build bundle
    for (const pick of teamPicks) {
      const playerStats = matchPickToStats(pick, teamPlayerStats);

      if (!playerStats) {
        console.warn(`    ⚠️  No stats found for ${pick.name} — skipping`);
        errors.push({ year, player: pick.name, error: "No stats match" });
        continue;
      }

      const athleteId = playerStats.athleteId;
      const shootingStats = teamShootingStats.find(
        (s) => s.athleteId === athleteId
      );

      // Fetch shots for this player
      let shots = [];
      try {
        shots = await apiFetch(`/plays/player/${athleteId}`, {
          season: String(year),
          shootingPlaysOnly: "true",
        });
        await delay(300);
      } catch (err) {
        console.warn(`    ⚠️  Shots fetch failed for ${playerStats.name}: ${err.message}`);
      }

      // Find roster entry (match by athleteId or name)
      const rosterEntry =
        teamRoster.find((r) => r.id === athleteId) ??
        teamRoster.find(
          (r) => r.name && r.name.toLowerCase() === playerStats.name.toLowerCase()
        );

      const profile = rosterEntry
        ? {
            jersey: rosterEntry.jersey ?? null,
            position: rosterEntry.position ?? null,
            height: rosterEntry.height ?? null,
            weight: rosterEntry.weight ?? null,
            hometown: rosterEntry.hometown
              ? {
                  city: rosterEntry.hometown.city ?? null,
                  state: rosterEntry.hometown.state ?? null,
                }
              : null,
            dateOfBirth: rosterEntry.dateOfBirth ?? null,
          }
        : null;

      // Build game log for this player
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

      // Draft metadata attached to bundle
      const draftMeta = {
        overall: pick.overall,
        round: pick.round ?? null,
        pick: pick.pick ?? null,
        draftTeam: pick.draftTeam ?? null,
        draftYear: year,
      };

      const bundle = {
        id: athleteId,
        name: playerStats.name,
        team,
        draftMeta,
        playerStats,
        shootingStats: shootingStats || null,
        teamStats: teamStats || null,
        profile,
        shots,
        gameLog,
      };

      // Save individual file
      const filePath = path.join(yearDir, `${athleteId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(bundle, null, 2));

      const g = playerStats.games || 1;
      console.log(
        `    ✅ #${pick.overall} ${playerStats.name} (id: ${athleteId}) → ${path.relative(ROOT, filePath)} (${shots.length} shots)`
      );

      index.push({
        id: athleteId,
        name: playerStats.name,
        team,
        year,
        overall: pick.overall,
        draftTeam: pick.draftTeam ?? null,
        conference: playerStats.conference || "",
        position: profile?.position || playerStats.position || "",
        games: playerStats.games || 0,
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

  // Save year index
  const indexPath = path.join(yearDir, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(
    `\n✅ Draft ${year}: ${index.length} players saved → ${path.relative(ROOT, yearDir)}/`
  );

  if (errors.length > 0) {
    console.log(`⚠️  ${errors.length} errors for ${year}:`);
    for (const e of errors) console.log(`   - ${JSON.stringify(e)}`);
  }

  return index;
}

/* ── Main ── */
async function main() {
  console.log(`\n🏀 Fetching draft class bundles — ${START_YEAR} to ${END_YEAR}\n`);

  const allIndices = {};

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const idx = await processYear(year);
    if (idx) allIndices[year] = idx;
  }

  // Summary
  console.log(`\n${"═".repeat(56)}`);
  console.log("  Summary");
  console.log(`${"═".repeat(56)}`);
  let total = 0;
  for (const [year, idx] of Object.entries(allIndices)) {
    console.log(`  ${year}: ${idx.length} players`);
    total += idx.length;
  }
  console.log(`  ─────────────────────`);
  console.log(`  Total: ${total} players`);
  console.log(`\n🏁 Done!\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
