"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import RadarChart from "@/components/dashboard/RadarChart";
import type { RadarPlayer } from "@/components/dashboard/RadarChart";
import type { PlayerDataBundle, PlayerSeasonStats } from "@/types/stats";
import styles from "./CompareClient.module.scss";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  player1: PlayerDataBundle | null;
  player2: PlayerDataBundle | null;
  id1: string;
  id2: string;
  allPlayers: IndexEntry[];
};

function toRadar(ps: PlayerSeasonStats, color: string): RadarPlayer {
  return {
    name: ps.name,
    color,
    values: {
      fg: ps.fieldGoals.pct,
      three: ps.threePointFieldGoals.pct,
      ft: ps.freeThrows.pct,
      ts: ps.trueShootingPct < 1 ? ps.trueShootingPct * 100 : ps.trueShootingPct,
      usage: ps.usage,
    },
  };
}

type StatRow = {
  label: string;
  v1: string | number;
  v2: string | number;
  better?: 1 | 2 | null;
};

function buildStatRows(
  p1: PlayerSeasonStats,
  p2: PlayerSeasonStats
): StatRow[] {
  const cmp = (a: number, b: number): 1 | 2 | null =>
    a > b ? 1 : b > a ? 2 : null;

  const ppg1 = p1.points / (p1.games || 1);
  const ppg2 = p2.points / (p2.games || 1);
  const rpg1 = p1.rebounds.total / (p1.games || 1);
  const rpg2 = p2.rebounds.total / (p2.games || 1);
  const apg1 = p1.assists / (p1.games || 1);
  const apg2 = p2.assists / (p2.games || 1);
  const mpg1 = p1.minutes / (p1.games || 1);
  const mpg2 = p2.minutes / (p2.games || 1);

  return [
    { label: "Games", v1: p1.games, v2: p2.games, better: null },
    { label: "PPG", v1: ppg1.toFixed(1), v2: ppg2.toFixed(1), better: cmp(ppg1, ppg2) },
    { label: "RPG", v1: rpg1.toFixed(1), v2: rpg2.toFixed(1), better: cmp(rpg1, rpg2) },
    { label: "APG", v1: apg1.toFixed(1), v2: apg2.toFixed(1), better: cmp(apg1, apg2) },
    { label: "MPG", v1: mpg1.toFixed(1), v2: mpg2.toFixed(1), better: null },
    { label: "FG%", v1: `${p1.fieldGoals.pct}%`, v2: `${p2.fieldGoals.pct}%`, better: cmp(p1.fieldGoals.pct, p2.fieldGoals.pct) },
    { label: "3PT%", v1: `${p1.threePointFieldGoals.pct}%`, v2: `${p2.threePointFieldGoals.pct}%`, better: cmp(p1.threePointFieldGoals.pct, p2.threePointFieldGoals.pct) },
    { label: "FT%", v1: `${p1.freeThrows.pct}%`, v2: `${p2.freeThrows.pct}%`, better: cmp(p1.freeThrows.pct, p2.freeThrows.pct) },
    { label: "TS%", v1: `${(p1.trueShootingPct < 1 ? p1.trueShootingPct * 100 : p1.trueShootingPct).toFixed(1)}%`, v2: `${(p2.trueShootingPct < 1 ? p2.trueShootingPct * 100 : p2.trueShootingPct).toFixed(1)}%`, better: cmp(p1.trueShootingPct, p2.trueShootingPct) },
    { label: "Usage", v1: `${p1.usage}%`, v2: `${p2.usage}%`, better: null },
    { label: "Off. Rating", v1: p1.offensiveRating, v2: p2.offensiveRating, better: cmp(p1.offensiveRating, p2.offensiveRating) },
    { label: "Def. Rating", v1: p1.defensiveRating, v2: p2.defensiveRating, better: cmp(p2.defensiveRating, p1.defensiveRating) },
  ];
}

function PlayerSelect({
  players,
  value,
  onChange,
  label,
}: {
  players: IndexEntry[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className={styles.selectGroup}>
      <label className={styles.label}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Select a player</option>
        {players.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name} — {p.team}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CompareClient({
  player1,
  player2,
  id1,
  id2,
  allPlayers,
}: Props) {
  const router = useRouter();
  const [sel1, setSel1] = useState(id1);
  const [sel2, setSel2] = useState(id2);

  const navigate = (newId1: string, newId2: string) => {
    if (newId1 && newId2) {
      router.push(`/compare-tool/${newId1}/${newId2}`);
    }
  };

  const handleSel1 = (v: string) => {
    setSel1(v);
    navigate(v, sel2);
  };
  const handleSel2 = (v: string) => {
    setSel2(v);
    navigate(sel1, v);
  };

  const radarPlayers: RadarPlayer[] = [];
  if (player1) radarPlayers.push(toRadar(player1.playerStats, "#FF8C42"));
  if (player2) radarPlayers.push(toRadar(player2.playerStats, "#3B6EC9"));

  const hasComparison = player1 && player2;
  const statRows = hasComparison
    ? buildStatRows(player1.playerStats, player2.playerStats)
    : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Compare Players
      </h1>

      {/* Selects */}
      <div className={styles.selectGrid}>
        <PlayerSelect
          players={allPlayers}
          value={sel1}
          onChange={handleSel1}
          label="Player 1"
        />
        <PlayerSelect
          players={allPlayers}
          value={sel2}
          onChange={handleSel2}
          label="Player 2"
        />
      </div>

      {hasComparison ? (
        <div className={styles.content}>
          {/* Radar Chart */}
          <div className={styles.radarWrapper}>
            <RadarChart players={radarPlayers} size={320} />
          </div>

          {/* Stats comparison table */}
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.thPlayer1}>
                  {player1.playerStats.name}
                </th>
                <th className={styles.thStat}>
                  Stat
                </th>
                <th className={styles.thPlayer2}>
                  {player2.playerStats.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {statRows.map((row) => (
                <tr key={row.label} className={styles.dataRow}>
                  <td
                    className={`${styles.tdRight} ${
                      row.better === 1 ? styles.better : styles.notBetter
                    }`}
                  >
                    {row.v1}
                  </td>
                  <td className={styles.tdCenter}>
                    {row.label}
                  </td>
                  <td
                    className={`${styles.tdLeft} ${
                      row.better === 2 ? styles.better : styles.notBetter
                    }`}
                  >
                    {row.v2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.emptyState}>
          {sel1 && sel2
            ? "Loading players…"
            : "Select two players to compare"}
        </div>
      )}
    </div>
  );
}
