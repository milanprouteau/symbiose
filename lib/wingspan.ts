import { promises as fs } from "fs";
import path from "path";

/**
 * Map of player ID → wingspan in compact feet-inch notation.
 * e.g. { "53": 72 } means player 53 has a 7'2" wingspan.
 *
 * Source of truth: data/players/wingspan.json (manually curated).
 */
export type WingspanMap = Record<string, number>;

let cached: WingspanMap | null = null;

/**
 * Load the manual wingspan map from disk (server-only, cached in-process).
 * Returns an empty object if the file is missing or unreadable.
 */
export async function loadWingspans(): Promise<WingspanMap> {
  if (cached) return cached;
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", "wingspan.json"),
      "utf-8",
    );
    const parsed = JSON.parse(raw) as WingspanMap;
    cached = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    cached = {};
  }
  return cached;
}

/** Lookup a single player's wingspan (compact notation) from the map. */
export function getWingspan(map: WingspanMap, id: number | string): number | null {
  const value = map[String(id)];
  return typeof value === "number" ? value : null;
}
