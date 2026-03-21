import { Shot } from "@/types/player";
import { HEX_CENTERS } from "./hex-centers";
import { scaleX, scaleY } from "./scales";

/* ── Types ── */
export type HexBin = {
  cx: number;
  cy: number;
  made: number;
  total: number;
  pct: number;
};

export type HexBinResult = {
  bins: HexBin[];
  maxTotal: number;
};

/* ── Constants ── */
export const HEX_MIN_R = 5;
export const HEX_MAX_R = 16;
const MIN_SHOTS = 1;

/** Pointy-top hexagon SVG path */
export function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  });
  return `M ${pts[0]} L ${pts[1]} L ${pts[2]} L ${pts[3]} L ${pts[4]} L ${pts[5]} Z`;
}

/** Assign every shot to its nearest hex center & aggregate stats */
export function computeHexBins(shots: Shot[]): HexBinResult {
  const groups = new Map<number, { made: number; total: number }>();

  for (const shot of shots) {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < HEX_CENTERS.length; i++) {
      const dx = shot.x - HEX_CENTERS[i].x;
      const dy = shot.y - HEX_CENTERS[i].y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const g = groups.get(best) ?? { made: 0, total: 0 };
    g.total++;
    if (shot.made) g.made++;
    groups.set(best, g);
  }

  let maxTotal = 1;
  const bins: HexBin[] = [];
  for (const [idx, g] of groups) {
    if (g.total < MIN_SHOTS) continue;
    if (g.total > maxTotal) maxTotal = g.total;
    const c = HEX_CENTERS[idx];
    bins.push({
      cx: scaleX(c.x),
      cy: scaleY(c.y),
      made: g.made,
      total: g.total,
      pct: (g.made / g.total) * 100,
    });
  }

  return { bins, maxTotal };
}

/** Player overall FG% */
export function computePlayerFgPct(shots: Shot[]): number {
  const made = shots.filter((s) => s.made).length;
  return shots.length > 0 ? (made / shots.length) * 100 : 0;
}
