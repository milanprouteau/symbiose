import type { Shot } from "@/types/player";
import type { PlayerShootingStats } from "@/types/stats";

export type ShotStatRow = { 
  label: string; 
  made: number; 
  attempted: number; 
  pct: number;
};

export function buildRows(ss: PlayerShootingStats): ShotStatRow[] {
  const dunks = ss.dunks ?? { attempted: 0, made: 0, pct: 0 };
  const layups = ss.layups ?? { attempted: 0, made: 0, pct: 0 };
  const tipIns = ss.tipIns ?? { attempted: 0, made: 0, pct: 0 };
  const twoJ = ss.twoPointJumpers ?? { attempted: 0, made: 0, pct: 0 };
  const threeJ = ss.threePointJumpers ?? { attempted: 0, made: 0, pct: 0 };

  const closeAttempted = dunks.attempted + layups.attempted + tipIns.attempted;
  const closeMade = dunks.made + layups.made + tipIns.made;

  return [
    { 
      label: "Dunks", 
      made: dunks.made, 
      attempted: dunks.attempted, 
      pct: Math.round(dunks.pct) 
    },
    { 
      label: "Layups", 
      made: layups.made + tipIns.made, 
      attempted: layups.attempted + tipIns.attempted, 
      pct: (layups.attempted + tipIns.attempted) > 0 
        ? Math.round(((layups.made + tipIns.made) / (layups.attempted + tipIns.attempted)) * 100) 
        : 0 
    },
    { 
      label: "Mid-Range", 
      made: twoJ.made, 
      attempted: twoJ.attempted, 
      pct: Math.round(twoJ.pct) 
    },
    { 
      label: "3-Pointers", 
      made: threeJ.made, 
      attempted: threeJ.attempted, 
      pct: Math.round(threeJ.pct) 
    },
  ];
}

export function buildRowsFromShots(shots: Shot[]): ShotStatRow[] {
  const types = [
    { label: "2PT", filter: (s: Shot) => s.type === "2PT" },
    { label: "3PT", filter: (s: Shot) => s.type === "3PT" },
  ];
  
  return types.map(({ label, filter }) => {
    const filtered = shots.filter(filter);
    const made = filtered.filter((s) => s.made).length;
    const attempted = filtered.length;
    return { 
      label, 
      made, 
      attempted, 
      pct: attempted > 0 ? Math.round((made / attempted) * 100) : 0 
    };
  });
}
