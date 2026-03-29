"use client";

import type { Player } from "@/types/player";
import RadarChart, { type RadarAxis, type RadarPlayer } from "./RadarChart";
import styles from "./Defensive.module.scss";

const DEFENSIVE_AXES: RadarAxis[] = [
  { key: "rpg",             label: "REB",    max: 12 },
  { key: "bpg",             label: "BLK",    max: 3 },
  { key: "spg",             label: "STL",    max: 3 },
  { key: "defensiveRating", label: "DEF RTG", max: 120 },
];

type Props = {
  player: Player;
  radarPlayer: RadarPlayer;
};

export default function Defensive({ player: p, radarPlayer }: Props) {
  const stats = [
    { label: "Rebonds / match",       value: p.rpg },
    { label: "Contres / match",       value: p.bpg },
    { label: "Interceptions / match", value: p.spg },
    { label: "Defensive Rating",      value: p.defensiveRating.toFixed(1) },
    { label: "Reb. Défensifs",        value: p.reboundsDefensive },
    { label: "Reb. Offensifs",        value: p.reboundsOffensive },
    { label: "Off. Reb. %",           value: `${p.offensiveReboundPct}%` },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.radarCol}>
          <RadarChart players={[radarPlayer]} axes={DEFENSIVE_AXES} />
        </div>
        <div className={styles.statsCol}>
          <ul className={styles.statsList}>
            {stats.map((s) => (
              <li key={s.label} className={styles.statItem}>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statValue}>{s.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
