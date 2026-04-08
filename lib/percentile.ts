export type NcaaAverages = {
  season: number;
  qualifiedCount: number;
  avgTsPct: number;
  sorted: Record<string, number[]>;
};

/**
 * Returns raw percentile rank 0–100 (position in ascending sorted array).
 * 0 = lowest value, 100 = highest value.
 *
 * For higher-is-better stats: topPct = 100 - rawPct
 * For lower-is-better stats:  topPct = rawPct
 */
export function getRawPercentile(
  value: number,
  key: string,
  averages: NcaaAverages,
): number | null {
  const arr = averages.sorted[key];
  if (!arr || arr.length === 0) return null;

  // Binary search — find insertion point in sorted ascending array
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < value) lo = mid + 1;
    else hi = mid;
  }

  return Math.round((lo / arr.length) * 100);
}

/**
 * Compute TS+ = player TS% − NCAA avg TS%.
 * Positive = above average (e.g. +8.9%), negative = below average.
 */
export function calcTsPlus(tsPct: number, averages: NcaaAverages): number {
  return +(tsPct - averages.avgTsPct).toFixed(1);
}
