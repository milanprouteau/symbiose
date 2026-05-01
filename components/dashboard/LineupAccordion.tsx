"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { LineupEntry, LineupStatBlock } from "@/types/stats";
import styles from "./Overview.module.scss";

type Props = {
  lineups: LineupEntry[];
  currentPlayerId: number;
};

function formatMinutes(totalSeconds: number): string {
  return `${Math.round(totalSeconds / 60)} min`;
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function toRatio(turnovers: number, possessions: number): string {
  if (!possessions) return "—";
  return `${((turnovers / possessions) * 100).toFixed(1)}%`;
}

type StatRowDef = {
  label: string;
  get: (b: LineupStatBlock) => string;
  higherIsBetter: boolean;
  /** Fixed max for the gauge (e.g., 100 for percentage stats). Undefined = scale relative to max(n1, n2). */
  scale?: number;
};

const STAT_ROWS: StatRowDef[] = [
  { label: "FG%",   get: (b) => pct(b.fgPct),                                    higherIsBetter: true,  scale: 100 },
  { label: "3PT%",  get: (b) => pct(b.threePtPct),                                higherIsBetter: true,  scale: 100 },
  { label: "eFG%",  get: (b) => pct(b.eFgPct),                                    higherIsBetter: true,  scale: 100 },
  { label: "TS%",   get: (b) => pct(b.trueShooting),                              higherIsBetter: true,  scale: 100 },
  { label: "AST",   get: (b) => String(b.assists),                                higherIsBetter: true },
  { label: "STL",   get: (b) => String(b.steals),                                 higherIsBetter: true },
  { label: "BLK",   get: (b) => String(b.blocks),                                 higherIsBetter: true },
  { label: "TO%",   get: (b) => toRatio(b.turnovers, b.possessions),              higherIsBetter: false, scale: 100 },
  { label: "OR",    get: (b) => String(b.offRebounds),                            higherIsBetter: true },
  { label: "DR",    get: (b) => String(b.defRebounds),                            higherIsBetter: true },
];

const detailVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeInOut" as const } },
  exit:    { height: 0, opacity: 0,      transition: { duration: 0.18, ease: "easeInOut" as const } },
};

export default function LineupAccordion({ lineups, currentPlayerId }: Props) {
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className={styles.lineupAccordion}>
      {lineups.map((lu, i) => {
        const isOpen = openSet.has(i);
        const hasDetail = !!(lu.teamStats && lu.opponentStats);

        return (
          <div key={lu.idHash} className={styles.lineupItem}>
            <button
              className={`${styles.lineupRow} ${isOpen ? styles.lineupRowOpen : ""}`}
              onClick={() => toggle(i)}
            >
              <span className={styles.lineupRank}>{i + 1}</span>

              <div className={styles.lineupNames}>
                {lu.athletes.map((a) => (
                  <span
                    key={a.id}
                    className={`${styles.lineupName} ${a.id === currentPlayerId ? styles.lineupNameHighlight : ""}`}
                  >
                    {a.name}
                  </span>
                ))}
              </div>

              <div className={styles.lineupMiniStats}>
                <span className={styles.lineupMiniStat}>
                  <span className={styles.lineupMiniVal}>{lu.offenseRating.toFixed(1)}</span>
                  <span className={styles.lineupMiniLabel}>OFF</span>
                </span>
                <span className={styles.lineupMiniStat}>
                  <span className={styles.lineupMiniVal}>{lu.defenseRating.toFixed(1)}</span>
                  <span className={styles.lineupMiniLabel}>DEF</span>
                </span>
                <span className={styles.lineupMiniStat}>
                  <span className={`${styles.lineupMiniVal} ${lu.netRating >= 0 ? styles.lineupPositive : styles.lineupNegative}`}>
                    {lu.netRating >= 0 ? "+" : ""}{lu.netRating.toFixed(1)}
                  </span>
                  <span className={styles.lineupMiniLabel}>NET</span>
                </span>
                <span className={styles.lineupMiniStat}>
                  <span className={styles.lineupMiniVal}>{formatMinutes(lu.totalSeconds)}</span>
                  <span className={styles.lineupMiniLabel}>TEMPS</span>
                </span>
              </div>

              {hasDetail && (
                <span className={`${styles.lineupChevron} ${isOpen ? styles.lineupChevronOpen : ""}`}>
                  ▾
                </span>
              )}
            </button>

            <AnimatePresence initial={false}>
              {isOpen && lu.teamStats && lu.opponentStats && (
                <motion.div
                  key="detail"
                  variants={detailVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ overflow: "hidden" }}
                >
                  <div className={styles.lineupDetail}>
                    <div className={styles.lineupDetailTime}>
                      {formatMinutes(lu.totalSeconds)}
                    </div>
                    <div className={styles.lineupCompareHeader}>
                      <span>LINEUP</span>
                      <span>STAT</span>
                      <span>ADVERSE</span>
                    </div>
                    {STAT_ROWS.map(({ label, get, higherIsBetter, scale }, rowIdx) => {
                      const v1 = get(lu.teamStats!);
                      const v2 = get(lu.opponentStats!);
                      const n1 = parseFloat(v1);
                      const n2 = parseFloat(v2);
                      const teamBetter = higherIsBetter ? n1 > n2 : n1 < n2;
                      const oppBetter  = higherIsBetter ? n2 > n1 : n2 < n1;
                      const a1 = Math.abs(n1) || 0;
                      const a2 = Math.abs(n2) || 0;
                      const denom = scale ?? Math.max(a1, a2);
                      const leftShare  = denom > 0 ? Math.min((a1 / denom) * 100, 100) : 0;
                      const rightShare = denom > 0 ? Math.min((a2 / denom) * 100, 100) : 0;
                      const baseDelay = 0.18 + rowIdx * 0.05;
                      const leftDuration  = 0.45 + (leftShare  / 100) * 0.6;
                      const rightDuration = 0.45 + (rightShare / 100) * 0.6;
                      return (
                        <div key={label} className={styles.lineupCompareRow}>
                          <span className={`${styles.lineupCompareVal} ${styles.lineupCompareLeft} ${teamBetter ? styles.lineupBetter : ""}`}>
                            {v1}
                          </span>
                          <span className={styles.lineupCompareLabel}>{label}</span>
                          <span className={`${styles.lineupCompareVal} ${styles.lineupCompareRight} ${oppBetter ? styles.lineupBetter : ""}`}>
                            {v2}
                          </span>
                          <div className={styles.lineupCompareBar} aria-hidden="true">
                            <div className={styles.lineupCompareBarTrack}>
                              <motion.div
                                className={`${styles.lineupCompareBarSeg} ${styles.lineupCompareBarLeft} ${teamBetter ? styles.lineupBarBetter : ""}`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${leftShare}%` }}
                                transition={{ duration: leftDuration, delay: baseDelay, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <div className={styles.lineupCompareBarTrack}>
                              <motion.div
                                className={`${styles.lineupCompareBarSeg} ${styles.lineupCompareBarRight} ${oppBetter ? styles.lineupBarBetter : ""}`}
                                initial={{ width: "0%" }}
                                animate={{ width: `${rightShare}%` }}
                                transition={{ duration: rightDuration, delay: baseDelay, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
