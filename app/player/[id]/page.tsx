import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import PlayerHero from "@/components/dashboard/PlayerHero";
import PlayerTabs from "@/components/dashboard/PlayerTabs";
import Overview from "@/components/dashboard/Overview";
import ShotChart from "@/components/dashboard/ShotChart";
import Defensive from "@/components/dashboard/Defensive";
import GameLog from "@/components/dashboard/GameLog";
import type { RadarPlayer } from "@/components/dashboard/RadarChart";

import { mapPlaysToShots } from "@/lib/mapShots";
import { buildPlayer } from "@/lib/buildPlayer";
import { calculatePlayerRankings } from "@/lib/playerRankings";
import type { PlayRaw } from "@/lib/api";
import type { PlayerDataBundle, GameLogEntry } from "@/types/stats";

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
    profile: data.profile ?? null,
    topLineups: data.topLineups ?? [],
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

  // Build centralized player model
  const player = buildPlayer(stats);

  const plays: PlayRaw[] = data.shots ?? [];
  const shots = mapPlaysToShots(plays, Number(id));
  const opponentFG = data.teamStats.opponentStats.fieldGoals.pct;

  const radarPlayer: RadarPlayer = {
    name: player.name,
    color: "#FF8C42",
    values: {
      ppg: parseFloat(player.ppg),
      rpg: parseFloat(player.rpg),
      apg: parseFloat(player.apg),
      mpg: parseFloat(player.mpg),
      spg: parseFloat(player.spg),
      bpg: parseFloat(player.bpg),
      fgPct: player.fgPct,
      threePtPct: player.threePtPct,
      ftPct: player.ftPct,
      trueShootingPct: player.trueShootingPct,
      usage: player.usage,
      defensiveRating: player.defensiveRating,
      reboundsDefensive: player.reboundsDefensive,
      steals: player.steals,
      blocks: player.blocks,
    },
  };

  console.log('stats', stats);

  return (
    <div>
      <PlayerHero player={player} />
      <PlayerTabs
        overview={<Overview player={player} rankings={playerRankings} topLineups={stats.topLineups ?? []} />}
        offensive={<ShotChart shots={shots} shootingStats={stats.shootingStats} radarPlayer={radarPlayer} />}
        defensive={<Defensive player={player} radarPlayer={radarPlayer} opponentFG={opponentFG} />}
        gameLog={<GameLog gameLog={data.gameLog ?? []} />}
      />
    </div>
  );
}
