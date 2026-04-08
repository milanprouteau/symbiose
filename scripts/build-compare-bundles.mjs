#!/usr/bin/env node
/**
 * Pre-process player files into lean compare bundles.
 * Replaces raw shots (1-1.5MB each) with pre-mapped shot coordinates (~70KB).
 * Output: data/compare/{id}.json  (~75KB each vs ~1.5MB)
 *
 * Run automatically as part of `npm run build` via prebuild.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLAYERS_DIR = path.join(ROOT, "data", "players");
const COMPARE_DIR = path.join(ROOT, "data", "compare");

const BASKET_X = 52.5;
const COURT_MID = 470;
const COURT_WIDTH_HALF = 250;

function toHalfCourt(apiX, apiY) {
  if (apiX <= COURT_MID) {
    return { x: apiY - COURT_WIDTH_HALF, y: apiX - BASKET_X };
  }
  return { x: COURT_WIDTH_HALF - apiY, y: (940 - BASKET_X) - apiX };
}

function classifyZone(x, y) {
  const absX = Math.abs(x);
  const dist = Math.sqrt(x * x + y * y);
  if ((x / 60) ** 2 + ((y - 34) / 49) ** 2 < 1) return "Raquette";
  if (absX > 217 && y < 94) return x < 0 ? "Très loin gauche" : "Très loin droit";
  if (absX > 119 && y < 87) return x < 0 ? "Corner gauche" : "Corner droit";
  const midBound = absX < 60 ? 127 : 127 - (absX - 60) * 0.68;
  if (y < midBound && absX < 119) {
    if (absX < 60) return "Mi-distance face";
    return x < 0 ? "Mi-distance gauche" : "Mi-distance droite";
  }
  if (y > 193 && absX < 148) return "Logo";
  if (absX > 105 && dist > 220) return x < 0 ? "Aile gauche loin" : "Aile droite loin";
  if (absX > 217) return x < 0 ? "Très loin gauche" : "Très loin droit";
  if (absX > 105) return x < 0 ? "Aile gauche" : "Aile droite";
  return "Face au panier";
}

function shotType(scoreValue) {
  if (scoreValue === 3) return "3PT";
  if (scoreValue === 1) return "FT";
  return "2PT";
}

function mapShots(plays, playerId) {
  const shots = [];
  for (const play of plays) {
    if (play.shotInfo.shooter.id !== playerId) continue;
    const loc = play.shotInfo.location;
    if (!loc || loc.x == null || loc.y == null) continue;
    const { x, y } = toHalfCourt(loc.x, loc.y);
    shots.push({
      id: String(play.id),
      x,
      y,
      made: play.shotInfo.made,
      type: shotType(play.scoreValue),
      zone: classifyZone(x, y),
    });
  }
  return shots;
}

fs.mkdirSync(COMPARE_DIR, { recursive: true });

const files = fs.readdirSync(PLAYERS_DIR).filter(
  (f) => f.endsWith(".json") && f !== "index.json"
);

let count = 0;
for (const file of files) {
  const fullPath = path.join(PLAYERS_DIR, file);
  const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

  const playerId = data.id;
  const rawShots = data.shots ?? [];
  const mappedShots = mapShots(rawShots, playerId);

  const lean = {
    id: data.id,
    name: data.name,
    team: data.team,
    playerStats: data.playerStats,
    shootingStats: data.shootingStats,
    teamStats: data.teamStats,
    profile: data.profile ?? null,
    shots: mappedShots,
  };

  const outPath = path.join(COMPARE_DIR, file);
  fs.writeFileSync(outPath, JSON.stringify(lean));
  count++;
}

console.log(`✅ Built ${count} compare bundles → data/compare/`);
