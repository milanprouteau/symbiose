#!/usr/bin/env node
/**
 * Enrich draft-history.json with additional stats from CBBD API.
 * Adds: threePtPct, ftPct, topg, tsPct, orebPct, astToRatio
 *
 * Groups players by (team, draftYear) to minimize API calls.
 * ~561 unique combos with 200ms delay ≈ ~2 minutes total.
 *
 * Run: node scripts/enrich-draft-history.mjs
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

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(urlPath, params = {}) {
  const url = new URL(urlPath, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const normPct = (v) => (v != null && v < 1 ? +(v * 100).toFixed(1) : v != null ? +v.toFixed(1) : null);

// ── Load draft history ──
const historyPath = path.join(ROOT, "data", "draft-history.json");
const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));

// ── Build lookup: athleteSourceId → player index ──
const bySourceId = new Map();
history.forEach((p, i) => {
  if (p.athleteSourceId) bySourceId.set(p.athleteSourceId, i);
});

// ── Group by (team, draftYear) ──
const groups = new Map();
for (const p of history) {
  if (!p.athleteSourceId || !p.team || !p.draftYear) continue;
  const key = `${p.team}__${p.draftYear}`;
  if (!groups.has(key)) groups.set(key, { team: p.team, year: p.draftYear });
}

console.log(`\n🏀 Enriching ${history.length} players across ${groups.size} team/year combos\n`);

let enriched = 0;
let apiErrors = 0;
let comboIdx = 0;

for (const [, { team, year }] of groups) {
  comboIdx++;
  if (comboIdx % 50 === 0) {
    console.log(`  [${comboIdx}/${groups.size}] ${team} ${year} — enriched so far: ${enriched}`);
  }

  let players;
  try {
    players = await apiFetch("/stats/player/season", {
      season: String(year),
      team,
    });
    await delay(200);
  } catch {
    apiErrors++;
    continue;
  }

  if (!Array.isArray(players) || players.length === 0) continue;

  for (const apiPlayer of players) {
    const srcId = String(apiPlayer.athleteSourceId ?? "");
    if (!srcId || !bySourceId.has(srcId)) continue;

    const idx = bySourceId.get(srcId);
    const g = apiPlayer.games || 1;

    history[idx].threePtPct   = apiPlayer.threePointFieldGoals?.pct != null
      ? +apiPlayer.threePointFieldGoals.pct.toFixed(1)
      : null;
    history[idx].ftPct        = apiPlayer.freeThrows?.pct != null
      ? +apiPlayer.freeThrows.pct.toFixed(1)
      : null;
    history[idx].topg         = apiPlayer.turnovers != null
      ? +((apiPlayer.turnovers / g).toFixed(1))
      : null;
    history[idx].tsPct        = normPct(apiPlayer.trueShootingPct);
    history[idx].orebPct      = apiPlayer.offensiveReboundPct != null
      ? +apiPlayer.offensiveReboundPct.toFixed(1)
      : null;
    history[idx].astToRatio   = apiPlayer.assistsTurnoverRatio != null
      ? +apiPlayer.assistsTurnoverRatio.toFixed(2)
      : null;

    enriched++;
  }
}

// Count players still missing new stats
const stillMissing = history.filter(
  (p) => p.athleteSourceId && p.threePtPct == null
).length;

// Save
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

console.log(`\n✅ Done!`);
console.log(`   Enriched:     ${enriched} players`);
console.log(`   API errors:   ${apiErrors} combos`);
console.log(`   Still missing: ${stillMissing} (no API data for their season)`);
console.log(`   Saved → data/draft-history.json\n`);
