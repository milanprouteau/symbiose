"use client";

import { useEffect, useMemo, useState } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX, VB_X, VB_Y, VB_W, VB_H } from "../utils/scales";
import { renderHeatmapCanvas } from "../utils/heatmap";
import { computePlayerFgPct } from "../utils/hex-bins";
import Court from "../Court";

type Props = { shots: Shot[] };

export default function HeatMap({ shots }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const playerFgPct = useMemo(() => computePlayerFgPct(shots), [shots]);

  useEffect(() => {
    setDataUrl(renderHeatmapCanvas(shots));
  }, [shots]);

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="font-heading text-xs uppercase tracking-widest text-[#888884]">
        Heat Map
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className="w-full max-w-lg"
      >
        {dataUrl && (
          <image
            href={dataUrl}
            x={VB_X}
            y={VB_Y}
            width={VB_W}
            height={VB_H}
            preserveAspectRatio="none"
          />
        )}

        <Court />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] font-heading text-[#888884]">
        <span>Faible</span>
        <span
          className="w-20 h-1.5 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #0000b4, #00b4eb, #00d250, #ffdc00, #ff7800, #dc1e00)",
          }}
        />
        <span>Fort</span>
        <span className="ml-2 text-primary-yellow">{Math.round(playerFgPct)}% FG</span>
      </div>
    </div>
  );
}
