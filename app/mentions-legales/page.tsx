import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: false },
};

export default function MentionsLegales() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mentions légales</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>Éditeur</h2>
        <p>Ce site est édité par SymbioseBB.</p>
        <p>Contact : <a href="https://symbiosebb.fr" className={styles.link}>symbiosebb.fr</a></p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Hébergement</h2>
        <p>Ce site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Données personnelles</h2>
        <p>
          Ce site ne collecte aucune donnée personnelle. Aucun cookie de traçage n&apos;est utilisé.
          Les données statistiques affichées proviennent de sources publiques.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, graphiques, logos, images)
          est la propriété de SymbioseBB et est protégé par le droit d&apos;auteur.
          Toute reproduction sans autorisation est interdite.
        </p>
      </section>
    </div>
  );
}
