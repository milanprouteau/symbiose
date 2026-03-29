"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import styles from "./PercentileRadialChart.module.scss";

/* ── Types ── */
export type PercentileStat = {
  label: string;
  value: number; // 0–100 percentile
  category: string;
};

export type CategoryStyle = {
  bg: string; // full-slice background
  fill: string; // value fill color
};

type Props = {
  title: string;
  stats: PercentileStat[];
  categories: Record<string, CategoryStyle>;
  size?: number;
};

/* ── Helpers ── */
const TAU = 2 * Math.PI;

/** Build an SVG arc path (annular sector) */
function arcPath(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const arc = d3.arc().innerRadius(innerR).outerRadius(outerR).cornerRadius(0);
  return arc({ startAngle, endAngle, innerRadius: innerR, outerRadius: outerR }) ?? "";
}

export default function PercentileRadialChart({
  title,
  stats,
  categories,
  size = 320,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 40; // leave room for labels
  const innerR = 12;
  const gap = 0.012; // gap between slices in radians

  const sliceAngle = useMemo(
    () => (TAU - stats.length * gap) / stats.length,
    [stats.length],
  );

  const slices = useMemo(() => {
    return stats.map((stat, i) => {
      const startAngle = i * (sliceAngle + gap) - TAU / 4; // start at top
      const endAngle = startAngle + sliceAngle;
      const valueR = innerR + (outerR - innerR) * (stat.value / 100);
      const midAngle = (startAngle + endAngle) / 2;

      // Label position (outside the slice)
      const labelR = outerR + 16;
      const labelX = labelR * Math.cos(midAngle);
      const labelY = labelR * Math.sin(midAngle);

      // Percentile number position (at the tip of the value arc)
      const numR = valueR + 8;
      const numX = numR * Math.cos(midAngle);
      const numY = numR * Math.sin(midAngle);

      // Rotation for the label text
      let textAngle = (midAngle * 180) / Math.PI + 90;
      // Flip text if on the bottom half so it reads correctly
      const flip = midAngle > 0 && midAngle < Math.PI;
      if (flip) textAngle += 180;

      const catStyle = categories[stat.category] ?? {
        bg: "#333",
        fill: "#666",
      };

      return {
        ...stat,
        startAngle,
        endAngle,
        valueR,
        midAngle,
        labelX,
        labelY,
        numX,
        numY,
        textAngle,
        flip,
        catStyle,
        bgPath: arcPath(innerR, outerR, startAngle, endAngle),
        valuePath: arcPath(innerR, valueR, startAngle, endAngle),
      };
    });
  }, [stats, categories, sliceAngle, outerR]);

  // Build legend entries from categories
  const legendEntries = useMemo(() => {
    const seen = new Set<string>();
    return stats
      .filter((s) => {
        if (seen.has(s.category)) return false;
        seen.add(s.category);
        return true;
      })
      .map((s) => ({
        category: s.category,
        style: categories[s.category],
      }));
  }, [stats, categories]);

  return (
    <div className={styles.container}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
      >
        <g transform={`translate(${cx},${cy})`}>
          {slices.map((s, i) => (
            <g key={i}>
              {/* Background slice */}
              <path d={s.bgPath} fill={s.catStyle.bg} fillOpacity={0.35} />
              {/* Value fill */}
              <path d={s.valuePath} fill={s.catStyle.fill} fillOpacity={0.85} />
              {/* Slice border */}
              <path
                d={s.bgPath}
                fill="none"
                stroke="#1D1D1B"
                strokeWidth={1.5}
              />

              {/* Percentile number */}
              <text
                x={s.numX}
                y={s.numY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#fff"
                fontSize={9}
                fontWeight={600}
                fontFamily="var(--font-heading)"
              >
                {s.value}
              </text>

              {/* Label around the outside */}
              <text
                x={s.labelX}
                y={s.labelY}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${s.textAngle}, ${s.labelX}, ${s.labelY})`}
                fill="#888884"
                fontSize={7}
                fontFamily="var(--font-heading)"
              >
                {s.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div className={styles.legend}>
        {legendEntries.map((e) => (
          <div key={e.category} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: e.style.fill }}
            />
            <span>{e.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
