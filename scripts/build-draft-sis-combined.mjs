#!/usr/bin/env node
/**
 * Merge all data/players/{year}/sis-scores.json into data/players/draft-sis-all.json
 * Faster alternative to re-running compute-draft-sis.mjs.
 *
 * Usage: node scripts/build-draft-sis-combined.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLAYERS_DIR = path.join(ROOT, "data", "players");

const all = [];

const years = fs
  .readdirSync(PLAYERS_DIR)
  .filter((d) => /^\d{4}$/.test(d))
  .sort();

for (const year of years) {
  const sisPath = path.join(PLAYERS_DIR, year, "sis-scores.json");
  if (!fs.existsSync(sisPath)) continue;
  const entries = JSON.parse(fs.readFileSync(sisPath, "utf-8"));
  all.push(...entries);
  console.log(`${year}: ${entries.length} players`);
}

all.sort((a, b) => b.sisPx.total - a.sisPx.total);

const outPath = path.join(PLAYERS_DIR, "draft-sis-all.json");
fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
console.log(`\n✅ ${all.length} total players → ${path.relative(ROOT, outPath)}`);
