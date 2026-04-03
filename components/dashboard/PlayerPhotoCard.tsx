"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./PlayerPhotoCard.module.scss";

type Size = "sm" | "md" | "lg";

const SIZE_CONFIG: Record<Size, { containerHeight: number; logoSize: number; photoWidth: number; photoHeight: number }> = {
  sm:  { containerHeight: 140, logoSize: 120, photoWidth: 120, photoHeight: 160 },
  md:  { containerHeight: 200, logoSize: 190, photoWidth: 160, photoHeight: 210 },
  lg:  { containerHeight: 260, logoSize: 240, photoWidth: 200, photoHeight: 260 },
};

type Props = {
  photoUrl: string;
  logoUrl: string;
  name: string;
  shadow?: string;
  size?: Size;
};

export default function PlayerPhotoCard({ photoUrl, logoUrl, name, shadow, size = "md" }: Props) {
  const cfg = SIZE_CONFIG[size];
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={styles.root} style={{ height: cfg.containerHeight }}>
      {!loaded && <div className={styles.shimmer} />}
      <Image
        src={logoUrl}
        alt=""
        width={cfg.logoSize}
        height={cfg.logoSize}
        className={styles.logo}
      />
      <Image
        src={photoUrl}
        alt={name}
        width={cfg.photoWidth}
        height={cfg.photoHeight}
        className={styles.photo}
        style={shadow ? { filter: shadow } : undefined}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
