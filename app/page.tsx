import { promises as fs } from "fs";
import path from "path";
import PlayerHero from "@/components/dashboard/PlayerHero";
import ShotChart from "@/components/dashboard/ShotChart";
import PercentileRanks from "@/components/dashboard/PercentileRanks";
import { mapPlaysToShots } from "@/lib/mapShots";
import type { PlayRaw } from "@/lib/api";
import type { PlayerDataBundle } from "@/types/stats";

const AJ_DYBANTSA_ID = 198382;

export default async function DashboardPage() {
  const dataDir = path.join(process.cwd(), "data");

  const [shotsRaw, statsRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "aj-dybantsa-shots.json"), "utf-8"),
    fs.readFile(path.join(dataDir, "aj-dybantsa-stats.json"), "utf-8"),
  ]);

  const plays: PlayRaw[] = JSON.parse(shotsRaw);
  const shots = mapPlaysToShots(plays, AJ_DYBANTSA_ID);
  const stats: PlayerDataBundle = JSON.parse(statsRaw);

  return (
    <div>
      <PlayerHero stats={stats} />
      <ShotChart shots={shots} />
      <PercentileRanks stats={stats} />
    </div>
  );
}