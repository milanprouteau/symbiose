"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, ArrowRight, ArrowUp, ArrowDown, Minus } from "lucide-react";
import styles from "./PlayerTable.module.scss";
import { getPreLotteryOrder, simulateLottery, type PickSlot } from "@/lib/draft2026";
import { NBA_TEAMS, teamLogo, type TeamAbbr } from "@/lib/nbaTeams";

const ALL_TEAMS = Object.keys(NBA_TEAMS) as TeamAbbr[];

export type PlayerEntry = {
  id: number;
  name: string;
  team: string;
  conference: string;
  position: string;
  games: number;
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
  fgPct: number;
  threePct: number;
  ftPct: number;
  usage: number;
  mockDraftPick?: number;
  sis?: number | null;
  sisPx?: number | null;
  nbaProfile?: { label: string; confidence: number } | null;
};

type SortKey = keyof PlayerEntry;
type SortDir = "asc" | "desc";




const COLUMNS: { key: SortKey; label: string; w: string }[] = [
  { key: "name",     label: "Joueur",  w: "w44" },
  { key: "position", label: "Pos",     w: "w12" },
  { key: "team",     label: "Équipe",  w: "w28" },
  { key: "games",    label: "MJ",      w: "w12" },
  { key: "ppg",      label: "PPG",     w: "w14" },
  { key: "rpg",      label: "RPG",     w: "w14" },
  { key: "apg",      label: "APG",     w: "w14" },
  { key: "mpg",      label: "MPG",     w: "w14" },
  { key: "fgPct",    label: "FG%",     w: "w14" },
  { key: "threePct", label: "3P%",     w: "w14" },
  { key: "ftPct",    label: "FT%",     w: "w14" },
  { key: "usage",    label: "USG%",    w: "w14" },
  { key: "sis",      label: "SIS",     w: "w14" },
  { key: "sisPx",    label: "SIS-Px",  w: "w14" },
];

