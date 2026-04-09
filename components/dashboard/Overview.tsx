"use client";

import { useState } from "react";
import type { Player } from "@/types/player";
import type { StatRanking } from "@/lib/playerRankings";
import type { LineupEntry } from "@/types/stats";
import { findSimilarPlayers, distanceToScore } from "@/lib/similarPlayers";
import LineupAccordion from "./LineupAccordion";
import StatCounter from "@/components/ui/StatCounter";
import styles from "./Overview.module.scss";

type SISBreakdown = {
  offensiveEfficiency: number;
  defensiveImpact: number;
  advancedEfficiency: number;
  hustle: number;
  systemWeight: number;
};

type SISPxBreakdown = {
  pxPhysical: number;
  pxEfficiency: number;
  pxDefensiveMobility: number;
  pxProjectedRole: number;
  pxNBAAdaptability: number;
};

type Props = {
  player: Player;
  rankings?: StatRanking;
  topLineups?: LineupEntry[];
  sis?: number | null;
  sisPx?: number | null;
  sisBreakdown?: SISBreakdown | null;
  sisPxBreakdown?: SISPxBreakdown | null;
};

export default function Overview({ player: p, rankings, topLineups = [], sis, sisPx, sisBreakdown, sisPxBreakdown }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<"sis" | "sisPx" | null>(null);

  const similarPlayers = findSimilarPlayers({
    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
    spg: p.spg,
    bpg: p.bpg,
    fgPct: p.fgPct,
    usage: p.usage,
  });

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
                           : "var(--color-primary-white)",
                    }}>{sis.toFixed(1)}</span>
                    {sisBreakdown && (
                      <button
                        className={`${styles.infoBtn} ${activeTooltip === "sis" ? styles.infoBtnActive : ""}`}
                        onClick={() => setActiveTooltip((t) => t === "sis" ? null : "sis")}
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
                      color: sisPx >= 80 ? "var(--color-primary-orange)"
                           : sisPx >= 70 ? "var(--color-primary-yellow)"
                           : "var(--color-primary-white)",
                    }}>{sisPx.toFixed(1)}</span>
                    {sisPxBreakdown && (
                      <button
                        className={`${styles.infoBtn} ${activeTooltip === "sisPx" ? styles.infoBtnActive : ""}`}
                        onClick={() => setActiveTooltip((t) => t === "sisPx" ? null : "sisPx")}
                        aria-label="Détail SIS-Px"
                        aria-expanded={activeTooltip === "sisPx"}
                      >i</button>
                    )}
                    {sisPxBreakdown && (
                      <div className={styles.indexTooltip}>
                        <div className={styles.tooltipRow}><span>Physique</span><span>{sisPxBreakdown.pxPhysical.toFixed(1)}<em>/20</em></span></div>
                        <div className={styles.tooltipRow}><span>Efficacité</span><span>{sisPxBreakdown.pxEfficiency.toFixed(1)}<em>/25</em></span></div>
                        <div className={styles.tooltipRow}><span>Mobilité déf.</span><span>{sisPxBreakdown.pxDefensiveMobility.toFixed(1)}<em>/15</em></span></div>
                        <div className={styles.tooltipRow}><span>Rôle projeté</span><span>{sisPxBreakdown.pxProjectedRole.toFixed(1)}<em>/20</em></span></div>
                        <div className={styles.tooltipRow}><span>Adapt. NBA</span><span>{sisPxBreakdown.pxNBAAdaptability.toFixed(1)}<em>/20</em></span></div>
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
      <div className={styles.similarSection}>
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
                    {sp.position} · {sp.team} ({sp.draftYear})
                  </span>
                </div>
                <div className={styles.similarDraft}>
                  <span className={styles.similarPick}>Pick #{sp.overall}</span>
                  <span className={styles.similarTeam}>{sp.draftTeam}</span>
                </div>
              </div>
              <div className={styles.similarStats}>
                <span>{sp.points} pts</span>
                <span>{sp.rebounds} reb</span>
                <span>{sp.assists} ast</span>
                <span>{sp.fieldGoalsPct}% FG</span>
                <span>{sp.usage}% Usage</span>
              </div>
              {(() => {
                const score = distanceToScore(sp.distance);
                const color = score >= 80 ? "var(--color-primary-orange)"
                            : score >= 65 ? "#f5c842"
                            : score >= 50 ? "rgba(255,255,255,0.8)"
                            : "#888884";
                return (
                  <div className={styles.similarBarWrapper}>
                    <div className={styles.similarBar}>
                      <div className={styles.similarBarFill} style={{ width: `${score}%`, background: color }} />
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
