import styles from "./CourtBackground.module.scss";

export default function CourtBackground() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <svg className={styles.noise} xmlns="http://www.w3.org/2000/svg">
        <filter id="grain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.68"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0 1
                    0 0 0 0.5 0"
            in="noise"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
