"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { GameLogEntry } from "@/types/stats";
import styles from "./GameLog.module.scss";

type Props = {
  gameLog: GameLogEntry[];
};

const FILTERS = [5, 10, 20] as const;
type Filter = (typeof FILTERS)[number];

const SEASON_FILTERS = ["all", "regular", "postseason"] as const;
type SeasonFilter = (typeof SEASON_FILTERS)[number];
const SEASON_LABELS: Record<SeasonFilter, string> = {
  all: "Tous",
  regular: "Saison",
  postseason: "Playoffs",
};

const STAT_LINES: { key: keyof GameLogEntry; label: string; color: string }[] = [
  { key: "points",   label: "PTS", color: "#FF8C42" },
  { key: "rebounds",  label: "REB", color: "#74d0ed" },
  { key: "assists",   label: "AST", color: "#9b59b6" },
];

export default function GameLog({ gameLog }: Props) {
  const [filter, setFilter] = useState<Filter>(10);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(STAT_LINES.map((s) => s.key))
  );

  // Filter by season type, take last N, sorted newest-first for table
  const games = useMemo(() => {
    const filtered = seasonFilter === "all"
      ? gameLog
      : gameLog.filter((g) => (g.seasonType ?? "regular") === seasonFilter);
    const sorted = [...filtered].sort((a, b) =>
      (a.date ?? "") > (b.date ?? "") ? 1 : -1
    );
    return sorted.slice(-filter).reverse();
  }, [gameLog, filter, seasonFilter]);

  const totalFiltered = useMemo(() => {
    if (seasonFilter === "all") return gameLog.length;
    return gameLog.filter((g) => (g.seasonType ?? "regular") === seasonFilter).length;
  }, [gameLog, seasonFilter]);

  // Chart data in chronological order (oldest → newest)
  const chartData = useMemo(
    () =>
      [...games].reverse().map((g) => ({
        label: g.opponent ? `${g.isHome ? "vs" : "@"} ${g.opponent}` : g.date ?? "",
        ...g,
      })),
    [games]
  );

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!gameLog || gameLog.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.placeholder}>Aucune donnée de game log disponible.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Historique des matchs <span className={styles.count}>({games.length}/{totalFiltered})</span></h2>
        <div className={styles.filtersRow}>
          <div className={styles.filters}>
            {SEASON_FILTERS.map((sf) => (
              <button
                key={sf}
                className={`${styles.filterBtn} ${seasonFilter === sf ? styles.filterActive : ""}`}
                onClick={() => setSeasonFilter(sf)}
              >
                {SEASON_LABELS[sf]}
              </button>
            ))}
          </div>
          <div className={styles.filters}>
            {FILTERS.map((n) => (
              <button
                key={n}
                className={`${styles.filterBtn} ${filter === n ? styles.filterActive : ""}`}
                onClick={() => setFilter(n)}
              >
                {n} matchs
              </button>
            ))}
          </div>
        </div>
      </div>
{/* Stats Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thLeft}>Date</th>
              <th className={styles.thLeft}>Adversaire</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>TO</th>
              <th>FG</th>
              <th>3PT</th>
              <th>FT</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i} className={styles.row}>
                <td className={styles.tdLeft}>{g.date?.slice(5) ?? "—"}</td>
                <td className={styles.tdLeft}>
                  {g.isHome ? "vs" : "@"} {g.opponent ?? "—"}
                </td>
                <td>{g.minutes}</td>
                <td className={styles.highlight}>{g.points}</td>
                <td>{g.rebounds}</td>
                <td>{g.assists}</td>
                <td>{g.steals}</td>
                <td>{g.blocks}</td>
                <td>{g.turnovers}</td>
                <td>
                  {g.fgMade}/{g.fgAttempted}
                </td>
                <td>
                  {g.threeMade}/{g.threeAttempted}
                </td>
                <td>
                  {g.ftMade}/{g.ftAttempted}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Line Chart */}
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#444" }}
              tickLine={false}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "#888", fontSize: 11 }}
              axisLine={{ stroke: "#444" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a2e",
                border: "1px solid #333",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Legend
              onClick={(e) => toggleLine(e.dataKey as string)}
              wrapperStyle={{ cursor: "pointer", fontSize: 12 }}
            />
            {STAT_LINES.map((sl) =>
              visibleLines.has(sl.key) ? (
                <Line
                  key={sl.key}
                  type="monotone"
                  dataKey={sl.key}
                  name={sl.label}
                  stroke={sl.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: sl.color }}
                  activeDot={{ r: 5 }}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
