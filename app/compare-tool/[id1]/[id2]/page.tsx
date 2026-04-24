import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import type { PlayerDataBundle, PlayerProfile } from "@/types/stats";
import type { Shot } from "@/types/player";
import type { PlayerPercentiles } from "@/lib/compareStats";
import { teamDropShadow } from "@/lib/teamColors";
import { loadWingspans, getWingspan } from "@/lib/wingspan";
import CompareClient from "./CompareClient";

type IndexEntry = {
  id: number;
  name: string;
  team: string;
};

type PlayerWithShots = {
  bundle: PlayerDataBundle;
  shots: Shot[];
  percentiles: PlayerPercentiles | null;
  tsPlusRating: number | null;
};

async function loadPlayer(id: string): Promise<PlayerWithShots | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "compare", `${id}.json`),
      "utf-8"
    );
    const data = JSON.parse(raw);
    const bundle: PlayerDataBundle = {
      playerStats: data.playerStats,
      shootingStats: data.shootingStats,
      teamStats: data.teamStats,
      profile: data.profile ?? null,
    };
    const shots: Shot[] = data.shots ?? [];
    return {
      bundle,
      shots,
      percentiles: data.percentiles ?? null,
      tsPlusRating: data.tsPlusRating ?? null,
    };
  } catch (err) {
    console.error(`[loadPlayer] Failed to load player ${id}:`, err);
    return null;
  }
}

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players-index.json"),
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

/**
 * Merge the manually-curated wingspan (from data/players/wingspan.json)
 * onto a player profile. The manual file is the single source of truth.
 */
function mergeWingspan(profile: PlayerProfile | null, wingspan: number | null): PlayerProfile | null {
  if (!profile && wingspan == null) return null;
  if (!profile) {
    return {
      jersey: null,
      position: null,
      height: null,
      weight: null,
      wingspan,
      hometown: null,
      dateOfBirth: null,
    };
  }
  return { ...profile, wingspan: wingspan ?? profile.wingspan ?? null };
}

export default async function CompareToolPage({ params }: Props) {
  const { id1, id2 } = await params;
  const [p1Data, p2Data, allPlayers, wingspans] = await Promise.all([
    loadPlayer(id1),
    loadPlayer(id2),
    loadIndex(),
    loadWingspans(),
  ]);

  const team1 = p1Data?.bundle?.playerStats?.team ?? "";
  const team2 = p2Data?.bundle?.playerStats?.team ?? "";

  const profile1 = mergeWingspan(p1Data?.bundle?.profile ?? null, getWingspan(wingspans, id1));
  const profile2 = mergeWingspan(p2Data?.bundle?.profile ?? null, getWingspan(wingspans, id2));

  return (
    <CompareClient
      player1={p1Data?.bundle ?? null}
      player2={p2Data?.bundle ?? null}
      shots1={p1Data?.shots ?? []}
      shots2={p2Data?.shots ?? []}
      profile1={profile1}
      profile2={profile2}
      id1={id1}
      id2={id2}
      allPlayers={allPlayers}
      shadow1={teamDropShadow(team1)}
      shadow2={teamDropShadow(team2)}
      percentiles1={p1Data?.percentiles ?? null}
      percentiles2={p2Data?.percentiles ?? null}
      tsPlusRating1={p1Data?.tsPlusRating ?? null}
      tsPlusRating2={p2Data?.tsPlusRating ?? null}
    />
  );
}
