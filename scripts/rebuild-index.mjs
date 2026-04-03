#!/usr/bin/env node
/**
 * Rebuild data/players/index.json from existing player JSON files.
 * No API calls — just reads local files and regenerates the index.
 *
 * Usage:  node scripts/rebuild-index.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.join(ROOT, "data", "players");

const files = fs.readdirSync(DIR).filter((f) => /^\d+\.json$/.test(f));
const index = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf-8");
  const data = JSON.parse(raw);
  const s = data.playerStats;
  const p = data.profile;

  if (!s) {
    console.warn(`⚠️  Skipping ${file} — no playerStats`);
    continue;
  }

  const g = s.games || 1;

  index.push({
    id: data.id,
    name: s.name || data.name,
    team: data.team || s.team,
    conference: s.conference || "",
    position: p?.position || s.position || "",
    games: s.games || 0,
    points: s.points || 0,
    ppg: +(s.points / g).toFixed(1),
    rpg: +((s.rebounds?.total || 0) / g).toFixed(1),
    apg: +((s.assists || 0) / g).toFixed(1),
    mpg: +((s.minutes || 0) / g).toFixed(1),
    fgPct: s.fieldGoals?.pct || 0,
    threePct: s.threePointFieldGoals?.pct || 0,
    ftPct: s.freeThrows?.pct || 0,
    usage: s.usage || 0,
  });
}

const indexPath = path.join(DIR, "index.json");
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(`✅ Index rebuilt → ${path.relative(ROOT, indexPath)} (${index.length} players)`);
