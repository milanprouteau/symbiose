import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import PlayerHero from "@/components/dashboard/PlayerHero";
import ShotChart from "@/components/dashboard/ShotChart";
import RadarChart from "@/components/dashboard/RadarChart";
import type { RadarPlayer } from "@/components/dashboard/RadarChart";

import { mapPlaysToShots } from "@/lib/mapShots";
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
      <PlayerHero stats={stats} />
      <ShotChart shots={shots} shootingStats={stats.shootingStats} />
      <div className={styles.radarSection}>
        <h2 className={styles.radarTitle}>
          Player Profile
        </h2>
        <RadarChart players={[radarPlayer]} />
      </div>
    </div>
  );
}
