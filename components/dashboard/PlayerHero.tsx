import type { Player } from "@/types/player";
import styles from "./PlayerHero.module.scss";
import CompareButton from "./CompareButton";
import PlayerPhotoCard from "./PlayerPhotoCard";

type IndexEntry = { id: number; name: string; team: string };

type NBAProfileData = {
  nba_profile: string;
  profile_confidence: number;
};

type Props = {
  player: Player;
  photoShadow?: string;
  allPlayers?: IndexEntry[];
  nbaProfile?: NBAProfileData | null;
};

const PROFILE_LABELS: Record<string, string> = {
  NBA_READY: "NBA Ready",
  LATE_BLOOMER: "Late Bloomer",
  ROLE_PLAYER: "Role Player",
};

const PROFILE_COLORS: Record<string, string> = {
  NBA_READY: "var(--color-primary-orange)",
  LATE_BLOOMER: "var(--color-primary-yellow)",
  ROLE_PLAYER: "var(--color-text-muted)",
};

const PROFILE_BG: Record<string, string> = {
  NBA_READY: "rgba(255,108,34,0.1)",
  LATE_BLOOMER: "rgba(255,214,0,0.07)",
  ROLE_PLAYER: "var(--color-surface)",
};

const PROFILE_BORDER: Record<string, string> = {
  NBA_READY: "rgba(255,108,34,0.4)",
  LATE_BLOOMER: "rgba(255,214,0,0.3)",
  ROLE_PLAYER: "var(--color-border)",
};

export default function PlayerHero({ player: p, photoShadow, allPlayers, nbaProfile }: Props) {
  console.log('player', p);
  return (
    <section className={styles.section}>
      <div className={styles.inner}>

        <div className={styles.grid}>

          {/* ── Colonne gauche : Photo joueur ── */}
          <div className={styles.photoCol}>
            <div className={styles.teamSeparator} aria-hidden="true">
              {p.teamAbbreviation.split("").map((char, i) => (
                <span key={i} className={styles.teamChar}>{char}</span>
              ))}
            </div>
            <PlayerPhotoCard
              photoUrl={p.photoUrl}
              logoUrl={p.teamLogoUrl}
              name={p.name}
              shadow={photoShadow}
              size="md"
            />
          </div>

          {/* ── Colonne droite : Infos ── */}
          <div className={styles.overviewCol}>
            <div className={styles.nameRow}>
              <h1 className={styles.playerName}>
                {p.jersey && <span className={styles.jersey}>#{p.jersey}</span>}
                {p.name}
              </h1>
              <div className={styles.metaRow}>
                <span className={styles.playerMeta}>
                  {p.position} · {p.team}
                </span>
                {nbaProfile && (
                  <span
                    className={styles.profileBadge}
                    style={{
                      color: PROFILE_COLORS[nbaProfile.nba_profile],
                      background: PROFILE_BG[nbaProfile.nba_profile],
                      borderColor: PROFILE_BORDER[nbaProfile.nba_profile],
                    }}
                    title={`${nbaProfile.profile_confidence.toFixed(0)}% de confiance`}
                  >
                    {PROFILE_LABELS[nbaProfile.nba_profile] ?? nbaProfile.nba_profile}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.overviewRow}>
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

              {allPlayers && allPlayers.length > 0 && (
                <CompareButton currentPlayerId={p.id} allPlayers={allPlayers} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}