export type Shot = {
  id: string;
  x: number;        // coordonnée terrain -250 à 250
  y: number;        // coordonnée terrain -47.5 à 422.5
  made: boolean;
  type: "2PT" | "3PT" | "FT";
  zone: string;
};

// ── Centralized, formatted player model ──

export type Player = {
  // Identity
  id: number;
  name: string;
  jersey: string | null;
  position: string;
  team: string;
  conference: string;
  athleteId: number;

  // Bio (from roster / profile)
  height: string | null;       // formatted e.g. "6'9\""
  heightInches: number | null; // raw inches
  weight: string | null;       // formatted e.g. "250 lbs"
  weightRaw: number | null;    // raw lbs
  hometown: string | null;     // formatted e.g. "Miami, FL"
  dateOfBirth: string | null;  // formatted e.g. "Jan 15, 2005"

  // Derived image paths
  photoUrl: string;            // /players/{athleteId}.png
  teamLogoUrl: string;         // /uni/{slug}.png

  // Per-game averages (formatted strings with 1 decimal)
  ppg: string;
  rpg: string;
  apg: string;
  mpg: string;
  spg: string;
  bpg: string;
  topg: string;
  fpg: string;

  // Season totals
  games: number;
  starts: number;
  minutes: number;
  points: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;

  // Rebounds
  reboundsTotal: number;
  reboundsOffensive: number;
  reboundsDefensive: number;

  // Shooting percentages
  fgPct: number;
  fgMade: number;
  fgAttempted: number;
  twoPtPct: number;
  twoPtMade: number;
  twoPtAttempted: number;
  threePtPct: number;
  threePtMade: number;
  threePtAttempted: number;
  ftPct: number;
  ftMade: number;
  ftAttempted: number;

  // Advanced
  trueShootingPct: number;     // 0-100 scale
  effectiveFieldGoalPct: number;
  usage: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  assistsTurnoverRatio: number;
  offensiveReboundPct: number;
  freeThrowRate: number;
  PORPAG: number;

  // Win shares
  winSharesTotal: number;
  winSharesOffensive: number;
  winSharesDefensive: number;
  winSharesPer40: number;
};