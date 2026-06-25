"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./PlayerTable.module.scss";
import { teamByPick } from "@/lib/draftResults2026";
import { NBA_TEAMS, teamLogo, type TeamAbbr } from "@/lib/nbaTeams";

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
  threePct: number | null;
  ftPct: number;
  usage: number;
  mockDraftPick?: number;
  sis?: number | null;
  sisPx?: number | null;
  nbaProfile?: { label: string; confidence: number } | null;
  isIntl?: boolean;
};

type SortKey = keyof PlayerEntry;
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; w: string; tooltip?: string }[] = [
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
  { key: "sis",      label: "SIS",     w: "w14", tooltip: "SIS — Symbiose Indice : impact actuel du joueur, sur 100." },
  { key: "sisPx",    label: "SIS-Px",  w: "w14", tooltip: "SIS-Px — Symbiose Indice Potentiel : projection vers la NBA, sur 100." },
];

export default function PlayerTable({ players }: { players: PlayerEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("mockDraftPick");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeTip, setActiveTip] = useState<SortKey | null>(null);

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
              Ordre{arrow("mockDraftPick")}
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`${styles.colHeader} ${styles[col.w]} ${col.key === sortKey ? styles.colHeaderActive : ""}`}
              >
                <span className={col.tooltip ? styles.headerInner : undefined}>
                  {col.label}{arrow(col.key)}
                  {col.tooltip && (
                    <span className={styles.infoWrap} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={styles.infoBtn}
                        onClick={() => {
                          if (window.matchMedia("(hover: none)").matches)
                            setActiveTip((t) => (t === col.key ? null : col.key));
                        }}
                        aria-label={`Définition ${col.label}`}
                        aria-expanded={activeTip === col.key}
                      >i</button>
                      <span className={`${styles.headerTooltip} ${activeTip === col.key ? styles.headerTooltipOpen : ""}`}>
                        {col.tooltip}
                      </span>
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const teamAbbr = p.mockDraftPick ? teamByPick[p.mockDraftPick] : undefined;
            return (
            <tr key={p.id} className={styles.bodyRow}>
              <td className={styles.rankCell}>
                <span className={styles.rankInner}>
                  {teamAbbr ? <TeamBadge team={teamAbbr} /> : null}
                  <span className={styles.pickNumber}>
                    {p.mockDraftPick ? `#${p.mockDraftPick}` : "—"}
                  </span>
                </span>
              </td>
              {COLUMNS.map((col) => {
                const val = p[col.key];
                if (col.key === "name") {
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                      {p.isIntl ? (
                        <span className={styles.nameIntl}>{val as string}</span>
                      ) : (
                        <Link href={`/player/${p.id}`} className={styles.nameLink}>
                          {val as string}
                        </Link>
                      )}
                    </td>
                  );
                }
                // Joueurs non-NCAA : stats pro de base affichées, le reste en "—"
                if (p.isIntl) {
                  let content: React.ReactNode;
                  if (col.key === "usage" || col.key === "sis" || col.key === "sisPx") {
                    content = "—";
                  } else if (col.key === "threePct") {
                    content = p.threePct == null ? "—" : p.threePct;
                  } else {
                    content = typeof val === "object" ? "" : (val as React.ReactNode);
                  }
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                      {content}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamBadge({ team }: { team: TeamAbbr }) {
  const t = NBA_TEAMS[team];
  return (
    <span className={styles.teamBadge} title={`${t.city} ${t.name}`}>
      <Image
        src={teamLogo(team)}
        alt={t.abbr}
        width={20}
        height={20}
        className={styles.teamLogo}
      />
    </span>
  );
}
