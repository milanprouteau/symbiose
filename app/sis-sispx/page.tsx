import type { Metadata } from "next";
import prospectsSisData from "@/data/prospects-sis.json";
import draftSisData from "@/data/players/draft-sis-all.json";
import SisTable, { type SisRow } from "./SisTable";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "SIS / SIS-Px — Scores internes",
  robots: { index: false, follow: false },
};

export default function SisSispxPage() {
  const prospects: SisRow[] = (prospectsSisData as typeof prospectsSisData).map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    year: null,
    overall: null,
    draftTeam: null,
    position: p.position ?? null,
    games: p.games,
    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
    usage: p.usage,
    sis: p.sis,
    sisPx: p.sisPx,
  }));

  const history: SisRow[] = (draftSisData as typeof draftSisData).map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    year: p.year,
    overall: p.overall ?? null,
    draftTeam: p.draftTeam ?? null,
    position: p.position ?? null,
    games: p.games,
    ppg: p.ppg,
    rpg: p.rpg,
    apg: p.apg,
    usage: p.usage,
    sis: p.sis.total,
    sisPx: p.sisPx.total,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>SIS / SIS-Px</h1>
          <p className={styles.subtitle}>
            {prospects.length} prospects 2026 · {history.length} draftés 2005–2025
          </p>
        </div>
        <a href="/sis-sispx/calibration" className={styles.calibLink}>
          ⚙ Calibration
        </a>
      </header>
      <SisTable rows={[...prospects, ...history]} />
    </div>
  );
}
