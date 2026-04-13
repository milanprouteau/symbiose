/**
 * Calibration engine — client-safe (no server imports)
 * Contains: types, default config (Option A), pure score computation.
 */

// ── Types ────────────────────────────────────────────────

export type PosGroup = "G" | "WING" | "BIG";

/** A single threshold + weight */
export type TH = { worse: number; better: number; pts: number };

export type DefGroup = {
  wsDef: TH;
  stl:   TH;
  blk:   TH;
  drb:   TH;
};

export type ThresholdConfig = {
  // ── SIS ──────────────────────────────────────────────
  // 1. Offensive Efficiency (25 pts)
  sis_ts:     TH;  // TS%
  sis_ppp:    TH;  // PPP individuel
  sis_to:     TH;  // TO Rate (inversé)
  // 2. Defensive Impact (25 pts) — par posGroup
  def: Record<PosGroup, DefGroup>;
  // 3. Advanced Efficiency (20 pts)
  sis_porpag: TH;
  sis_efg:    TH;
  sis_astTo:  TH;
  // 4. Hustle (15 pts)
  sis_reb:    TH;
  sis_fouls:  TH;  // inversé
  // 5. System Weight (15 pts)
  sis_usage:  TH;
  sis_ast:    TH;
  sis_minPct: TH;
  // ── SIS-Px ────────────────────────────────────────────
  // 1. Physical (20 pts)
  px_heightDelta: TH; // height − NBA avg (en pouces)
  px_fouls:       TH; // inversé
  px_stlBlk:      TH; // STL+BLK/40
  // 2. Efficiency (25 pts)
  px_ts:    TH;
  px_ppp:   TH;
  px_astTo: TH;
  px_ft:    TH;  // FT%
  px_3par:  TH;  // 3PAr×100
  // 3. Defensive Mobility (15 pts) — utilise def × 1.1 pour stl/blk
  px_defFouls: TH; // inversé (5 pts)
  // 4. Projected Role (20 pts)
  px_usage: TH;
  px_ast:   TH;
  px_por:   TH;
  // 5. NBA Adaptability (20 pts)
  px_rimAttack: TH; // rim attack rate (layups / trackedShots %)
  px_spacing:   TH; // 3PAr×100
  px_ftRate:    TH;
  px_efg:       TH;
};

/** Pre-computed intermediate stats for one player (computed server-side, constant) */
export type PlayerIntermediate = {
  id:       number;
  name:     string;
  team:     string;
  year:     number | null; // null = prospect 2026
  overall:  number | null;
  posGroup: PosGroup;
  games:    number;
  ppg:      number;
  rpg:      number;
  apg:      number;
  // Computed intermediates
  tsPercent:     number;
  indivPPP:      number;
  toRate:        number;
  stlPer40:      number;
  blkPer40:      number;
  wsDef40:       number;
  defRebPct:     number;
  rebPer40:      number;
  foulsPer40:    number;
  assistRate:    number;
  minPct:        number;
  threePAr:      number; // ×100 (0–100)
  PORPAG:        number;
  efgPct:        number;
  astToRatio:    number;
  ftPct:         number;
  freeThrowRate: number;
  usage:         number;
  heightVsNBA:   number; // height − NBA_AVG[posGroup], null→0
  rimAttackRate: number; // layups.attempted / trackedShots × 100
};

export type SectionScores = {
  sis: {
    total:                number;
    offensiveEfficiency:  number;
    defensiveImpact:      number;
    advancedEfficiency:   number;
    hustle:               number;
    systemWeight:         number;
  };
  sisPx: {
    total:                number;
    pxPhysical:           number;
    pxEfficiency:         number;
    pxDefensiveMobility:  number;
    pxProjectedRole:      number;
    pxNBAAdaptability:    number;
  };
};

// ── Default config (Option A applied) ───────────────────

