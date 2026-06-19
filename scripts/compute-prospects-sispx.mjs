#!/usr/bin/env node
/**
 * Approximate SIS-Px ML scores + NBA profiles for prospects missing from
 * data/sispx_ml.json and data/profiles_prospects.json.
 *
 * Strategy: k-nearest-neighbors (k=5) on normalized college stats.
 * For each missing player we find the 5 most similar already-scored prospects,
 * then take an inverse-distance-weighted average of their ML values.
 *
 * Usage:  node scripts/compute-prospects-sispx.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const DIR       = path.join(ROOT, "data", "players");

/* ── Load env ── */
const envPath = path.join(ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

/* ── Load reference data ── */
const index      = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf-8"));
const mlData     = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "sispx_ml.json"), "utf-8"));
const profData   = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "profiles_prospects.json"), "utf-8"));
const mockDraftRaw = `
198977:1,199883:2,198382:3,200988:4,199686:5,198012:6,199596:7,197982:8,200182:9,202445:10,
85:11,3951:12,203279:13,199595:14,309:15,5647:16,535:17,197993:18,198155:19,7639:20,
3596:21,4065:22,7593:23,833:24,211:25,202245:26,142:27,198026:28,197881:29,4562:30,
270:31,7799:32,7792:33,1424:34,7673:35,4066:36,269:37,53:38,149:39,7827:40,
3921:41,420:42,562:43,115:44,114:45,368:46,2474:47,144:48,334:49,465:50,7241:51
`;
const mockDraft = Object.fromEntries(
  mockDraftRaw.trim().split(/[\s,]+/).filter(Boolean).map(s => { const [k,v]=s.split(":"); return [Number(k),Number(v)]; })
);

const normName = (n) => n.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, "").trim();

function posGroup(raw) {
  const p = (raw ?? "").toLowerCase();
  if (p === "g" || p.startsWith("guard") || p === "pg" || p === "sg") return "Guard";
  if (p === "c" || p.startsWith("center") || p.includes("center")) return "Big";
  return "Forward";
}

/* ── Build feature vector from player bundle ── */
function features(bundle) {
  const ps = bundle.playerStats;
  const ts = bundle.teamStats;
  if (!ps || !ts) return null;
  const g  = ps.games || 1;
  const m  = ps.minutes || 1;
  const ppg = ps.points / g;
  const rpg = (ps.rebounds?.total ?? 0) / g;
  const apg = (ps.assists ?? 0) / g;
  const spg = (ps.steals ?? 0) / g;
  const bpg = (ps.blocks ?? 0) / g;
  const mpg = m / g;
  const fgPct  = ps.fieldGoals?.pct ?? 0;
  const threePct = ps.threePointFieldGoals?.pct ?? 0;
  const ftPct  = ps.freeThrows?.pct ?? 0;
  const usage  = ps.usage ?? 0;
  const ts_pct = ps.trueShootingPct < 1 ? ps.trueShootingPct * 100 : ps.trueShootingPct;
  const porpag = ps.PORPAG ?? 0;
  const astTo  = ps.assistsTurnoverRatio ?? 0;
  return { ppg, rpg, apg, spg, bpg, mpg, fgPct, threePct, ftPct, usage, ts_pct, porpag, astTo };
}

const FEAT_KEYS = ["ppg","rpg","apg","spg","bpg","mpg","fgPct","threePct","ftPct","usage","ts_pct","porpag","astTo"];

/* ── Normalize features (z-score) ── */
function buildNormParams(featureVecs) {
  const params = {};
  for (const k of FEAT_KEYS) {
    const vals = featureVecs.map(v => v[k]).filter(v => v != null);
    const n    = vals.length || 1;
    const mean = vals.reduce((a,b)=>a+b,0) / n;
    const std  = Math.sqrt(vals.reduce((a,v)=>a+(v-mean)**2,0)/n) || 1;
    params[k]  = { mean, std };
  }
  return params;
}

function normalize(vec, params) {
  const out = {};
  for (const k of FEAT_KEYS) out[k] = ((vec[k] ?? 0) - params[k].mean) / params[k].std;
  return out;
}

function euclidean(a, b) {
  return Math.sqrt(FEAT_KEYS.reduce((s,k) => s + (a[k]-b[k])**2, 0));
}

/* ── ML output keys to interpolate ── */
const ML_KEYS = ["sisPx","sisPx_raw","sisPx_pts","sisPx_reb","sisPx_ast","sisPx_mpg","sisPx_stl","sisPx_blk","sisPx_porpag","proj_pts","proj_reb","proj_ast","proj_mpg","proj_stl","proj_blk"];
const PROF_KEYS = ["proba_nba_ready","proba_late_bloomer","proba_role_player","profile_confidence"];

/* ── Main ── */

