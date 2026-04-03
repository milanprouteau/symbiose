import Skeleton from "@/components/ui/Skeleton";
import styles from "./loading.module.scss";

export default function PlayerLoading() {
  return (
    <div className={styles.container}>
      {/* Hero */}
      <div className={styles.hero}>
        <Skeleton width={200} height={260} borderRadius={12} />
        <div className={styles.heroInfo}>
          <Skeleton width={240} height={32} borderRadius={6} />
          <Skeleton width={140} height={14} borderRadius={4} />
          <div className={styles.statRow}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.statItem}>
                <Skeleton width={48} height={28} borderRadius={4} />
                <Skeleton width={32} height={10} borderRadius={3} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} width={80} height={32} borderRadius={8} />
        ))}
      </div>

      {/* Content blocks */}
      <div className={styles.blocks}>
        <Skeleton height={180} borderRadius={10} />
        <Skeleton height={240} borderRadius={10} />
      </div>
    </div>
  );
}