export const DEFAULT_CONFIG: ThresholdConfig = {
  // SIS — Offensive Efficiency
  sis_ts:     { worse: 50,   better: 68,   pts: 10 },
  sis_ppp:    { worse: 0.75, better: 1.30, pts: 10 },
  sis_to:     { worse: 0.22, better: 0.07, pts: 5  },
  // SIS — Defensive Impact
  def: {
    G:    {
      wsDef: { worse: 1,   better: 12,  pts: 10 },
      stl:   { worse: 0.6, better: 3.0, pts: 5  },
      blk:   { worse: 0.0, better: 0.8, pts: 5  },
      drb:   { worse: 3,   better: 12,  pts: 5  },
    },
    WING: {
      wsDef: { worse: 2,   better: 14,  pts: 10 },
      stl:   { worse: 0.5, better: 2.4, pts: 5  },
      blk:   { worse: 0.0, better: 2.0, pts: 5  },
      drb:   { worse: 5,   better: 17,  pts: 5  },
    },
    BIG: {
      wsDef: { worse: 3,   better: 17,  pts: 10 },
      stl:   { worse: 0.3, better: 1.6, pts: 5  },
      blk:   { worse: 0.3, better: 4.0, pts: 5  },
      drb:   { worse: 8,   better: 26,  pts: 5  },
    },
  },
  // SIS — Advanced Efficiency (Option A: PORPAG 7.5→5.5)
  sis_porpag: { worse: 1.0, better: 5.5, pts: 10 },
  sis_efg:    { worse: 45,  better: 65,  pts: 5  },
  sis_astTo:  { worse: 0.4, better: 3.5, pts: 5  },
  // SIS — Hustle
  sis_reb:    { worse: 2,   better: 13,  pts: 8  },
  sis_fouls:  { worse: 5.0, better: 1.5, pts: 7  },
  // SIS — System Weight
  sis_usage:  { worse: 15,  better: 32,  pts: 5  },
  sis_ast:    { worse: 3,   better: 42,  pts: 5  },
  sis_minPct: { worse: 50,  better: 90,  pts: 5  },
  // SIS-Px — Physical
  px_heightDelta: { worse: -5,  better: 5,    pts: 10 },
  px_fouls:       { worse: 5.0, better: 1.5,  pts: 5  },
  px_stlBlk:      { worse: 1.0, better: 5.0,  pts: 5  },
  // SIS-Px — Efficiency
  px_ts:    { worse: 52,   better: 68,   pts: 8 },
  px_ppp:   { worse: 0.80, better: 1.30, pts: 8 },
  px_astTo: { worse: 0.5,  better: 3.5,  pts: 3 },
  px_ft:    { worse: 58,   better: 90,   pts: 3 },
  px_3par:  { worse: 5,    better: 60,   pts: 3 },
  // SIS-Px — Defensive Mobility
  px_defFouls: { worse: 5.0, better: 1.5, pts: 5 },
  // SIS-Px — Projected Role (Option A: ast 42→28, por 7.5→5.5)
  px_usage: { worse: 15,  better: 33,  pts: 7 },
  px_ast:   { worse: 3,   better: 28,  pts: 7 },
  px_por:   { worse: 1.0, better: 5.5, pts: 6 },
  // SIS-Px — NBA Adaptability (Option A: rimAttack remplace pace, ftRate 50→55)
  px_rimAttack: { worse: 15, better: 55, pts: 5 },
  px_spacing:   { worse: 5,  better: 60, pts: 5 },
  px_ftRate:    { worse: 15, better: 55, pts: 5 },
  px_efg:       { worse: 48, better: 65, pts: 5 },
};

// ── Pure score computation ────────────────────────────────

function sc(value: number, worse: number, better: number, maxPts: number): number {
  if (better === worse) return 0;
  const pct = (value - worse) / (better - worse);
  return Math.max(0, Math.min(1, pct)) * maxPts;
}

function r1(n: number) { return Math.round(n * 10) / 10; }

