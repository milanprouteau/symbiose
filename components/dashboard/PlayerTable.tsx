"use client";

import React, { useState, useMemo } from "react";
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
  sis?: number | null;
  sisPx?: number | null;
  nbaProfile?: { label: string; confidence: number } | null;
};

type SortKey = keyof PlayerEntry;
type SortDir = "asc" | "desc";

const PROFILE_LABELS: Record<string, string> = {
  NBA_READY:    "NBA Ready",
  LATE_BLOOMER: "Late Bloomer",
  ROLE_PLAYER:  "Role Player",
};

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  NBA_READY: {
    color: "var(--color-primary-orange)",
    borderColor: "rgba(255,108,34,0.35)",
    background: "rgba(255,108,34,0.07)",
  },
  LATE_BLOOMER: {
    color: "var(--color-primary-yellow)",
    borderColor: "rgba(255,214,0,0.3)",
    background: "rgba(255,214,0,0.06)",
  },
  ROLE_PLAYER: {
    color: "var(--color-text-muted)",
    borderColor: "var(--color-border)",
    background: "transparent",
  },
};

const COL_WIDTH_MAP: Record<string, string> = {
  "w-44": "w44",
  "w-12": "w12",
  "w-28": "w28",
  "w-14": "w14",
};

const COLUMNS: { key: SortKey; label: string; w: string }[] = [
  { key: "name",     label: "Joueur",  w: "w44" },
  { key: "position", label: "Pos",     w: "w12" },
  { key: "team",     label: "Équipe",  w: "w28" },
  { key: "games",    label: "MJ",      w: "w12" },
  { key: "ppg",      label: "PPG",     w: "w14" },
  { key: "rpg",      label: "RPG",     w: "w14" },
  { key: "apg",      label: "APG",     w: "w14" },
  { key: "mpg",      label: "MPG",     w: "w14" },
  { key: "fgPct",    label: "FG%",     w: "w14" },
  { key: "threePct", label: "3P%",     w: "w14" },
  { key: "ftPct",    label: "FT%",     w: "w14" },
  { key: "usage",    label: "USG%",    w: "w14" },
  { key: "sis",      label: "SIS",     w: "w14" },
  { key: "sisPx",    label: "SIS-Px",  w: "w14" },
];

export default function PlayerTable({ players }: { players: PlayerEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("mockDraftPick");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (sortKey === "mockDraftPick") {
        const aPick = a.mockDraftPick ?? Infinity;
        const bPick = b.mockDraftPick ?? Infinity;
        return sortDir === "asc" ? aPick - bPick : bPick - aPick;
      }
      if (sortKey === "sis") {
        const aS = a.sis ?? -Infinity;
        const bS = b.sis ?? -Infinity;
        return sortDir === "asc" ? aS - bS : bS - aS;
      }
      if (sortKey === "sisPx") {
        const aS = a.sisPx ?? -Infinity;
        const bS = b.sisPx ?? -Infinity;
        return sortDir === "asc" ? aS - bS : bS - aS;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
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
              className={`${styles.rankHeader} ${sortKey === "mockDraftPick" ? styles.colHeaderActive : ""}`}
            >
              Prediction{arrow("mockDraftPick")}
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`${styles.colHeader} ${styles[col.w]} ${col.key === sortKey ? styles.colHeaderActive : ""}`}
              >
                {col.label}{arrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className={styles.bodyRow}>
              <td className={styles.rankCell}>
                {p.mockDraftPick ? `#${p.mockDraftPick}` : "—"}
              </td>
              {COLUMNS.map((col) => {
                const val = p[col.key];
                if (col.key === "name") {
                  const profile = p.nbaProfile;
                  const badgeStyle = profile ? BADGE_STYLES[profile.label] : undefined;
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                      <Link href={`/player/${p.id}`} className={styles.nameLink}>
                        {val as string}
                      </Link>
                      {/* {profile && badgeStyle && (
                        <span className={styles.profileBadge} style={badgeStyle}>
                          {PROFILE_LABELS[profile.label] ?? profile.label}
                        </span>
                      )} */}
                    </td>
                  );
                }
                if (col.key === "sis") {
                  const score = p.sis;
                  const color =
                    score == null ? undefined
                    : score >= 75 ? "var(--color-primary-orange)"
                    : score >= 65 ? "var(--color-primary-yellow)"
                    : score >= 55 ? "var(--color-text)"
                    : "var(--color-text-muted)";
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`} style={{ color, fontWeight: score != null && score >= 65 ? 600 : undefined }}>
                      {score != null ? score.toFixed(1) : "—"}
                    </td>
                  );
                }
                if (col.key === "sisPx") {
                  const score = p.sisPx;
                  const color =
                    score == null ? undefined
                    : score >= 60 ? "var(--color-primary-orange)"
                    : score >= 50 ? "var(--color-primary-yellow)"
                    : score >= 40 ? "var(--color-text)"
                    : "var(--color-text-muted)";
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`} style={{ color, fontWeight: score != null && score >= 50 ? 600 : undefined }}>
                      {score != null ? score.toFixed(1) : "—"}
                    </td>
                  );
                }
                const display = typeof val === "object" ? null : val;
                return (
                  <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                    {display}
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
