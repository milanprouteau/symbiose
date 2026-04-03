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
