import { Shot } from "@/types/player";
import { ZONE_PATHS } from "./zone-paths";

export type ZoneStat = {
  id: string;
  label: string;
  path: string;
  made: number;
  total: number;
  pct: number;
  centerX: number;
  centerY: number;
};

// Mapping : nom de zone dans Shot.zone → id dans ZONE_PATHS
export const ZONE_MAP: Record<string, string> = {
  "Raquette":           "raquette",
  "Mi-distance gauche": "mi-distance-gauche",
  "Mi-distance droite": "mi-distance-droite",
  "Mi-distance face":   "haut-raquette",
  "Corner gauche":      "corner-gauche",
  "Corner droit":       "corner-droit",
  "Aile gauche":        "aile-gauche-proche",
  "Aile droite":        "aile-droite-proche",
  "Face au panier":     "face-milieu",
  "Logo":               "face-loin",
  "Aile gauche loin":   "aile-gauche-loin",
  "Aile droite loin":   "aile-droite-loin",
  "Très loin gauche":   "tres-loin-gauche",
  "Très loin droit":    "tres-loin-droit",
};

export function computeZoneStats(shots: Shot[]): ZoneStat[] {
  const stats: Record<string, { made: number; total: number }> = {};

  for (const shot of shots) {
    const zoneId = ZONE_MAP[shot.zone];
    if (!zoneId) continue;
    if (!stats[zoneId]) stats[zoneId] = { made: 0, total: 0 };
    stats[zoneId].total++;
    if (shot.made) stats[zoneId].made++;
  }

  return ZONE_PATHS.map((zone) => {
    const s = stats[zone.id] ?? { made: 0, total: 0 };
    const pct = s.total > 0 ? Math.round((s.made / s.total) * 100) : 0;
    return {
      id: zone.id,
      label: zone.label,
      path: zone.path,
      made: s.made,
      total: s.total,
      pct,
      centerX: zone.centerX,
      centerY: zone.centerY,
    };
  });
}