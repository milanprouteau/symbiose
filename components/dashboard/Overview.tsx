"use client";

import React, { useState } from "react";
import type { Player } from "@/types/player";
import type { StatRanking } from "@/lib/playerRankings";
import type { LineupEntry } from "@/types/stats";
import { findSimilarPlayersWeighted, distanceToScore, DEFAULT_WEIGHTS, type StatKey } from "@/lib/similarPlayers";
import LineupAccordion from "./LineupAccordion";
import StatCounter from "@/components/ui/StatCounter";
import { useInView } from "@/hooks/useInView";
import styles from "./Overview.module.scss";

type SISBreakdown = {
  offensiveEfficiency: number;
  defensiveImpact: number;
  advancedEfficiency: number;
  hustle: number;
  systemWeight: number;
};

type SISPxBreakdown = {
  sisPx_pts: number;
  sisPx_reb: number;
  sisPx_ast: number;
  sisPx_mpg: number;
  sisPx_stl?: number;
  sisPx_blk?: number;
  sisPx_fg?: number;
  sisPx_porpag?: number;
  proj_pts: number;
  proj_reb: number;
  proj_ast: number;
  proj_mpg: number;
  proj_stl?: number;
  proj_blk?: number;
  proj_fg_pct?: number;
  posGroup: string;
};

type NBAProfileData = {
  nba_profile: string;
  profile_confidence: number;
  proba_nba_ready: number;
  proba_late_bloomer: number;
  proba_role_player: number;
};

type Props = {
  player: Player;
  rankings?: StatRanking;
  topLineups?: LineupEntry[];
  sis?: number | null;
  sisPx?: number | null;
  sisBreakdown?: SISBreakdown | null;
  sisPxBreakdown?: SISPxBreakdown | null;
  nbaProfile?: NBAProfileData | null;
};

