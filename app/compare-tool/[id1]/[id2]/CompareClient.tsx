"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import RadarChart from "@/components/dashboard/RadarChart";
import type { RadarAxis, RadarPlayer } from "@/components/dashboard/RadarChart";
import type { PlayerDataBundle, PlayerSeasonStats } from "@/types/stats";
import type { Shot } from "@/types/player";
import { VIEW_BOX, scaleX, scaleY } from "@/components/dashboard/ShotChart/utils/scales";
import Court from "@/components/dashboard/ShotChart/Court";
import ScatterChart from "@/components/dashboard/ShotChart/charts/ScatterChart";
import ZoneChart from "@/components/dashboard/ShotChart/charts/ZoneChart";
import HexChart from "@/components/dashboard/ShotChart/charts/HexChart";
import HeatMap from "@/components/dashboard/ShotChart/charts/HeatMap";
import styles from "./CompareClient.module.scss";

export const COMPARE_AXES: RadarAxis[] = [
  { key: "ppg",   label: "PPG",   max: 30 },
  { key: "rpg",   label: "REB",   max: 12 },
  { key: "apg",   label: "AST",   max: 8 },
  { key: "spg",   label: "STL",   max: 3 },
  { key: "bpg",   label: "BLK",   max: 3 },
  { key: "fgPct", label: "FG%",   max: 70 },
  { key: "usage", label: "Usage", max: 40 },
];

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  player1: PlayerDataBundle | null;
  player2: PlayerDataBundle | null;
  shots1: Shot[];
  shots2: Shot[];
  id1: string;
  id2: string;
  allPlayers: IndexEntry[];
};

function toRadar(ps: PlayerSeasonStats, color: string): RadarPlayer {
  return {
    name: ps.name,
    color,
    values: {
      ppg: ps.points / (ps.games || 1),
      rpg: ps.rebounds.total / (ps.games || 1),
      apg: ps.assists / (ps.games || 1),
      spg: ps.steals / (ps.games || 1),
      bpg: ps.blocks / (ps.games || 1),
      fgPct: ps.fieldGoals.pct,
      usage: ps.usage,
    },
  };
}

/* ── Stat row helpers ── */

type StatRow = {
  label: string;
  v1: string | number;
  v2: string | number;
  better?: 1 | 2 | null;
};

type StatSection = {
  title: string;
  rows: StatRow[];
};

const cmp = (a: number, b: number): 1 | 2 | null =>
  a > b ? 1 : b > a ? 2 : null;

const cmpLow = (a: number, b: number): 1 | 2 | null =>
  a < b ? 1 : b < a ? 2 : null;

const pct = (v: number) => `${v.toFixed(1)}%`;
const fix1 = (v: number) => v.toFixed(1);

