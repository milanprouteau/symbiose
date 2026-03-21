"use client";

import * as d3 from "d3";
import { useMemo } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX } from "../utils/scales";
import { computeZoneStats } from "../utils/zones";
import Court from "../Court";

type Props = { shots: Shot[] };

export default function ZoneChart({ shots }: Props) {
  const zoneStats = useMemo(() => computeZoneStats(shots), [shots]);

  const colorScale = useMemo(
    () =>
      d3.scaleLinear<string>()
        .domain([0, 35, 50, 65, 100])
        .range(["#F794D9", "#D8D1C5", "#FFCD01", "#62E862", "#74D0ED"]),
    []
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="font-heading text-xs uppercase tracking-widest text-[#888884]">
        % par zone
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-lg"
      >
        <Court />

        {zoneStats.map((zone) => {
          const hasStat = zone.total > 0;
          const fill = hasStat ? colorScale(zone.pct) : "#2a2a28";

          return (
            <g key={zone.id}>
              <path
                d={zone.path}
                fill={fill}
                fillOpacity={hasStat ? 0.45 : 0.25}
                stroke="#555"
                strokeWidth={2}
              />
              {hasStat && (
                <>
                  <text
                    x={zone.centerX}
                    y={zone.centerY - 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={colorScale(zone.pct)}
                    fontSize={11}
                    fontWeight="600"
                  >
                    {zone.pct}%
                  </text>
                  <text
                    x={zone.centerX}
                    y={zone.centerY + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#888884"
                    fontSize={8}
                  >
                    {zone.made}/{zone.total}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Légende */}
      <div className="flex items-center gap-3 text-[10px] font-heading text-[#888884]">
        <span style={{ color: "#F794D9" }}>■</span> Faible
        <span style={{ color: "#FFCD01" }}>■</span> Moyen
        <span style={{ color: "#62E862" }}>■</span> Bon
        <span style={{ color: "#74D0ED" }}>■</span> Excellent
      </div>
    </div>
  );
}