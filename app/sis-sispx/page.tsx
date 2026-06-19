import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "SIS & SIS-Px — Comprendre nos indices | Symbiose",
  description:
    "SIS et SIS-Px sont les deux indices maison de Symbiose : l'un mesure l'impact actuel d'un joueur, l'autre projette son potentiel NBA. Explication des principes.",
};

const SIS_PILLARS = [
  "Efficacité offensive",
  "Impact défensif",
  "Efficacité avancée",
  "Activité (hustle)",
  "Rôle dans le système",
];

const PX_PILLARS = [
  "Physique",
  "Efficacité translatable",
  "Mobilité défensive",
  "Rôle projeté",
  "Adaptabilité NBA",
];

export default function SisSispxPage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <header className={styles.hero}>
        <h1 className={styles.title}>SIS &amp; SIS-Px</h1>
        <p className={styles.subtitle}>
          Deux lectures complémentaires d&apos;un même joueur : son impact aujourd&apos;hui,
          et son potentiel demain.
        </p>
        <p className={styles.intro}>
          Symbiose s&apos;appuie sur deux indices propriétaires, tous deux notés{" "}
          <strong>sur 100</strong>. Ils ne mesurent pas la même chose et se lisent
          ensemble. Le détail des pondérations et des seuils reste notre recette maison —
          voici les principes qui les animent.
        </p>
      </header>

      {/* Cartes comparatives */}
      <div className={styles.cards}>
        {/* SIS */}
        <section className={`${styles.card} ${styles.cardSis}`}>
          <p className={styles.cardTag}>Indice d&apos;impact</p>
          <h2 className={styles.cardName}>SIS</h2>
          <p className={styles.cardQuestion}>« Quel est son impact aujourd&apos;hui ? »</p>
          <p className={styles.cardLead}>
            Le <strong>Symbiose Impact Score</strong> mesure l&apos;impact réel d&apos;un joueur
            sur sa saison en cours, à partir de ses seules statistiques individuelles.
          </p>
          <ul className={styles.principles}>
            <li>
              <strong>100 % individuel</strong> : on neutralise tout ce qui dépend du niveau
              de l&apos;équipe autour, pour ne créditer que ce que le joueur génère lui-même.
            </li>
            <li>
              <strong>Ajusté par poste</strong> : meneurs, ailiers et intérieurs sont comparés
              à leurs pairs — un meneur n&apos;est pas pénalisé de contrer moins qu&apos;un pivot.
            </li>
            <li>
              <strong>Exigence de volume</strong> : en dessous d&apos;un minimum de matchs,
              aucun score n&apos;est attribué (échantillon trop faible).
            </li>
          </ul>
          <p className={styles.pillarsLabel}>Ce qu&apos;il pèse</p>
          <div className={styles.pillars}>
            {SIS_PILLARS.map((p) => (
              <span key={p} className={styles.pillar}>
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* SIS-Px */}
        <section className={`${styles.card} ${styles.cardPx}`}>
          <p className={styles.cardTag}>Indice de projection</p>
          <h2 className={styles.cardName}>SIS-Px</h2>
          <p className={styles.cardQuestion}>« Que peut-il devenir au niveau NBA ? »</p>
          <p className={styles.cardLead}>
            Le <strong>Symbiose Projection Index</strong> projette le potentiel d&apos;un joueur
            au niveau supérieur — sa « translatabilité » vers la NBA — plutôt que sa simple
            production universitaire.
          </p>
          <ul className={styles.principles}>
            <li>
              <strong>On valorise ce qui transfère</strong> : outils physiques, efficacité
              reproductible à plus haut niveau, profil défensif mobile.
            </li>
            <li>
              <strong>On regarde le rôle projeté</strong> : quel type de joueur il peut devenir
              dans une rotation NBA, pas seulement ses chiffres actuels.
            </li>
            <li>
              <strong>Mis en perspective historique</strong> : les profils sont resitués par
              rapport aux classes de draft passées.
            </li>
          </ul>
          <p className={styles.pillarsLabel}>Ce qu&apos;il pèse</p>
          <div className={styles.pillars}>
            {PX_PILLARS.map((p) => (
              <span key={p} className={styles.pillar}>
                {p}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Lire les deux ensemble */}
      <h2 className={styles.sectionTitle}>Les lire ensemble</h2>
      <div className={styles.combos}>
        <div className={styles.combo}>
          <span className={styles.comboLabel}>SIS élevé · SIS-Px modéré</span>
          <p className={styles.comboText}>
            Joueur <strong>déjà dominant en NCAA</strong> mais dont le profil transfère moins bien —
            typiquement un joueur très productif à son niveau, plus limité physiquement ou en marge
            de progression.
          </p>
        </div>
        <div className={styles.combo}>
          <span className={styles.comboLabel}>SIS modéré · SIS-Px élevé</span>
          <p className={styles.comboText}>
            Statistiques encore <strong>discrètes</strong>, mais des outils et une trajectoire qui
            laissent entrevoir un <strong>plafond NBA élevé</strong> — souvent un jeune joueur dans
            un rôle restreint.
          </p>
        </div>
        <div className={styles.combo}>
          <span className={styles.comboLabel}>Les deux élevés</span>
          <p className={styles.comboText}>
            <strong>Prospect d&apos;élite</strong> : il produit déjà à un haut niveau et son profil
            devrait continuer à monter au palier supérieur.
          </p>
        </div>
      </div>

      {/* Note recette maison */}
      <p className={styles.note}>
        <strong>Recette maison.</strong> Cette page présente uniquement les principes de
        conception. Les pondérations exactes, les seuils et les formules de calcul restent
        internes à Symbiose afin de préserver l&apos;originalité de la méthode.
      </p>
    </div>
  );
}
