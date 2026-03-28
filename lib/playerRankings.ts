import type { PlayerSeasonStats } from "@/types/stats";

export type StatRanking = {
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
};

export function calculatePlayerRankings(allPlayers: PlayerSeasonStats[]): Map<number, StatRanking> {
  const rankings = new Map<number, StatRanking>();
  
  // Calculate per-game stats for all players
  const playersWithStats = allPlayers.map(player => ({
    id: player.athleteId,
    ppg: player.points / (player.games || 1),
    rpg: player.rebounds.total / (player.games || 1),
    apg: player.assists / (player.games || 1),
    mpg: player.minutes / (player.games || 1),
  }));

  // Sort and rank for each stat
  const sortedByPPG = [...playersWithStats].sort((a, b) => b.ppg - a.ppg);
  const sortedByRPG = [...playersWithStats].sort((a, b) => b.rpg - a.rpg);
  const sortedByAPG = [...playersWithStats].sort((a, b) => b.apg - a.apg);
  const sortedByMPG = [...playersWithStats].sort((a, b) => b.mpg - a.mpg);

  // Create ranking map
  playersWithStats.forEach(player => {
    rankings.set(player.id, {
      ppg: sortedByPPG.findIndex(p => p.id === player.id) + 1,
      rpg: sortedByRPG.findIndex(p => p.id === player.id) + 1,
      apg: sortedByAPG.findIndex(p => p.id === player.id) + 1,
      mpg: sortedByMPG.findIndex(p => p.id === player.id) + 1,
    });
  });

  return rankings;
}
