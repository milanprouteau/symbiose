#!/usr/bin/env node
/**
 * Classify play-by-play events into 15 Hoop-Explorer-style archetypes
 * (10 scorer roles + 5 passer roles) for each tracked prospect, and merge
 * the result into data/players/{id}.json under `archetypes`.
 *
 * Inputs (must already exist):
 *   data/players/index.json
 *   data/players/{id}.json
 *   data/pbp/{gameId}.json   (run scripts/fetch-game-pbp.mjs first)
 *
 * Lazy-fetched + cached:
 *   data/rosters/{team}.json — used to look up teammate positions, needed
 *                              for passer archetypes that depend on whether
 *                              the scorer is a Big (hits cutter / pnr passer /
 *                              high-low / pick-and-pop / etc).
 *
 * Output: each data/players/{id}.json gets an `archetypes` block:
 *   {
 *     season: 2026,
 *     teamPossessions: number,         // raw team possessions, sum across player's games
 *     playerPossessions: number,       // teamPossessions × (mpg / 40)
 *     items: {
 *       rimAttack:        { count, points, freqPer100, ppp },
 *       perimeterSniper:  { ... },
 *       dribbleJumper, midRange, postUp, perimeterCut,
 *       bigCutRoll, pickAndPop, rebScramble, transition,    // scorer roles
 *       attackKick, hitsCutter, pnrPasser, insideOut, highLow  // passer roles
 *     }
 *   }
 *
 * HEURISTICS — every rule is an approximation derived only from public PBP
 * signals (text, range, assist flag, position). Without tracking we cannot
 * see screens, drives that don't end in shots, or off-ball cuts directly,
 * so a few archetypes (PnR / Attack & Kick / Hits Cutter / Inside-Out)
 * are necessarily proxy-based. Document each below where it is applied.
 *
 * Usage:  node scripts/classify-archetypes.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/* ── env ── */
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
const SEASON = 2026;

const PLAYERS_DIR = path.join(ROOT, "data", "players");
const PBP_DIR = path.join(ROOT, "data", "pbp");
const ROSTERS_DIR = path.join(ROOT, "data", "rosters");

/* ── Constants ── */
const SCORER_ARCHETYPES = [
  "rimAttack", "perimeterSniper", "dribbleJumper", "midRange", "postUp",
  "perimeterCut", "bigCutRoll", "pickAndPop", "rebScramble", "transition",
];
const PASSER_ARCHETYPES = [
  "attackKick", "hitsCutter", "pnrPasser", "insideOut", "highLow",
];
const ALL_ARCHETYPES = [...SCORER_ARCHETYPES, ...PASSER_ARCHETYPES];

