import { promises as fs } from "fs";
import path from "path";
import type { PlayerDataBundle } from "@/types/stats";
import CompareClient from "./CompareClient";

type IndexEntry = {
  id: number;
  name: string;
  team: string;
};

async function loadPlayer(id: string): Promise<PlayerDataBundle | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", `${id}.json`),
      "utf-8"
    );
    const data = JSON.parse(raw);
    return {
      playerStats: data.playerStats,
      shootingStats: data.shootingStats,
      teamStats: data.teamStats,
    };
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
  const [player1, player2, allPlayers] = await Promise.all([
    loadPlayer(id1),
    loadPlayer(id2),
    loadIndex(),
  ]);

  return (
    <CompareClient
      player1={player1}
      player2={player2}
      id1={id1}
      id2={id2}
      allPlayers={allPlayers}
    />
  );
}
