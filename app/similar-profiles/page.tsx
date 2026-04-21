import type { Metadata } from "next";
import sispxMlData from "@/data/sispx_ml.json";
import SimilarProfilesClient from "./SimilarProfilesClient";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Profils similaires",
  robots: { index: false, follow: false },
};

export type PlayerProfileData = {
  id: number | null;
  name: string;
  team: string;
  posGroup: string;
  overall: number | null;
  sisPx: number;
  sisPx_pts: number;
  sisPx_reb: number;
  sisPx_ast: number;
  sisPx_mpg: number;
  sisPx_stl: number;
  sisPx_blk: number;
  sisPx_porpag: number;
  proj_pts: number;
  proj_reb: number;
  proj_ast: number;
};

export default function SimilarProfilesPage() {
  const players: PlayerProfileData[] = (sispxMlData as {
    id: number | null;
    name: string;
    team: string;
    posGroup: string;
    overall: number | null;
    sisPx: number;
    sisPx_pts: number;
    sisPx_reb: number;
    sisPx_ast: number;
    sisPx_mpg: number;
    sisPx_stl: number;
    sisPx_blk: number;
    sisPx_porpag: number;
    proj_pts: number;
    proj_reb: number;
    proj_ast: number;
  }[])
    .filter((p) => p.sisPx != null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      posGroup: p.posGroup,
      overall: p.overall,
      sisPx: p.sisPx,
      sisPx_pts: p.sisPx_pts,
      sisPx_reb: p.sisPx_reb,
      sisPx_ast: p.sisPx_ast,
      sisPx_mpg: p.sisPx_mpg,
      sisPx_stl: p.sisPx_stl,
      sisPx_blk: p.sisPx_blk,
      sisPx_porpag: p.sisPx_porpag,
      proj_pts: p.proj_pts,
      proj_reb: p.proj_reb,
      proj_ast: p.proj_ast,
    }))
    .sort((a, b) => b.sisPx - a.sisPx);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Profils similaires</h1>
        <p className={styles.subtitle}>
          {players.length} joueurs · Pondérez les composantes pour affiner les comparaisons
        </p>
      </header>
      <SimilarProfilesClient players={players} />
    </div>
  );
}
