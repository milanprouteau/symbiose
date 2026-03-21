/**
 * Hex-bin center positions in physical shot coordinates (tenths of feet).
 * x : -250 → 250  (court width, 0 = center; sideline at ±250)
 * y :    0 → ~270  (distance from basket; 3PT arc ≈ 221)
 *
 * Calibrated to match actual shot data range (y max ≈ 267).
 */
export const HEX_CENTERS: { x: number; y: number }[] = [
  // ── Rim / restricted area ──
  { x: 0, y: 10 },
  { x: -30, y: 20 },
  { x: 30, y: 20 },

  // ── Close paint ──
  { x: -20, y: 45 },
  { x: 20, y: 45 },
  { x: -55, y: 35 },
  { x: 55, y: 35 },
  { x: 0, y: 65 },
  { x: -40, y: 70 },
  { x: 40, y: 70 },

  // ── Free-throw / paint edge ──
  { x: 0, y: 95 },
  { x: -35, y: 100 },
  { x: 35, y: 100 },
  { x: -60, y: 90 },
  { x: 60, y: 90 },

  // ── Short mid-range ──
  { x: -100, y: 50 },
  { x: 100, y: 50 },
  { x: -95, y: 100 },
  { x: 95, y: 100 },
  { x: -65, y: 130 },
  { x: 65, y: 130 },
  { x: 0, y: 145 },
  { x: -30, y: 140 },
  { x: 30, y: 140 },

  // ── Long mid-range ──
  { x: -145, y: 70 },
  { x: 145, y: 70 },
  { x: -140, y: 130 },
  { x: 140, y: 130 },
  { x: -100, y: 170 },
  { x: 100, y: 170 },
  { x: -45, y: 185 },
  { x: 45, y: 185 },
  { x: 0, y: 195 },

  // ── 3PT corners ──
  { x: -230, y: 25 },
  { x: -230, y: 70 },
  { x: 230, y: 25 },
  { x: 230, y: 70 },

  // ── 3PT wings (along the arc, dist ≈ 220) ──
  { x: -210, y: 120 },
  { x: 210, y: 120 },
  { x: -190, y: 165 },
  { x: 190, y: 165 },
  { x: -160, y: 200 },
  { x: 160, y: 200 },

  // ── 3PT top of key (along the arc) ──
  { x: -110, y: 220 },
  { x: -55, y: 228 },
  { x: 0, y: 230 },
  { x: 55, y: 228 },
  { x: 110, y: 220 },

  // ── Deep 3 (beyond arc) ──
  { x: -200, y: 230 },
  { x: 200, y: 230 },
  { x: -140, y: 255 },
  { x: 140, y: 255 },
  { x: -55, y: 260 },
  { x: 55, y: 260 },
  { x: 0, y: 265 },
];
