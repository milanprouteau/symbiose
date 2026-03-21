/**
 * Transform raw API shooting plays into our Shot type.
 *
 * API coordinate system (full court, tenths of feet):
 *   x: 0 → 940  (court length, baseline to baseline)
 *   y: 0 → 500  (court width)
 *   Basket 1 ≈ (52.5, 250)   Basket 2 ≈ (887.5, 250)
 *
 * Our half-court coordinate system (physical, tenths of feet):
 *   x: -250 → 250  (court width, 0 = center)
 *   y:    0 → ~289  (0 = basket)
 */

import { Shot } from "@/types/player";
import type { PlayRaw } from "./api";

const BASKET_X = 52.5;    // basket offset from baseline (5.25 ft)
const COURT_MID = 470;    // half-court line in API x
const COURT_WIDTH_HALF = 250;

/** Convert API full-court coords → our half-court coords */
function toHalfCourt(apiX: number, apiY: number): { x: number; y: number } {
  if (apiX <= COURT_MID) {
    // Shot towards basket 1
    return {
      x: apiY - COURT_WIDTH_HALF,
      y: apiX - BASKET_X,
    };
  }
  // Shot towards basket 2 — mirror to same half-court orientation
  return {
    x: COURT_WIDTH_HALF - apiY,
    y: (940 - BASKET_X) - apiX,
  };
}

/**
 * Classify (halfCourt x, y) into a zone name matching ZONE_MAP.
 *
 * Boundaries are calibrated from the SVG zone-paths.ts coordinates
 * mapped back to physical coords via the scales:
 *   phys_x = (SVG_x − 254) / 0.7362
 *   phys_y = (270.9 − SVG_y) / 0.9091
 *
 * Key physical boundaries:
 *   Raquette ellipse: center (0, 34), x-radius 60, y-top 83
 *   Paint edge:       |x| = 119
 *   FT line:          y = 108
 *   Corner upper:     y = 87      (3PT straight section end)
 *   Très loin upper:  y = 94
 *   Face-milieu:      |x| < 105,  y ∈ [127, 193]
 *   Logo:             |x| < 148,  y > 193
 *   Aile boundary:    y ≈ 193     (close → far)
 *   3PT corner line:  |x| = 217
 */
function classifyZone(x: number, y: number): string {
  const absX = Math.abs(x);
  const dist = Math.sqrt(x * x + y * y);

  // ── 1. Raquette (SVG circle r=44.23 at (254,240)) ──
  // Ellipse in physical space: center (0, 34), rx=60, ry=49
  if ((x / 60) ** 2 + ((y - 34) / 49) ** 2 < 1) return "Raquette";

  // ── 2. Très loin (far sideline, |x| > 217, y < 94) ──
  if (absX > 217 && y < 94) {
    return x < 0 ? "Très loin gauche" : "Très loin droit";
  }

  // ── 3. Corner (paint-edge to 3PT corner, near baseline) ──
  if (absX > 119 && y < 87) {
    return x < 0 ? "Corner gauche" : "Corner droit";
  }

  // ── 4. Mi-distance (between raquette and face-milieu inner ring) ──
  // Boundary slopes from (|x|=60, y=127) to (|x|=119, y=87)
  const midBound = absX < 60 ? 127 : 127 - (absX - 60) * 0.68;
  if (y < midBound && absX < 119) {
    if (absX < 60) return "Mi-distance face";
    return x < 0 ? "Mi-distance gauche" : "Mi-distance droite";
  }

  // ── 5. Deep center (Logo): above face-milieu, center court ──
  // The face-loin SVG inner edge is a horizontal line at phys y=193
  if (y > 193 && absX < 148) return "Logo";

  // ── 6. Aile loin (deep wings): beyond 3PT arc on the sides ──
  // The SVG aile-loin inner edge follows the 3PT arc ≈ dist 220
  if (absX > 105 && dist > 220) {
    return x < 0 ? "Aile gauche loin" : "Aile droite loin";
  }

  // ── 7. Très loin extended: far sideline above 3PT straight ──
  if (absX > 217) {
    return x < 0 ? "Très loin gauche" : "Très loin droit";
  }

  // ── 8. Aile proche (wing 3PT, |x| > 105, inside 3PT arc) ──
  if (absX > 105) {
    return x < 0 ? "Aile gauche" : "Aile droite";
  }

  // ── 9. Face au panier (top-of-key 3PT area, |x| ≤ 105) ──
  return "Face au panier";
}

/** Determine shot type from scoreValue */
function shotType(scoreValue: number): "2PT" | "3PT" | "FT" {
  if (scoreValue === 3) return "3PT";
  if (scoreValue === 1) return "FT";
  return "2PT";
}

/**
 * Map raw API plays → Shot[].
 * Filters to only the given player's own shots with valid locations.
 */
export function mapPlaysToShots(plays: PlayRaw[], playerId: number): Shot[] {
  const shots: Shot[] = [];

  for (const play of plays) {
    // Only this player's own shots
    if (play.shotInfo.shooter.id !== playerId) continue;

    // Skip free throws and shots without location
    const loc = play.shotInfo.location;
    if (!loc || loc.x == null || loc.y == null) continue;

    const { x, y } = toHalfCourt(loc.x, loc.y);

    shots.push({
      id: String(play.id),
      x,
      y,
      made: play.shotInfo.made,
      type: shotType(play.scoreValue),
      zone: classifyZone(x, y),
    });
  }

  return shots;
}