/* ── Generic helpers ── */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(urlPath, params = {}) {
  if (!API_KEY) throw new Error("CBBD_API_KEY not set");
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

function safeName(s) {
  return String(s || "").replace(/[^a-z0-9]/gi, "_");
}

function emptyBuckets() {
  const items = {};
  for (const a of ALL_ARCHETYPES) items[a] = { count: 0, points: 0 };
  return items;
}

/**
 * Position string → "is this player a Big (5 / hybrid 4-5)".
 * We treat only Center / hybrid Forward-Center as Big. "Forward" alone
 * is ambiguous (often SF) so we leave it as non-Big.
 */
function isBig(position) {
  if (!position) return false;
  const p = String(position).trim().toUpperCase();
  if (!p) return false;
  if (p.includes("CENTER")) return true;
  // short codes: "C", "PF/C", "C/PF", "F/C", "C-F", "F-C"
  if (/^C$|^PF\/C$|^C\/PF$|^F\/C$|^C\/F$|^F-C$|^C-F$/.test(p)) return true;
  return false;
}

/* ── PBP shape predicates (defensive — handle both playType and playText) ── */
function isOffReb(p) {
  const pt = (p.playType || "").toLowerCase();
  const tx = (p.playText || "").toLowerCase();
  return /offensive.*rebound/.test(pt) || /offensive rebound/.test(tx);
}
function isDefReb(p) {
  const pt = (p.playType || "").toLowerCase();
  const tx = (p.playText || "").toLowerCase();
  return /defensive.*rebound/.test(pt) || /defensive rebound/.test(tx);
}
function isTurnover(p) {
  const pt = (p.playType || "").toLowerCase();
  const tx = (p.playText || "").toLowerCase();
  return /turnover/.test(pt) || /turnover/.test(tx);
}
/**
 * Live-ball turnover (the kind that triggers fastbreaks). We exclude OOB,
 * travel, offensive fouls, 3-second / 5-second / shot-clock violations.
 * "Lost Ball Turnover" / "Bad Pass Turnover" without OOB qualifier are live.
 */
function isLiveBallTurnover(p) {
  if (!isTurnover(p)) return false;
  const pt = (p.playType || "").toLowerCase();
  const tx = (p.playText || "").toLowerCase();
  if (/out.?of.?bounds|travel|offensive foul|3 ?second|5 ?second|shot ?clock|jump ?ball/.test(pt + " " + tx)) return false;
  return true;
}
function isSteal(p) {
  const pt = (p.playType || "").toLowerCase();
  return /steal/.test(pt);
}
function isMadeFG(p) {
  return p.shootingPlay === true && p.scoringPlay === true && (p.scoreValue || 0) >= 2;
}
function isShotEvent(p) {
  if (!p.shootingPlay) return false;
  const pt = (p.playType || "").toLowerCase();
  if (pt === "freethrow" || /free throw/.test(pt)) return false;
  return true;
}

/**
 * Cumulative seconds since tip. Used to measure deltas across periods.
 * Regulation = 2 × 1200s halves; OT = 5min (300s) each.
 */
function absSeconds(p) {
  const period = p.period || 1;
  const sr = p.secondsRemaining ?? 0;
  let prior = 0;
  for (let q = 1; q < period; q++) prior += q <= 2 ? 1200 : 300;
  const len = period <= 2 ? 1200 : 300;
  return prior + (len - sr);
}

function sortPlays(plays) {
  return [...plays].sort((a, b) => {
    if ((a.period || 0) !== (b.period || 0)) return (a.period || 0) - (b.period || 0);
    if ((a.secondsRemaining || 0) !== (b.secondsRemaining || 0)) {
      // clock counts down → earlier event has higher secondsRemaining
      return (b.secondsRemaining || 0) - (a.secondsRemaining || 0);
    }
    return (a.id || 0) - (b.id || 0);
  });
}

/* ── Roster cache ── */

/**
 * Build a Map<athleteId, position> for every player on the given teams,
 * lazy-fetching from /teams/roster and caching to data/rosters/{team}.json.
 */
async function loadRosters(teams) {
  fs.mkdirSync(ROSTERS_DIR, { recursive: true });
  const lookup = new Map();
  for (const team of teams) {
    const cache = path.join(ROSTERS_DIR, `${safeName(team)}.json`);
    let players;
    if (fs.existsSync(cache)) {
      try { players = JSON.parse(fs.readFileSync(cache, "utf-8")); }
      catch { players = null; }
    }
    if (!players) {
      try {
        const resp = await apiFetch("/teams/roster", { team, season: String(SEASON) });
        const entry = Array.isArray(resp) ? resp[0] : resp;
        players = entry?.players || [];
        fs.writeFileSync(cache, JSON.stringify(players));
        await delay(300);
      } catch (e) {
        console.warn(`  ⚠️  roster fetch failed for ${team}: ${e.message}`);
        players = [];
      }
    }
    for (const pl of players) {
      if (pl?.id != null) lookup.set(pl.id, pl.position || null);
    }
  }
  return lookup;
}

/* ── Classification ── */

/**
 * Classify a single shot from the SCORER perspective. Mutates `buckets`.
 *
 * `ctx` carries:
 *   range          "rim" | "midRange" | "three" | null
 *   assisted       boolean
 *   text           full playText
 *   points         play.scoreValue
 *   possEvent      "tipoff" | "defReb" | "oppTO" | "oppMade" | "steal" (we treat steal=oppTO)
 *   secondsSincePoss
 *   lastOffRebTeam, lastOffRebTime, t, teamId
 *   isPlayerBig
 */
function classifyScorer(ctx, buckets) {
  const { range, assisted, catchAndShoot, text, points, possEvent, secondsSincePoss,
          lastOffRebTeam, lastOffRebTime, t, teamId, isPlayerBig } = ctx;

  const isDriving = /Driving/i.test(text);
  const isPostMove = /Hook|Fadeaway|Turnaround/i.test(text);
  const isPutback = /Putback|Tip[ -]?Shot|Tip[- ]?In/i.test(text);
  // `transition` only counts when the possession was triggered by a live event
  // (defensive rebound, steal, or live-ball turnover). Dead-ball TOs (OOB,
  // travel, offensive foul) lead to a baseline inbound and aren't transition.
  const isTransitionPoss = (possEvent === "defReb" || possEvent === "steal" || possEvent === "liveTO");

  const inc = (key) => {
    buckets[key].count += 1;
    buckets[key].points += points;
  };

  // 1. Rim Attack — self-created at the rim (driving layup, dunk, no assist)
  if (range === "rim" && !assisted) inc("rimAttack");

  // 2. Perimeter Sniper — catch-and-shoot three (made or missed C&S proxy)
  if (range === "three" && catchAndShoot) inc("perimeterSniper");

  // 3. Dribble Jumper — unassisted off-rim shot (pullups / step-backs).
  //    Excludes catch-and-shoot (perimeterSniper), driving floaters, and
  //    post moves which belong to their own archetypes.
  if (
    !catchAndShoot && (range === "midRange" || range === "three") &&
    !isDriving && !isPostMove
  ) {
    inc("dribbleJumper");
  }

  // 4. Mid-Range — any midrange shot (overlaps with dribbleJumper / pickAndPop)
  if (range === "midRange") inc("midRange");

  // 5. Post-Up — text describes a post move
  if (isPostMove) inc("postUp");

  // 6. Reb. & Scramble — explicit putback OR shot ≤ 3s after own-team off rebound at the rim
  const recentOffReb = lastOffRebTeam === teamId && (t - lastOffRebTime) <= 3 && range === "rim";
  if (isPutback || recentOffReb) inc("rebScramble");

  // 7. Transition — shot ≤ 7s into a possession that started on a live-ball event
  if (isTransitionPoss && secondsSincePoss <= 7) inc("transition");

  // 8. Perimeter Cut — assisted finish at the rim by a non-Big in halfcourt
  //    (assisted-only since at the rim we can't reliably proxy missed cuts)
  if (assisted && range === "rim" && !isPlayerBig && !isTransitionPoss) inc("perimeterCut");

  // 9. Big Cut & Roll — assisted rim by a Big in halfcourt (roll-man / dump-off)
  if (assisted && range === "rim" && isPlayerBig && !isTransitionPoss) inc("bigCutRoll");

  // 10. Pick & Pop — Big shoots a catch-and-shoot off-rim shot (3pt / midRange)
  if (catchAndShoot && (range === "three" || range === "midRange") && isPlayerBig) inc("pickAndPop");
}

/**
 * Classify from the PASSER perspective for an assisted shot. Mutates `buckets`.
 *
 * Extra `ctx` fields:
 *   scorerIsBig       (or null if unknown)
 *   scorerKnown       boolean
 *   lastShotInPoss    { type, time } | null  — the *passer*'s last shot in this possession
 */
function classifyPasser(ctx, buckets) {
  const { range, points, possEvent, secondsSincePoss, scorerIsBig, scorerKnown,
          isPlayerBig, lastShotInPoss } = ctx;

  const isTransitionPoss = (possEvent === "defReb" || possEvent === "steal" || possEvent === "liveTO");

  const inc = (key) => {
    buckets[key].count += 1;
    buckets[key].points += points;
  };

  // 11. Attack & Kick — Guard/Wing assists a 3pt in halfcourt either right
  //     after they themselves attempted a rim/driving shot in the same
  //     possession (clean signal), OR with the possession running ≥ 4s
  //     (deliberate set play, broad proxy for drive-and-kick which we can't
  //     see directly without dribble tracking). Heuristic-heavy.
  if (
    range === "three" && !isTransitionPoss && !isPlayerBig &&
    (
      (lastShotInPoss && (lastShotInPoss.type === "rim" || lastShotInPoss.type === "drive")) ||
      secondsSincePoss >= 4
    )
  ) {
    inc("attackKick");
  }

  // 12. Hits Cutter — assist on a rim finish to a non-Big teammate, halfcourt.
  //     Skipped if scorer position is unknown (avoids false positives).
  if (range === "rim" && scorerKnown && scorerIsBig === false && !isTransitionPoss) {
    inc("hitsCutter");
  }

  // 13. PnR Passer — assist to a Big (rim, pop, or short midrange) — proxy
  //     for ball-screen actions since screens aren't in PBP.
  if (scorerKnown && scorerIsBig === true && (range === "rim" || range === "midRange" || range === "three")) {
    inc("pnrPasser");
  }

  // 14. Inside-Out — Big passer kicking out for a 3pt in halfcourt. The
  //     strict signal (passer's previous shot in possession was a post move)
  //     is rare; we relax to "Big assist on 3pt halfcourt", which captures
  //     most kickouts but also some Big-as-DHO situations.
  if (
    range === "three" && !isTransitionPoss &&
    (
      isPlayerBig ||
      (lastShotInPoss && lastShotInPoss.type === "post")
    )
  ) {
    inc("insideOut");
  }

  // 15. High-Low — Big-to-Big at the rim, halfcourt
  if (isPlayerBig && scorerKnown && scorerIsBig === true && range === "rim" && !isTransitionPoss) {
    inc("highLow");
  }
}

/* ── Per-game possession walk ── */

/**
 * Walk one game's PBP, classify shots into the player buckets, and update the
 * teamPossCount map. Mutates buckets in place.
 *
 * @param plays       array of PlayInfo from /plays/game/{gameId}
 * @param trackedIds  Set<number>  — player IDs we care about
 * @param posLookup   Map<number, string> — athleteId → position
 * @param buckets     Map<number, BucketObj> — playerId → archetype counters
 * @param teamPoss    Map<number, number>   — teamId → cumulative possessions
 */
function processGame(plays, trackedIds, posLookup, buckets, teamPoss) {
  const sorted = sortPlays(plays);

  let currentTeam = null;
  let possStart = 0;
  let possEvent = "tipoff";
  let lastOffRebTeam = null;
  let lastOffRebTime = -1e9;
  let possKey = "0|init";
  let lastPeriod = null;

  // Per-passer last shot in current possession (needed for Inside-Out / Attack & Kick)
  const playerLastShot = new Map();

  for (const p of sorted) {
    const t = absSeconds(p);
    const tId = p.teamId;
    const oppId = p.opponentId;

    // Reset possession context on a new period — the buzzer ends any in-flight
    // possession so events at the start of period 2 / OT shouldn't inherit
    // possEvent from a fastbreak that died in the previous period.
    if (lastPeriod != null && p.period !== lastPeriod) {
      currentTeam = null;
      possStart = t;
      possEvent = "tipoff";
      lastOffRebTeam = null;
      lastOffRebTime = -1e9;
      possKey = `${possStart}|periodStart`;
      playerLastShot.clear();
    }
    lastPeriod = p.period;

    // ── Step A: classify if it's a shot ──
    if (isShotEvent(p) && p.shotInfo) {
      const shooterId = p.shotInfo.shooter?.id;
      const assistedBy = p.shotInfo.assisted ? p.shotInfo.assistedBy?.id : null;
      // Normalize CBBD's range strings to the names the classifier expects.
      // CBBD: "rim" | "jumper" | "three_pointer" | "free_throw" → here:
      //       "rim" | "midRange" | "three" (free_throw is filtered out earlier).
      const rawRange = p.shotInfo.range || null;
      const range =
        rawRange === "three_pointer" ? "three" :
        rawRange === "jumper"        ? "midRange" :
        rawRange === "rim"           ? "rim" :
        null;
      const text = p.playText || "";
      // CBBD's scoreValue is the *value* of the shot (2 or 3), present even
      // for misses. Real points scored = scoreValue only when made.
      const made = p.scoringPlay === true || p.shotInfo.made === true;
      const points = made ? Number(p.scoreValue || 0) : 0;
      const assisted = p.shotInfo.assisted === true;

      // catchAndShoot proxy — CBBD only flags `assisted=true` on made shots, so
      // catch-and-shoot misses would otherwise be invisible. We treat a missed
      // *three* as catch-and-shoot when its playText shows no self-create signal
      // (no Pullup / Step Back / Driving / Floating / Hook / Fadeaway / Putback).
      // We only apply this for 3pt because in NCAA midrange most bare-text
      // "Jumper" misses are pull-ups, not catch-and-shoots — applying the
      // proxy there inflates pickAndPop and depletes dribbleJumper.
      const selfCreateText = /Pullup|Pull[- ]Up|Step ?Back|Stepback|Driving|Floating|Hook|Fadeaway|Turnaround|Putback|Tip[ -]?Shot|Tip[- ]?In/i.test(text);
      const catchAndShoot =
        assisted ||
        (!made && range === "three" && !selfCreateText);

      // Update playerLastShot for the shooter (any player, tracked or not),
      // since they might be a passer later in same possession.
      if (shooterId) {
        const shotType = (() => {
          if (range === "rim") return /Driving/i.test(text) ? "drive" : "rim";
          if (/Hook|Fadeaway|Turnaround/i.test(text)) return "post";
          if (range === "midRange") return "midRange";
          if (range === "three") return "three";
          return null;
        })();
        if (shotType) playerLastShot.set(shooterId, { type: shotType, time: t, possKey });
      }

      const ctxBase = {
        range, text, points,
        possEvent, secondsSincePoss: t - possStart,
        lastOffRebTeam, lastOffRebTime, t, teamId: tId,
      };

      // Scorer side
      if (shooterId && trackedIds.has(shooterId)) {
        const isPlayerBig = isBig(posLookup.get(shooterId));
        classifyScorer(
          { ...ctxBase, assisted, catchAndShoot, isPlayerBig },
          buckets.get(shooterId),
        );
      }

      // Passer side
      if (assistedBy && trackedIds.has(assistedBy)) {
        const isPlayerBig = isBig(posLookup.get(assistedBy));
        const scorerKnown = posLookup.has(shooterId);
        const scorerIsBig = scorerKnown ? isBig(posLookup.get(shooterId)) : null;
        const last = playerLastShot.get(assistedBy);
        const lastShotInPoss = last && last.possKey === possKey ? last : null;
        classifyPasser(
          { ...ctxBase, isPlayerBig, scorerKnown, scorerIsBig, lastShotInPoss },
          buckets.get(assistedBy),
        );
      }
    }

    // ── Step B: update possession state ──
    if (isOffReb(p)) {
      lastOffRebTeam = tId;
      lastOffRebTime = t;
      // possession continues; possKey stays
    } else if (isDefReb(p)) {
      // previous offensive team's possession ends; rebounder's team gains
      const prevOff = oppId ?? currentTeam;
      if (prevOff != null) teamPoss.set(prevOff, (teamPoss.get(prevOff) || 0) + 1);
      currentTeam = tId;
      possStart = t;
      possEvent = "defReb";
      lastOffRebTeam = null;
      possKey = `${possStart}|${currentTeam}|defReb`;
    } else if (isTurnover(p)) {
      if (tId != null) teamPoss.set(tId, (teamPoss.get(tId) || 0) + 1);
      currentTeam = oppId;
      possStart = t;
      // distinguish live (steal / lost ball with no OOB) from dead (travel,
      // OOB, offensive foul) so the transition rule only triggers off live ones.
      possEvent = isLiveBallTurnover(p) ? "liveTO" : "deadTO";
      lastOffRebTeam = null;
      possKey = `${possStart}|${currentTeam}|${possEvent}`;
    } else if (isSteal(p)) {
      // Some PBP feeds emit a `Steal` event distinct from the matching TO.
      // Treat the steal itself as the canonical possession-change marker so
      // transition timing keys off the right moment.
      possEvent = "steal";
      possStart = t;
      possKey = `${possStart}|${tId}|steal`;
      currentTeam = tId;
      lastOffRebTeam = null;
    } else if (isMadeFG(p)) {
      if (tId != null) teamPoss.set(tId, (teamPoss.get(tId) || 0) + 1);
      currentTeam = oppId;
      possStart = t;
      possEvent = "oppMade";
      lastOffRebTeam = null;
      possKey = `${possStart}|${currentTeam}|oppMade`;
    }
  }
}

/* ── Main ── */
async function main() {
  // Read tracked players index
  const indexPath = path.join(PLAYERS_DIR, "index.json");
  if (!fs.existsSync(indexPath)) {
    console.error("❌ data/players/index.json missing — run fetch-players.mjs first");
    process.exit(1);
  }
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  console.log(`🏀 ${index.length} tracked players`);

  // Build list of unique teams (for roster fetch) and trackedIds set
  const teams = [...new Set(index.map((p) => p.team))];
  const trackedIds = new Set(index.map((p) => p.id));

  // Load each player's bundle for profile / gameLog
  const playerInfo = new Map(); // id → { team, position, mpg, gameIds, minutes, games }
  for (const p of index) {
    const file = path.join(PLAYERS_DIR, `${p.id}.json`);
    if (!fs.existsSync(file)) continue;
    let bundle;
    try { bundle = JSON.parse(fs.readFileSync(file, "utf-8")); }
    catch { continue; }
    const position = bundle?.profile?.position ?? bundle?.playerStats?.position ?? p.position ?? null;
    const games = bundle?.playerStats?.games ?? p.games ?? 0;
    const minutes = bundle?.playerStats?.minutes ?? null;
    const mpg = minutes != null && games > 0 ? minutes / games : (p.mpg ?? 0);
    const gameIds = new Set();
    for (const s of bundle?.shots ?? []) {
      if (typeof s?.gameId === "number") gameIds.add(s.gameId);
    }
    playerInfo.set(p.id, { team: p.team, position, mpg, gameIds, minutes: minutes ?? 0, games });
  }

  // Lazy-fetch all rosters for tracked teams (gives us teammate positions)
  console.log(`📋 loading rosters for ${teams.length} teams...`);
  const posLookup = await loadRosters(teams);
  // Also seed posLookup with our tracked players' own positions (in case roster fetch missed them)
  for (const [id, info] of playerInfo) {
    if (info.position && !posLookup.has(id)) posLookup.set(id, info.position);
  }
  console.log(`   ${posLookup.size} player positions known`);

  // Init buckets per player
  const buckets = new Map();
  for (const id of trackedIds) buckets.set(id, emptyBuckets());

  // Per-team total possessions (across only games we walk)
  const teamPossPerGame = new Map(); // gameId → Map<teamId, possCount>

  // Walk every cached PBP file. Filter out games we don't care about (no tracked player).
  const pbpFiles = fs.existsSync(PBP_DIR)
    ? fs.readdirSync(PBP_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    : [];
  if (pbpFiles.length === 0) {
    console.error("❌ data/pbp/ is empty — run fetch-game-pbp.mjs first");
    process.exit(1);
  }
  console.log(`🎬 walking ${pbpFiles.length} games...`);

  // teamIdByGameAndName: built in the same walk so we can later attribute team
  // possessions to each tracked player by name → id.
  const teamIdByGameAndName = new Map();

  let processed = 0;
  for (const f of pbpFiles) {
    const gameId = parseInt(f.replace(".json", ""), 10);
    if (!Number.isFinite(gameId)) continue;
    let plays;
    try {
      plays = JSON.parse(fs.readFileSync(path.join(PBP_DIR, f), "utf-8"));
    } catch {
      continue;
    }
    if (!Array.isArray(plays) || plays.length === 0) continue;

    // Capture {team name → teamId} for this game so we can resolve player teams later.
    for (const pl of plays) {
      if (pl?.team && pl?.teamId != null) {
        const key = `${gameId}|${pl.team}`;
        if (!teamIdByGameAndName.has(key)) teamIdByGameAndName.set(key, pl.teamId);
      }
    }

    const teamPoss = new Map();
    processGame(plays, trackedIds, posLookup, buckets, teamPoss);
    teamPossPerGame.set(gameId, teamPoss);
    processed++;
  }
  console.log(`   ${processed} games walked`);

  // Aggregate team possessions per player, summing only over games the player participated in.
  const teamPossByPlayer = new Map();
  for (const [pid, info] of playerInfo) {
    let sum = 0;
    for (const gid of info.gameIds) {
      const tp = teamPossPerGame.get(gid);
      if (!tp) continue;
      const tId = teamIdByGameAndName.get(`${gid}|${info.team}`);
      if (tId != null) sum += tp.get(tId) || 0;
    }
    teamPossByPlayer.set(pid, sum);
  }

  // Final aggregation: write archetypes block back into each player file
  let written = 0;
  for (const p of index) {
    const info = playerInfo.get(p.id);
    if (!info) continue;
    const file = path.join(PLAYERS_DIR, `${p.id}.json`);
    if (!fs.existsSync(file)) continue;

    const teamPoss = teamPossByPlayer.get(p.id) || 0;
    const playerPoss = teamPoss * Math.min(1, (info.mpg || 0) / 40);

    const items = {};
    const raw = buckets.get(p.id);
    for (const a of ALL_ARCHETYPES) {
      const r = raw[a];
      const freqPer100 = playerPoss > 0 ? (r.count / playerPoss) * 100 : 0;
      const ppp = r.count > 0 ? r.points / r.count : 0;
      items[a] = {
        count: r.count,
        points: Number(r.points.toFixed(1)),
        freqPer100: Number(freqPer100.toFixed(2)),
        ppp: Number(ppp.toFixed(2)),
      };
    }

    let bundle;
    try { bundle = JSON.parse(fs.readFileSync(file, "utf-8")); }
    catch { continue; }
    bundle.archetypes = {
      season: SEASON,
      teamPossessions: teamPoss,
      playerPossessions: Math.round(playerPoss),
      items,
    };
    fs.writeFileSync(file, JSON.stringify(bundle, null, 2));
    written++;
  }
  console.log(`\n✅ archetypes written to ${written} player files`);

  // Quick sanity print on the first tracked player so the user can eyeball the output
  const sample = index[0];
  if (sample) {
    const file = path.join(PLAYERS_DIR, `${sample.id}.json`);
    if (fs.existsSync(file)) {
      const b = JSON.parse(fs.readFileSync(file, "utf-8"));
      const a = b.archetypes;
      if (a) {
        console.log(`\n🔎 sample — ${sample.name} (${sample.team})`);
        console.log(`   teamPoss=${a.teamPossessions}  playerPoss≈${a.playerPossessions}`);
        for (const k of ALL_ARCHETYPES) {
          const it = a.items[k];
          if (it.count > 0) {
            console.log(`   ${k.padEnd(18)} count=${String(it.count).padStart(4)}  freq/100=${String(it.freqPer100).padStart(5)}  ppp=${it.ppp}`);
          }
        }
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
