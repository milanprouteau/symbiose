import { Shot } from "@/types/player";

export type ShotCategory = {
  label: string;
  made: number;
  total: number;
  pct: number;
};

const PAINT_ZONES = new Set(["Raquette"]);
const MIDRANGE_ZONES = new Set([
  "Mi-distance gauche",
  "Mi-distance droite",
  "Mi-distance face",
]);
const THREE_PT_ZONES = new Set([
  "Corner gauche",
  "Corner droit",
  "Aile gauche",
  "Aile droite",
  "Face au panier",
]);
const DEEP_ZONES = new Set([
  "Logo",
  "Aile gauche loin",
  "Aile droite loin",
  "Très loin gauche",
  "Très loin droit",
]);

function bucket(shots: Shot[], zones: Set<string>): ShotCategory & { label: string } {
  const filtered = shots.filter((s) => zones.has(s.zone));
  const made = filtered.filter((s) => s.made).length;
  const total = filtered.length;
  return { label: "", made, total, pct: total > 0 ? Math.round((made / total) * 100) : 0 };
}

export function computeShotStats(shots: Shot[]) {
  const all: ShotCategory = {
    label: "Total",
    made: shots.filter((s) => s.made).length,
    total: shots.length,
    pct: shots.length > 0 ? Math.round((shots.filter((s) => s.made).length / shots.length) * 100) : 0,
  };

  const twoPointers = shots.filter((s) => s.type === "2PT");
  const twoPt: ShotCategory = {
    label: "2PT",
    made: twoPointers.filter((s) => s.made).length,
    total: twoPointers.length,
    pct: twoPointers.length > 0 ? Math.round((twoPointers.filter((s) => s.made).length / twoPointers.length) * 100) : 0,
  };

  const threePointers = shots.filter((s) => s.type === "3PT");
  const threePt: ShotCategory = {
    label: "3PT",
    made: threePointers.filter((s) => s.made).length,
    total: threePointers.length,
    pct: threePointers.length > 0 ? Math.round((threePointers.filter((s) => s.made).length / threePointers.length) * 100) : 0,
  };

  const paint: ShotCategory = { ...bucket(shots, PAINT_ZONES), label: "Paint" };
  const midrange: ShotCategory = { ...bucket(shots, MIDRANGE_ZONES), label: "Mid-Range" };
  const threeZone: ShotCategory = { ...bucket(shots, THREE_PT_ZONES), label: "3PT Zone" };
  const deep: ShotCategory = { ...bucket(shots, DEEP_ZONES), label: "Deep" };

  return {
    all,
    byType: [twoPt, threePt],
    byZone: [paint, midrange, threeZone, deep],
  };
}
