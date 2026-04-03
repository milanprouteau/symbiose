import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import PlayerTable, { type PlayerEntry } from "@/components/dashboard/PlayerTable";
import { mockDraftPredictions } from "@/lib/mockDraftPredictions";
import { calculateSIS } from "@/lib/sisScore";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Joueurs — Stats Basketball Universitaire",
  description: "Retrouvez les stats complètes de tous les joueurs de basketball universitaire suivis par SymbioseBB.",
  openGraph: {
    title: "Joueurs — SymbioseBB Stats",
    description: "Stats complètes des joueurs de basketball universitaire.",
  },
};

export default async function HomePage() {
  const dir = path.join(process.cwd(), "data", "players");
  const indexPath = path.join(dir, "index.json");
  const raw = await fs.readFile(indexPath, "utf-8");
  const players: PlayerEntry[] = JSON.parse(raw);

  // Calcul SIS au build time depuis les fichiers JSON individuels
  const sisMap = new Map<number, { sis: number | null; sisPx: number | null }>();
  await Promise.all(
    players.map(async (p) => {
      try {
        const data = JSON.parse(
          await fs.readFile(path.join(dir, `${p.id}.json`), "utf-8"),
        );
        const result = calculateSIS({
          playerStats:   data.playerStats,
          shootingStats: data.shootingStats,
          teamStats:     data.teamStats,
          profile:       data.profile ?? null,
        });
        sisMap.set(p.id, { sis: result?.total ?? null, sisPx: result?.totalPx ?? null });
      } catch {
        sisMap.set(p.id, { sis: null, sisPx: null });
      }
    }),
  );

  const enrichedPlayers = players.map((player) => ({
    ...player,
    mockDraftPick: mockDraftPredictions[player.id],
    sis: sisMap.get(player.id)?.sis ?? null,
    sisPx: sisMap.get(player.id)?.sisPx ?? null,
  }));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Top NCAA Prospects</h1>
      <PlayerTable players={enrichedPlayers} />
    </div>
  );
}