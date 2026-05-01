#!/usr/bin/env node
/**
 * Parse Hoop Explorer clipboard dumps into structured archetype data.
 *
 * Reads:
 *   data/clipboard/{id}.txt          — raw HE clipboard per player
 *   data/clipboard/_partial_recap.md — disambiguation of partial 2025+ rosters
 *
 * Writes (merge into each existing player file):
 *   data/players/{id}.json with new key `archetypesHE.2025` containing
 *   { label: { ppp, percentile, freqPer100 } } for the 15 archetypes
 *   (missing ones get null values).
 *
 * Mapping rule for partial seasons: HE displays 15 static labels but only
 * outputs triplets for archetypes the player has data on. The triplets in
 * the clipboard appear in static order with the missing slots simply
 * omitted. So triplet[i] → static_labels[i-th present index].
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CLIPBOARD_DIR = path.join(ROOT, "data", "clipboard");
const PLAYERS_DIR = path.join(ROOT, "data", "players");
const RECAP_FILE = path.join(CLIPBOARD_DIR, "_partial_recap.md");

// Static label order (1-indexed in the recap file). Keep in sync with HE.
const STATIC_LABELS = [
  "rimAttack",      // 1
  "attackKick",     // 2
  "perimeterSniper",// 3
  "dribbleJumper",  // 4
  "midRange",       // 5
  "hitsCutter",     // 6
  "perimeterCut",   // 7
  "pnrPasser",      // 8
  "bigCutRoll",     // 9
  "postUp",         // 10
  "insideOut",      // 11
  "pickAndPop",     // 12
  "highLow",        // 13
  "rebScramble",    // 14
  "transition",     // 15
];

/** Parse the recap markdown into { id → missingIndices[] } and a Set of OK ids. */
function parseRecap(text) {
  const partial = new Map();
  const ok = new Set();
  const lines = text.split("\n");
  for (const line of lines) {
    // Table rows look like: | 53 | Bidunga, Flory | 2025+ | 10 | 5 | 1, 2, 4, 5, 7 |
    const m = line.match(/^\|\s*(\d+)\s*\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|\s*([0-9 ,]+?)\s*\|/);
    if (m) {
      const id = Number(m[1]);
      const indices = m[2].split(",").map((s) => Number(s.trim())).filter(Number.isFinite);
      partial.set(id, indices);
      continue;
    }
    // The "OK" line: "197881, 197993, 198382, 198977, ..."
    if (/^\s*\d+(\s*,\s*\d+)+\s*$/.test(line)) {
      for (const tok of line.split(",")) {
        const n = Number(tok.trim());
        if (Number.isFinite(n)) ok.add(n);
      }
    }
  }
  return { partial, ok };
}

/**
 * Extract the run of triplets that belongs to the 2025+ section. A triplet
 * is 4 consecutive lines: "<ppp> ppp", "<pct>%ile", "<freq>", "ƒ/100".
 *
 * Returns [] if the file has no 2025+ section (player didn't play this year).
 */
function extractTriplets(text) {
  const lines = text.split("\n").map((l) => l.trim());
  // First season header in the file determines whether 2025+ data is here.
  const firstSeasonIdx = lines.findIndex((l) => /^20\d{2}\+$/.test(l));
  if (firstSeasonIdx < 0 || lines[firstSeasonIdx] !== "2025+") return [];
  // Each season has its own "Frequency %ile in D1" anchor; we want the first.
  const startIdx = lines.findIndex((l) => /Frequency\s+%ile\s+in\s+D1/i.test(l));
  if (startIdx < 0) return [];

  const triplets = [];
  let i = startIdx + 1;
  while (i + 3 < lines.length) {
    const a = lines[i];
    const b = lines[i + 1];
    const c = lines[i + 2];
    const d = lines[i + 3];
    const pppM = a.match(/^([\d.]+)\s*ppp$/);
    const pctM = b.match(/^([\d.]+)%ile$/);
    const freqM = c.match(/^([\d.]+)$/);
    const dOk = d === "ƒ/100";
    if (pppM && pctM && freqM && dOk) {
      triplets.push({
        ppp: Number(pppM[1]),
        percentile: Number(pctM[1]),
        freqPer100: Number(freqM[1]),
      });
      i += 4;
    } else {
      break;
    }
  }
  return triplets;
}

function buildArchetypes(triplets, missingIndices) {
  // Build the list of present static labels (1-indexed) for this player.
  const missing = new Set(missingIndices);
  const presentLabels = [];
  for (let idx = 1; idx <= 15; idx++) {
    if (!missing.has(idx)) presentLabels.push(STATIC_LABELS[idx - 1]);
  }
  if (triplets.length !== presentLabels.length) {
    return { ok: false, error: `triplets=${triplets.length} but expected ${presentLabels.length} present labels` };
  }
  const items = {};
  for (const label of STATIC_LABELS) items[label] = null;
  for (let i = 0; i < triplets.length; i++) {
    items[presentLabels[i]] = triplets[i];
  }
  return { ok: true, items };
}

function main() {
  const recap = parseRecap(fs.readFileSync(RECAP_FILE, "utf-8"));

  const files = fs.readdirSync(CLIPBOARD_DIR).filter((f) => /^\d+\.txt$/.test(f));
  console.log(`📋 ${files.length} clipboard files`);

  let written = 0;
  let skipped = 0;
  const errors = [];

  for (const f of files) {
    const id = Number(f.replace(".txt", ""));
    const text = fs.readFileSync(path.join(CLIPBOARD_DIR, f), "utf-8");
    const triplets = extractTriplets(text);
    if (triplets.length === 0) {
      console.log(`   ⏭️  ${id}: no 2025+ section (skipping)`);
      skipped++;
      continue;
    }

    const missing = recap.partial.get(id) ?? (recap.ok.has(id) ? [] : null);
    if (missing == null) {
      // Not in recap: assume full 15 only if we got 15 triplets, otherwise warn.
      if (triplets.length === 15) {
        // treat as OK
      } else {
        errors.push(`${id}: not in recap (partial nor OK), got ${triplets.length} triplets`);
        skipped++;
        continue;
      }
    }
    const missingForBuild = missing ?? [];
    const built = buildArchetypes(triplets, missingForBuild);
    if (!built.ok) {
      errors.push(`${id}: ${built.error}`);
      skipped++;
      continue;
    }

    const playerFile = path.join(PLAYERS_DIR, `${id}.json`);
    if (!fs.existsSync(playerFile)) {
      errors.push(`${id}: player file missing`);
      skipped++;
      continue;
    }
    const bundle = JSON.parse(fs.readFileSync(playerFile, "utf-8"));
    bundle.archetypesHE = {
      season: "2025+",
      items: built.items,
    };
    fs.writeFileSync(playerFile, JSON.stringify(bundle, null, 2));
    written++;
  }

  console.log(`\n✅ wrote archetypesHE to ${written} player files (skipped ${skipped})`);
  if (errors.length) {
    console.log(`\n⚠️  ${errors.length} issues:`);
    for (const e of errors) console.log(`   - ${e}`);
  }
}

main();
