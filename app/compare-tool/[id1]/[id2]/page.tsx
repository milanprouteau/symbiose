import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import type { PlayerDataBundle } from "@/types/stats";
import type { Shot } from "@/types/player";
import type { PlayRaw } from "@/lib/api";
import { mapPlaysToShots } from "@/lib/mapShots";
import { teamDropShadow } from "@/lib/teamColors";
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
  } catch (err) {
    console.error(`[loadPlayer] Failed to load player ${id}:`, err);
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
  } catch (err) {
    console.error("[loadIndex] Failed to read player index:", err);
    return [];
  }
}

type Props = { params: Promise<{ id1: string; id2: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id1, id2 } = await params;
  const readName = async (id: string) => {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), "data", "players", `${id}.json`), "utf-8");
      return JSON.parse(raw).playerStats.name as string;
    } catch { return null; }
  };
  const [name1, name2] = await Promise.all([readName(id1), readName(id2)]);
  if (name1 && name2) {
    const title = `${name1} vs ${name2}`;
    const description = `Comparatif stats entre ${name1} et ${name2} — SymbioseBB Stats.`;
    return {
      title,
      description,
      openGraph: { title, description },
      twitter: { title, description },
    };
  }
  return { title: "Comparatif joueurs" };
}

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

  const team1 = p1Data?.bundle?.playerStats?.team ?? "";
  const team2 = p2Data?.bundle?.playerStats?.team ?? "";

  return (
    <CompareClient
      player1={p1Data?.bundle ?? null}
      player2={p2Data?.bundle ?? null}
      shots1={p1Data?.shots ?? []}
      shots2={p2Data?.shots ?? []}
      profile1={p1Data?.bundle?.profile ?? null}
      profile2={p2Data?.bundle?.profile ?? null}
      id1={id1}
      id2={id2}
      allPlayers={allPlayers}
      shadow1={teamDropShadow(team1)}
      shadow2={teamDropShadow(team2)}
    />
  );
}
