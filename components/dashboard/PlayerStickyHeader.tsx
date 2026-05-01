"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./PlayerStickyHeader.module.scss";
import { getTeamDisplayColor, hexToRgb } from "@/lib/teamColors";
import CompareButton from "./CompareButton";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  id: number;
  name: string;
  photoUrl: string;
  team: string;
  teamAbbreviation: string;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
  allPlayers: IndexEntry[];
  /** ref forwarded from parent pointing at the PlayerHero section */
  heroRef: React.RefObject<HTMLElement | null>;
};

export default function PlayerStickyHeader({ id, name, photoUrl, team, teamAbbreviation, position, ppg, rpg, apg, allPlayers, heroRef }: Props) {
  const teamColor = getTeamDisplayColor(team);
  const teamRgb = teamColor ? hexToRgb(teamColor) : null;
  const barStyle = teamRgb
    ? ({ "--team-color": teamColor, "--team-rgb": teamRgb } as React.CSSProperties)
    : undefined;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky header when hero is NOT intersecting (scrolled past it)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-140px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  return (
    <div className={`${styles.bar} ${visible ? styles.barVisible : ""}`} aria-hidden={!visible} style={barStyle}>
      <span className={styles.bgInitials} aria-hidden="true">{teamAbbreviation}</span>
      <div className={styles.inner}>
        <div className={styles.playerInfo}>
          <div className={styles.photoWrap}>
            <Image
              src={photoUrl}
              alt={name}
              width={36}
              height={36}
              className={styles.photo}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className={styles.nameBlock}>
            <span className={styles.name}>{name}</span>
            <span className={styles.meta}>{position} · {team}</span>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statVal}>{ppg}</span>
              <span className={styles.statLabel}>PPG</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{rpg}</span>
              <span className={styles.statLabel}>RPG</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statVal}>{apg}</span>
              <span className={styles.statLabel}>APG</span>
            </div>
          </div>

          {allPlayers.length > 0 && (
            <div className={styles.compareSlot}>
              <CompareButton currentPlayerId={id} allPlayers={allPlayers} align="right" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
