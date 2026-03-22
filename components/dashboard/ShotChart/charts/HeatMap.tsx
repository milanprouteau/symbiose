"use client";

import { useEffect, useMemo, useState } from "react";
import { Shot } from "@/types/player";
import { VIEW_BOX, VB_X, VB_Y, VB_W, VB_H } from "../utils/scales";
import { renderHeatmapCanvas } from "../utils/heatmap";
import { computePlayerFgPct } from "../utils/hex-bins";
import Court from "../Court";
import styles from "./HeatMap.module.scss";

type Props = { shots: Shot[] };

export default function HeatMap({ shots }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const playerFgPct = useMemo(() => computePlayerFgPct(shots), [shots]);

  useEffect(() => {
    setDataUrl(renderHeatmapCanvas(shots));
  }, [shots]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        Heat Map
      </h3>

      <svg
        viewBox={VIEW_BOX}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
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
      <div className={styles.legend}>
        <span>Faible</span>
        <span className={styles.gradientBar} />
        <span>Fort</span>
        <span className={styles.fgNote}>{Math.round(playerFgPct)}% FG</span>
      </div>
    </div>
  );
}
