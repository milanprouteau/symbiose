import type { Player } from "@/types/player";
import styles from "./PlayerHero.module.scss";
import PlayerPhotoCard from "./PlayerPhotoCard";
import CompareButton from "./CompareButton";
import { getTeamDisplayColor, hexToRgb } from "@/lib/teamColors";

type IndexEntry = { id: number; name: string; team: string };

type NBAProfileData = {
  nba_profile: string;
  profile_confidence: number;
};

type Props = {
  player: Player;
  nbaProfile?: NBAProfileData | null;
  allPlayers?: IndexEntry[];
};

export default function PlayerHero({ player: p, allPlayers }: Props) {
  const teamColor = getTeamDisplayColor(p.team);
  const teamRgb = teamColor ? hexToRgb(teamColor) : null;

  const sectionStyle: React.CSSProperties = teamRgb
    ? ({ "--team-color": teamColor, "--team-rgb": teamRgb } as React.CSSProperties)
    : {};

  return (
    <section
      className={styles.section}
      style={sectionStyle}
    >
      <span className={styles.bgInitials} aria-hidden="true">
        {p.teamAbbreviation}
      </span>
      {allPlayers && allPlayers.length > 0 && (
        <div className={styles.compareSlot}>
          <CompareButton currentPlayerId={p.id} allPlayers={allPlayers} align="right" />
        </div>
      )}
      <div className={styles.inner}>

        <div className={styles.grid}>

          {/* ── Colonne gauche : Photo joueur ── */}
          <div className={styles.photoCol}>
            <PlayerPhotoCard
              photoUrl={p.photoUrl}
              logoUrl={p.teamLogoUrl}
              name={p.name}
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

            <div className={styles.divider} aria-hidden="true" />

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
                {p.wingspan && (
                  <li className={styles.overviewItem}>
                    <span className={styles.overviewLabel}>Envergure</span>
                    <span className={styles.overviewValue}>{p.wingspan}</span>
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
      </div>
    </section>
  );
}