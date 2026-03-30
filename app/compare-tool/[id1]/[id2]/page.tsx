import { promises as fs } from "fs";
import path from "path";
import type { PlayerDataBundle } from "@/types/stats";
import type { Shot } from "@/types/player";
import type { PlayRaw } from "@/lib/api";
import { mapPlaysToShots } from "@/lib/mapShots";
import CompareClient from "./CompareClient";

type IndexEntry = {
  id: number;
  name: string;
  team: string;
};

type PlayerWithShots = {
  bundle: PlayerDataBundle;
  shots: Shot[];
};

async function loadPlayer(id: string): Promise<PlayerWithShots | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", `${id}.json`),
      "utf-8"
    );
    const data = JSON.parse(raw);
    const bundle: PlayerDataBundle = {
      playerStats: data.playerStats,
      shootingStats: data.shootingStats,
      teamStats: data.teamStats,
      profile: data.profile ?? null,
    };
    const plays: PlayRaw[] = data.shots ?? [];
    const shots = mapPlaysToShots(plays, Number(id));
    return { bundle, shots };
  } catch {
    return null;
  }
}

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", "index.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ id1: string; id2: string }> };

export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

export default async function CompareToolPage({ params }: Props) {
  const { id1, id2 } = await params;
  const [p1Data, p2Data, allPlayers] = await Promise.all([
    loadPlayer(id1),
    loadPlayer(id2),
    loadIndex(),
  ]);

  return (
    <CompareClient
      player1={p1Data?.bundle ?? null}
      player2={p2Data?.bundle ?? null}
      shots1={p1Data?.shots ?? []}
      shots2={p2Data?.shots ?? []}
      id1={id1}
      id2={id2}
      allPlayers={allPlayers}
    />
  );
}
