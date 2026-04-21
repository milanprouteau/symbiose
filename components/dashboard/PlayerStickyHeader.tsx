"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./PlayerStickyHeader.module.scss";

type Props = {
  name: string;
  photoUrl: string;
  team: string;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
  /** ref forwarded from parent pointing at the PlayerHero section */
  heroRef: React.RefObject<HTMLElement | null>;
};

export default function PlayerStickyHeader({ name, photoUrl, team, position, ppg, rpg, apg, heroRef }: Props) {
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
    <div className={`${styles.bar} ${visible ? styles.barVisible : ""}`} aria-hidden={!visible}>
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
      </div>
    </div>
  );
}
