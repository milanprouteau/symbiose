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

  // SIS formule (conservé)
  const sisMap = new Map<number, number | null>();
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
        sisMap.set(p.id, result?.total ?? null);
      } catch {
        sisMap.set(p.id, null);
      }
    }),
  );

  // SIS-Px ML — indexé par nom de joueur
  type MLEntry    = { name: string; sisPx: number };
  type ProfEntry  = { name: string; nba_profile: string; profile_confidence: number };

  const mlSisPxByName  = new Map<string, number>();
  const mlProfileByName = new Map<string, { label: string; confidence: number }>();
  const normName = (n: string) => n.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, "").trim();

  try {
    const mlData: MLEntry[] = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "data", "sispx_ml.json"), "utf-8"),
    );
    mlData.forEach((e) => { mlSisPxByName.set(e.name, e.sisPx); mlSisPxByName.set(normName(e.name), e.sisPx); });
  } catch { /* ML non disponible */ }

  try {
    const profData: ProfEntry[] = JSON.parse(
      await fs.readFile(path.join(process.cwd(), "data", "profiles_prospects.json"), "utf-8"),
    );
    profData.forEach((e) => {
      const entry = { label: e.nba_profile, confidence: e.profile_confidence };
      mlProfileByName.set(e.name, entry);
      mlProfileByName.set(normName(e.name), entry);
    });
  } catch { /* profiles non disponibles */ }

  // Charger les noms depuis les fichiers joueurs pour faire la jointure id→name
  const nameById = new Map<number, string>();
  await Promise.all(
    players.map(async (p) => {
      try {
        const data = JSON.parse(
          await fs.readFile(path.join(dir, `${p.id}.json`), "utf-8"),
        );
        nameById.set(p.id, data.playerStats?.name ?? "");
      } catch { /* skip */ }
    }),
  );

  const enrichedPlayers = players.map((player) => {
    const name = nameById.get(player.id) ?? "";
    return {
      ...player,
      mockDraftPick: mockDraftPredictions[player.id],
      sis:           sisMap.get(player.id) ?? null,
      sisPx:         mlSisPxByName.get(name) ?? mlSisPxByName.get(normName(name)) ?? null,
      nbaProfile:    mlProfileByName.get(name) ?? mlProfileByName.get(normName(name)) ?? null,
    };
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Top NCAA Prospects</h1>
      <PlayerTable players={enrichedPlayers} />
    </div>
  );
}