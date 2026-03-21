"use client";

import { Shot } from "@/types/player";
import { mockShots } from "@/constants/mock-shots";
import { scaleX, scaleY, VIEW_BOX } from "./utils/scales";
import Court from "./Court";
import ScatterChart from "./charts/ScatterChart";
import ZoneChart from "./charts/ZoneChart";
import HexChart from "./charts/HexChart";
import HeatMap from "./charts/HeatMap";

type Props = {
  shots?: Shot[];
};

export default function ShotChart({ shots = mockShots }: Props) {
  const made  = shots.filter((s) => s.made).length;
  const total = shots.length;
  const pct   = total > 0 ? Math.round((made / total) * 100) : 0;

  return (
    <div className="w-full py-8 px-6">
      <h2 className="font-heading text-sm uppercase tracking-widest text-[#888884] mb-6">
        Shot Chart
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Chart 1 — Scatter */}
        <div className="flex flex-col items-center gap-3">
          <h3 className="font-heading text-xs uppercase tracking-widest text-[#888884]">
            Tirs individuels
          </h3>
          <div className="flex items-center gap-6 font-heading text-xs text-[#888884]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-orange inline-block" />
              <span>Rentré ({made})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary-beige">×</span>
              <span>Raté ({total - made})</span>
            </div>
            <span className="text-primary-yellow">{pct}% FG</span>
          </div>
          <svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" className="w-full max-w-lg">
            <Court />
            {shots.map((shot) => (
              <ScatterChart key={shot.id} shot={shot} scaleX={scaleX} scaleY={scaleY} />
            ))}
          </svg>
        </div>

        {/* Chart 2 — Zones */}
        <ZoneChart shots={shots} />

        {/* Chart 3 — Hex Map */}
        <HexChart shots={shots} />

        {/* Chart 4 — Heat Map */}
        <HeatMap shots={shots} />

      </div>
    </div>
  );
}