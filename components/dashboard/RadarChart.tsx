"use client";

import { useMemo, useState } from "react";
import styles from "./RadarChart.module.scss";

export type RadarAxis = {
  key: string;
  label: string;
  max: number;
  invert?: boolean;
};

export type RadarPlayer = {
  name: string;
  color: string;
  values: Record<string, number>;
};

type Props = {
  players: RadarPlayer[];
  axes: RadarAxis[];
  size?: number;
};

type Tooltip = {
  x: number;
  y: number;
  label: string;
  value: string;
  color: string;
};

const RINGS = [0.25, 0.5, 0.75, 1];

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarChart({ players, axes, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const angleStep = 360 / axes.length;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const polygons = useMemo(() => {
    return players.map((player) => {
      const points = axes.map((axis, i) => {
        const raw = player.values[axis.key] ?? 0;
        const norm = axis.invert
          ? Math.max(0, 1 - raw / axis.max)
          : Math.min(raw / axis.max, 1);
        const r = norm * maxR;
        const angle = i * angleStep;
        return polarToXY(angle, r, cx, cy);
      });
      return { ...player, points };
    });
  }, [players, axes, cx, cy, maxR, angleStep]);

  return (
    <div className={styles.container}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
        {/* Background rings */}
        {RINGS.map((pct) => {
          const r = pct * maxR;
          const pts = axes.map((_, i) => {
            const p = polarToXY(i * angleStep, r, cx, cy);
            return `${p.x},${p.y}`;
          }).join(" ");
          return (
            <polygon
              key={pct}
              points={pts}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Axis lines + labels */}
        {axes.map((axis, i) => {
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
                stroke="var(--color-border)"
                strokeWidth={0.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-text-secondary)"
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
                  r={tooltip?.label === axes[j].label && tooltip?.color === p.color ? 5 : 3}
                  fill={p.color}
                  style={{ cursor: "pointer", transition: "r 0.15s" }}
                  onMouseEnter={() =>
                    setTooltip({
                      x: pt.x,
                      y: pt.y,
                      label: axes[j].label,
                      value: (p.values[axes[j].key] ?? 0).toFixed(1),
                      color: p.color,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const tw = 70;
          const th = 22;
          const tx = Math.min(Math.max(tooltip.x - tw / 2, 4), size - tw - 4);
          const ty = tooltip.y - th - 8;
          return (
            <g style={{ pointerEvents: "none" }}>
              <rect x={tx} y={ty} width={tw} height={th} rx={4} fill="var(--color-surface-raised)" stroke={tooltip.color} strokeWidth={1} />
              <text
                x={tx + tw / 2}
                y={ty + th / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={tooltip.color}
                fontSize={9}
                fontFamily="var(--font-alfabet-semibold), sans-serif"
              >
                {tooltip.label}: {tooltip.value}
              </text>
            </g>
          );
        })()}
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
