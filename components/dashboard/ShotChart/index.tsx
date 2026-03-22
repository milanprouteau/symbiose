"use client";

import { useState, useMemo } from "react";
import { Shot } from "@/types/player";
import { mockShots } from "@/constants/mock-shots";
import { scaleX, scaleY, VIEW_BOX } from "./utils/scales";
import Court from "./Court";
import ScatterChart from "./charts/ScatterChart";
import ZoneChart from "./charts/ZoneChart";
import HexChart from "./charts/HexChart";
import HeatMap from "./charts/HeatMap";
import ShotStatsPanel from "./ShotStatsPanel";
import type { PlayerShootingStats } from "@/types/stats";
import styles from "./ShotChart.module.scss";

type Props = {
  shots?: Shot[];
  shootingStats?: PlayerShootingStats | null;
};

const TABS = ["Scatter", "Zones", "Hex", "Heat"] as const;
type Tab = (typeof TABS)[number];

export default function ShotChart({ shots = mockShots, shootingStats }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Scatter");

  const made  = useMemo(() => shots.filter((s) => s.made).length, [shots]);
  const total = shots.length;
  const pct   = total > 0 ? Math.round((made / total) * 100) : 0;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.sectionTitle}>
        Shot Chart
      </h2>

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
          {activeTab === "Scatter" && (
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
        </div>

        {/* Right — Stats panel */}
        <div className={styles.statsSide}>
          <ShotStatsPanel shots={shots} shootingStats={shootingStats} />
        </div>
      </div>
    </div>
  );
}