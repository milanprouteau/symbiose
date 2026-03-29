"use client";

import { useState, useMemo } from "react";
import type { Shot } from "@/types/player";
import type { PlayerShootingStats } from "@/types/stats";
import { VIEW_BOX, scaleX, scaleY } from "./utils/scales";
import { buildRows, buildRowsFromShots } from "@/lib/shotStats";
import Court from "./Court";
import ScatterChart from "./charts/ScatterChart";
import ZoneChart from "./charts/ZoneChart";
import HexChart from "./charts/HexChart";
import HeatMap from "./charts/HeatMap";
import ShotStatsPanel from "./ShotStatsPanel";
import styles from "./ShotChart.module.scss";
import type { RadarPlayer } from "../RadarChart";

type Props = {
  shots?: Shot[];
  shootingStats?: PlayerShootingStats | null;
  radarPlayer?: RadarPlayer ;
};

const TABS = ["Tirs", "Zones", "Hex", "Heat"] as const;
type Tab = (typeof TABS)[number];

export default function ShotChart({ shots = [], shootingStats, radarPlayer }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Tirs");

  const rows = useMemo(
    () => (shootingStats ? buildRows(shootingStats) : buildRowsFromShots(shots)),
    [shots, shootingStats]
  );

  const made  = useMemo(() => shots.filter((s) => s.made).length, [shots]);
  const total = shots.length;
  const pct   = total > 0 ? Math.round((made / total) * 100) : 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.layout}>
        {/* Left — Chart with tabs */}
        <div className={styles.chartSide}>
          {/* Tab bar */}
          <div className={styles.tabBar}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${styles.tab} ${
                  activeTab === tab ? styles.tabActive : ""
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Active chart */}
          {activeTab === "Tirs" && (
            <div className={styles.scatterContainer}>
              <div className={styles.scatterLegend}>
                <div className={styles.legendDot}>
                  <span className={styles.madeDot} />
                  <span>Rentré ({made})</span>
                </div>
                <div className={styles.legendDot}>
                  <span className={styles.missedX}>×</span>
                  <span>Raté ({total - made})</span>
                </div>
                <span className={styles.fgPct}>{pct}% FG</span>
              </div>
              <svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" className={styles.svgChart}>
                <Court />
                {shots.map((shot) => (
                  <ScatterChart key={shot.id} shot={shot} scaleX={scaleX} scaleY={scaleY} />
                ))}
              </svg>
            </div>
          )}

          {activeTab === "Zones" && <ZoneChart shots={shots} />}
          {activeTab === "Hex" && <HexChart shots={shots} />}
          {activeTab === "Heat" && <HeatMap shots={shots} />}

          {/* Stats Table */}
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.thLeft}>Zone de tir</th>
                <th className={styles.thCenter}>réussi</th>
                <th className={styles.thCenter}>tenté</th>
                <th className={styles.thRight}>Pourcentage</th>
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

        {/* Right — Stats panel */}
        <div className={styles.statsSide}>
          {radarPlayer && <ShotStatsPanel shots={shots} shootingStats={shootingStats} radarPlayer={radarPlayer} />}
        </div>
      </div>
    </div>
  );
}