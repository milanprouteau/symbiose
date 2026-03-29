import type { Player } from "@/types/player";
import type { StatRanking } from "@/lib/playerRankings";
import styles from "./Overview.module.scss";

type Props = {
  player: Player;
  rankings?: StatRanking;
};

export default function Overview({ player: p, rankings }: Props) {
  const overview = [
    `${p.position} · ${p.team} (${p.conference}) — ${p.games} matchs, ${p.starts} titulaires.`,
    `${p.ppg} PPG, ${p.rpg} RPG, ${p.apg} APG en ${p.mpg} MPG.`,
    `Tirs: ${p.fgPct}% FG, ${p.threePtPct}% 3PT, ${p.ftPct}% FT.`,
    `TS% ${p.trueShootingPct.toFixed(1)}% · Usage ${p.usage}% · Net Rating +${p.netRating}.`,
  ];

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
    </div>
  );
}
