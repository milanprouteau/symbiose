import { promises as fs } from "fs";
import path from "path";
import PlayerTable, { type PlayerEntry } from "@/components/dashboard/PlayerTable";
import { mockDraftPredictions } from "@/lib/mockDraftPredictions";
import styles from "./page.module.scss";

export default async function HomePage() {
  const indexPath = path.join(process.cwd(), "data", "players", "index.json");
  const raw = await fs.readFile(indexPath, "utf-8");
  const players: PlayerEntry[] = JSON.parse(raw);

  // Enrich players with mock draft predictions
  const enrichedPlayers = players.map(player => ({
    ...player,
    mockDraftPick: mockDraftPredictions[player.id]
  }));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Top NCAA Prospects
      </h1>
      <PlayerTable players={enrichedPlayers} />
    </div>
  );
}