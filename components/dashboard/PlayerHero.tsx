import type { Player } from "@/types/player";
import styles from "./PlayerHero.module.scss";
import CompareButton from "./CompareButton";
import PlayerPhotoCard from "./PlayerPhotoCard";
import { getTeamDisplayColor, hexToRgb } from "@/lib/teamColors";

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

export default function PlayerHero({ player: p, photoShadow, allPlayers }: Props) {
  const teamColor = getTeamDisplayColor(p.team);
  const teamRgb = teamColor ? hexToRgb(teamColor) : null;

  return (
    <section
      className={styles.section}
      style={teamRgb ? ({
        "--team-color": teamColor,
        "--team-rgb": teamRgb,
      } as React.CSSProperties) : undefined}
    >
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