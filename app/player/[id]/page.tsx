import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
import { calculateSIS } from "@/lib/sisScore";
import { teamDropShadow } from "@/lib/teamColors";
import type { PlayRaw } from "@/lib/api";
import type { PlayerDataBundle, GameLogEntry } from "@/types/stats";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const filePath = path.join(process.cwd(), "data", "players", `${id}.json`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    const ps = data.playerStats;
    const g = ps.games || 1;
    const ppg = (ps.points / g).toFixed(1);
    const rpg = (ps.rebounds.total / g).toFixed(1);
    const apg = (ps.assists / g).toFixed(1);
    const description = `${ps.position} · ${ps.team} — ${ppg} PPG, ${rpg} RPG, ${apg} APG. Stats complètes sur SymbioseBB.`;
    const photoUrl = `/players/${ps.athleteId}.png`;
    return {
      title: ps.name,
      description,
      openGraph: {
        title: `${ps.name} — Stats`,
        description,
        images: [{ url: photoUrl, alt: ps.name }],
      },
      twitter: {
        title: `${ps.name} — Stats`,
        description,
        images: [photoUrl],
      },
    };
  } catch {
    return { title: "Joueur introuvable" };
  }
}

/** Pre-generate all player pages at build time */
export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "data", "players");
  const indexPath = path.join(dir, "index.json");
  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    const players: { id: number }[] = JSON.parse(raw);
    return players.map((p) => ({ id: String(p.id) }));
  } catch (err) {
    console.error("[generateStaticParams] Failed to read player index:", err);
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

  // SIS / SIS-Px
  const sisResult = calculateSIS(stats);
  const sis   = sisResult?.total   ?? null;
  const sisPx = sisResult?.totalPx ?? null;
  const sisBreakdown   = sisResult ? {
    offensiveEfficiency: sisResult.offensiveEfficiency,
    defensiveImpact:     sisResult.defensiveImpact,
    advancedEfficiency:  sisResult.advancedEfficiency,
    hustle:              sisResult.hustle,
    systemWeight:        sisResult.systemWeight,
  } : null;
  const sisPxBreakdown = sisResult ? {
    pxPhysical:           sisResult.pxPhysical,
    pxEfficiency:         sisResult.pxEfficiency,
    pxDefensiveMobility:  sisResult.pxDefensiveMobility,
    pxProjectedRole:      sisResult.pxProjectedRole,
    pxNBAAdaptability:    sisResult.pxNBAAdaptability,
  } : null;

  const plays: PlayRaw[] = data.shots ?? [];
  const shots = mapPlaysToShots(plays, Number(id));
  const opponentFG = data.teamStats.opponentStats.fieldGoals.pct;

  const ps = stats.playerStats;
  const pppPoss = ps.fieldGoals.attempted + 0.44 * ps.freeThrows.attempted + ps.turnovers;
  const ppp = pppPoss > 0 ? ps.points / pppPoss : 0;

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
      ppp,
      fgPct: player.fgPct,
      threePtPct: player.threePtPct,
      ftPct: player.ftPct,
      trueShootingPct: player.trueShootingPct,
      usage: player.usage,
      defensiveRating: player.defensiveRating,
      reboundsDefensive: player.reboundsDefensive,
      defensiveReboundPct: player.defensiveReboundPct,
      steals: player.steals,
      blocks: player.blocks,
      opponentFG,
      fpg: parseFloat(player.fpg),
    },
  };

  const photoShadow = teamDropShadow(player.team);

  return (
    <div>
      <PlayerHero
        player={player}
        photoShadow={photoShadow}
        allPlayers={allPlayerStats.map((ps) => ({
          id: ps.athleteId,
          name: ps.name,
          team: ps.team,
        }))}
      />
      <PlayerTabs
        overview={<Overview player={player} rankings={playerRankings} topLineups={stats.topLineups ?? []} sis={sis} sisPx={sisPx} sisBreakdown={sisBreakdown} sisPxBreakdown={sisPxBreakdown} />}
        offensive={<ShotChart shots={shots} shootingStats={stats.shootingStats} radarPlayer={radarPlayer} />}
        defensive={<Defensive player={player} radarPlayer={radarPlayer} opponentFG={opponentFG} />}
        gameLog={<GameLog gameLog={data.gameLog ?? []} />}
      />
    </div>
  );
}
