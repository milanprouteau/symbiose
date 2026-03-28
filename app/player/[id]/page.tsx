import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import PlayerHero from "@/components/dashboard/PlayerHero";
import ShotChart from "@/components/dashboard/ShotChart";
import type { RadarPlayer } from "@/components/dashboard/RadarChart";

import { mapPlaysToShots } from "@/lib/mapShots";
import { calculatePlayerRankings } from "@/lib/playerRankings";
import type { PlayRaw } from "@/lib/api";
import type { PlayerDataBundle } from "@/types/stats";
import styles from "./page.module.scss";

type Props = { params: Promise<{ id: string }> };

/** Pre-generate all player pages at build time */
export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "data", "players");
  const indexPath = path.join(dir, "index.json");
  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    const players: { id: number }[] = JSON.parse(raw);
    return players.map((p) => ({ id: String(p.id) }));
  } catch {
    return [];
  }
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const filePath = path.join(process.cwd(), "data", "players", `${id}.json`);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const data = JSON.parse(raw);

  const stats: PlayerDataBundle = {
    playerStats: data.playerStats,
    shootingStats: data.shootingStats,
    teamStats: data.teamStats,
  };

  // Load all player data for rankings
  const indexPath = path.join(process.cwd(), "data", "players", "index.json");
  const indexRaw = await fs.readFile(indexPath, "utf-8");
  const playerIndex: { id: number }[] = JSON.parse(indexRaw);
  
  // Load all player stats
  const allPlayerStats = await Promise.all(
    playerIndex.map(async (player) => {
      const playerFilePath = path.join(process.cwd(), "data", "players", `${player.id}.json`);
      const playerRaw = await fs.readFile(playerFilePath, "utf-8");
      const playerData = JSON.parse(playerRaw);
      return playerData.playerStats;
    })
  );

  // Calculate rankings
  const rankings = calculatePlayerRankings(allPlayerStats);
  const playerRankings = rankings.get(Number(id));

  const plays: PlayRaw[] = data.shots ?? [];
  const shots = mapPlaysToShots(plays, Number(id));

  const ps = stats.playerStats;
  const radarPlayer: RadarPlayer = {
    name: ps.name,
    color: "#FF8C42",
    values: {
      fg: ps.fieldGoals.pct,
      three: ps.threePointFieldGoals.pct,
      ft: ps.freeThrows.pct,
      ts: ps.trueShootingPct < 1 ? ps.trueShootingPct * 100 : ps.trueShootingPct,
      usage: ps.usage,
    },
  };

  return (
    <div>
      <PlayerHero stats={stats} rankings={playerRankings} />
      <ShotChart shots={shots} shootingStats={stats.shootingStats} radarPlayer={radarPlayer} />
    </div>
  );
}
