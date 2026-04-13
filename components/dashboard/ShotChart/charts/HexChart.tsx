"use client";

import * as d3 from "d3";
import { useMemo } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX } from "../utils/scales";
import { computeHexBins, computePlayerFgPct, hexPath, HEX_MIN_R, HEX_MAX_R } from "../utils/hex-bins";
import Court from "../Court";
import styles from "./HexChart.module.scss";

type Props = { shots: Shot[] };

export default function HexChart({ shots }: Props) {
  const playerFgPct = useMemo(() => computePlayerFgPct(shots), [shots]);
  const { bins, maxTotal } = useMemo(() => computeHexBins(shots), [shots]);

  const colorScale = useMemo(
    () =>
      d3
        .scaleLinear<string>()
        .domain([playerFgPct - 25, playerFgPct, playerFgPct + 25])
        .range(["#1565c0", "#e8e8e8", "#c62828"])
        .clamp(true),
    [playerFgPct]
  );

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Hex Map
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
      >
        <Court />

        {bins.map((bin, i) => {
          const r = HEX_MIN_R + Math.sqrt(bin.total / maxTotal) * (HEX_MAX_R - HEX_MIN_R);
          return (
            <path
              key={i}
              d={hexPath(bin.cx, bin.cy, r)}
              fill={colorScale(bin.pct)}
              fillOpacity={0.88}
              stroke="#1D1D1B"
              strokeWidth={1.25}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: "hexIn 0.3s ease backwards",
                animationDelay: `${Math.min(i * 18, 400)}ms`,
              }}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        <span style={{ color: "#1565c0" }}>●</span> Below avg
        <span className={styles.gradientBar} />
        <span style={{ color: "#c62828" }}>●</span> Above avg
        <span className={styles.fgNote}>
          ({Math.round(playerFgPct)}% FG)
        </span>
      </div>
    </div>
  );
}
