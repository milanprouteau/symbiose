#!/usr/bin/env node
/**
 * Fetch all NBA draft picks from 2025 to 2002 and their college season stats.
 * Saves the result to data/draft-history.json
 *
 * Usage:  node scripts/fetch-draft-history.mjs
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

const START_YEAR = 2011;
const END_YEAR = 2002;
const OUT_FILE = path.join(ROOT, "data", "draft-history.json");

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
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

  // Load existing data and remove entries for years we're re-fetching
  let existing = [];
  if (fs.existsSync(OUT_FILE)) {
    existing = JSON.parse(fs.readFileSync(OUT_FILE, "utf-8"));
    existing = existing.filter(
      (p) => p.draftYear < END_YEAR || p.draftYear > START_YEAR
    );
    console.log(`  📂 Loaded ${existing.length} existing players (excluded ${START_YEAR}-${END_YEAR})`);
  }

  const allPlayers = [];
  const errors = [];

  console.log(
    `\n🏀 Fetching draft picks from ${START_YEAR} to ${END_YEAR}\n`
  );

  for (let year = START_YEAR; year >= END_YEAR; year--) {
    console.log(`\n── Draft ${year} ──`);

    // 1. Fetch draft picks for this year
    let picks;
    try {
      picks = await apiFetch("/draft/picks", { year: String(year) });
      await delay(300);
    } catch (err) {
      console.error(`  ❌ Failed to fetch draft picks for ${year}: ${err.message}`);
      errors.push({ year, error: err.message });
      continue;
    }

    // 2. Filter picks with a defined sourceTeamCollegeId
    const validPicks = picks.filter((p) => p.sourceTeamCollegeId != null);
    console.log(
      `  📋 ${picks.length} picks, ${validPicks.length} with sourceTeamCollegeId`
    );

    if (validPicks.length === 0) continue;

    // 3. Group picks by sourceTeamLocation to minimize API calls
    const teamMap = new Map();
    for (const pick of validPicks) {
      const team = pick.sourceTeamLocation;
      if (!team) continue;
      if (!teamMap.has(team)) teamMap.set(team, []);
      teamMap.get(team).push(pick);
    }

    // 4. For each team, fetch player season stats
    let teamIdx = 0;
    for (const [team, teamPicks] of teamMap) {
      teamIdx++;
      console.log(
        `  [${teamIdx}/${teamMap.size}] ${team} (${teamPicks.length} drafted players)`
      );

      let teamPlayerStats = [];
      try {
        teamPlayerStats = await apiFetch("/stats/player/season", {
          season: String(year),
          team,
        });
        await delay(300);
      } catch (err) {
        console.warn(
          `    ⚠️  Stats fetch failed for ${team} (${year}): ${err.message}`
        );
        errors.push({ year, team, error: err.message });
        // Still record the draft picks without stats
        for (const pick of teamPicks) {
          allPlayers.push({
            name: pick.name,
            team,
            overall: pick.overall,
            draftTeam: pick.draftTeam,
            draftYear: year,
            athleteSourceId: null,
            position: null,
            points: null,
            assists: null,
            rebounds: null,
            steals: null,
            blocks: null,
            usage: null,
            fieldGoalsPct: null,
          });
        }
        continue;
      }

      // 5. Match each drafted player by name
      for (const pick of teamPicks) {
        // Try athleteId first, then fall back to name matching
        let stats = pick.athleteId != null
          ? teamPlayerStats.find((s) => s.athleteId === pick.athleteId)
          : null;

        if (!stats) {
          // Normalize names for comparison (lowercase, trim)
          const pickName = pick.name.toLowerCase().trim();
          stats = teamPlayerStats.find(
            (s) => s.name && s.name.toLowerCase().trim() === pickName
          );
        }

        if (!stats) {
          // Try partial match (last name)
          const lastName = pick.name.split(" ").pop().toLowerCase();
          const candidates = teamPlayerStats.filter(
            (s) => s.name && s.name.toLowerCase().includes(lastName)
          );
          if (candidates.length === 1) stats = candidates[0];
        }

        if (!stats) {
          console.warn(
            `    ⚠️  No stats found for ${pick.name}`
          );
          allPlayers.push({
            name: pick.name,
            team,
            overall: pick.overall,
            draftTeam: pick.draftTeam,
            draftYear: year,
            athleteSourceId: null,
            position: null,
            points: null,
            assists: null,
            rebounds: null,
            steals: null,
            blocks: null,
            usage: null,
            fieldGoalsPct: null,
          });
          continue;
        }

        const g = stats.games || 1;

        allPlayers.push({
          name: stats.name || pick.name,
          team: stats.team || team,
          overall: pick.overall,
          draftTeam: pick.draftTeam,
          draftYear: year,
          athleteSourceId: stats.athleteSourceId || null,
          position: stats.position || null,
          points: stats.points != null ? +(stats.points / g).toFixed(1) : null,
          assists:
            stats.assists != null ? +(stats.assists / g).toFixed(1) : null,
          rebounds:
            stats.rebounds?.total != null
              ? +(stats.rebounds.total / g).toFixed(1)
              : null,
          steals:
            stats.steals != null ? +(stats.steals / g).toFixed(1) : null,
          blocks:
            stats.blocks != null ? +(stats.blocks / g).toFixed(1) : null,
          usage: stats.usage ?? null,
          fieldGoalsPct: stats.fieldGoals?.pct ?? null,
        });

        console.log(`    ✅ ${stats.name || pick.name} — #${pick.overall} → ${pick.draftTeam}`);
      }
    }
  }

  // Merge with existing and save
  const merged = [...existing, ...allPlayers].sort(
    (a, b) => b.draftYear - a.draftYear || a.overall - b.overall
  );
  fs.writeFileSync(OUT_FILE, JSON.stringify(merged, null, 2));
  console.log(
    `\n✅ Saved ${allPlayers.length} new + ${existing.length} existing = ${merged.length} total → ${path.relative(ROOT, OUT_FILE)}`
  );

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    for (const e of errors) console.log(`  - ${JSON.stringify(e)}`);
  }

  console.log(`\n🏁 Done!\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
