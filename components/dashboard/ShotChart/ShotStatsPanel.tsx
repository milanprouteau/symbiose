"use client";

import { useMemo } from "react";
import type { Shot } from "@/types/player";
import type { PlayerShootingStats } from "@/types/stats";
import { buildRows, buildRowsFromShots } from "@/lib/shotStats";
import styles from "./ShotStatsPanel.module.scss";
import RadarChart, { type RadarAxis, type RadarPlayer } from "../RadarChart";

export const OFFENSIVE_AXES: RadarAxis[] = [
  { key: "ppg",   label: "PPG",   max: 30 },
  { key: "rpg",   label: "REB",   max: 12 },
  { key: "apg",   label: "AST",   max: 8 },
  { key: "spg",   label: "STL",   max: 3 },
  { key: "ppp",   label: "PPP",   max: 1.5 },
  { key: "fgPct", label: "FG%",   max: 80 },
  { key: "usage", label: "Usage", max: 40 },
];

type Props = {
  shots?: Shot[];
  shootingStats?: PlayerShootingStats | null;
  radarPlayer: RadarPlayer;
};

export default function ShotStatsPanel({ shots, shootingStats, radarPlayer }: Props) {
  const rows = useMemo(
    () => (shootingStats ? buildRows(shootingStats) : buildRowsFromShots(shots || [])),
    [shots, shootingStats]
  );

  const totalAttempted = rows.reduce((sum, r) => sum + r.attempted, 0);

  const distributionRows = useMemo(
    () => rows.map((r) => ({
      ...r,
      distPct: totalAttempted > 0 ? Math.round((r.attempted / totalAttempted) * 100) : 0,
    })),
    [rows, totalAttempted]
  );

  const maxDist = Math.max(...distributionRows.map((r) => r.distPct), 1);
  const maxPct = Math.max(...rows.map((r) => r.pct), 1);

  return (
    <div className={styles.container}>
      {/* Two side-by-side vertical bar charts */}
      <div className={styles.chartContainer}>
        {/* Bar Chart 1 — Shot Selection Distribution */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>
            Distribution des tirs
          </h4>
          <div className={styles.barRow}>
            {distributionRows.map((row) => {
              const barH = maxDist > 0 ? Math.round((row.distPct / maxDist) * 96) : 0;
              return (
                <div key={row.label} className={styles.barItem}>
                  <span className={styles.barValue}>
                    {row.distPct}%
                  </span>
                  <div
                    className={styles.bar}
                    style={{ height: barH, minHeight: row.distPct > 0 ? 4 : 0, backgroundColor: "#FFCD01" }}
                  />
                  <span className={styles.barLabel}>
                    {row.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart 2 — Shooting % By Shot Type */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>
            Pourcentage au tir par zone
          </h4>
          <div className={styles.barRow}>
            {rows.map((row) => {
              const barH = maxPct > 0 ? Math.round((row.pct / maxPct) * 96) : 0;
              return (
                <div key={row.label} className={styles.barItem}>
                  <span className={styles.barValue}>
                    {row.pct}%
                  </span>
                  <div
                    className={styles.bar}
                    style={{ height: barH, minHeight: row.pct > 0 ? 4 : 0, backgroundColor: "#FFCD01" }}
                  />
                  <span className={styles.barLabel}>
                    {row.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div>
        <RadarChart players={[radarPlayer]} axes={OFFENSIVE_AXES} />
      </div>
    </div>
  );
}
