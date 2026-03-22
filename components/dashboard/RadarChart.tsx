"use client";

import { useMemo } from "react";
import styles from "./RadarChart.module.scss";

export type RadarPlayer = {
  name: string;
  color: string;
  values: {
    fg: number;    // FG%
    three: number; // 3PT%
    ft: number;    // FT%
    ts: number;    // TS%
    usage: number; // Usage%
  };
};

type Props = {
  players: RadarPlayer[];
  size?: number;
};

const AXES = [
  { key: "fg" as const, label: "FG%", max: 70 },
  { key: "three" as const, label: "3PT%", max: 50 },
  { key: "ft" as const, label: "FT%", max: 100 },
  { key: "ts" as const, label: "TS%", max: 70 },
  { key: "usage" as const, label: "Usage", max: 40 },
];

const RINGS = [0.25, 0.5, 0.75, 1];

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({ players, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const angleStep = 360 / AXES.length;

  const polygons = useMemo(() => {
    return players.map((player) => {
      const points = AXES.map((axis, i) => {
        const raw = player.values[axis.key];
        const norm = Math.min(raw / axis.max, 1);
        const r = norm * maxR;
        const angle = i * angleStep;
        return polarToXY(angle, r, cx, cy);
      });
      return { ...player, points };
    });
  }, [players, cx, cy, maxR, angleStep]);

  return (
    <div className={styles.container}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background rings */}
        {RINGS.map((pct) => {
          const r = pct * maxR;
          const pts = AXES.map((_, i) => {
            const p = polarToXY(i * angleStep, r, cx, cy);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <polygon
              key={pct}
              points={pts}
              fill="none"
              stroke="#333"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Axis lines + labels */}
        {AXES.map((axis, i) => {
          const angle = i * angleStep;
          const end = polarToXY(angle, maxR, cx, cy);
          const labelPos = polarToXY(angle, maxR + 18, cx, cy);
          return (
            <g key={axis.key}>
              <line
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="#444"
                strokeWidth={0.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#888884"
                fontSize={10}
                fontFamily="var(--font-alfabet-semibold), sans-serif"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Player polygons */}
        {polygons.map((p, idx) => {
          const pts = p.points.map((pt) => `${pt.x},${pt.y}`).join(" ");
          return (
            <g key={idx}>
              <polygon
                points={pts}
                fill={p.color}
                fillOpacity={0.15}
                stroke={p.color}
                strokeWidth={2}
              />
              {p.points.map((pt, j) => (
                <circle
                  key={j}
                  cx={pt.x}
                  cy={pt.y}
                  r={3}
                  fill={p.color}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {players.length > 0 && (
        <div className={styles.legend}>
          {players.map((p, i) => (
            <div key={i} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: p.color }}
              />
              <span className={styles.legendLabel}>{p.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
