"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useInView } from "@/hooks/useInView";
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
const ANIM_DURATION = 700; // ms

function polarToXY(angle: number, radius: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function RadarChart({ players, axes, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const angleStep = 360 / axes.length;
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

    // Animation progress: 0 → 1
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const [containerRef, inView] = useInView({ threshold: 0.2 });

  // Track previous player values for morphing interpolation
  const prevPlayersRef = useRef<RadarPlayer[]>([]);
  const playersKey = players.map((p) => p.name).join("|");
  const prevPlayersKey = useRef(playersKey);
  const [animKey, setAnimKey] = useState(0);
  const isMorphAnim = useRef(false);

  useEffect(() => {
    if (playersKey !== prevPlayersKey.current) {
      isMorphAnim.current = true;
      prevPlayersKey.current = playersKey;
      setAnimKey((k) => k + 1);
    }
  }, [playersKey]);

  useEffect(() => {
    if (!inView && animKey === 0) return;
    // Capture previous players before starting morph
    prevPlayersRef.current = isMorphAnim.current ? prevPlayersRef.current : [];
    isMorphAnim.current = false;
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / ANIM_DURATION, 1);
      setProgress(easeOutCubic(t));
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
      else prevPlayersRef.current = players;
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView, animKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* eslint-disable react-hooks/refs */
  const polygons = useMemo(() => {
    const prev = prevPlayersRef.current;
    return players.map((player, pi) => {
      const prevPlayer = prev[pi];
      const points = axes.map((axis, i) => {
        const raw = player.values[axis.key] ?? 0;
        const norm = axis.invert
          ? Math.max(0, 1 - raw / axis.max)
          : Math.min(raw / axis.max, 1);
        const targetR = norm * maxR;

        // If we have previous values, interpolate from them; otherwise scale from 0
        let r: number;
        if (prevPlayer) {
          const prevRaw = prevPlayer.values[axis.key] ?? 0;
          const prevNorm = axis.invert
            ? Math.max(0, 1 - prevRaw / axis.max)
            : Math.min(prevRaw / axis.max, 1);
          const prevR = prevNorm * maxR;
          r = prevR + (targetR - prevR) * progress;
        } else {
          r = targetR * progress;
        }

        const angle = i * angleStep;
        return polarToXY(angle, r, cx, cy);
      });
      return { ...player, points };
    });
  }, [players, axes, cx, cy, maxR, angleStep, progress]);
  /* eslint-enable react-hooks/refs */

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={styles.container}
    >
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
          const dotsReady = progress > 0.65;
          return (
            <g key={idx}>
              <polygon
                points={pts}
                fill={p.color}
                fillOpacity={0.15 * progress}
                stroke={p.color}
                strokeWidth={2}
                strokeOpacity={0.4 + 0.6 * progress}
              />
              {p.points.map((pt, j) => {
                const isHovered = tooltip?.label === axes[j].label && tooltip?.color === p.color;
                return (
                  <circle
                    key={j}
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5 : 3}
                    fill={p.color}
                    style={{
                      cursor: "pointer",
                      opacity: dotsReady ? 1 : 0,
                      transition: `opacity 0.35s ease ${j * 45}ms, r 0.15s`,
                    }}
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
                );
              })}
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
