#!/usr/bin/env node
/**
 * Fetch the full play-by-play (every event type — shots, rebounds,
 * turnovers, fouls, subs, …) for every game played by a tracked
 * prospect. One file per game in data/pbp/{gameId}.json. Resume-friendly:
 * already-cached games are skipped unless --force is passed.
 *
 * Usage:
 *   node scripts/fetch-game-pbp.mjs           # cached games are skipped
 *   node scripts/fetch-game-pbp.mjs --force   # re-fetch everything
 *
 * Requires CBBD_API_KEY in .env.local.
 *
 * The list of game IDs is the union of every shot's gameId across all
 * data/players/*.json bundles, so it always matches the players you've
 * already pulled with fetch-players.mjs.
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

const PLAYERS_DIR = path.join(ROOT, "data", "players");
const PBP_DIR = path.join(ROOT, "data", "pbp");

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");

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

/* ── Game ID collection ── */
function collectGameIds() {
  const ids = new Set();
  if (!fs.existsSync(PLAYERS_DIR)) return [];
  const files = fs
    .readdirSync(PLAYERS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json");

  for (const f of files) {
    let bundle;
    try {
      bundle = JSON.parse(fs.readFileSync(path.join(PLAYERS_DIR, f), "utf-8"));
    } catch {
      continue;
    }
    if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) continue;
    const shots = Array.isArray(bundle.shots) ? bundle.shots : [];
    for (const s of shots) {
      if (s && typeof s.gameId === "number") ids.add(s.gameId);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

/* ── Main ── */
async function main() {
  fs.mkdirSync(PBP_DIR, { recursive: true });
  const gameIds = collectGameIds();
  if (gameIds.length === 0) {
    console.error("❌ No game IDs found. Run fetch-players.mjs first.");
    process.exit(1);
  }

  console.log(`\n🏀 ${gameIds.length} unique games to consider${FORCE ? " (force re-fetch)" : ""}\n`);

  let fetched = 0;
  let skipped = 0;
  let errs = 0;
  const errors = [];

  for (let i = 0; i < gameIds.length; i++) {
    const gid = gameIds[i];
    const out = path.join(PBP_DIR, `${gid}.json`);

    if (!FORCE && fs.existsSync(out)) {
      skipped++;
      continue;
    }

    try {
      const plays = await apiFetch(`/plays/game/${gid}`);
      fs.writeFileSync(out, JSON.stringify(plays));
      fetched++;
      await delay(300);
    } catch (e) {
      errs++;
      errors.push({ gameId: gid, error: e.message });
      console.warn(`  ⚠️  ${gid}: ${e.message}`);
    }

    if ((i + 1) % 25 === 0 || i === gameIds.length - 1) {
      console.log(
        `  [${i + 1}/${gameIds.length}] fetched=${fetched} skipped=${skipped} errs=${errs}`
      );
    }
  }

  console.log(`\n✅ done. fetched=${fetched} skipped=${skipped} errs=${errs}`);
  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(PBP_DIR, "_errors.json"),
      JSON.stringify(errors, null, 2)
    );
    console.log(`   errors logged → data/pbp/_errors.json`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
