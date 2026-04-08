"use client";

import { useState, useMemo } from "react";
import {
  findSimilarPlayersWeighted,
  distanceToScore,
  DEFAULT_WEIGHTS,
  type StatWeights,
} from "@/lib/similarPlayers";
import type { PlayerProfileData } from "./page";
import styles from "./page.module.scss";

const STAT_DEFS: { key: keyof StatWeights; label: string; statKey: keyof PlayerProfileData; decimals: number; suffix?: string }[] = [
  { key: "points",        label: "PPG",    statKey: "points",        decimals: 1 },
  { key: "rebounds",      label: "RPG",    statKey: "rebounds",      decimals: 1 },
  { key: "assists",       label: "APG",    statKey: "assists",       decimals: 1 },
  { key: "steals",        label: "SPG",    statKey: "steals",        decimals: 1 },
  { key: "blocks",        label: "BPG",    statKey: "blocks",        decimals: 1 },
  { key: "fieldGoalsPct", label: "FG%",    statKey: "fieldGoalsPct", decimals: 1, suffix: "%" },
  { key: "usage",         label: "USG%",   statKey: "usage",         decimals: 1, suffix: "%" },
  { key: "threePtPct",    label: "3PT%",   statKey: "threePtPct",    decimals: 1, suffix: "%" },
  { key: "ftPct",         label: "FT%",    statKey: "ftPct",         decimals: 1, suffix: "%" },
  { key: "topg",          label: "TO/G",   statKey: "topg",          decimals: 1 },
  { key: "tsPct",         label: "TS%",    statKey: "tsPct",         decimals: 1, suffix: "%" },
  { key: "orebPct",       label: "OREB%",  statKey: "orebPct",       decimals: 1, suffix: "%" },
  { key: "astToRatio",    label: "AST/TO", statKey: "astToRatio",    decimals: 2 },
];

const WEIGHT_STEPS = [0, 0.5, 1, 1.5, 2, 3];
const WEIGHT_LABELS: Record<number, string> = { 0: "OFF", 0.5: "×0.5", 1: "×1", 1.5: "×1.5", 2: "×2", 3: "×3" };

function scoreColor(score: number): string {
  if (score >= 80) return "var(--color-primary-orange)";
  if (score >= 65) return "#f5c842";
  if (score >= 50) return "rgba(255,255,255,0.8)";
  return "#888884";
}

export default function SimilarProfilesClient({ players }: { players: PlayerProfileData[] }) {
  const [weights, setWeights] = useState<StatWeights>({ ...DEFAULT_WEIGHTS });

  const allResults = useMemo(() =>
    players.map((p) => ({
      player: p,
      similar: findSimilarPlayersWeighted(
        {
          points:        p.points,
          rebounds:      p.rebounds,
          assists:       p.assists,
          steals:        p.steals,
          blocks:        p.blocks,
          fieldGoalsPct: p.fieldGoalsPct,
          usage:         p.usage,
          threePtPct:    p.threePtPct,
          ftPct:         p.ftPct,
          topg:          p.topg,
          tsPct:         p.tsPct,
          orebPct:       p.orebPct,
          astToRatio:    p.astToRatio,
        },
        weights,
        5,
      ),
    })),
    [players, weights],
  );

  const setWeight = (key: keyof StatWeights, val: number) => {
    setWeights((w) => ({ ...w, [key]: val }));
  };

  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });

  const allDefault = Object.values(weights).every((v) => v === 1);

  return (
    <div className={styles.clientRoot}>

      {/* ── Weight panel ── */}
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
        {!allDefault && (
          <button className={styles.resetBtn} onClick={resetWeights}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Player cards ── */}
      <div className={styles.cardList}>
        {allResults.map(({ player: p, similar }) => (
          <div key={p.id} className={styles.card}>

            {/* Player header */}
            <div className={styles.cardHeader}>
              <div className={styles.cardIdentity}>
                <a href={`/player/${p.id}`} className={styles.cardName}>{p.name}</a>
                <span className={styles.cardMeta}>{p.position} · {p.team} · {p.games} G</span>
              </div>
              <div className={styles.cardStats}>
                {STAT_DEFS.map(({ key, label, statKey, decimals, suffix }) => {
                  const isOff = weights[key] === 0;
                  const boosted = weights[key] > 1;
                  return (
                    <div
                      key={key}
                      className={`${styles.statChip} ${isOff ? styles.statChipOff : ""} ${boosted ? styles.statChipBoosted : ""}`}
                    >
                      <span className={styles.statChipVal}>
                        {(p[statKey] as number).toFixed(decimals)}{suffix ?? ""}
                      </span>
                      <span className={styles.statChipLabel}>{label}</span>
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
                      {sp.position ?? "—"} · {sp.team} · {sp.draftYear}
                    </span>
                    <span className={styles.similarPick}>#{sp.overall}</span>
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
