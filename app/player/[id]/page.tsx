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
import { loadWingspans, getWingspan } from "@/lib/wingspan";
import PlayerPageClient from "@/components/dashboard/PlayerPageClient";
import type { PlayRaw } from "@/lib/api";
import type { PlayerDataBundle } from "@/types/stats";

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

  // Load manual wingspan data (single source of truth for display)
  const wingspans = await loadWingspans();
  const manualWingspan = getWingspan(wingspans, id);

  const profile = data.profile ?? null;
  const mergedProfile = profile
    ? { ...profile, wingspan: manualWingspan ?? profile.wingspan ?? null }
    : manualWingspan != null
      ? {
          jersey: null,
          position: null,
          height: null,
          weight: null,
          wingspan: manualWingspan,
          hometown: null,
          dateOfBirth: null,
        }
      : null;

  const stats: PlayerDataBundle = {
    playerStats: data.playerStats,
    shootingStats: data.shootingStats,
    teamStats: data.teamStats,
    profile: mergedProfile,
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

  // SIS (formule actuelle, conservée)
  const sisResult = calculateSIS(stats);
  const sis = sisResult?.total ?? null;
  const sisBreakdown = sisResult ? {
    offensiveEfficiency: sisResult.offensiveEfficiency,
    defensiveImpact:     sisResult.defensiveImpact,
    advancedEfficiency:  sisResult.advancedEfficiency,
    hustle:              sisResult.hustle,
    systemWeight:        sisResult.systemWeight,
  } : null;

  // SIS-Px ML — score basé sur le modèle XGBoost
  type MLSisPxEntry = {
    name: string; sisPx: number; posGroup: string;
    sisPx_pts: number; sisPx_reb: number; sisPx_ast: number; sisPx_mpg: number;
    sisPx_stl?: number; sisPx_blk?: number; sisPx_fg?: number; sisPx_porpag?: number;
    proj_pts: number; proj_reb: number; proj_ast: number; proj_mpg: number;
    proj_stl?: number; proj_blk?: number; proj_fg_pct?: number;
  };
  type NBAProfileEntry = {
    name: string; nba_profile: string; profile_confidence: number;
    proba_nba_ready: number; proba_late_bloomer: number; proba_role_player: number;
  };

  let sisPx: number | null = null;
  let sisPxBreakdown: {
    sisPx_pts: number; sisPx_reb: number; sisPx_ast: number; sisPx_mpg: number;
    sisPx_stl?: number; sisPx_blk?: number; sisPx_fg?: number; sisPx_porpag?: number;
    proj_pts: number; proj_reb: number; proj_ast: number; proj_mpg: number;
    proj_stl?: number; proj_blk?: number; proj_fg_pct?: number;
    posGroup: string;
  } | null = null;
  let nbaProfile: NBAProfileEntry | null = null;

  try {
    const mlRaw = await fs.readFile(path.join(process.cwd(), "data", "sispx_ml.json"), "utf-8");
    const mlData: MLSisPxEntry[] = JSON.parse(mlRaw);
    const normName = (n: string) => n.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, "").trim();
    const entry = mlData.find((e) => e.name === player.name || normName(e.name) === normName(player.name));
    if (entry) {
      sisPx = entry.sisPx;
      sisPxBreakdown = {
        sisPx_pts: entry.sisPx_pts, sisPx_reb: entry.sisPx_reb,
        sisPx_ast: entry.sisPx_ast, sisPx_mpg: entry.sisPx_mpg,
        sisPx_stl: entry.sisPx_stl, sisPx_blk: entry.sisPx_blk, sisPx_fg: entry.sisPx_fg, sisPx_porpag: entry.sisPx_porpag,
        proj_pts: entry.proj_pts,   proj_reb: entry.proj_reb,
        proj_ast: entry.proj_ast,   proj_mpg: entry.proj_mpg,
        proj_stl: entry.proj_stl,   proj_blk: entry.proj_blk, proj_fg_pct: entry.proj_fg_pct,
        posGroup: entry.posGroup,
      };
    }
  } catch { /* ML data not available */ }

  try {
    const profileRaw = await fs.readFile(path.join(process.cwd(), "data", "profiles_prospects.json"), "utf-8");
    const profileData: NBAProfileEntry[] = JSON.parse(profileRaw);
    const normName2 = (n: string) => n.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/i, "").trim();
    nbaProfile = profileData.find((e) => e.name === player.name || normName2(e.name) === normName2(player.name)) ?? null;
  } catch { /* profile data not available */ }

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
    <PlayerPageClient
      name={player.name}
      photoUrl={player.photoUrl}
      team={player.team}
      position={player.position}
      ppg={player.ppg}
      rpg={player.rpg}
      apg={player.apg}
      hero={
        <PlayerHero
          player={player}
          photoShadow={photoShadow}
          nbaProfile={nbaProfile}
          allPlayers={allPlayerStats.map((ps) => ({
            id: ps.athleteId,
            name: ps.name,
            team: ps.team,
          }))}
        />
      }
      tabs={
        <PlayerTabs
          overview={<Overview player={player} rankings={playerRankings} topLineups={stats.topLineups ?? []} sis={sis} sisPx={sisPx} sisBreakdown={sisBreakdown} sisPxBreakdown={sisPxBreakdown} nbaProfile={nbaProfile} />}
          offensive={<ShotChart shots={shots} shootingStats={stats.shootingStats} radarPlayer={radarPlayer} />}
          defensive={<Defensive player={player} radarPlayer={radarPlayer} opponentFG={opponentFG} />}
          gameLog={<GameLog gameLog={data.gameLog ?? []} />}
        />
      }
    />
  );
}
