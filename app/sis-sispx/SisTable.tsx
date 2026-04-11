"use client";

import { useState, useMemo } from "react";
import styles from "./page.module.scss";

const PAGE_SIZE = 50;

export type SisRow = {
  id: number;
  name: string;
  team: string;
  year: number | null;       // null = prospect 2026
  overall: number | null;
  draftTeam: string | null;
  position: string | null;
  games: number;
  ppg: number;
  rpg: number;
  apg: number;
  usage: number;
  sis: number;
  sisPx: number;
};

type SortKey = keyof SisRow;
type SortDir = "asc" | "desc";

const COLS: { key: SortKey; label: string; num?: boolean }[] = [
  { key: "name",     label: "Joueur" },
  { key: "year",     label: "Année",    num: true },
  { key: "overall",  label: "Pick",     num: true },
  { key: "position", label: "Poste" },
  { key: "team",     label: "Équipe" },
  { key: "games",    label: "G",        num: true },
  { key: "ppg",      label: "PPG",      num: true },
  { key: "rpg",      label: "RPG",      num: true },
  { key: "apg",      label: "APG",      num: true },
  { key: "usage",    label: "USG%",     num: true },
  { key: "sis",      label: "SIS",      num: true },
  { key: "sisPx",    label: "SIS-Px",   num: true },
];

function sisColor(val: number): string {
  if (val >= 70) return "var(--color-secondary-green)";
  if (val >= 60) return "var(--color-primary-yellow)";
  if (val >= 50) return "var(--color-primary-white)";
  return "var(--color-secondary-beige)";
}

export default function SisTable({ rows }: { rows: SisRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("sisPx");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const years = useMemo(() => {
    const s = new Set(rows.map((r) => r.year ?? 2026));
    return Array.from(s).sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    let data = rows.filter((r) => {
      const q = search.toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.team.toLowerCase().includes(q)) return false;
      if (yearFilter !== "all" && String(r.year ?? 2026) !== yearFilter) return false;
      return true;
    });

    data = [...data].sort((a, b) => {
      const av = a[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity);
      const bv = b[sortKey] ?? (sortDir === "asc" ? Infinity : -Infinity);
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [rows, sortKey, sortDir, search, yearFilter]);


  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  return (
    <div className={styles.tableWrap}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className={styles.yearSelect}
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setPage(0); }}
        >
          <option value="all">Toutes les années</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y === null ? "2026 (prospects)" : y === 2026 ? "2026 (prospects)" : y}
            </option>
          ))}
        </select>
        <span className={styles.count}>{filtered.length} joueurs</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`${styles.th} ${c.num ? styles.num : ""} ${sortKey === c.key ? styles.sorted : ""}`}
                onClick={() => toggleSort(c.key)}
              >
                {c.label}
                <span className={styles.arrow}>
                  {sortKey === c.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map((r) => (
            <tr key={`${r.id}-${r.year}`} className={styles.row}>
              <td className={styles.name}>{r.name}</td>
              <td className={`${styles.td} ${styles.num}`}>
                <span className={r.year === null ? styles.prospect : styles.year}>
                  {r.year ?? "2026 ★"}
                </span>
              </td>
              <td className={`${styles.td} ${styles.num}`}>
                {r.overall != null ? `#${r.overall}` : "—"}
              </td>
              <td className={styles.td}>{r.position ?? "—"}</td>
              <td className={styles.td}>{r.team}</td>
              <td className={`${styles.td} ${styles.num}`}>{r.games}</td>
              <td className={`${styles.td} ${styles.num}`}>{r.ppg.toFixed(1)}</td>
              <td className={`${styles.td} ${styles.num}`}>{r.rpg.toFixed(1)}</td>
              <td className={`${styles.td} ${styles.num}`}>{r.apg.toFixed(1)}</td>
              <td className={`${styles.td} ${styles.num}`}>{r.usage.toFixed(1)}</td>
              <td className={`${styles.td} ${styles.num} ${styles.score}`} style={{ color: sisColor(r.sis) }}>
                {r.sis.toFixed(1)}
              </td>
              <td className={`${styles.td} ${styles.num} ${styles.score}`} style={{ color: sisColor(r.sisPx) }}>
                {r.sisPx.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ←
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {totalPages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
