import teamData from "@/data/teams.json";

type TeamInfo = { color: string; abbreviation: string };
const teams = teamData as Record<string, TeamInfo>;

/** Returns the team's primary hex color, or a fallback */
export function getTeamColor(team: string): string {
  return teams[team]?.color ?? "#888884";
}

/** Returns the team abbreviation (e.g. "UNC", "DUKE"), or first 4 chars */
export function getTeamAbbreviation(team: string): string {
  return teams[team]?.abbreviation ?? team.slice(0, 4).toUpperCase();
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

/** Relative luminance (0–1) of an #RRGGBB color */
function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(parseInt(clean.slice(0, 2), 16));
  const g = toLinear(parseInt(clean.slice(2, 4), 16));
  const b = toLinear(parseInt(clean.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Convert #RRGGBB → { h, s, l } (h: 0–360, s/l: 0–100) */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Convert HSL → #RRGGBB */
function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const val = ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(val * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Returns a display-safe version of the team color for use as a UI accent.
 * - Purely black colors (#000000 and near-black) → returns null (skip theming)
 * - Very dark colors → lightness boosted to a minimum of 45% so they're visible in dark mode
 */
export function getTeamDisplayColor(team: string): string | null {
  const hex = getTeamColor(team);
  const lum = luminance(hex);

  // Skip theming for near-black colors (no hue to work with)
  if (lum < 0.02) return null;

  const { h, s, l } = hexToHsl(hex);

  // If too dark for dark-mode visibility, boost lightness
  if (l < 45) {
    return hslToHex(h, Math.min(s, 85), 50);
  }

  return hex;
}
