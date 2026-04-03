import Link from "next/link";
import type { Metadata } from "next";
import styles from "./not-found.module.scss";

export const metadata: Metadata = {
  title: "Page introuvable",
};

export default function NotFound() {
  return (
    <div className={styles.container}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.message}>
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className={styles.link}>
        ← Retour aux joueurs
      </Link>
    </div>
  );
}