export function computeScores(p: PlayerIntermediate, cfg: ThresholdConfig): SectionScores {
  const def = cfg.def[p.posGroup];
  const isBig = p.posGroup === "BIG";

  // ── SIS ──
  const offensiveEfficiency =
    sc(p.tsPercent,    cfg.sis_ts.worse,    cfg.sis_ts.better,    cfg.sis_ts.pts) +
    sc(p.indivPPP,     cfg.sis_ppp.worse,   cfg.sis_ppp.better,   cfg.sis_ppp.pts) +
    sc(p.toRate,       cfg.sis_to.worse,    cfg.sis_to.better,    cfg.sis_to.pts);

  const defensiveImpact =
    sc(p.wsDef40,   def.wsDef.worse, def.wsDef.better, def.wsDef.pts) +
    sc(p.stlPer40,  def.stl.worse,   def.stl.better,   def.stl.pts) +
    sc(p.blkPer40,  def.blk.worse,   def.blk.better,   def.blk.pts) +
    sc(p.defRebPct, def.drb.worse,   def.drb.better,   def.drb.pts);

  const advancedEfficiency =
    sc(p.PORPAG,     cfg.sis_porpag.worse, cfg.sis_porpag.better, cfg.sis_porpag.pts) +
    sc(p.efgPct,     cfg.sis_efg.worse,    cfg.sis_efg.better,    cfg.sis_efg.pts) +
    sc(p.astToRatio, cfg.sis_astTo.worse,  cfg.sis_astTo.better,  cfg.sis_astTo.pts);

  const hustle =
    sc(p.rebPer40,   cfg.sis_reb.worse,   cfg.sis_reb.better,   cfg.sis_reb.pts) +
    sc(p.foulsPer40, cfg.sis_fouls.worse, cfg.sis_fouls.better, cfg.sis_fouls.pts);

  const systemWeight =
    sc(p.usage,      cfg.sis_usage.worse,  cfg.sis_usage.better,  cfg.sis_usage.pts) +
    sc(p.assistRate, cfg.sis_ast.worse,    cfg.sis_ast.better,    cfg.sis_ast.pts) +
    sc(p.minPct,     cfg.sis_minPct.worse, cfg.sis_minPct.better, cfg.sis_minPct.pts);

  // ── SIS-Px ──
  const pxPhysical =
    sc(p.heightVsNBA,              cfg.px_heightDelta.worse, cfg.px_heightDelta.better, cfg.px_heightDelta.pts) +
    sc(p.foulsPer40,               cfg.px_fouls.worse,       cfg.px_fouls.better,       cfg.px_fouls.pts) +
    sc(p.stlPer40 + p.blkPer40,   cfg.px_stlBlk.worse,      cfg.px_stlBlk.better,      cfg.px_stlBlk.pts);

  // For BIG: scoring efficiency translates less reliably to NBA (pts 8→5)
  const pxTsPts  = isBig ? 5 : cfg.px_ts.pts;
  const pxPppPts = isBig ? 5 : cfg.px_ppp.pts;
  const pxEfficiency =
    sc(p.tsPercent,    cfg.px_ts.worse,    cfg.px_ts.better,    pxTsPts) +
    sc(p.indivPPP,     cfg.px_ppp.worse,   cfg.px_ppp.better,   pxPppPts) +
    sc(p.astToRatio,   cfg.px_astTo.worse, cfg.px_astTo.better, cfg.px_astTo.pts) +
    sc(p.ftPct,        cfg.px_ft.worse,    cfg.px_ft.better,    cfg.px_ft.pts) +
    sc(p.threePAr,     cfg.px_3par.worse,  cfg.px_3par.better,  cfg.px_3par.pts);

  // stl/blk inherit from def thresholds × 1.1 on better
  const pxDefensiveMobility =
    sc(p.stlPer40,   def.stl.worse, def.stl.better * 1.1, def.stl.pts) +
    sc(p.blkPer40,   def.blk.worse, def.blk.better * 1.1, def.blk.pts) +
    sc(p.foulsPer40, cfg.px_defFouls.worse, cfg.px_defFouls.better, cfg.px_defFouls.pts);

  // For BIG: rebounding dominance predicts NBA role better than assist rate
  const pxUsagePts = isBig ? 5 : cfg.px_usage.pts;
  const pxRoleStat = isBig
    ? sc(p.rebPer40, 8, 16, 10)
    : sc(p.assistRate, cfg.px_ast.worse, cfg.px_ast.better, cfg.px_ast.pts);
  const pxProjectedRole =
    sc(p.usage,  cfg.px_usage.worse, cfg.px_usage.better, pxUsagePts) +
    pxRoleStat +
    sc(p.PORPAG, cfg.px_por.worse,   cfg.px_por.better,   cfg.px_por.pts);

  const pxNBAAdaptability =
    sc(p.rimAttackRate, cfg.px_rimAttack.worse, cfg.px_rimAttack.better, cfg.px_rimAttack.pts) +
    sc(p.threePAr,      cfg.px_spacing.worse,   cfg.px_spacing.better,   cfg.px_spacing.pts) +
    sc(p.freeThrowRate, cfg.px_ftRate.worse,    cfg.px_ftRate.better,    cfg.px_ftRate.pts) +
    sc(p.efgPct,        cfg.px_efg.worse,       cfg.px_efg.better,       cfg.px_efg.pts);

  // For BIG: apply a rebounding translation multiplier.
  // Centers who dominate the glass (≥13 REB/40) translate reliably; non-dominant bigs (≤9) are penalised.
  let sisPxRaw = pxPhysical + pxEfficiency + pxDefensiveMobility + pxProjectedRole + pxNBAAdaptability;
  if (isBig) {
    const rebClamped = Math.max(9, Math.min(13, p.rebPer40));
    const rebMult    = 0.75 + 0.35 * ((rebClamped - 9) / (13 - 9));
    sisPxRaw         = sisPxRaw * rebMult;
  }

  return {
    sis: {
      total: r1(offensiveEfficiency + defensiveImpact + advancedEfficiency + hustle + systemWeight),
      offensiveEfficiency:  r1(offensiveEfficiency),
      defensiveImpact:      r1(defensiveImpact),
      advancedEfficiency:   r1(advancedEfficiency),
      hustle:               r1(hustle),
      systemWeight:         r1(systemWeight),
    },
    sisPx: {
      total:                r1(sisPxRaw),
      pxPhysical:           r1(pxPhysical),
      pxEfficiency:         r1(pxEfficiency),
      pxDefensiveMobility:  r1(pxDefensiveMobility),
      pxProjectedRole:      r1(pxProjectedRole),
      pxNBAAdaptability:    r1(pxNBAAdaptability),
    },
  };
}
