/**
 * ─────────────────────────────────────────────────────────
 *  SIS — Symbiose Impact Score  (sur 100)
 *  SIS-Px — Symbiose Projection Index  (sur 100)
 *
 *  Principes de conception
 *  ───────────────────────
 *  • 100% stats individuelles : aucune métrique équipe-dépendante
 *    (offensiveRating, defensiveRating, netRating supprimés)
 *  • Ajustement par poste pour les stats défensives :
 *    les Guards, Wings et Bigs sont comparés à leurs pairs
 *  • Seuil minimum de matchs : < MIN_GAMES → score null (données insuffisantes)
 *
 *  `score(value, worse, better, maxPts)` :
 *    worse  → 0 pt  | better → maxPts  (clampé)
 *    Pour les stats "moins = mieux", passer worse > better.
 * ─────────────────────────────────────────────────────────
 */

import type { PlayerDataBundle } from "@/types/stats";

// ── Constantes ───────────────────────────────────────────

/** Seuil minimum de matchs pour un score fiable */
const MIN_GAMES = 10;

// ── Types ────────────────────────────────────────────────

/** Groupe de position pour l'ajustement défensif */
type PosGroup = "G" | "WING" | "BIG";

export type SISBreakdown = {
  // SIS – sous-catégories
  offensiveEfficiency: number;   // /25
  defensiveImpact: number;       // /25
  advancedEfficiency: number;    // /20  (remplace "Impact Collectif")
  hustle: number;                // /15
  systemWeight: number;          // /15
  total: number;                 // /100

  // SIS-Px – sous-catégories
  pxPhysical: number;            // /20
  pxEfficiency: number;          // /25
  pxDefensiveMobility: number;   // /15
  pxProjectedRole: number;       // /20
  pxNBAAdaptability: number;     // /20
  totalPx: number;               // /100

  // Groupe de position détecté
  posGroup: PosGroup;

  // Stats intermédiaires exposées
  computed: SISComputedStats;

  // Badges
  sisBadges: string[];
  sisPxBadges: string[];
};

export type SISComputedStats = {
  tsPercent: number;       // True Shooting % (0-100)
  indivPPP: number;        // PPP individuel = pts / (FGA + 0.44×FTA + TO)
  toRate: number;          // Turnover Rate (0-1)
  stlPer40: number;        // Steals / 40 min
  blkPer40: number;        // Blocks / 40 min
  wsDef40: number;         // Win Shares Défensifs / 40 (×100)
  defRebPct: number;       // Defensive Rebound % (0-100)
  rebPer40: number;        // Rebonds totaux / 40 min
  foulsPer40: number;      // Fautes / 40 min
  assistRate: number;      // Assist Rate (0-100)
  minPct: number;          // % minutes jouées (0-100)
  threePAr: number;        // 3-Point Attempt Rate (0-1)
  PORPAG: number;          // Points Over Replacement Per Adjusted Game
  efgPct: number;          // Effective FG %
  astToRatio: number;      // AST / TO Ratio
};

// ── Helpers ──────────────────────────────────────────────

