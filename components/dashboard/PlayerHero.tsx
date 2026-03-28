import type { PlayerDataBundle } from "@/types/stats";
import type { StatRanking } from "@/lib/playerRankings";
import Image from "next/image";
import styles from "./PlayerHero.module.scss";

type Props = { 
  stats: PlayerDataBundle;
  rankings?: StatRanking;
};

export default function PlayerHero({ stats, rankings }: Props) {
  const p = stats.playerStats;
  console.log('p', p);
  const games = p.games || 1;

  const ppg = (p.points / games).toFixed(1);
  const rpg = (p.rebounds.total / games).toFixed(1);
  const apg = (p.assists / games).toFixed(1);
  const mpg = (p.minutes / games).toFixed(1);

  const overview = [
    `${p.position} · ${p.team} (${p.conference}) — ${p.games} matchs, ${p.starts} titulaires.`,
    `${ppg} PPG, ${rpg} RPG, ${apg} APG en ${mpg} MPG.`,
    `Tirs: ${p.fieldGoals.pct}% FG, ${p.threePointFieldGoals.pct}% 3PT, ${p.freeThrows.pct}% FT.`,
    `TS% ${(p.trueShootingPct * 100).toFixed(1)}% · Usage ${p.usage}% · Net Rating +${p.netRating}.`,
  ];

  const uniSlug = p.team.toLowerCase().replace(/ /g, "-");

  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        {/* Layout desktop : 3 colonnes | Layout mobile : empilé */}
        <div className={styles.grid}>

          {/* ── Colonne gauche : Photo joueur ── */}
          <div className={styles.photoCol}>
            {/* Logo université en watermark */}
            <Image
              src={`/uni/${uniSlug}.png`}
              alt={p.team}
              fill
              className={styles.uniLogo}
            />
            {/* Dégradé bas pour fondu */}
            <div className={styles.fadeBottom} />
            {/* Photo joueur coupée en bas */}
            <Image
              src={`/players/${p.athleteId}.png`}
              alt={p.name}
              width={220}
              height={280}
              className={styles.playerImg}
              style={{ maskImage: "linear-gradient(to top, transparent 0%, black 30%)" }}
            />
          </div>

          {/* ── Colonne centre : Infos principales ── */}
          <div className={styles.infoCol}>
            <div className={styles.nameRow}>
              <h1 className={styles.playerName}>
                {p.name}
              </h1>
              <span className={styles.playerMeta}>
                {p.position} · {p.team}
              </span>
            </div>

            <div className={styles.statsRow}>
              {[
                { label: "PPG", value: ppg, rank: rankings?.ppg },
                { label: "RPG", value: rpg, rank: rankings?.rpg },
                { label: "APG", value: apg, rank: rankings?.apg },
                { label: "MPG", value: mpg, rank: rankings?.mpg },
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
    </section>
  );
}