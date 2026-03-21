import * as d3 from "d3";

/* ── Shared coordinate scales ──
 *
 * Shot coords (physical, tenths of feet, basket at origin):
 *   x ∈ [-306.5, 306.5]   (court width;  sideline at ±250)
 *   y ∈ [0, 289]           (distance from basket; half-court ≈ 417)
 *
 * SVG coords (match Court.tsx landmarks):
 *   x ∈ [28.35, 479.65]   y ∈ [270.9, 8]   (y inverted)
 *
 * Calibrated on:
 *   • 3PT corner lines  x = ±216.5  →  SVG 94.61 / 413.39
 *   • 3PT arc apex       y = 221.5   →  SVG 69.5
 *   • Basket              y = 0       →  SVG 270.9
 */
export const scaleX = d3.scaleLinear().domain([-306.5, 306.5]).range([28.35, 479.65]);
export const scaleY = d3.scaleLinear().domain([0, 289]).range([270.9, 8]);

/* ── ViewBox constants ── */
export const VB_X = 28.35;
export const VB_Y = 8.01;
export const VB_W = 451.3;
export const VB_H = 270.89;
export const VIEW_BOX = `${VB_X} ${VB_Y} ${VB_W} ${VB_H}`;
