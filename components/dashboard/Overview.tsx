import type { Player } from "@/types/player";
import type { StatRanking } from "@/lib/playerRankings";
import type { LineupEntry } from "@/types/stats";
import { findSimilarPlayers } from "@/lib/similarPlayers";
import styles from "./Overview.module.scss";

type Props = {
  player: Player;
  rankings?: StatRanking;
  topLineups?: LineupEntry[];
};

function formatMinutes(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60);
  return `${mins} min`;
}

export default function Overview({ player: p, rankings, topLineups = [] }: Props) {
  const overview = [
    `${p.position} · ${p.team} (${p.conference}) — ${p.games} matchs, ${p.starts} titulaires.`,
    `${p.ppg} PPG, ${p.rpg} RPG, ${p.apg} APG en ${p.mpg} MPG.`,
    `Tirs: ${p.fgPct}% FG, ${p.threePtPct}% 3PT, ${p.ftPct}% FT.`,
    `TS% ${p.trueShootingPct.toFixed(1)}% · Usage ${p.usage}% · Net Rating +${p.netRating}.`,
  ];

  const similarPlayers = findSimilarPlayers({
    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
    spg: p.spg,
    bpg: p.bpg,
    fgPct: p.fgPct,
    usage: p.usage,
  });

  console.log('similarPlayers', similarPlayers);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {/* ── Colonne centre : Infos principales ── */}
        <div className={styles.infoCol}>
          <div className={styles.statsRow}>
            {[
              { label: "PPG", value: p.ppg, rank: rankings?.ppg },
              { label: "RPG", value: p.rpg, rank: rankings?.rpg },
              { label: "APG", value: p.apg, rank: rankings?.apg },
              { label: "MPG", value: p.mpg, rank: rankings?.mpg },
            ].map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statValue}>
                  {stat.value}
                </span>
                <span className={styles.statLabel}>
                  {stat.label}{stat.rank ? ` (#${stat.rank})` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Colonne droite : Overview ── */}
        <div className={styles.overviewCol}>
          <h2 className={styles.overviewTitle}>
            Resumé
          </h2>
          <ul className={styles.overviewList}>
            {overview.map((line, i) => (
              <li
                key={i}
                className={styles.overviewItem}
              >
                <span className={styles.overviewDash}>—</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Top 5 Lineups ── */}
      {topLineups.length > 0 && (
        <div className={styles.lineupsSection}>
          <h2 className={styles.lineupsTitle}>Meilleurs Lineups</h2>
          <div className={styles.lineupsList}>
            {topLineups.map((lu, i) => (
              <div key={lu.idHash} className={styles.lineupCard}>
                <div className={styles.lineupStats}>
                  <div className={styles.lineupStatItem}>
                    <span className={styles.lineupStatValue}>{formatMinutes(lu.totalSeconds)}</span>
                    <span className={styles.lineupStatLabel}>Temps</span>
                  </div>
                  <div className={styles.lineupStatItem}>
                    <span className={styles.lineupStatValue}>{lu.pace.toFixed(1)}</span>
                    <span className={styles.lineupStatLabel}>Pace</span>
                  </div>
                  <div className={styles.lineupStatItem}>
                    <span className={styles.lineupStatValue}>{lu.offenseRating.toFixed(1)}</span>
                    <span className={styles.lineupStatLabel}>Off Rtg</span>
                  </div>
                  <div className={styles.lineupStatItem}>
                    <span className={styles.lineupStatValue}>{lu.defenseRating.toFixed(1)}</span>
                    <span className={styles.lineupStatLabel}>Def Rtg</span>
                  </div>
                  <div className={styles.lineupStatItem}>
                    <span className={`${styles.lineupStatValue} ${lu.netRating >= 0 ? styles.lineupPositive : styles.lineupNegative}`}>
                      {lu.netRating >= 0 ? "+" : ""}{lu.netRating.toFixed(1)}
                    </span>
                    <span className={styles.lineupStatLabel}>Net Rtg</span>
                  </div>
                </div>
                <div className={styles.lineupHeader}>
                  <span className={styles.lineupRank}>{i + 1}</span>
                  <div className={styles.lineupPlayers}>
                    {lu.athletes.map((a) => (
                      <span
                        key={a.id}
                        className={`${styles.lineupPlayerName} ${a.id === p.athleteId ? styles.lineupPlayerHighlight : ""}`}
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Profils similaires ── */}
      <div className={styles.similarSection}>
        <h2 className={styles.similarTitle}>Profils similaires</h2>
        <div className={styles.similarList}>
          {similarPlayers.map((sp, i) => (
            <div key={`${sp.name}-${sp.draftYear}`} className={styles.similarCard}>
              <div className={styles.similarContent}>
                <div className={styles.similarRank}>{i + 1}</div>
                <div className={styles.similarInfo}>
                  <span className={styles.similarName}>{sp.name}</span>
                  <span className={styles.similarMeta}>
                    {sp.position} · {sp.team} ({sp.draftYear})
                  </span>
                </div>
                <div className={styles.similarDraft}>
                  <span className={styles.similarPick}>Pick #{sp.overall}</span>
                  <span className={styles.similarTeam}>{sp.draftTeam}</span>
                </div>
              </div>
              <div className={styles.similarStats}>
                <span>{sp.points} pts</span>
                <span>{sp.rebounds} reb</span>
                <span>{sp.assists} ast</span>
                <span>{sp.fieldGoalsPct}% FG</span>
                <span>{sp.usage}% Usage</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
