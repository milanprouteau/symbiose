import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import SimilarProfilesClient from "./SimilarProfilesClient";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Profils similaires",
  robots: { index: false, follow: false },
};

export type PlayerProfileData = {
  id: number;
  name: string;
  team: string;
  position: string;
  games: number;
  // Original 7
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  fieldGoalsPct: number;
  usage: number;
  // Enriched 6
  threePtPct: number;
  ftPct: number;
  topg: number;
  tsPct: number;
  orebPct: number;
  astToRatio: number;
};

export default async function SimilarProfilesPage() {
  const dir = path.join(process.cwd(), "data", "players");
  const indexRaw = await fs.readFile(path.join(dir, "index.json"), "utf-8");
  const index: { id: number }[] = JSON.parse(indexRaw);

  const players: PlayerProfileData[] = [];

  for (const entry of index) {
    try {
      const raw = await fs.readFile(path.join(dir, `${entry.id}.json`), "utf-8");
      const d = JSON.parse(raw);
      const ps = d.playerStats;
      const g = ps.games || 1;
      const normPct = (v: number) => (v != null && v < 1 ? +(v * 100).toFixed(1) : +(v ?? 0).toFixed(1));
      players.push({
        id: entry.id,
        name: ps.name,
        team: ps.team,
        position: ps.position ?? "—",
        games: ps.games,
        points:       +(ps.points / g).toFixed(1),
        rebounds:     +((ps.rebounds?.total ?? 0) / g).toFixed(1),
        assists:      +((ps.assists ?? 0) / g).toFixed(1),
        steals:       +((ps.steals ?? 0) / g).toFixed(1),
        blocks:       +((ps.blocks ?? 0) / g).toFixed(1),
        fieldGoalsPct: +(ps.fieldGoals?.pct ?? 0),
        usage:        +(ps.usage ?? 0),
        threePtPct:   +(ps.threePointFieldGoals?.pct ?? 0),
        ftPct:        +(ps.freeThrows?.pct ?? 0),
        topg:         +((ps.turnovers ?? 0) / g).toFixed(1),
        tsPct:        normPct(ps.trueShootingPct),
        orebPct:      +(ps.offensiveReboundPct ?? 0),
        astToRatio:   +(ps.assistsTurnoverRatio ?? 0),
      });
    } catch {
      // skip missing files
    }
  }

  // Sort by PPG desc by default
  players.sort((a, b) => b.points - a.points);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profils similaires</h1>
        <p className={styles.subtitle}>
          {players.length} joueurs · Pondérez les stats pour affiner les comparaisons
        </p>
      </header>
      <SimilarProfilesClient players={players} />
    </div>
  );
}