function buildStatSections(
  p1: PlayerSeasonStats,
  p2: PlayerSeasonStats
): StatSection[] {
  const g1 = p1.games || 1;
  const g2 = p2.games || 1;

  const ppg1 = p1.points / g1, ppg2 = p2.points / g2;
  const rpg1 = p1.rebounds.total / g1, rpg2 = p2.rebounds.total / g2;
  const apg1 = p1.assists / g1, apg2 = p2.assists / g2;
  const mpg1 = p1.minutes / g1, mpg2 = p2.minutes / g2;
  const spg1 = p1.steals / g1, spg2 = p2.steals / g2;
  const bpg1 = p1.blocks / g1, bpg2 = p2.blocks / g2;
  const topg1 = p1.turnovers / g1, topg2 = p2.turnovers / g2;
  const fpg1 = p1.fouls / g1, fpg2 = p2.fouls / g2;
  const orpg1 = p1.rebounds.offensive / g1, orpg2 = p2.rebounds.offensive / g2;
  const drpg1 = p1.rebounds.defensive / g1, drpg2 = p2.rebounds.defensive / g2;

  const ts1 = p1.trueShootingPct < 1 ? p1.trueShootingPct * 100 : p1.trueShootingPct;
  const ts2 = p2.trueShootingPct < 1 ? p2.trueShootingPct * 100 : p2.trueShootingPct;

  return [
    {
      title: "General",
      rows: [
        { label: "Games", v1: p1.games, v2: p2.games, better: null },
        { label: "Starts", v1: p1.starts, v2: p2.starts, better: null },
        { label: "MPG", v1: fix1(mpg1), v2: fix1(mpg2), better: null },
      ],
    },
    {
      title: "Offensive",
      rows: [
        { label: "PPG", v1: fix1(ppg1), v2: fix1(ppg2), better: cmp(ppg1, ppg2) },
        { label: "APG", v1: fix1(apg1), v2: fix1(apg2), better: cmp(apg1, apg2) },
        { label: "TO/G", v1: fix1(topg1), v2: fix1(topg2), better: cmpLow(topg1, topg2) },
        { label: "AST/TO", v1: fix1(p1.assistsTurnoverRatio), v2: fix1(p2.assistsTurnoverRatio), better: cmp(p1.assistsTurnoverRatio, p2.assistsTurnoverRatio) },
        { label: "Fouls/G", v1: fix1(fpg1), v2: fix1(fpg2), better: cmpLow(fpg1, fpg2) },
        { label: "Off. Rating", v1: fix1(p1.offensiveRating), v2: fix1(p2.offensiveRating), better: cmp(p1.offensiveRating, p2.offensiveRating) },
        { label: "Usage", v1: pct(p1.usage), v2: pct(p2.usage), better: null },
        { label: "PORPAG", v1: fix1(p1.PORPAG), v2: fix1(p2.PORPAG), better: cmp(p1.PORPAG, p2.PORPAG) },
      ],
    },
    {
      title: "Shooting",
      rows: [
        { label: "FG%", v1: pct(p1.fieldGoals.pct), v2: pct(p2.fieldGoals.pct), better: cmp(p1.fieldGoals.pct, p2.fieldGoals.pct) },
        { label: "FGM/A", v1: `${p1.fieldGoals.made}/${p1.fieldGoals.attempted}`, v2: `${p2.fieldGoals.made}/${p2.fieldGoals.attempted}`, better: null },
        { label: "2PT%", v1: pct(p1.twoPointFieldGoals.pct), v2: pct(p2.twoPointFieldGoals.pct), better: cmp(p1.twoPointFieldGoals.pct, p2.twoPointFieldGoals.pct) },
        { label: "2PM/A", v1: `${p1.twoPointFieldGoals.made}/${p1.twoPointFieldGoals.attempted}`, v2: `${p2.twoPointFieldGoals.made}/${p2.twoPointFieldGoals.attempted}`, better: null },
        { label: "3PT%", v1: pct(p1.threePointFieldGoals.pct), v2: pct(p2.threePointFieldGoals.pct), better: cmp(p1.threePointFieldGoals.pct, p2.threePointFieldGoals.pct) },
        { label: "3PM/A", v1: `${p1.threePointFieldGoals.made}/${p1.threePointFieldGoals.attempted}`, v2: `${p2.threePointFieldGoals.made}/${p2.threePointFieldGoals.attempted}`, better: null },
        { label: "FT%", v1: pct(p1.freeThrows.pct), v2: pct(p2.freeThrows.pct), better: cmp(p1.freeThrows.pct, p2.freeThrows.pct) },
        { label: "FTM/A", v1: `${p1.freeThrows.made}/${p1.freeThrows.attempted}`, v2: `${p2.freeThrows.made}/${p2.freeThrows.attempted}`, better: null },
        { label: "TS%", v1: pct(ts1), v2: pct(ts2), better: cmp(ts1, ts2) },
        { label: "eFG%", v1: pct(p1.effectiveFieldGoalPct), v2: pct(p2.effectiveFieldGoalPct), better: cmp(p1.effectiveFieldGoalPct, p2.effectiveFieldGoalPct) },
        { label: "FT Rate", v1: fix1(p1.freeThrowRate), v2: fix1(p2.freeThrowRate), better: cmp(p1.freeThrowRate, p2.freeThrowRate) },
      ],
    },
    {
      title: "Defensive",
      rows: [
        { label: "RPG", v1: fix1(rpg1), v2: fix1(rpg2), better: cmp(rpg1, rpg2) },
        { label: "ORPG", v1: fix1(orpg1), v2: fix1(orpg2), better: cmp(orpg1, orpg2) },
        { label: "DRPG", v1: fix1(drpg1), v2: fix1(drpg2), better: cmp(drpg1, drpg2) },
        { label: "Off. Reb %", v1: pct(p1.offensiveReboundPct), v2: pct(p2.offensiveReboundPct), better: cmp(p1.offensiveReboundPct, p2.offensiveReboundPct) },
        { label: "SPG", v1: fix1(spg1), v2: fix1(spg2), better: cmp(spg1, spg2) },
        { label: "BPG", v1: fix1(bpg1), v2: fix1(bpg2), better: cmp(bpg1, bpg2) },
        { label: "Def. Rating", v1: fix1(p1.defensiveRating), v2: fix1(p2.defensiveRating), better: cmpLow(p1.defensiveRating, p2.defensiveRating) },
      ],
    },
    {
      title: "Advanced",
      rows: [
        { label: "Net Rating", v1: fix1(p1.netRating), v2: fix1(p2.netRating), better: cmp(p1.netRating, p2.netRating) },
        { label: "Win Shares", v1: fix1(p1.winShares.total), v2: fix1(p2.winShares.total), better: cmp(p1.winShares.total, p2.winShares.total) },
        { label: "Off. WS", v1: fix1(p1.winShares.offensive), v2: fix1(p2.winShares.offensive), better: cmp(p1.winShares.offensive, p2.winShares.offensive) },
        { label: "Def. WS", v1: fix1(p1.winShares.defensive), v2: fix1(p2.winShares.defensive), better: cmp(p1.winShares.defensive, p2.winShares.defensive) },
        { label: "WS/40", v1: fix1(p1.winShares.totalPer40), v2: fix1(p2.winShares.totalPer40), better: cmp(p1.winShares.totalPer40, p2.winShares.totalPer40) },
      ],
    },
  ];
}