// Build reference pool: players present in both index.json AND sispx_ml.json
const mlByName = new Map();
for (const e of mlData) { mlByName.set(e.name, e); mlByName.set(normName(e.name), e); }
const profByName = new Map();
for (const e of profData) { profByName.set(e.name, e); profByName.set(normName(e.name), e); }

const refPool = [];
const missingPlayers = [];

for (const idxEntry of index) {
  const bundle = JSON.parse(fs.readFileSync(path.join(DIR, `${idxEntry.id}.json`), "utf-8"));
  const feat   = features(bundle);
  if (!feat) continue;
  const name   = bundle.playerStats?.name ?? bundle.name;
  const mlEntry = mlByName.get(name) ?? mlByName.get(normName(name));
  if (mlEntry) {
    refPool.push({ name, id: idxEntry.id, feat, ml: mlEntry, prof: profByName.get(name) ?? profByName.get(normName(name)) });
  } else {
    missingPlayers.push({ name, id: idxEntry.id, bundle, feat,
      position: bundle.profile?.position ?? bundle.playerStats?.position ?? "F" });
  }
}

console.log(`\n✅ Reference pool: ${refPool.length} joueurs`);
console.log(`⚠️  Missing: ${missingPlayers.length} joueurs →`, missingPlayers.map(p=>p.name).join(", "), "\n");

if (missingPlayers.length === 0) {
  console.log("Rien à faire.");
  process.exit(0);
}

// Build normalization params from reference pool
const normParams = buildNormParams(refPool.map(p => p.feat));
const refNorm    = refPool.map(p => ({ ...p, normFeat: normalize(p.feat, normParams) }));

const newMlEntries   = [];
const newProfEntries = [];

for (const mp of missingPlayers) {
  const mpNorm = normalize(mp.feat, normParams);

  // Compute distances to all ref players
  const dists = refNorm.map(r => ({ r, d: euclidean(mpNorm, r.normFeat) }));
  dists.sort((a,b) => a.d - b.d);
  const k = 5;
  const neighbors = dists.slice(0, k);

  // Inverse-distance weights (guard against d=0)
  const weights = neighbors.map(({d}) => d < 1e-9 ? 1e9 : 1/d);
  const wSum    = weights.reduce((a,b)=>a+b,0);

  console.log(`🎯 ${mp.name}`);
  console.log(`   Voisins: ${neighbors.map(({r,d})=>`${r.name}(${d.toFixed(2)})`).join(", ")}`);

  // Weighted average of ML scores
  const mlEntry = { id: mp.id, name: mp.name, team: mp.bundle.team,
    position: mp.position,
    posGroup: posGroup(mp.position),
    overall: mockDraft[mp.id] ?? null,
  };
  for (const key of ML_KEYS) {
    const val = neighbors.reduce((s, {r}, i) => s + (r.ml[key] ?? 0) * weights[i], 0) / wSum;
    mlEntry[key] = Math.round(val * 10) / 10;
  }
  newMlEntries.push(mlEntry);

  // Weighted average of profile probas
  const profProbas = {};
  for (const key of PROF_KEYS) {
    profProbas[key] = neighbors.reduce((s, {r}, i) => s + (r.prof?.[key] ?? 0) * weights[i], 0) / wSum;
  }
  const prNbaReady    = Math.round(profProbas.proba_nba_ready);
  const prLateBloomer = Math.round(profProbas.proba_late_bloomer);
  const prRolePlayer  = Math.round(profProbas.proba_role_player);

  let profile = "ROLE_PLAYER";
  if (prNbaReady >= prLateBloomer && prNbaReady >= prRolePlayer) profile = "NBA_READY";
  else if (prLateBloomer >= prRolePlayer) profile = "LATE_BLOOMER";

  newProfEntries.push({
    name: mp.name, team: mp.bundle.team, position: mp.position,
    nba_profile: profile,
    profile_confidence: Math.round(profProbas.profile_confidence),
    proba_nba_ready:    prNbaReady,
    proba_late_bloomer: prLateBloomer,
    proba_role_player:  prRolePlayer,
  });

  console.log(`   sisPx: ${mlEntry.sisPx}  proj_pts: ${mlEntry.proj_pts}  profil: ${profile} (${Math.round(profProbas.profile_confidence)}%)\n`);
}

// Merge and save
const updatedMl   = [...mlData,   ...newMlEntries];
const updatedProf = [...profData, ...newProfEntries];

fs.writeFileSync(path.join(ROOT, "data", "sispx_ml.json"),          JSON.stringify(updatedMl,   null, 2));
fs.writeFileSync(path.join(ROOT, "data", "profiles_prospects.json"), JSON.stringify(updatedProf, null, 2));

console.log(`✅ sispx_ml.json          → ${updatedMl.length} joueurs`);
console.log(`✅ profiles_prospects.json → ${updatedProf.length} joueurs`);
