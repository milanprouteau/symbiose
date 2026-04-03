import Skeleton from "@/components/ui/Skeleton";
import styles from "./loading.module.scss";

export default function CompareLoading() {
  return (
    <div className={styles.container}>
      {/* Selects */}
      <div className={styles.selects}>
        <Skeleton height={40} borderRadius={8} />
        <Skeleton height={40} borderRadius={8} />
      </div>

      {/* Profile cards */}
      <div className={styles.profiles}>
        <div className={styles.profileCard}>
          <Skeleton width={120} height={140} borderRadius={10} />
          <Skeleton width={90} height={14} borderRadius={4} />
          <Skeleton width={60} height={10} borderRadius={3} />
        </div>
        <Skeleton width={40} height={28} borderRadius={4} />
        <div className={styles.profileCard}>
          <Skeleton width={120} height={140} borderRadius={10} />
          <Skeleton width={90} height={14} borderRadius={4} />
          <Skeleton width={60} height={10} borderRadius={3} />
        </div>
      </div>

      {/* Sections */}
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={44} borderRadius={6} />
      ))}
    </div>
  );
}
