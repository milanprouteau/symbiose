"use client";

import * as d3 from "d3";
import { useMemo } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX } from "../utils/scales";
import { computeZoneStats } from "../utils/zones";
import Court from "../Court";
import styles from "./ZoneChart.module.scss";

type Props = { shots: Shot[] };

export default function ZoneChart({ shots }: Props) {
  const zoneStats = useMemo(() => computeZoneStats(shots), [shots]);

  const colorScale = useMemo(
    () =>
      d3.scaleLinear<string>()
        .domain([0, 25, 50, 75, 100])
        .range(["#FFCCCC", "#FF8888", "#E04040", "#B81D1D", "#7A0000"]),
    []
  );

  const emptyFill = "#FFCCCC";

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        % par zone
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
      >
        <Court />

        {zoneStats.map((zone, i) => {
          const hasStat = zone.total > 0;
          const fill = hasStat ? colorScale(zone.pct) : emptyFill;
          const delay = `${i * 45}ms`;

          return (
            <g
              key={zone.id}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: `zoneIn 0.35s ease backwards`,
                animationDelay: delay,
              }}
            >
              <path
                d={zone.path}
                fill={fill}
                fillOpacity={0.55}
                stroke="#555"
                strokeWidth={2}
              />
              <text
                x={zone.centerX}
                y={zone.centerY - 6}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fff"
                fontSize={11}
                fontWeight="600"
              >
                {hasStat ? `${zone.pct}%` : "0%"}
              </text>
              <text
                x={zone.centerX}
                y={zone.centerY + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffffaa"
                fontSize={8}
              >
                {zone.made}/{zone.total}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className={styles.legend}>
        <span style={{ color: "#FFCCCC" }}>■</span> 0%
        <span style={{ color: "#FF8888" }}>■</span> 25%
        <span style={{ color: "#E04040" }}>■</span> 50%
        <span style={{ color: "#B81D1D" }}>■</span> 75%
        <span style={{ color: "#7A0000" }}>■</span> 100%
      </div>
    </div>
  );
}