function score(value: number, worse: number, better: number, maxPts: number): number {
  if (better === worse) return 0;
  const pct = (value - worse) / (better - worse);
  return Math.max(0, Math.min(1, pct)) * maxPts;
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Groupe de position ───────────────────────────────────

/**
 * Normalise la position brute en un groupe défensif.
 * Guards : actifs dans les couloirs de passes (plus de STL)
 * Bigs : protection du cercle (plus de BLK et DRB)
 * Wings : profil hybride
 */
function posGroup(raw: string): PosGroup {
  const p = raw.toLowerCase();
  if (p === "g" || p.startsWith("guard") || p === "pg" || p === "sg") return "G";
  if (p === "c" || p.startsWith("center") || p === "f/c" || p === "c/f"
    || p.includes("forward-center") || p.includes("center-forward")) return "BIG";
  if (p === "f" || p.startsWith("forward") || p === "pf" || p === "sf"
    || p === "g/f" || p === "f/g"
    || p.includes("guard-forward") || p.includes("forward-guard")) return "WING";
  return "WING"; // fallback
}

// ── Seuils défensifs par poste ───────────────────────────
//
//  Chaque poste est évalué par rapport à ses pairs NCAA.
//  Les Guards sont récompensés pour les steals, les Bigs pour les blocks
//  et les rebonds défensifs. Les Wings ont un profil intermédiaire.
//
//  Thresholds : [worse, better] basés sur les percentiles p10/p90
//  du dataset, stratifiés par groupe de position.

type DefThresholds = {
  stl:  [number, number]; // STL/40 : worse → better
  blk:  [number, number]; // BLK/40 : worse → better
  drb:  [number, number]; // DefReb% : worse → better
  wsDef:[number, number]; // WS.def/40 (×100) : worse → better
};

const DEF_THRESHOLDS: Record<PosGroup, DefThresholds> = {
  G: {
    stl:   [0.6, 3.0],  // guards attendent d'être actifs dans les passing lanes
    blk:   [0.0, 0.8],  // guards bloquent peu
    drb:   [3,   12 ],  // guards captent peu de rebonds défensifs
    wsDef: [1,   12 ],
  },
  WING: {
    stl:   [0.5, 2.4],  // wings : profil équilibré
    blk:   [0.0, 2.0],
    drb:   [5,   17 ],
    wsDef: [2,   14 ],
  },
  BIG: {
    stl:   [0.3, 1.6],  // bigs volent moins mais défendent le cercle
    blk:   [0.3, 4.0],  // seuils BLK élevés : les vrais protecteurs du cercle
    drb:   [8,   26 ],  // bigs dominent les rebonds défensifs
    wsDef: [3,   17 ],
  },
};

// ── Heights NBA par poste (pour SIS-Px) ──────────────────

const NBA_AVG_HEIGHT: Record<PosGroup, number> = {
  G:    75, // 6'3"
  WING: 78, // 6'6"
  BIG:  82, // 6'10"
};

// ── Badges ───────────────────────────────────────────────

function assignSISBadges(
  offPts:  number,
  defPts:  number,
  advPts:  number,
  c:       SISComputedStats,
  usage:   number,
): string[] {
  const badges: string[] = [];

  if (defPts >= 19 && c.rebPer40 >= 7)              badges.push("ANCHOR");
  if (offPts >= 19 && usage >= 23)                   badges.push("CATALYST");
  if (c.assistRate >= 20 && c.toRate <= 0.13)        badges.push("MAESTRO");
  if (advPts >= 14 && defPts >= 14)                  badges.push("GLUE");
  if (c.PORPAG >= 5.5)                               badges.push("X-FACTOR");
  if (usage >= 26 && offPts < 12)                    badges.push("BLACK HOLE");

  return badges.length > 0 ? badges : ["ROLE PLAYER"];
}

function assignSISPxBadges(totalPx: number, pxPhysical: number, pxDef: number): string[] {
  const badges: string[] = [];

  if      (totalPx >= 88) badges.push("NBA STARTER+");
  else if (totalPx >= 78) badges.push("ROTATION NBA");
  else if (totalPx >= 68) badges.push("DEVELOPMENTAL");
  else                     badges.push("LIMITED PROJECTION");

  if (pxPhysical >= 17)   badges.push("NBA-READY FRAME");
  if (pxDef      >= 13)   badges.push("DEFENSIVE ANCHOR");

  return badges;
}

// ── Calcul principal ─────────────────────────────────────

/**
 * Retourne null si le joueur n'a pas assez de matchs (données non fiables).
 */
export function calculateSIS(bundle: PlayerDataBundle): SISBreakdown | null {
  const ps      = bundle.playerStats;
  const ts      = bundle.teamStats;
  const profile = bundle.profile;

  // ── Garde : données insuffisantes ───────────────────────
  if (ps.games < MIN_GAMES) return null;

  const games   = ps.games;
  const minutes = ps.minutes || 1;

  // ── Groupe de position ───────────────────────────────────
  const rawPos = profile?.position ?? ps.position ?? "F";
  const pg     = posGroup(rawPos);
  const def    = DEF_THRESHOLDS[pg];

  // ════════════════════════════════════════════════════════
  //  STATS INTERMÉDIAIRES — toutes 100% individuelles
  // ════════════════════════════════════════════════════════

  // True Shooting % (0-100)
  const tsPercent = ps.trueShootingPct < 1
    ? ps.trueShootingPct * 100
    : ps.trueShootingPct;

  // PPP individuel = pts propres / possessions utilisées personnellement
  // Contrairement à offensiveRating (team on-court), c'est 100% individuel.
  // Formule : pts / (FGA + 0.44×FTA + TO)
  const indivPosBase =
    ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted + ps.turnovers;
  const indivPPP = indivPosBase > 0 ? ps.points / indivPosBase : 0;

  // Turnover Rate = TO / (FGA + 0.44×FTA + TO)
  const toRate = indivPosBase > 0 ? ps.turnovers / indivPosBase : 0;

  // Stats par 40 min
  const stlPer40   = (ps.steals         / minutes) * 40;
  const blkPer40   = (ps.blocks         / minutes) * 40;
  const rebPer40   = (ps.rebounds.total / minutes) * 40;
  const foulsPer40 = (ps.fouls          / minutes) * 40;

  // Win Shares Défensifs par 40 min (×100 pour scale lisible)
  // winShares.defensive est une estimation individuelle de la contribution
  // défensive en termes de victoires. Bien plus individuel que defRating.
  const wsDef40 = (ps.winShares.defensive / minutes) * 40 * 100;

  // Defensive Rebound %
  // DRB% = 100 × (DRB × TmMP) / (MP × (TmDRB + OppORB))
  // `totalMinutes` = temps d'horloge → TmMP (somme joueurs) = totalMinutes × 5
  // Les ×5 et /5 se simplifient : DRB% = 100 × (DRB × totalMinutes) / (MP × (TmDRB + OppORB))
  const defRebPctRaw =
    (ps.rebounds.defensive * ts.totalMinutes) /
    (minutes * (ts.teamStats.rebounds.defensive + ts.opponentStats.rebounds.offensive));
  const defRebPct = defRebPctRaw * 100;

  // Assist Rate
  // AST% = 100 × AST / ((MP / TmMP) × TmFGM − FGM)
  // Fraction du temps sur le terrain × paniers équipe − paniers propres = opportunités
  const tmShare    = minutes / ts.totalMinutes;
  const assistDenom = tmShare * ts.teamStats.fieldGoals.made - ps.fieldGoals.made;
  const assistRate  = assistDenom > 0 ? (100 * ps.assists) / assistDenom : 0;

  // % Minutes jouées (sur max théorique games × 40)
  const minPct = (minutes / (games * 40)) * 100;

  // 3-Point Attempt Rate = 3PA / (FGA + 0.44×FTA)
  const totalFga = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted;
  const threePAr = totalFga > 0 ? ps.threePointFieldGoals.attempted / totalFga : 0;

  const computed: SISComputedStats = {
    tsPercent, indivPPP, toRate, stlPer40, blkPer40, wsDef40, defRebPct,
    rebPer40, foulsPer40, assistRate, minPct, threePAr,
    PORPAG:     ps.PORPAG,
    efgPct:     ps.effectiveFieldGoalPct,
    astToRatio: ps.assistsTurnoverRatio,
  };

  // ════════════════════════════════════════════════════════
  //  SIS — Symbiose Impact Score  (100% individuel)
  // ════════════════════════════════════════════════════════

  // 1. EFFICACITÉ OFFENSIVE — 25 pts
  //    TS%         : 50% = mauvais → 68% = élite   (10 pts)
  //    PPP individ.: 0.75 = mauvais → 1.30 = élite  (10 pts)
  //    TO Rate     : 22% = mauvais → 7% = élite     (5 pts, INVERSÉ)
  const sis_ts      = score(tsPercent, 50,   68,   10);
  const sis_ppp     = score(indivPPP,  0.75, 1.30, 10);
  const sis_to      = score(toRate,    0.22, 0.07,  5); // inversé
  const offensiveEfficiency = sis_ts + sis_ppp + sis_to;

  // 2. IMPACT DÉFENSIF — 25 pts  [AJUSTÉ PAR POSTE]
  //    WS Défensifs/40 : seuils par poste — 10 pts
  //    STL/40          : seuils par poste —  5 pts
  //    BLK/40          : seuils par poste —  5 pts
  //    DefReb%         : seuils par poste —  5 pts
  const sis_wsDef = score(wsDef40,   def.wsDef[0], def.wsDef[1], 10);
  const sis_stl   = score(stlPer40,  def.stl[0],   def.stl[1],    5);
  const sis_blk   = score(blkPer40,  def.blk[0],   def.blk[1],    5);
  const sis_drb   = score(defRebPct, def.drb[0],   def.drb[1],    5);
  const defensiveImpact = sis_wsDef + sis_stl + sis_blk + sis_drb;

  // 3. EFFICACITÉ AVANCÉE — 20 pts  [REMPLACE "IMPACT COLLECTIF"]
  //    100% individuel, aucune métrique équipe-dépendante.
  //
  //    PORPAG    : 1.0 = mauvais → 7.5 = élite  (10 pts)
  //      Points Over Replacement Per Adjusted Game — mesure individuelle
  //      de la valeur ajoutée vs un joueur de remplacement, ajustée par
  //      la qualité de l'opposition et le niveau de la conférence.
  //    eFG%      : 45% = mauvais → 65% = élite  (5 pts)
  //      Efficacité de tir pure (2PT + bonus 3PT) sans l'effet équipe.
  //    AST/TO    : 0.4 = mauvais → 3.5 = élite  (5 pts)
  //      Qualité de décision individuelle.
  const sis_porpag = score(ps.PORPAG,                   1.0, 5.5, 10); // Option A: 7.5→5.5
  const sis_efg    = score(ps.effectiveFieldGoalPct,    45,  65,   5);
  const sis_astTo  = score(ps.assistsTurnoverRatio,     0.4, 3.5,  5);
  const advancedEfficiency = sis_porpag + sis_efg + sis_astTo;

  // 4. HUSTLE — 15 pts
  //    Rebs/40   : 2  = mauvais → 13 = élite  (8 pts)
  //    Fautes/40 : 5.0 = mauvais → 1.5 = élite (7 pts, INVERSÉ)
  const sis_reb    = score(rebPer40,    2,   13,  8);
  const sis_fouls  = score(foulsPer40,  5.0,  1.5, 7); // inversé
  const hustle = sis_reb + sis_fouls;

  // 5. POIDS DANS LE SYSTÈME — 15 pts
  //    Usage%      : 15% = mauvais → 32% = élite  (5 pts)
  //    Assist Rate : 3%  = mauvais → 42% = élite  (5 pts)
  //    % Minutes   : 50% = mauvais → 90% = élite  (5 pts)
  const sis_usage  = score(ps.usage,   15,  32,  5);
  const sis_ast    = score(assistRate,  3,  42,  5);
  const sis_minPct = score(minPct,     50,  90,  5);
  const systemWeight = sis_usage + sis_ast + sis_minPct;

  const sisTotal = r1(
    offensiveEfficiency + defensiveImpact + advancedEfficiency + hustle + systemWeight,
  );

  // ════════════════════════════════════════════════════════
  //  SIS-Px — Projection Index  (100% individuel)
  // ════════════════════════════════════════════════════════

  const heightInches = profile?.height ?? null;

  // 1. PROFIL PHYSIQUE NBA-READY — 20 pts
  //    Taille vs moyenne NBA au poste (10 pts)
  //      -5 po sous la moyenne = 0 pt | +5 po au-dessus = 10 pts
  //    Mobilité proxy (10 pts) :
  //      Foulse/40 inversé (5 pts) : peu de fautes = mobilité latérale
  //      STL+BLK / 40 combinés (5 pts) : athléticité / verticalité
  let px_height = 5; // valeur neutre si taille inconnue
  if (heightInches !== null) {
    px_height = score(heightInches - NBA_AVG_HEIGHT[pg], -5, 5, 10);
  }
  const px_mobility =
    score(foulsPer40, 5.0, 1.5, 5) +           // inversé
    score(stlPer40 + blkPer40, 1.0, 5.0, 5);
  const pxPhysical = px_height + px_mobility;

  // 2. EFFICACITÉ TRANSPOSABLE — 25 pts
  //    TS%      : 52% → 68%  (8 pts) — seuil haut car NBA est plus exigeant
  //    PPP ind. : 0.80 → 1.30 (8 pts) — même stat que SIS
  //    AST/TO   : 0.5 → 3.5  (3 pts)
  //    FT%      : 58% → 90%  (3 pts) — fiabilité aux lancers transposable
  //    3PAr     : 5% → 60%   (3 pts) — orientation spacing NBA
  const px_ts      = score(tsPercent,              52,   68,   8);
  const px_ppp     = score(indivPPP,               0.80, 1.30, 8);
  const px_astTo   = score(ps.assistsTurnoverRatio, 0.5, 3.5,  3);
  const px_ft      = score(ps.freeThrows.pct,      58,   90,   3);
  const px_3par    = score(threePAr * 100,          5,   60,   3);
  const pxEfficiency = px_ts + px_ppp + px_astTo + px_ft + px_3par;

  // 3. MOBILITÉ DÉFENSIVE — 15 pts  [AJUSTÉ PAR POSTE]
  //    Mêmes seuils que SIS défensif mais seuil "élite" légèrement plus
  //    élevé (NBA est plus exigeant) : +10% sur la borne "better"
  const px_stl    = score(stlPer40,   def.stl[0],  def.stl[1]  * 1.1, 5);
  const px_blk    = score(blkPer40,   def.blk[0],  def.blk[1]  * 1.1, 5);
  const px_foul   = score(foulsPer40, 5.0,          1.5,               5); // inversé
  const pxDefensiveMobility = px_stl + px_blk + px_foul;

  // 4. RÔLE PROJETÉ — 20 pts
  //    Usage%      : 15% → 33%  (7 pts) — peut assumer un volume NBA
  //    Assist Rate : 3%  → 42%  (7 pts) — capacité à faciliter le jeu
  //    PORPAG      : 1.0 → 7.5  (6 pts) — valeur individuelle au-dessus du remplacement
  const px_usage  = score(ps.usage,   15,  33,  7);
  const px_ast    = score(assistRate,  3,  28,  7); // Option A: 42→28
  const px_por    = score(ps.PORPAG,   1.0, 5.5, 6); // Option A: 7.5→5.5
  const pxProjectedRole = px_usage + px_ast + px_por;

  // 5. ADAPTABILITÉ NBA — 20 pts
  //    Rim attack rate : 15% → 55% (5 pts) — % tirs au cercle (layups/trackedShots)
  //      Mesure l'agressivité au panier, stat individuelle (remplace pace d'équipe)
  //    3PAr (×100)     : 5% → 60% (5 pts) — orientation spacing NBA
  //    FT Rate         : 15 → 55  (5 pts) — Option A: 50→55
  //    eFG%            : 48% → 65% (5 pts)
  const rimAttackRate = bundle.shootingStats && bundle.shootingStats.trackedShots > 0
    ? (bundle.shootingStats.layups.attempted / bundle.shootingStats.trackedShots) * 100
    : 25; // fallback ≈ médiane
  const px_rimAttack = score(rimAttackRate,                15,  55, 5); // Option A: remplace pace
  const px_spacing   = score(threePAr * 100,               5,  60, 5);
  const px_ftRate    = score(ps.freeThrowRate,            15,  55, 5); // Option A: 50→55
  const px_efg       = score(ps.effectiveFieldGoalPct,    48,  65, 5);
  const pxNBAAdaptability = px_rimAttack + px_spacing + px_ftRate + px_efg;

  const sisPxTotal = r1(
    pxPhysical + pxEfficiency + pxDefensiveMobility + pxProjectedRole + pxNBAAdaptability,
  );

  // ── Badges ───────────────────────────────────────────────
  const sisBadges   = assignSISBadges(
    offensiveEfficiency, defensiveImpact, advancedEfficiency, computed, ps.usage,
  );
  const sisPxBadges = assignSISPxBadges(sisPxTotal, pxPhysical, pxDefensiveMobility);

  return {
    offensiveEfficiency:  r1(offensiveEfficiency),
    defensiveImpact:      r1(defensiveImpact),
    advancedEfficiency:   r1(advancedEfficiency),
    hustle:               r1(hustle),
    systemWeight:         r1(systemWeight),
    total:                sisTotal,

    pxPhysical:           r1(pxPhysical),
    pxEfficiency:         r1(pxEfficiency),
    pxDefensiveMobility:  r1(pxDefensiveMobility),
    pxProjectedRole:      r1(pxProjectedRole),
    pxNBAAdaptability:    r1(pxNBAAdaptability),
    totalPx:              sisPxTotal,

    posGroup:             pg,
    computed,
    sisBadges,
    sisPxBadges,
  };
}
