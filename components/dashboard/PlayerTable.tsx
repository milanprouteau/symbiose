"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./PlayerTable.module.scss";

export type PlayerEntry = {
  id: number;
  name: string;
  team: string;
  conference: string;
  position: string;
  games: number;
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  usage: number;
  mockDraftPick?: number;
};

type SortKey = keyof PlayerEntry;
type SortDir = "asc" | "desc";

const COL_WIDTH_MAP: Record<string, string> = {
  "w-44": "w44",
  "w-12": "w12",
  "w-28": "w28",
  "w-14": "w14",
};

const COLUMNS: { key: SortKey; label: string; w: string }[] = [
  { key: "name",     label: "Joueur",  w: "w44" },
  { key: "position", label: "Pos",     w: "w12" },
  { key: "team",     label: "Équipe",    w: "w28" },
  { key: "games",    label: "MJ",      w: "w12" },
  { key: "ppg",      label: "PPG",     w: "w14" },
  { key: "rpg",      label: "RPG",     w: "w14" },
  { key: "apg",      label: "APG",     w: "w14" },
  { key: "mpg",      label: "MPG",     w: "w14" },
  { key: "fgPct",    label: "FG%",     w: "w14" },
  { key: "threePct", label: "3P%",     w: "w14" },
  { key: "ftPct",    label: "FT%",     w: "w14" },
  { key: "usage",    label: "USG%",    w: "w14" },
];

export default function PlayerTable({ players }: { players: PlayerEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("mockDraftPick");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      
      // Special handling for mockDraftPick - players without picks go to the end
      if (sortKey === "mockDraftPick") {
        const aPick = a.mockDraftPick ?? Infinity;
        const bPick = b.mockDraftPick ?? Infinity;
        return sortDir === "asc" ? aPick - bPick : bPick - aPick;
      }
      
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [players, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "team" || key === "position" || key === "mockDraftPick" ? "asc" : "desc");
    }
  }

  function arrow(key: SortKey) {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th
              onClick={() => handleSort("mockDraftPick")}
              className={`${styles.rankHeader} ${
                sortKey === "mockDraftPick" ? styles.colHeaderActive : ""
              }`}
            >
              Prediction{arrow("mockDraftPick")}
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`${styles.colHeader} ${styles[col.w]} ${
                  col.key === sortKey ? styles.colHeaderActive : ""
                }`}
              >
                {col.label}{arrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr
              key={p.id}
              className={styles.bodyRow}
            >
              <td className={styles.rankCell}>
                {p.mockDraftPick ? `#${p.mockDraftPick}` : "—"}
              </td>
              {COLUMNS.map((col) => {
                const val = p[col.key];
                if (col.key === "name") {
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                      <Link
                        href={`/player/${p.id}`}
                        className={styles.nameLink}
                      >
                        {val as string}
                      </Link>
                    </td>
                  );
                }
                return (
                  <td
                    key={col.key}
                    className={`${styles.cell} ${styles[col.w]}`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