/* ── Shot chart tab types ── */

const COURT_TABS = ["Tirs", "Zones", "Hex", "Heat"] as const;
type CourtTab = (typeof COURT_TABS)[number];

/* ── Inline scatter view (no wrapper title) ── */

function ScatterView({ shots }: { shots: Shot[] }) {
  const made = shots.filter((s) => s.made).length;
  return (
    <svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" className={styles.courtSvg}>
      <Court />
      {shots.map((shot) => (
        <ScatterChart key={shot.id} shot={shot} scaleX={scaleX} scaleY={scaleY} />
      ))}
      <text x="254" y="22" textAnchor="middle" fill="#888" fontSize="10" fontFamily="var(--font-heading)">
        {made}/{shots.length} ({shots.length > 0 ? Math.round((made / shots.length) * 100) : 0}%)
      </text>
    </svg>
  );
}

/* ── Comparison slider for mobile ── */

function ComparisonSlider({
  activeTab,
  shots1,
  shots2,
  name1,
  name2,
}: {
  activeTab: CourtTab;
  shots1: Shot[];
  shots2: Shot[];
  name1: string;
  name2: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  }, [updatePos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    updatePos(e.clientX);
  }, [updatePos]);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const renderChart = (shots: Shot[]) => {
    switch (activeTab) {
      case "Tirs": return <ScatterView shots={shots} />;
      case "Zones": return <ZoneChart shots={shots} />;
      case "Hex": return <HexChart shots={shots} />;
      case "Heat": return <HeatMap shots={shots} />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.sliderContainer}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: "none" }}
    >
      {/* Player 2 — clipped to right portion */}
      <div className={styles.sliderLayer} style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}>
        {renderChart(shots2)}
        <span className={styles.sliderLabel} style={{ right: 8 }}>{name2}</span>
      </div>

      {/* Player 1 — clipped */}
      <div
        className={styles.sliderLayerClipped}
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        {renderChart(shots1)}
        <span className={styles.sliderLabel} style={{ left: 8 }}>{name1}</span>
      </div>

      {/* Divider line & handle */}
      <div className={styles.sliderDivider} style={{ left: `${sliderPos}%` }}>
        <div className={styles.sliderHandle}>
          <span>◀</span>
          <span>▶</span>
        </div>
      </div>
    </div>
  );
}

/* ── Player select ── */

