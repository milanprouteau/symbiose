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
  Brush,
  ResponsiveContainer,
} from "recharts";
import type { GameLogEntry } from "@/types/stats";
import styles from "./GameLog.module.scss";

type Props = {
  gameLog: GameLogEntry[];
};

const SEASON_FILTERS = ["all", "regular", "postseason"] as const;
type SeasonFilter = (typeof SEASON_FILTERS)[number];
const SEASON_LABELS: Record<SeasonFilter, string> = {
  all: "Tous",
  regular: "Saison",
  postseason: "Playoffs",
};

const COUNT_STEPS = [5, 10, 20, 30] as const;

const STAT_LINES: { key: keyof GameLogEntry; label: string; color: string }[] = [
  { key: "points",   label: "PTS", color: "#FF8C42" },
  { key: "rebounds", label: "REB", color: "#74d0ed" },
  { key: "assists",  label: "AST", color: "#b7a3d2" },
];

const PX_PER_GAME = 55;

export default function GameLog({ gameLog }: Props) {
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [countLimit, setCountLimit] = useState<number | null>(null);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(STAT_LINES.map((s) => s.key))
  );
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number } | null>(null);

  // All games for this season filter, sorted chronologically
  const chartData = useMemo(() => {
    const filtered = seasonFilter === "all"
      ? gameLog
      : gameLog.filter((g) => (g.seasonType ?? "regular") === seasonFilter);
    return [...filtered]
      .sort((a, b) => ((a.date ?? "") > (b.date ?? "") ? 1 : -1))
      .map((g) => {
        const dateShort = g.date ? g.date.slice(5).replace("-", "/") : "";
        const opponent = g.opponent ? `${g.isHome ? "vs" : "@"} ${g.opponent}` : "";
        return {
          label: opponent ? `${dateShort} · ${opponent}` : (g.date ?? ""),
          opponentLabel: opponent || (g.date ?? ""),
          ...g,
        };
      });
  }, [gameLog, seasonFilter]);

  // Count-limited slice (last N games)
  const limitedData = useMemo(
    () => (countLimit ? chartData.slice(-countLimit) : chartData),
    [chartData, countLimit]
  );

  // Available count options: only steps strictly less than total
  const availableSteps = COUNT_STEPS.filter((n) => n < chartData.length);

  const defaultStart = 0;
  const defaultEnd = limitedData.length - 1;
  const startIdx = brushRange?.startIndex ?? defaultStart;
  const endIdx   = brushRange?.endIndex   ?? defaultEnd;

  const visibleData = limitedData.slice(startIdx, endIdx + 1);
  const chartMinWidth = Math.max(300, visibleData.length * PX_PER_GAME);

  // Table: newest first, synced with limitedData
  const tableGames = useMemo(() => [...limitedData].reverse(), [limitedData]);

  const toggleLine = (key: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    if (range.startIndex !== undefined && range.endIndex !== undefined) {
      let { startIndex, endIndex } = range;
      if (endIndex - startIndex < 1) {
        if (startIndex > 0) startIndex = endIndex - 1;
        else endIndex = startIndex + 1;
      }
      setBrushRange({ startIndex, endIndex });
    }
  };

  const handleSeasonChange = (sf: SeasonFilter) => {
    setSeasonFilter(sf);
    setCountLimit(null);
    setBrushRange(null);
  };

  const handleCountChange = (n: number | null) => {
    setCountLimit(n);
    setBrushRange(null);
  };

  if (!gameLog || gameLog.length <= 1) return null;

  const showChart = limitedData.length > 1;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Historique des matchs{" "}
          <span className={styles.count}>({limitedData.length})</span>
        </h2>
        <div className={styles.filters}>
          {SEASON_FILTERS.map((sf) => (
            <button
              key={sf}
              className={`${styles.filterBtn} ${seasonFilter === sf ? styles.filterActive : ""}`}
              onClick={() => handleSeasonChange(sf)}
            >
              {SEASON_LABELS[sf]}
            </button>
          ))}
        </div>
      </div>

      {/* Count filter — only shown if there are meaningful options */}
      {availableSteps.length > 0 && (
        <div className={styles.countFilters}>
          {availableSteps.map((n) => (
            <button
              key={n}
              className={`${styles.filterBtn} ${countLimit === n ? styles.filterActive : ""}`}
              onClick={() => handleCountChange(countLimit === n ? null : n)}
            >
              {n}
            </button>
          ))}
          <button
            className={`${styles.filterBtn} ${countLimit === null ? styles.filterActive : ""}`}
            onClick={() => handleCountChange(null)}
          >
            Tous
          </button>
        </div>
      )}

      {/* Stats Table — synced with limitedData */}
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
            {tableGames.map((g, i) => (
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
                <td>{g.fgMade}/{g.fgAttempted}</td>
                <td>{g.threeMade}/{g.threeAttempted}</td>
                <td>{g.ftMade}/{g.ftAttempted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Main chart */}
      {showChart && (
        <div className={styles.chartWrapper}>
          <div className={styles.chartScroll}>
            <div style={{ width: chartMinWidth, height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visibleData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#888", fontSize: 11 }}
                    axisLine={{ stroke: "#444" }}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tickFormatter={(val: string) =>
                      val.includes(" · ") ? val.split(" · ")[1] : val
                    }
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
        </div>
      )}

      {/* Timeline brush */}
      {showChart && (
        <div className={styles.timelineWrapper}>
          <p className={styles.timelineLabel}>Timeline</p>
          <ResponsiveContainer width="100%" height={35}>
            <LineChart data={limitedData} margin={{ top: 2, right: 20, left: 40, bottom: 2 }}>
              {STAT_LINES.map((sl) => (
                <Line
                  key={sl.key}
                  dataKey={sl.key}
                  stroke={sl.color}
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              <Brush
                dataKey="label"
                height={35}
                fill="#1e2128"
                travellerWidth={12}
                tickFormatter={() => ""}
                startIndex={startIdx}
                endIndex={endIdx}
                onChange={handleBrushChange}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