export default function PlayerTable({ players }: { players: PlayerEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("mockDraftPick");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pickOrder, setPickOrder] = useState<PickSlot[]>(() => getPreLotteryOrder());
  const [isSimulated, setIsSimulated] = useState(false);
  const [overlay, setOverlay] = useState<{
    open: boolean;
    phase: "intro" | "revealMid" | "revealTop4" | "recap" | "closed";
    midRevealedCount: number;   // 0-10 (picks 14 → 5)
    topRevealedCount: number;   // 0-4  (picks 4 → 1)
    topRollingPick: number | null;
    topRollingLogo: TeamAbbr;
    topLanded: boolean;         // logo courant fixé sur le winner
  }>({
    open: false,
    phase: "closed",
    midRevealedCount: 0,
    topRevealedCount: 0,
    topRollingPick: null,
    topRollingLogo: "WAS",
    topLanded: false,
  });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const ownerByPick = useMemo(() => {
    const m = new Map<number, PickSlot>();
    pickOrder.forEach((p) => m.set(p.pick, p));
    return m;
  }, [pickOrder]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const handleSimulate = useCallback(() => {
    clearTimers();
    const next = simulateLottery();
    setPickOrder(next);
    setIsSimulated(true);

    const ownerAt = (pick: number): TeamAbbr => {
      const slot = next.find((p) => p.pick === pick);
      return (slot?.owner ?? "WAS") as TeamAbbr;
    };

    // Phase 1 — intro
    setOverlay({
      open: true,
      phase: "intro",
      midRevealedCount: 0,
      topRevealedCount: 0,
      topRollingPick: null,
      topRollingLogo: ALL_TEAMS[0],
      topLanded: false,
    });

    let t = 0;
    const push = (delay: number, fn: () => void) => {
      timersRef.current.push(setTimeout(fn, delay));
    };

    // Intro dure 500ms puis on passe à revealMid
    t += 500;
    push(t, () => setOverlay((o) => ({ ...o, phase: "revealMid" })));

    // Phase 2 — révèle picks 14 → 5, 550ms entre chaque
    const MID_STEP = 550;
    for (let i = 0; i < 10; i++) {
      t += MID_STEP;
      push(t, () => setOverlay((o) => ({ ...o, midRevealedCount: i + 1 })));
    }

    // Breathing 500ms avant le drama
    t += 500;
    push(t, () => setOverlay((o) => ({ ...o, phase: "revealTop4" })));

    // Phase 3 — révèle picks 4 → 1 avec roll dramatique.
    // Seules les équipes encore en lice cyclent dans le roll (pool rétrécit à chaque pick).
    const winnersTop4 = [ownerAt(4), ownerAt(3), ownerAt(2), ownerAt(1)];
    const LANDED_PAUSE = 1800;

    for (let idx = 0; idx < 4; idx++) {
      const currentPick = 4 - idx; // 4, 3, 2, 1
      const winner = winnersTop4[idx];
      const pool = winnersTop4.slice(idx); // équipes encore en lice pour ce pick et les suivants

      // Pick #1 : une seule équipe restante → reveal direct, pas de roll.
      if (pool.length === 1) {
        push(t, () => setOverlay((o) => ({
          ...o,
          topRollingPick: currentPick,
          topRollingLogo: winner,
          topLanded: true,
          topRevealedCount: o.topRevealedCount + 1,
        })));
        t += LANDED_PAUSE + 1000; // +1s sur le #1 pour admirer l'état final
        continue;
      }

      // Durée du roll proportionnelle à la taille du pool (plus il y a d'équipes, plus c'est long).
      const rollDuration = pool.length >= 4 ? 1000 : pool.length === 3 ? 900 : 800;
      const tickMs = 70;
      const rollTicks = Math.max(8, Math.round(rollDuration / tickMs));

      // Shuffle du pool pour que les équipes ne défilent pas dans un ordre prévisible.
      const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
      const rollStart = t;

      push(rollStart, () => setOverlay((o) => ({
        ...o,
        topRollingPick: currentPick,
        topRollingLogo: shuffledPool[0],
        topLanded: false,
      })));

      for (let j = 0; j < rollTicks; j++) {
        const tickT = rollStart + Math.round(((j + 1) / rollTicks) * rollDuration);
        const logo = shuffledPool[j % shuffledPool.length];
        push(tickT, () => setOverlay((o) => ({ ...o, topRollingLogo: logo })));
      }

      const landT = rollStart + rollDuration + 40;
      push(landT, () => setOverlay((o) => ({
        ...o,
        topRollingLogo: winner,
        topLanded: true,
        topRevealedCount: o.topRevealedCount + 1,
      })));

      t = landT + LANDED_PAUSE;
    }

    // Auto-close après la dernière pause (plus de phase recap).
    push(t, () => setOverlay((o) => ({ ...o, open: false, phase: "closed" })));
  }, []);

  const closeOverlay = useCallback(() => {
    clearTimers();
    setOverlay((o) => ({ ...o, open: false, phase: "closed" }));
  }, []);

  const handleReset = useCallback(() => {
    clearTimers();
    setPickOrder(getPreLotteryOrder());
    setIsSimulated(false);
    setOverlay({
      open: false,
      phase: "closed",
      midRevealedCount: 0,
      topRevealedCount: 0,
      topRollingPick: null,
      topRollingLogo: "WAS",
      topLanded: false,
    });
  }, []);

  const sorted = useMemo(() => {
    return [...players].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (sortKey === "mockDraftPick") {
        const aPick = a.mockDraftPick ?? Infinity;
        const bPick = b.mockDraftPick ?? Infinity;
        return sortDir === "asc" ? aPick - bPick : bPick - aPick;
      }
      if (sortKey === "sis") {
        const aS = a.sis ?? -Infinity;
        const bS = b.sis ?? -Infinity;
        return sortDir === "asc" ? aS - bS : bS - aS;
      }
      if (sortKey === "sisPx") {
        const aS = a.sisPx ?? -Infinity;
        const bS = b.sisPx ?? -Infinity;
        return sortDir === "asc" ? aS - bS : bS - aS;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [players, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "team" || key === "position" || key === "mockDraftPick" ? "asc" : "desc");
    }
  }

  function arrow(key: SortKey) {
    if (key !== sortKey) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.simulateBtn}
          onClick={handleSimulate}
          disabled={overlay.open}
          title="Simule la lottery selon les probabilités officielles"
        >
          Lotterie
        </button>
        {isSimulated && !overlay.open && (
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Réinitialiser
          </button>
        )}
      </div>

      {overlay.open && (
        <LotteryOverlay
          phase={overlay.phase}
          pickOrder={pickOrder}
          midRevealedCount={overlay.midRevealedCount}
          topRevealedCount={overlay.topRevealedCount}
          topRollingPick={overlay.topRollingPick}
          topRollingLogo={overlay.topRollingLogo}
          topLanded={overlay.topLanded}
          onClose={closeOverlay}
        />
      )}
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            <th
              onClick={() => handleSort("mockDraftPick")}
              className={`${styles.rankHeader} ${sortKey === "mockDraftPick" ? styles.colHeaderActive : ""}`}
            >
              Prediction{arrow("mockDraftPick")}
            </th>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`${styles.colHeader} ${styles[col.w]} ${col.key === sortKey ? styles.colHeaderActive : ""}`}
              >
                {col.label}{arrow(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const slot = p.mockDraftPick ? ownerByPick.get(p.mockDraftPick) : undefined;
            // Delta = position pré-lottery (rank) - position actuelle (pick).
            // Positif = équipe a gagné des places (meilleur pick), négatif = perdu.
            const delta = isSimulated && slot?.lotteryRank != null
              ? slot.lotteryRank - slot.pick
              : null;
            return (
            <tr key={p.id} className={styles.bodyRow}>
              <td className={styles.rankCell}>
                <span className={styles.rankInner}>
                  {slot ? <TeamBadge slot={slot} /> : null}
                  <span className={styles.pickNumber}>
                    {p.mockDraftPick ? `#${p.mockDraftPick}` : "—"}
                  </span>
                  {delta != null && <DeltaBadge delta={delta} />}
                  {slot?.lotteryOdds ? (
                    <span className={styles.oddsLabel}>({slot.lotteryOdds.toFixed(1)}%)</span>
                  ) : null}
                </span>
              </td>
              {COLUMNS.map((col) => {
                const val = p[col.key];
                if (col.key === "name") {
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                      <Link href={`/player/${p.id}`} className={styles.nameLink}>
                        {val as string}
                      </Link>
                    </td>
                  );
                }
                if (col.key === "sis") {
                  const score = p.sis;
                  const color =
                    score == null ? undefined
                    : score >= 75 ? "var(--color-primary-orange)"
                    : score >= 65 ? "var(--color-primary-yellow)"
                    : score >= 55 ? "var(--color-text)"
                    : "var(--color-text-muted)";
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`} style={{ color, fontWeight: score != null && score >= 65 ? 600 : undefined }}>
                      {score != null ? score.toFixed(1) : "—"}
                    </td>
                  );
                }
                if (col.key === "sisPx") {
                  const score = p.sisPx;
                  const color =
                    score == null ? undefined
                    : score >= 60 ? "var(--color-primary-orange)"
                    : score >= 50 ? "var(--color-primary-yellow)"
                    : score >= 40 ? "var(--color-text)"
                    : "var(--color-text-muted)";
                  return (
                    <td key={col.key} className={`${styles.cell} ${styles[col.w]}`} style={{ color, fontWeight: score != null && score >= 50 ? 600 : undefined }}>
                      {score != null ? score.toFixed(1) : "—"}
                    </td>
                  );
                }
                const display = typeof val === "object" ? null : val;
                return (
                  <td key={col.key} className={`${styles.cell} ${styles[col.w]}`}>
                    {display}
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className={`${styles.deltaBadge} ${styles.deltaUp}`} title={`+${delta} place${delta > 1 ? "s" : ""}`}>
        <ArrowUp aria-hidden="true" />
        {delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className={`${styles.deltaBadge} ${styles.deltaDown}`} title={`${delta} place${delta < -1 ? "s" : ""}`}>
        <ArrowDown aria-hidden="true" />
        {Math.abs(delta)}
      </span>
    );
  }
  return (
    <span className={`${styles.deltaBadge} ${styles.deltaEqual}`} title="Pas de changement">
      <Minus aria-hidden="true" />
    </span>
  );
}

function TeamBadge({ slot }: { slot: PickSlot }) {
  const owner = NBA_TEAMS[slot.owner as TeamAbbr];
  const origin = NBA_TEAMS[slot.origin as TeamAbbr];
  const swapped = slot.owner !== slot.origin;
  const oddsLabel = slot.lotteryOdds ? ` — ${slot.lotteryOdds.toFixed(1)}%` : "";

  let tooltip = `${owner.city} ${owner.name}${oddsLabel}`;
  if (swapped) tooltip = `${owner.city} ${owner.name} (via ${origin.city} ${origin.name})${oddsLabel}`;
  if (slot.isProtected && slot.protectionNote) tooltip = `${origin.city} ${origin.name} — ${slot.protectionNote}${oddsLabel}`;

  return (
    <span className={styles.teamBadge} title={tooltip}>
      {swapped ? (
        <>
          <Image
            src={teamLogo(slot.origin as TeamAbbr)}
            alt={origin.abbr}
            width={16}
            height={16}
            className={`${styles.teamLogo} ${styles.logoOrigin}`}
          />
          <ArrowRight className={styles.swapArrow} aria-hidden="true" />
          <Image
            src={teamLogo(slot.owner as TeamAbbr)}
            alt={owner.abbr}
            width={20}
            height={20}
            className={styles.teamLogo}
          />
        </>
      ) : (
        <Image
          src={teamLogo(slot.owner as TeamAbbr)}
          alt={owner.abbr}
          width={20}
          height={20}
          className={styles.teamLogo}
        />
      )}
      {slot.isProtected && (
        <span className={styles.lockMark} aria-label="Pick protégé">
          <Lock aria-hidden="true" />
        </span>
      )}
    </span>
  );
}

type OverlayPhase = "intro" | "revealMid" | "revealTop4" | "recap" | "closed";

function LotteryOverlay({
  phase,
  pickOrder,
  midRevealedCount,
  topRevealedCount,
  topRollingPick,
  topRollingLogo,
  topLanded,
  onClose,
}: {
  phase: OverlayPhase;
  pickOrder: PickSlot[];
  midRevealedCount: number;
  topRevealedCount: number;
  topRollingPick: number | null;
  topRollingLogo: TeamAbbr;
  topLanded: boolean;
  onClose: () => void;
}) {
  const lotteryPicks = pickOrder
    .filter((p) => p.pick >= 1 && p.pick <= 14)
    .sort((a, b) => a.pick - b.pick);

  // picks 14 → 5 (ordre de reveal)
  const midPicks = lotteryPicks.filter((p) => p.pick >= 5).slice().sort((a, b) => b.pick - a.pick);
  // picks 4 → 1 (ordre de reveal)
  const top4Picks = lotteryPicks.filter((p) => p.pick <= 4).slice().sort((a, b) => b.pick - a.pick);

  // Picks déjà révélés dans le top 4, par numéro (ex: revealedCount=2 → [4,3])
  const topRevealedPicks = [4, 3, 2, 1].slice(0, topRevealedCount);

  const currentTopSlot = topRollingPick != null
    ? lotteryPicks.find((p) => p.pick === topRollingPick)
    : undefined;
  const currentTopTeam = topLanded && currentTopSlot ? NBA_TEAMS[currentTopSlot.owner as TeamAbbr] : null;


  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.overlayInner}>
        <div className={styles.overlayHeader}>
          <span className={styles.overlayEyebrow}>NBA Draft Lottery 2026</span>
          <span className={styles.overlayHeadline}>
            {phase === "intro"       && "Révélation des picks"}
            {phase === "revealMid"   && "Picks #14 → #5"}
            {phase === "revealTop4"  && topRollingPick != null && `Pick #${topRollingPick}`}
          </span>
        </div>

        {/* Phase 3 : gros logo central + annonce winner */}
        {phase === "revealTop4" && topRollingPick != null && (
          <div className={styles.top4Center}>
            <div className={`${styles.overlayLogoWrap} ${topLanded ? styles.overlayLanded : styles.overlayRolling}`}>
              <Image
                key={topRollingLogo}
                src={teamLogo(topRollingLogo)}
                alt={currentTopTeam ? `${currentTopTeam.city} ${currentTopTeam.name}` : "Tirage en cours"}
                width={220}
                height={220}
                className={styles.overlayLogo}
                priority
              />
            </div>
            <div className={styles.overlayLabel}>
              {topLanded && currentTopTeam ? (
                <>
                  <div className={styles.overlayTeamName}>
                    {currentTopTeam.city} <strong>{currentTopTeam.name}</strong>
                  </div>
                  <div className={styles.overlaySubLabel}>
                    {topRollingPick === 1 ? "remportent le 1er choix" : `Pick #${topRollingPick}`}
                  </div>
                </>
              ) : (
                <div className={styles.overlayTeamName}>
                  <span className={styles.overlayTicker}>Tirage…</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top 4 strip (affiché durant revealTop4, les cartes se révèlent au fur et à mesure) */}
        {phase === "revealTop4" && (
          <div className={styles.top4Strip}>
            {top4Picks.map((slot) => {
              const revealed = topRevealedPicks.includes(slot.pick);
              return <PickCard key={slot.pick} slot={slot} revealed={revealed} size="md" />;
            })}
          </div>
        )}

        {/* Mid row (picks 14-5) visible à partir de phase 2 */}
        {(phase === "revealMid" || phase === "revealTop4") && (
          <div className={styles.midRow}>
            {midPicks.map((slot, i) => {
              const revealed = i < midRevealedCount;
              return <PickCard key={slot.pick} slot={slot} revealed={revealed} size="sm" />;
            })}
          </div>
        )}

      </div>
    </div>
  );
}

function PickCard({
  slot,
  revealed,
  size,
}: {
  slot: PickSlot;
  revealed: boolean;
  size: "sm" | "md";
}) {
  const owner = NBA_TEAMS[slot.owner as TeamAbbr];
  const origin = NBA_TEAMS[slot.origin as TeamAbbr];
  const swapped = slot.owner !== slot.origin;

  return (
    <div className={`${styles.pickCard} ${styles[`pickCard_${size}`]} ${revealed ? styles.pickCardRevealed : ""}`}>
      <div className={styles.pickCardFaceWrap}>
        <div className={`${styles.pickCardFace} ${styles.pickCardFront}`}>
          <span className={styles.pickCardNumber}>#{slot.pick}</span>
        </div>
        <div className={`${styles.pickCardFace} ${styles.pickCardBack}`}>
          <Image
            src={teamLogo(slot.owner as TeamAbbr)}
            alt={owner.abbr}
            width={size === "sm" ? 36 : 48}
            height={size === "sm" ? 36 : 48}
            className={styles.pickCardLogo}
          />
          <div className={styles.pickCardMeta}>
            <span className={styles.pickCardNumSmall}>#{slot.pick}</span>
            <span className={styles.pickCardTeam}>{owner.abbr}</span>
            {swapped && (
              <span className={styles.pickCardVia}>via {origin.abbr}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
