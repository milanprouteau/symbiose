import type { Player } from "@/types/player";
import Image from "next/image";
import styles from "./PlayerHero.module.scss";

type Props = { 
  player: Player;
};

export default function PlayerHero({ player: p }: Props) {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.grid}>

          {/* ── Colonne gauche : Photo joueur ── */}
          <div className={styles.photoCol}>
            <Image
              src={p.teamLogoUrl}
              alt={p.team}
              fill
              className={styles.uniLogo}
            />
            <div className={styles.fadeBottom} />
            <Image
              src={p.photoUrl}
              alt={p.name}
              width={220}
              height={280}
              className={styles.playerImg}
              style={{ maskImage: "linear-gradient(to top, transparent 0%, black 30%)" }}
            />
          </div>

          {/* ── Colonne droite : Infos ── */}
          <div className={styles.overviewCol}>
            <div className={styles.nameRow}>
              <h1 className={styles.playerName}>
                {p.jersey && <span className={styles.jersey}>#{p.jersey}</span>}
                {p.name}
              </h1>
              <span className={styles.playerMeta}>
                {p.position} · {p.team}
              </span>
            </div>

            <ul className={styles.overviewList}>
              {p.height && (
                <li className={styles.overviewItem}>
                  <span className={styles.overviewLabel}>Taille</span>
                  <span className={styles.overviewValue}>{p.height}</span>
                </li>
              )}
              {p.weight && (
                <li className={styles.overviewItem}>
                  <span className={styles.overviewLabel}>Poids</span>
                  <span className={styles.overviewValue}>{p.weight}</span>
                </li>
              )}
              {p.dateOfBirth && (
                <li className={styles.overviewItem}>
                  <span className={styles.overviewLabel}>Né le</span>
                  <span className={styles.overviewValue}>{p.dateOfBirth}</span>
                </li>
              )}
              {p.hometown && (
                <li className={styles.overviewItem}>
                  <span className={styles.overviewLabel}>À</span>
                  <span className={styles.overviewValue}>{p.hometown}</span>
                </li>
              )}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}