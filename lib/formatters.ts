/** Convert height in inches to a "1m90" string */
export function formatHeight(inches: number | null | undefined): string | null {
  if (!inches) return null;
  const totalCm = Math.round(inches * 2.54);
  const m = Math.floor(totalCm / 100);
  const cm = totalCm % 100;
  return `${m}m${cm.toString().padStart(2, "0")}`;
}

export function formatWeight(lbs: number | null | undefined): string | null {
  if (!lbs) return null;
  return `${Math.round(lbs * 0.453592)} kg`;
}

/**
 * Parse a wingspan stored in compact feet-inch notation to total inches.
 * First digit = feet, remaining digits = inches.
 * Examples: 7 → 7'0" (84"), 65 → 6'5" (77"), 72 → 7'2" (86"), 610 → 6'10" (82"), 611 → 6'11" (83").
 */
export function wingspanToInches(value: number | null | undefined): number | null {
  if (value == null) return null;
  const s = String(value);
  if (!/^\d+$/.test(s)) return null;
  const feet = parseInt(s[0], 10);
  const inches = s.length > 1 ? parseInt(s.slice(1), 10) : 0;
  if (Number.isNaN(feet) || Number.isNaN(inches)) return null;
  return feet * 12 + inches;
}

/** Format a wingspan stored in compact feet-inch notation to a "2m18" string. */
export function formatWingspan(value: number | null | undefined): string | null {
  const inches = wingspanToInches(value);
  return inches == null ? null : formatHeight(inches);
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
