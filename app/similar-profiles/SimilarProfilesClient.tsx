"use client";

import { useState, useMemo } from "react";
import {
  findSimilarPlayersWeighted,
  distanceToScore,
  DEFAULT_WEIGHTS,
  type StatWeights,
  type StatKey,
} from "@/lib/similarPlayers";
import type { PlayerProfileData } from "./page";
import styles from "./page.module.scss";

const STAT_DEFS: { key: StatKey; label: string }[] = [
  { key: "sisPx_pts",    label: "Scoring"     },
  { key: "sisPx_reb",    label: "Rebonds"      },
  { key: "sisPx_ast",    label: "Playmaking"   },
  { key: "sisPx_mpg",    label: "Minutes"      },
  { key: "sisPx_stl",    label: "Steals"       },
  { key: "sisPx_blk",    label: "Blocks"       },
  { key: "sisPx_porpag", label: "Impact"       },
];

const WEIGHT_STEPS = [0, 0.5, 1, 1.5, 2, 3];
const WEIGHT_LABELS: Record<number, string> = { 0: "OFF", 0.5: "×0.5", 1: "×1", 1.5: "×1.5", 2: "×2", 3: "×3" };

const POS_COLORS: Record<string, string> = {
  Guard:   "var(--color-primary-orange)",
  Forward: "#60b8f5",
  Center:  "#9b7fe8",
};

function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-primary-orange)";
  if (score >= 65) return "#f5c842";
  if (score >= 50) return "rgba(255,255,255,0.8)";
  return "#888884";
}

export default function SimilarProfilesClient({ players }: { players: PlayerProfileData[] }) {
  const [weights, setWeights] = useState<StatWeights>({ ...DEFAULT_WEIGHTS });
  const [filterByPos, setFilterByPos] = useState(true);

  const allResults = useMemo(() =>
    players.map((p) => {
      const scores: Record<StatKey, number> = {
        sisPx_pts:    p.sisPx_pts,
        sisPx_reb:    p.sisPx_reb,
        sisPx_ast:    p.sisPx_ast,
        sisPx_mpg:    p.sisPx_mpg,
        sisPx_stl:    p.sisPx_stl,
        sisPx_blk:    p.sisPx_blk,
        sisPx_porpag: p.sisPx_porpag,
      };
      return {
        player: p,
        similar: findSimilarPlayersWeighted(scores, p.sisPx, p.posGroup, weights, 5, filterByPos),
      };
    }),
    [players, weights, filterByPos],
  );

  const setWeight = (key: StatKey, val: number) =>
    setWeights((w) => ({ ...w, [key]: val }));

  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });
  const allDefault = Object.values(weights).every((v) => v === 1);

  return (
    <div className={styles.clientRoot}>

      {/* ── Controls ── */}
      <div className={styles.weightPanel}>
        <div className={styles.weightGrid}>
          {STAT_DEFS.map(({ key, label }) => {
            const val = weights[key];
            const isOff = val === 0;
            return (
              <div key={key} className={`${styles.weightRow} ${isOff ? styles.weightRowOff : ""}`}>
                <span className={styles.weightLabel}>{label}</span>
                <div className={styles.weightSteps}>
                  {WEIGHT_STEPS.map((step) => (
                    <button
                      key={step}
                      onClick={() => setWeight(key, step)}
                      className={`${styles.weightStep} ${val === step ? styles.weightStepActive : ""}`}
                    >
                      {WEIGHT_LABELS[step]}
                    </button>
                  ))}
                </div>
                <span className={`${styles.weightVal} ${isOff ? styles.weightValOff : ""}`}>
                  {isOff ? "—" : `×${val}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.posFilterRow}>
          <button
            className={`${styles.posFilterBtn} ${filterByPos ? styles.posFilterActive : ""}`}
            onClick={() => setFilterByPos(true)}
          >
            Même poste
          </button>
          <button
            className={`${styles.posFilterBtn} ${!filterByPos ? styles.posFilterActive : ""}`}
            onClick={() => setFilterByPos(false)}
          >
            Tous postes
          </button>
        </div>

        {!allDefault && (
          <button className={styles.resetBtn} onClick={resetWeights}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Player cards ── */}
      <div className={styles.cardList}>
        {allResults.map(({ player: p, similar }) => (
          <div key={p.name} className={styles.card}>

            {/* Header */}
            <div className={styles.cardHeader}>
              <div className={styles.cardIdentity}>
                <a href={p.id ? `/player/${p.id}` : "#"} className={styles.cardName}>{p.name}</a>
                <span className={styles.cardMeta}>
                  <span className={styles.posTag} style={{ color: POS_COLORS[p.posGroup] ?? "inherit" }}>
                    {p.posGroup}
                  </span>
                  {" · "}{p.team}
                  {p.overall != null && <>{" · "}#{p.overall}</>}
                  {" · "}<span className={styles.sisPxTotal}>{p.sisPx} SisPx</span>
                </span>
                <div className={styles.projStats}>
                  <span>{p.proj_pts.toFixed(1)} pts</span>
                  <span>{p.proj_reb.toFixed(1)} reb</span>
                  <span>{p.proj_ast.toFixed(1)} ast</span>
                  <span className={styles.projLabel}>proj. NBA/36</span>
                </div>
              </div>
              <div className={styles.cardStats}>
                {STAT_DEFS.map(({ key, label }) => {
                  const val = p[key as keyof PlayerProfileData] as number;
                  const isOff = weights[key] === 0;
                  const boosted = weights[key] > 1;
                  return (
                    <div
                      key={key}
                      className={`${styles.statChip} ${isOff ? styles.statChipOff : ""} ${boosted ? styles.statChipBoosted : ""}`}
                    >
                      <span className={styles.statChipVal}>{val.toFixed(0)}</span>
                      <span className={styles.statChipLabel}>{label}</span>
                      <div className={styles.statChipBar}>
                        <div className={styles.statChipBarFill} style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Similar players */}
            <ol className={styles.similarList}>
              {similar.map((sp, i) => {
                const score = distanceToScore(sp.distance);
                return (
                  <li key={`${sp.name}-${sp.draftYear}`} className={styles.similarRow}>
                    <span className={styles.similarRank}>{i + 1}</span>
                    <span className={styles.similarName}>{sp.name}</span>
                    <span className={styles.similarMeta}>
                      <span style={{ color: POS_COLORS[sp.posGroup] ?? "inherit", fontSize: "0.7rem" }}>
                        {sp.posGroup}
                      </span>
                      {" · "}{sp.team}{" · "}{sp.draftYear}
                    </span>
                    <span className={styles.similarPick}>#{sp.overall ?? "?"}</span>
                    <span className={styles.similarSisPx}>{sp.sisPx}</span>
                    <span className={styles.similarScore} style={{ color: scoreColor(score) }}>
                      {score}%
                    </span>
                    <div className={styles.similarBar}>
                      <div
                        className={styles.similarBarFill}
                        style={{ width: `${score}%`, background: scoreColor(score) }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>

          </div>
        ))}
      </div>
    </div>
  );
}
