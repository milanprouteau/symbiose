#!/usr/bin/env node
/**
 * Fetch team colors from the College Basketball Data API
 * and save to data/teams.json as { teamName: primaryColor }
 *
 * Usage: node scripts/fetch-teams.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const BASE_URL = process.env.CBBD_BASE_URL ?? "https://api.collegebasketballdata.com";
const API_KEY  = process.env.CBBD_API_KEY  ?? "";
if (!API_KEY) { console.error("❌ CBBD_API_KEY not set"); process.exit(1); }

const TEAMS = [
  "Alabama", "Arizona", "Arkansas", "Auburn", "BYU", "Baylor",
  "Duke", "Florida", "Houston", "Illinois", "Iowa", "Iowa State",
  "Kansas", "Kentucky", "Louisville", "Michigan", "NC State",
  "North Carolina", "Ohio State", "Oregon", "Purdue", "San Diego State",
  "St. John's", "Stanford", "Tennessee", "Texas", "Texas Tech",
  "UConn", "USC", "Vanderbilt", "Virginia", "Wake Forest", "Washington",
];

async function fetchTeam(name) {
  const url = new URL("/teams", BASE_URL);
  url.searchParams.set("team", name);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} for ${name}`);
  return res.json();
}

/** Pick the entry whose school name best matches the query */
function bestMatch(results, name) {
  const lower = name.toLowerCase();
  return (
    results.find((r) => r.school.toLowerCase() === lower) ??
    results.find((r) => r.school.toLowerCase().includes(lower)) ??
    results[0]
  );
}

const colors = {};

for (const name of TEAMS) {
  try {
    const results = await fetchTeam(name);
    const team = bestMatch(results, name);
    if (team?.primaryColor) {
      const hex = team.primaryColor.startsWith("#")
        ? team.primaryColor
        : `#${team.primaryColor}`;
      colors[name] = hex;
      console.log(`✓ ${name} → ${hex} (${team.school})`);
    } else {
      console.warn(`⚠ ${name}: no primaryColor found`);
    }
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  }
}

const out = path.join(ROOT, "data", "teams.json");
fs.writeFileSync(out, JSON.stringify(colors, null, 2));
console.log(`\n✅ Saved ${Object.keys(colors).length} teams → ${out}`);
