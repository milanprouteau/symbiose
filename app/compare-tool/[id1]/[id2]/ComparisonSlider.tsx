"use client";

import { useRef, useState, useCallback } from "react";
import type { Shot } from "@/types/player";
import ZoneChart from "@/components/dashboard/ShotChart/charts/ZoneChart";
import HexChart from "@/components/dashboard/ShotChart/charts/HexChart";
import HeatMap from "@/components/dashboard/ShotChart/charts/HeatMap";
import ScatterView from "./ScatterView";
import styles from "./CompareClient.module.scss";

export const COURT_TABS = ["Tirs", "Zones", "Hex", "Heat"] as const;
export type CourtTab = (typeof COURT_TABS)[number];

type Props = {
  activeTab: CourtTab;
  shots1: Shot[];
  shots2: Shot[];
  name1: string;
  name2: string;
};

export default function ComparisonSlider({ activeTab, shots1, shots2, name1, name2 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  }, [updatePos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePos(e.clientX);
  }, [updatePos]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const renderChart = (shots: Shot[], color: string) => {
    switch (activeTab) {
      case "Tirs": return <ScatterView shots={shots} color={color} />;
      case "Zones": return <ZoneChart shots={shots} />;
      case "Hex": return <HexChart shots={shots} />;
      case "Heat": return <HeatMap shots={shots} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.sliderContainer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: "none" }}
    >
      <div className={styles.sliderLayer} style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
        {renderChart(shots2, "#74D0ED")}
        <span className={styles.sliderLabel} style={{ right: 8 }}>{name2}</span>
      </div>

      <div
        className={styles.sliderLayerClipped}
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        {renderChart(shots1, "#FF6C22")}
        <span className={styles.sliderLabel} style={{ left: 8 }}>{name1}</span>
      </div>

      <div className={styles.sliderDivider} style={{ left: `${sliderPos}%` }}>
        <div className={styles.sliderHandle}>
          <span>◀</span>
          <span>▶</span>
        </div>
      </div>
    </div>
  );
}
