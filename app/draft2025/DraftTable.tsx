"use client";

import { useState, useMemo } from "react";
import styles from "./DraftTable.module.scss";

export type DraftRow = {
  overall: number;
  name: string;
  pos: string;
  posGroup: string;
  seasons: number;
  sisPxPred: number;
  sisPxReal: number;
  ecart: number;
  mpgPred: number;
  mpgReal: number;
  ptsPred: number;
  ptsReal: number;
  rebPred: number;
  rebReal: number;
  astPred: number;
  astReal: number;
  fgPred: number;
  fgReal: number;
};

type SortKey = keyof DraftRow;
type SortDir = "asc" | "desc";

const COLS: { key: SortKey; label: string }[] = [
  { key: "overall",   label: "Pick" },
  { key: "name",      label: "Joueur" },
  { key: "pos",       label: "Pos" },
  { key: "sisPxPred", label: "SisPx prédit" },
  { key: "sisPxReal", label: "SisPx réel" },
  { key: "ecart",     label: "Écart" },
  { key: "mpgPred",   label: "MPG prédit" },
  { key: "mpgReal",   label: "MPG réel" },
  { key: "ptsPred",   label: "PTS/36 p" },
  { key: "ptsReal",   label: "PTS/36 r" },
  { key: "rebPred",   label: "REB/36 p" },
  { key: "rebReal",   label: "REB/36 r" },
  { key: "astPred",   label: "AST/36 p" },
  { key: "astReal",   label: "AST/36 r" },
  { key: "fgPred",    label: "FG% p" },
  { key: "fgReal",    label: "FG% r" },
];

function ecartIcon(ecart: number) {
  if (ecart > 20)  return { icon: "🔴", label: "Surestimé" };
  if (ecart > 8)   return { icon: "🟠", label: "Léger excès" };
  if (ecart > -8)  return { icon: "🟡", label: "Précis" };
  if (ecart > -20) return { icon: "🟢", label: "Sous-estimé" };
  return { icon: "💎", label: "Révélation" };
}

function ecartColor(ecart: number) {
  if (ecart > 20)  return "#ff4d4d";
  if (ecart > 8)   return "#ff9c4d";
  if (ecart > -8)  return "#ffd84d";
  if (ecart > -20) return "#62E862";
  return "#74D0ED";
}

type Props = { data: DraftRow[]; year: number; mae: number; corr: number };

export default function DraftTable({ data, year, mae, corr }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [posFilter, setPosFilter] = useState<string>("all");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "overall" ? "asc" : "desc");
    }
  }

  const rows = useMemo(() => {
    const filtered = posFilter === "all" ? data : data.filter((r) => r.posGroup === posFilter);
    return [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, posFilter]);

  const precise = data.filter((r) => Math.abs(r.ecart) <= 8).length;
  const under   = data.filter((r) => r.ecart < -8).length;
  const over    = data.filter((r) => r.ecart > 8).length;

  const saison = year === 2025
    ? `${year}–${String(year + 1).slice(2)} (rookie en cours)`
    : `${year}–${String(year + 1).slice(2)} (saison rookie)`;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Draft {year} — SisPx prédit vs réel</h1>
        <p className={styles.subtitle}>Saison évaluée : {saison}</p>
        <div className={styles.meta}>
          <span className={styles.metaItem}>MAE <strong>{mae}</strong> pts</span>
          <span className={styles.metaItem}>Corrélation <strong>{corr}</strong></span>
          <span className={styles.metaItem}>🟡 Précis (±8) <strong>{precise}/{data.length}</strong></span>
          <span className={styles.metaItem}>🟢 Sous-estimés <strong>{under}/{data.length}</strong></span>
          <span className={styles.metaItem}>🔴 Surestimés <strong>{over}/{data.length}</strong></span>
        </div>
      </div>

      <div className={styles.filters}>
        {["all", "Guard", "Forward", "Center"].map((g) => (
          <button
            key={g}
            className={`${styles.filterBtn} ${posFilter === g ? styles.active : ""}`}
            onClick={() => setPosFilter(g)}
          >
            {g === "all" ? "Tous" : `${g}s`}
          </button>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {COLS.map((col) => (
                <th
                  key={col.key}
                  className={`${styles.th} ${sortKey === col.key ? styles.sorted : ""}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className={styles.arrow}>{sortDir === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const { icon } = ecartIcon(r.ecart);
              const color = ecartColor(r.ecart);
              const ecartStr = r.ecart > 0 ? `+${r.ecart}` : String(r.ecart);
              return (
                <tr key={r.overall} className={styles.tr}>
                  <td className={styles.tdPick}>#{r.overall}</td>
                  <td className={styles.tdName}>
                    {r.name}
                    {r.seasons > 1 && <span className={styles.seasons}> ×{r.seasons}</span>}
                  </td>
                  <td className={styles.tdPos}>{r.pos}</td>
                  <td className={styles.tdNum}>{r.sisPxPred}</td>
                  <td className={styles.tdNum}><strong>{r.sisPxReal}</strong></td>
                  <td className={styles.tdEcart}>
                    <span className={styles.ecartBadge} style={{ color }}>
                      {icon} {ecartStr}
                    </span>
                  </td>
                  <td className={styles.tdNum}>{r.mpgPred}</td>
                  <td className={`${styles.tdNum} ${Math.abs(r.mpgReal - r.mpgPred) > 6 ? styles.highlight : ""}`}>{r.mpgReal}</td>
                  <td className={styles.tdNum}>{r.ptsPred}</td>
                  <td className={styles.tdNum}>{r.ptsReal}</td>
                  <td className={styles.tdNum}>{r.rebPred}</td>
                  <td className={styles.tdNum}>{r.rebReal}</td>
                  <td className={styles.tdNum}>{r.astPred}</td>
                  <td className={styles.tdNum}>{r.astReal}</td>
                  <td className={styles.tdNum}>{r.fgPred}%</td>
                  <td className={styles.tdNum}>{r.fgReal}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <span>💎 Révélation (&lt;−20)</span>
        <span>🟢 Sous-estimé (−20 à −8)</span>
        <span>🟡 Précis (±8)</span>
        <span>🟠 Léger excès (+8 à +20)</span>
        <span>🔴 Surestimé (&gt;+20)</span>
        <span className={styles.highlightLegend}>■ MPG réel très différent du prédit</span>
      </div>
      <p className={styles.note}>
        Le modèle cible le <strong>plafond à 3 saisons</strong> — comparer à 1 saison rookie introduit du bruit. Un grand écart est souvent lié aux minutes imprévues.
      </p>
    </div>
  );
}
