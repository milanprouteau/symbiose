import styles from "./page.module.scss";

export default function DashboardPage() {
  return (
    <div>
      <h1 className={styles.title}>
        Symbiose
      </h1>
      <h2 className={styles.subtitle}>
        Dashboard basket stat
      </h2>
    </div>
  );
}