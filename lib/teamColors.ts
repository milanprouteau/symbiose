import teamColors from "@/data/teams.json";

const colors = teamColors as Record<string, string>;

/** Returns the team's primary hex color, or a fallback */
export function getTeamColor(team: string): string {
  return colors[team] ?? "#888884";
}

/** Converts #RRGGBB to "r,g,b" for use in CSS rgba() */
export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

/** Returns a CSS drop-shadow filter string using the team color */
export function teamDropShadow(team: string, opacity = 0.5): string {
  const hex = getTeamColor(team);
  const rgb = hexToRgb(hex);
  return `drop-shadow(0 6px 24px rgba(${rgb},${opacity}))`;
}
