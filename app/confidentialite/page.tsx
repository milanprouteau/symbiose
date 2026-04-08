import type { Metadata } from "next";
import styles from "../mentions-legales/page.module.scss";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false, follow: false },
};

export default function Confidentialite() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Politique de confidentialité</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>Données collectées</h2>
        <p>
          Ce site collecte des données de navigation anonymes afin d&apos;améliorer l&apos;expérience
          utilisateur. Ces données incluent les pages visitées, la durée des visites et le type
          d&apos;appareil utilisé.
        </p>
        <p>
          Aucune donnée personnelle identifiable (nom, email, adresse IP) n&apos;est collectée
          ou stockée.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Outil d&apos;analyse</h2>
        <p>
          Nous utilisons <strong>PostHog</strong> (PostHog Inc.) pour analyser l&apos;audience du site.
          Les données sont traitées de manière anonyme, sans cookie de traçage et sans
          enregistrement de l&apos;adresse IP.
        </p>
        <p>
          En savoir plus :{" "}
          <a href="https://posthog.com/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>
            posthog.com/privacy
          </a>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Cookies</h2>
        <p>
          Ce site n&apos;utilise pas de cookies de traçage ou publicitaires. Aucun consentement
          n&apos;est requis.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Vos droits</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
          d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
          Pour toute demande, contactez-nous via{" "}
          <a href="https://symbiosebb.fr" className={styles.link}>symbiosebb.fr</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Responsable du traitement</h2>
        <p>SymbioseBB — <a href="https://symbiosebb.fr" className={styles.link}>symbiosebb.fr</a></p>
      </section>
    </div>
  );
}