export default function Overview({ player: p, rankings, topLineups = [], sis, sisPx, sisBreakdown, sisPxBreakdown }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<"sis" | "sisPx" | null>(null);
  const [similarRef, similarInView] = useInView({ threshold: 0.1 });

  const similarPlayers = (() => {
    if (!sisPxBreakdown) return [];
    const scores: Record<StatKey, number> = {
      sisPx_pts:    sisPxBreakdown.sisPx_pts,
      sisPx_reb:    sisPxBreakdown.sisPx_reb,
      sisPx_ast:    sisPxBreakdown.sisPx_ast,
      sisPx_mpg:    sisPxBreakdown.sisPx_mpg,
      sisPx_stl:    sisPxBreakdown.sisPx_stl ?? 50,
      sisPx_blk:    sisPxBreakdown.sisPx_blk ?? 50,
      sisPx_porpag: sisPxBreakdown.sisPx_porpag ?? 50,
    };
    const posGroupMapped = sisPxBreakdown.posGroup === "G" ? "Guard"
      : sisPxBreakdown.posGroup === "BIG" ? "Center"
      : sisPxBreakdown.posGroup === "WING" ? "Forward"
      : sisPxBreakdown.posGroup;
    return findSimilarPlayersWeighted(scores, sisPx ?? 50, posGroupMapped, DEFAULT_WEIGHTS, 5, true);
  })();

  const mainStats = [
    { label: "PPG", value: Number(p.ppg), rank: rankings?.ppg },
    { label: "RPG", value: Number(p.rpg), rank: rankings?.rpg },
    { label: "APG", value: Number(p.apg), rank: rankings?.apg },
    { label: "MPG", value: Number(p.mpg), rank: rankings?.mpg },
  ];

  const advancedStats = [
    { label: "FG%",  value: p.fgPct,                    decimals: 1 },
    { label: "3PT%", value: p.threePtPct,                decimals: 1 },
    { label: "TS%",  value: p.trueShootingPct,           decimals: 1 },
    { label: "USG%", value: p.usage,                     decimals: 1 },
  ];

  return (
    <div className={styles.container}>

      {/* ── Métadonnées compactes ── */}
      <p className={styles.meta}>
        {p.position} · {p.team} · {p.conference} — {p.games} matchs, {p.starts} titulaires
      </p>

      {/* ── Barre de stats ── */}
      <div className={styles.statsBar}>
        <div className={styles.statsGroup}>
          {mainStats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <StatCounter value={s.value} className={styles.statValue} />
              <span className={styles.statLabel}>
                {s.label}{s.rank ? ` #${s.rank}` : ""}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.statsDivider} />

        <div className={styles.statsGroup}>
          {advancedStats.map((s) => (
            <div key={s.label} className={styles.statItem}>
              <StatCounter value={s.value} decimals={s.decimals} className={styles.statValueSecondary} />
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {(sis != null || sisPx != null) && (
          <>
            <div className={styles.statsDivider} />
            <div className={styles.statsGroup}>
              {sis != null && (
                <div className={styles.statItem}>
                  <div className={`${styles.indexValueRow} ${activeTooltip === "sis" ? styles.indexValueRowOpen : ""}`}>
                    <span className={styles.statValue} style={{
                      color: sis >= 75 ? "var(--color-primary-orange)"
                           : sis >= 65 ? "var(--color-primary-yellow)"
                           : "var(--color-text-muted)",
                    }}>{sis.toFixed(1)}</span>
                    {sisBreakdown && (
                      <button
                        className={styles.infoBtn}
                        onClick={() => {
                          if (window.matchMedia("(hover: none)").matches)
                            setActiveTooltip((t) => t === "sis" ? null : "sis");
                        }}
                        aria-label="Détail SIS"
                        aria-expanded={activeTooltip === "sis"}
                      >i</button>
                    )}
                    {sisBreakdown && (
                      <div className={styles.indexTooltip}>
                        <div className={styles.tooltipRow}><span>Offensive</span><span>{sisBreakdown.offensiveEfficiency.toFixed(1)}<em>/25</em></span></div>
                        <div className={styles.tooltipRow}><span>Défensif</span><span>{sisBreakdown.defensiveImpact.toFixed(1)}<em>/25</em></span></div>
                        <div className={styles.tooltipRow}><span>Avancé</span><span>{sisBreakdown.advancedEfficiency.toFixed(1)}<em>/20</em></span></div>
                        <div className={styles.tooltipRow}><span>Hustle</span><span>{sisBreakdown.hustle.toFixed(1)}<em>/15</em></span></div>
                        <div className={styles.tooltipRow}><span>Système</span><span>{sisBreakdown.systemWeight.toFixed(1)}<em>/15</em></span></div>
                      </div>
                    )}
                  </div>
                  <span className={styles.statLabel}>SIS</span>
                </div>
              )}
              {sisPx != null && (
                <div className={styles.statItem}>
                  <div className={`${styles.indexValueRow} ${activeTooltip === "sisPx" ? styles.indexValueRowOpen : ""}`}>
                    <span className={styles.statValueSecondary} style={{
                      color: sisPx >= 65 ? "var(--color-primary-orange)"
                           : sisPx >= 50 ? "var(--color-primary-yellow)"
                           : "var(--color-text-muted)",
                    }}>{sisPx.toFixed(1)}</span>
                    {sisPxBreakdown && (
                      <button
                        className={styles.infoBtn}
                        onClick={() => {
                          if (window.matchMedia("(hover: none)").matches)
                            setActiveTooltip((t) => t === "sisPx" ? null : "sisPx");
                        }}
                        aria-label="Détail SIS-Px"
                        aria-expanded={activeTooltip === "sisPx"}
                      >i</button>
                    )}
                    {sisPxBreakdown && (
                      <div className={styles.indexTooltip}>
                        <div className={styles.tooltipHeader}>
                          {sisPxBreakdown.posGroup === "Guard" ? "Guard" : "Big"} · proj. NBA (per 36)
                        </div>
                        <div className={styles.tooltipRow}>
                          <span>Scoring</span>
                          <span>{sisPxBreakdown.sisPx_pts.toFixed(0)}<em>/100</em></span>
                          <span className={styles.tooltipProj}>{sisPxBreakdown.proj_pts.toFixed(1)} pts</span>
                        </div>
                        <div className={styles.tooltipRow}>
                          <span>Rebonds</span>
                          <span>{sisPxBreakdown.sisPx_reb.toFixed(0)}<em>/100</em></span>
                          <span className={styles.tooltipProj}>{sisPxBreakdown.proj_reb.toFixed(1)} reb</span>
                        </div>
                        <div className={styles.tooltipRow}>
                          <span>Passes</span>
                          <span>{sisPxBreakdown.sisPx_ast.toFixed(0)}<em>/100</em></span>
                          <span className={styles.tooltipProj}>{sisPxBreakdown.proj_ast.toFixed(1)} ast</span>
                        </div>
                        <div className={styles.tooltipRow}>
                          <span>Minutes proj.</span>
                          <span>{sisPxBreakdown.sisPx_mpg.toFixed(0)}<em>/100</em></span>
                          <span className={styles.tooltipProj}>{sisPxBreakdown.proj_mpg.toFixed(1)} mpg</span>
                        </div>
                        {sisPxBreakdown.sisPx_fg != null && (
                          <div className={styles.tooltipRow}>
                            <span>FG%</span>
                            <span>{sisPxBreakdown.sisPx_fg.toFixed(0)}<em>/100</em></span>
                            <span className={styles.tooltipProj}>{((sisPxBreakdown.proj_fg_pct ?? 0) * 100).toFixed(1)}%</span>
                          </div>
                        )}
                        {sisPxBreakdown.sisPx_stl != null && (
                          <div className={styles.tooltipRow}>
                            <span>Interceptions</span>
                            <span>{sisPxBreakdown.sisPx_stl.toFixed(0)}<em>/100</em></span>
                            <span className={styles.tooltipProj}>{(sisPxBreakdown.proj_stl ?? 0).toFixed(1)} stl</span>
                          </div>
                        )}
                        {sisPxBreakdown.sisPx_blk != null && (
                          <div className={styles.tooltipRow}>
                            <span>Contres</span>
                            <span>{sisPxBreakdown.sisPx_blk.toFixed(0)}<em>/100</em></span>
                            <span className={styles.tooltipProj}>{(sisPxBreakdown.proj_blk ?? 0).toFixed(1)} blk</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={styles.statLabel}>SIS-Px</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Top Lineups ── */}
      {topLineups.length > 0 && (
        <div className={styles.lineupsSection}>
          <h2 className={styles.sectionTitle}>Meilleurs Lineups</h2>
          <LineupAccordion lineups={topLineups} currentPlayerId={p.athleteId} />
        </div>
      )}

      {/* ── Profils similaires ── */}
      <div ref={similarRef as React.RefObject<HTMLDivElement>} className={styles.similarSection}>
        <h2 className={styles.sectionTitle}>Profils similaires</h2>
        <div className={styles.similarList}>
          {similarPlayers.map((sp, i) => (
            <div key={`${sp.name}-${sp.draftYear}`} className={styles.similarCard}>
              <div className={styles.similarContent}>
                <div className={styles.similarRank}>
                  <StatCounter value={i + 1} decimals={0} duration={600} />
                </div>
                <div className={styles.similarInfo}>
                  <span className={styles.similarName}>{sp.name}</span>
                  <span className={styles.similarMeta}>
                    {sp.posGroup} · {sp.team} ({sp.draftYear})
                  </span>
                </div>
                <div className={styles.similarDraft}>
                  <span className={styles.similarPick}>Pick #{sp.overall ?? "?"}</span>
                  <span className={styles.similarTeam}>{sp.draftTeam}</span>
                </div>
              </div>
              <div className={styles.similarStats}>
                <span>{sp.proj_pts.toFixed(1)} pts</span>
                <span>{sp.proj_reb.toFixed(1)} reb</span>
                <span>{sp.proj_ast.toFixed(1)} ast</span>
                <span>{sp.sisPx} SisPx</span>
              </div>
              {(() => {
                const score = distanceToScore(sp.distance);
                const color = score >= 80 ? "var(--color-primary-orange)"
                            : score >= 65 ? "#f5c842"
                            : score >= 50 ? "var(--color-text)"
                            : "var(--color-text-muted)";
                return (
                  <div className={styles.similarBarWrapper}>
                    <div className={styles.similarBar}>
                      <div className={styles.similarBarFill} style={{ width: similarInView ? `${score}%` : "0%", background: color, transitionDelay: similarInView ? `${i * 80}ms` : "0ms" }} />
                    </div>
                    <span className={styles.similarScore} style={{ color }}>{score}%</span>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
