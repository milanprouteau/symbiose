"use client";

import * as d3 from "d3";
import { useMemo } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX } from "../utils/scales";
import { computeHexBins, computePlayerFgPct, hexPath, HEX_MIN_R, HEX_MAX_R } from "../utils/hex-bins";
import Court from "../Court";

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
    <div className="flex flex-col items-center gap-3">
      <h3 className="font-heading text-xs uppercase tracking-widest text-[#888884]">
        Hex Map
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-lg"
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
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] font-heading text-[#888884]">
        <span style={{ color: "#1565c0" }}>●</span> Below avg
        <span
          className="w-14 h-1.5 rounded-full mx-1"
          style={{
            background:
              "linear-gradient(to right, #1565c0, #e8e8e8, #c62828)",
          }}
        />
        <span style={{ color: "#c62828" }}>●</span> Above avg
        <span className="ml-2 text-primary-yellow">
          ({Math.round(playerFgPct)}% FG)
        </span>
      </div>
    </div>
  );
}
