"use client";

import { useMemo } from "react";
import { Shot } from "@/types/player";
import type { PlayerShootingStats } from "@/types/stats";
import styles from "./ShotStatsPanel.module.scss";

type Props = {
  shots: Shot[];
  shootingStats?: PlayerShootingStats | null;
};

type Row = { label: string; made: number; attempted: number; pct: number };

function buildRows(ss: PlayerShootingStats): Row[] {
  const dunks = ss.dunks ?? { attempted: 0, made: 0, pct: 0 };
  const layups = ss.layups ?? { attempted: 0, made: 0, pct: 0 };
  const tipIns = ss.tipIns ?? { attempted: 0, made: 0, pct: 0 };
  const twoJ = ss.twoPointJumpers ?? { attempted: 0, made: 0, pct: 0 };
  const threeJ = ss.threePointJumpers ?? { attempted: 0, made: 0, pct: 0 };

  const closeAttempted = dunks.attempted + layups.attempted + tipIns.attempted;
  const closeMade = dunks.made + layups.made + tipIns.made;

  return [
    { label: "Dunks", made: dunks.made, attempted: dunks.attempted, pct: Math.round(dunks.pct) },
    { label: "Layups", made: layups.made + tipIns.made, attempted: layups.attempted + tipIns.attempted, pct: (layups.attempted + tipIns.attempted) > 0 ? Math.round(((layups.made + tipIns.made) / (layups.attempted + tipIns.attempted)) * 100) : 0 },
    { label: "Mid-Range", made: twoJ.made, attempted: twoJ.attempted, pct: Math.round(twoJ.pct) },
    { label: "3-Pointers", made: threeJ.made, attempted: threeJ.attempted, pct: Math.round(threeJ.pct) },
  ];
}

function buildRowsFromShots(shots: Shot[]): Row[] {
  const types = [
    { label: "2PT", filter: (s: Shot) => s.type === "2PT" },
    { label: "3PT", filter: (s: Shot) => s.type === "3PT" },
  ];
  return types.map(({ label, filter }) => {
    const filtered = shots.filter(filter);
    const made = filtered.filter((s) => s.made).length;
    const attempted = filtered.length;
    return { label, made, attempted, pct: attempted > 0 ? Math.round((made / attempted) * 100) : 0 };
  });
}


export default function ShotStatsPanel({ shots, shootingStats }: Props) {
  const rows = useMemo(
    () => (shootingStats ? buildRows(shootingStats) : buildRowsFromShots(shots)),
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
      <div>
        {/* Bar Chart 1 — Shot Selection Distribution */}
        <div className={styles.chartSection}>
          <h4 className={styles.chartTitle}>
            Shot Selection Distribution
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
                    style={{ height: barH, minHeight: row.distPct > 0 ? 4 : 0, backgroundColor: "#3B6EC9" }}
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
            Shooting % By Shot Type
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
                    style={{ height: barH, minHeight: row.pct > 0 ? 4 : 0, backgroundColor: "#3B6EC9" }}
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

      {/* Stats Table */}
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            <th className={styles.thLeft}>Shot Type</th>
            <th className={styles.thCenter}>Makes</th>
            <th className={styles.thCenter}>Attempts</th>
            <th className={styles.thRight}>Percentage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={styles.tableRow}>
              <td className={styles.tdLabel}>{row.label}</td>
              <td className={styles.tdCenter}>{row.made}</td>
              <td className={styles.tdCenter}>{row.attempted}</td>
              <td className={styles.tdRight}>
                {row.attempted > 0 ? `${row.pct}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
