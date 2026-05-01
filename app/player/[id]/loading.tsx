import Skeleton from "@/components/ui/Skeleton";
import styles from "./loading.module.scss";

export default function PlayerLoading() {
  return (
    <div className={styles.container}>
      {/* ── Hero (full-bleed, mirrors PlayerHero) ── */}
      <section className={styles.hero}>
        {/* Compare button pill — top-right */}
        <div className={styles.compareSlot}>
          <Skeleton width={120} height={30} borderRadius={999} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroGrid}>
            {/* Photo column */}
            <div className={styles.photoCol}>
              <Skeleton width={160} height={210} borderRadius={12} />
            </div>

            {/* Info column */}
            <div className={styles.infoCol}>
              <div className={styles.nameRow}>
                <Skeleton width="60%" height={36} borderRadius={6} />
                <Skeleton width={180} height={12} borderRadius={4} />
              </div>

              <div className={styles.divider} />

              <ul className={styles.overviewList}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <li key={i} className={styles.overviewItem}>
                    <Skeleton width={56} height={9} borderRadius={3} />
                    <Skeleton width={64} height={14} borderRadius={4} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <nav className={styles.tabs}>
        {[88, 88, 92, 96].map((w, i) => (
          <Skeleton key={i} width={w} height={20} borderRadius={4} />
        ))}
      </nav>

      {/* ── Stats bar (mirrors Overview.statsBar) ── */}
      <div className={styles.statsBar}>
        <div className={styles.statsGroup}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.statItem}>
              <Skeleton width={42} height={26} borderRadius={4} />
              <Skeleton width={28} height={9} borderRadius={3} />
            </div>
          ))}
        </div>
        <div className={styles.statsDivider} />
        <div className={styles.statsGroup}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.statItem}>
              <Skeleton width={36} height={22} borderRadius={4} />
              <Skeleton width={28} height={9} borderRadius={3} />
            </div>
          ))}
        </div>
        <div className={styles.statsDivider} />
        <div className={styles.statsGroup}>
          {[0, 1].map((i) => (
            <div key={i} className={styles.statItem}>
              <Skeleton width={48} height={26} borderRadius={4} />
              <Skeleton width={32} height={9} borderRadius={3} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Content blocks ── */}
      <div className={styles.blocks}>
        <div className={styles.card}>
          <Skeleton width={160} height={14} borderRadius={4} />
          <Skeleton height={260} borderRadius={10} />
        </div>
        <div className={styles.card}>
          <Skeleton width={140} height={14} borderRadius={4} />
          <div className={styles.lineupRows}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={56} borderRadius={8} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