function PlayerSelect({
  players,
  value,
  onChange,
  label,
}: {
  players: IndexEntry[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className={styles.selectGroup}>
      <label className={styles.label}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Select a player</option>
        {players.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name} — {p.team}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Main component ── */

export default function CompareClient({
  player1,
  player2,
  shots1,
  shots2,
  id1,
  id2,
  allPlayers,
}: Props) {
  const router = useRouter();
  const [sel1, setSel1] = useState(id1);
  const [sel2, setSel2] = useState(id2);
  const [courtTab, setCourtTab] = useState<CourtTab>("Tirs");

  const navigate = (newId1: string, newId2: string) => {
    if (newId1 && newId2) {
      router.push(`/compare-tool/${newId1}/${newId2}`);
    }
  };

  const handleSel1 = (v: string) => {
    setSel1(v);
    navigate(v, sel2);
  };
  const handleSel2 = (v: string) => {
    setSel2(v);
    navigate(sel1, v);
  };

  const radarPlayers: RadarPlayer[] = [];
  if (player1) radarPlayers.push(toRadar(player1.playerStats, "#FF8C42"));
  if (player2) radarPlayers.push(toRadar(player2.playerStats, "#3B6EC9"));

  const hasComparison = player1 && player2;
  const statSections = hasComparison
    ? buildStatSections(player1.playerStats, player2.playerStats)
    : [];

  const p1Id = player1?.playerStats.athleteId;
  const p2Id = player2?.playerStats.athleteId;

  /* Inline chart renderer for desktop */
  const renderDesktopChart = (shots: Shot[]) => {
    switch (courtTab) {
      case "Tirs": return <ScatterView shots={shots} />;
      case "Zones": return <ZoneChart shots={shots} />;
      case "Hex": return <HexChart shots={shots} />;
      case "Heat": return <HeatMap shots={shots} />;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Compare Players
      </h1>

      {/* Selects */}
      <div className={styles.selectGrid}>
        <PlayerSelect
          players={allPlayers}
          value={sel1}
          onChange={handleSel1}
          label="Player 1"
        />
        <PlayerSelect
          players={allPlayers}
          value={sel2}
          onChange={handleSel2}
          label="Player 2"
        />
      </div>

      {hasComparison ? (
        <div className={styles.content}>
          {/* ── Player profile images ── */}
          <div className={styles.profileRow}>
            <div className={styles.profileCard}>
              <div className={styles.profileImgWrap}>
                <Image
                  src={`/players/${p1Id}.png`}
                  alt={player1.playerStats.name}
                  width={120}
                  height={120}
                  className={styles.profileImg}
                />
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName} style={{ color: "#FF8C42" }}>
                  {player1.playerStats.name}
                </span>
                <span className={styles.profileMeta}>
                  {player1.playerStats.position} · {player1.playerStats.team}
                </span>
              </div>
            </div>

            <span className={styles.vsLabel}>VS</span>

            <div className={styles.profileCard}>
              <div className={styles.profileImgWrap}>
                <Image
                  src={`/players/${p2Id}.png`}
                  alt={player2.playerStats.name}
                  width={120}
                  height={120}
                  className={styles.profileImg}
                />
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName} style={{ color: "#3B6EC9" }}>
                  {player2.playerStats.name}
                </span>
                <span className={styles.profileMeta}>
                  {player2.playerStats.position} · {player2.playerStats.team}
                </span>
              </div>
            </div>
          </div>
          {/* ── Shot chart section ── */}
          <div className={styles.courtSection}>
            <h3 className={styles.sectionTitle}>Shot Charts</h3>

            {/* Shared tab nav */}
            <div className={styles.courtTabBar}>
              {COURT_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCourtTab(tab)}
                  className={`${styles.courtTab} ${
                    courtTab === tab ? styles.courtTabActive : ""
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Desktop — two courts side-by-side */}
            <div className={styles.courtDesktop}>
              <div className={styles.courtPanel}>
                <span className={styles.courtPlayerLabel} style={{ color: "#FF8C42" }}>
                  {player1.playerStats.name}
                </span>
                {renderDesktopChart(shots1)}
              </div>
              <div className={styles.courtPanel}>
                <span className={styles.courtPlayerLabel} style={{ color: "#3B6EC9" }}>
                  {player2.playerStats.name}
                </span>
                {renderDesktopChart(shots2)}
              </div>
            </div>

            {/* Mobile — comparison slider */}
            <div className={styles.courtMobile}>
              <ComparisonSlider
                activeTab={courtTab}
                shots1={shots1}
                shots2={shots2}
                name1={player1.playerStats.name}
                name2={player2.playerStats.name}
              />
            </div>
          </div>

          {/* ── Radar Chart ── */}
          <div className={styles.radarWrapper}>
            <RadarChart players={radarPlayers} axes={COMPARE_AXES} size={320} />
          </div>

          {/* ── Stats comparison tables by section ── */}
          {statSections.map((section) => (
            <div key={section.title} className={styles.statSection}>
              <h3 className={styles.sectionTitle}>{section.title}</h3>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.thPlayer1}>
                      {player1.playerStats.name}
                    </th>
                    <th className={styles.thStat}>
                      Stat
                    </th>
                    <th className={styles.thPlayer2}>
                      {player2.playerStats.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.label} className={styles.dataRow}>
                      <td
                        className={`${styles.tdRight} ${
                          row.better === 1 ? styles.better : styles.notBetter
                        }`}
                      >
                        {row.v1}
                      </td>
                      <td className={styles.tdCenter}>
                        {row.label}
                      </td>
                      <td
                        className={`${styles.tdLeft} ${
                          row.better === 2 ? styles.better : styles.notBetter
                        }`}
                      >
                        {row.v2}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          {sel1 && sel2
            ? "Loading players…"
            : "Select two players to compare"}
        </div>
      )}
    </div>
  );
}
