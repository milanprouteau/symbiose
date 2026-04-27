"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, Fragment } from "react";
import Loader from "@/components/ui/Loader";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import PlayerPhotoCard from "@/components/dashboard/PlayerPhotoCard";
import RadarChart from "@/components/dashboard/RadarChart";
import type { RadarAxis, RadarPlayer } from "@/components/dashboard/RadarChart";
import type { PlayerDataBundle, PlayerSeasonStats, TeamSeasonStats, PlayerProfile } from "@/types/stats";
import type { Shot } from "@/types/player";
import ZoneChart from "@/components/dashboard/ShotChart/charts/ZoneChart";
import HexChart from "@/components/dashboard/ShotChart/charts/HexChart";
import HeatMap from "@/components/dashboard/ShotChart/charts/HeatMap";
import styles from "./CompareClient.module.scss";
import ScatterView from "./ScatterView";
import ComparisonSlider, { COURT_TABS, type CourtTab } from "./ComparisonSlider";
import PlayerSelect from "./PlayerSelect";
import ArchetypeButterfly from "@/components/dashboard/ArchetypeButterfly";
import { buildStatSections, type PlayerPercentiles } from "@/lib/compareStats";

export const COMPARE_AXES: RadarAxis[] = [
  { key: "ppg",   label: "PPG",   max: 30 },
  { key: "rpg",   label: "REB",   max: 12 },
  { key: "apg",   label: "AST",   max: 10 },
  { key: "spg",   label: "STL",   max: 5 },
  { key: "ppp",   label: "PPP",   max: 1.5 },
  { key: "fgPct", label: "FG%",   max: 80 },
  { key: "usage", label: "Usage", max: 40 },
];

export const DEFENSIVE_COMPARE_AXES: RadarAxis[] = [
  { key: "rpg",                 label: "REB",     max: 12 },
  { key: "bpg",                 label: "BLK",     max: 5 },
  { key: "spg",                 label: "STL",     max: 5 },
  { key: "defensiveRating",     label: "DEF RTG", max: 200, invert: true },
  { key: "opponentFG",          label: "OPP FG",  max: 100 },
  { key: "defensiveReboundPct", label: "DREB%",   max: 100 },
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
  profile1: PlayerProfile | null;
  profile2: PlayerProfile | null;
  shadow1?: string;
  shadow2?: string;
  percentiles1?: PlayerPercentiles | null;
  percentiles2?: PlayerPercentiles | null;
  tsPlusRating1?: number | null;
  tsPlusRating2?: number | null;
  sis1?: number | null;
  sis2?: number | null;
  sisPx1?: number | null;
  sisPx2?: number | null;
};

function calcPpp(ps: PlayerSeasonStats): number {
  const fga = Number(ps.fieldGoals?.attempted ?? 0);
  const fta = Number(ps.freeThrows?.attempted ?? 0);
  const tov = Number(ps.turnovers ?? 0);
  const pts = Number(ps.points ?? 0);
  const poss = fga + 0.44 * fta + tov;
  return poss > 0 ? pts / poss : 0;
}

function toRadar(ps: PlayerSeasonStats, color: string): RadarPlayer {
  return {
    name: ps.name,
    color,
    values: {
      ppg: ps.points / (ps.games || 1),
      rpg: ps.rebounds.total / (ps.games || 1),
      apg: ps.assists / (ps.games || 1),
      spg: ps.steals / (ps.games || 1),
      ppp: calcPpp(ps),
      fgPct: ps.fieldGoals.pct,
      usage: ps.usage,
    },
  };
}

function toDefensiveRadar(ps: PlayerSeasonStats, teamStats: TeamSeasonStats, color: string): RadarPlayer {
  return {
    name: ps.name,
    color,
    values: {
      rpg: ps.rebounds.total / (ps.games || 1),
      bpg: ps.blocks / (ps.games || 1),
      spg: ps.steals / (ps.games || 1),
      defensiveRating: ps.defensiveRating,
      opponentFG: teamStats?.opponentStats?.fieldGoals?.pct ?? 0,
      defensiveReboundPct: 100 - ps.offensiveReboundPct,
    },
  };
}

const tableBodyVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045 } },
};

const tableRowVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

const accordionVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: "auto", opacity: 1, transition: { duration: 0.28, ease: "easeInOut" as const } },
  exit:    { height: 0, opacity: 0, transition: { duration: 0.2,  ease: "easeInOut" as const } },
};

function getTopPct(rawPct: number | null | undefined, lowerIsBetter?: boolean): number | null {
  if (rawPct == null) return null;
  // rawPct = position in ascending sorted array (0 = lowest, 100 = highest)
  // For higher-is-better: topPct = 100 - rawPct (high position = small top%)
  // For lower-is-better: topPct = rawPct (low position = small top% = good)
  return lowerIsBetter ? rawPct : 100 - rawPct;
}

function pctClass(topPct: number): string {
  if (topPct <= 5)  return styles.pctElite;
  if (topPct <= 15) return styles.pctGreat;
  if (topPct <= 30) return styles.pctGood;
  if (topPct <= 50) return styles.pctAvg;
  return styles.pctWeak;
}

export default function CompareClient({
  player1,
  player2,
  shots1,
  shots2,
  id1,
  id2,
  allPlayers,
  profile1,
  profile2,
  shadow1,
  shadow2,
  percentiles1,
  percentiles2,
  tsPlusRating1,
  tsPlusRating2,
  sis1,
  sis2,
  sisPx1,
  sisPx2,
}: Props) {
  const router = useRouter();
  const [sel1, setSel1] = useState(id1);
  const [sel2, setSel2] = useState(id2);
  const [courtTab, setCourtTab] = useState<CourtTab>("Tirs");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset loader when navigation completes (ids change in props)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsNavigating(false);
  }, [id1, id2]);

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const navigate = (newId1: string, newId2: string) => {
    if (newId1 && newId2) {
      setIsNavigating(true);
      router.push(`/compare-tool/${newId1}/${newId2}`);
    }
  };

  const handleSel1 = (v: string) => { setSel1(v); navigate(v, sel2); };
  const handleSel2 = (v: string) => { setSel2(v); navigate(sel1, v); };

  const radarPlayers: RadarPlayer[] = [];
  if (player1) radarPlayers.push(toRadar(player1.playerStats, "#FF6C22"));
  if (player2) radarPlayers.push(toRadar(player2.playerStats, "#74D0ED"));

  const defensiveRadarPlayers: RadarPlayer[] = [];
  if (player1) defensiveRadarPlayers.push(toDefensiveRadar(player1.playerStats, player1.teamStats, "#FF6C22"));
  if (player2) defensiveRadarPlayers.push(toDefensiveRadar(player2.playerStats, player2.teamStats, "#74D0ED"));

  const hasComparison = player1 && player2;
  const statSections = hasComparison
    ? buildStatSections(
        player1.playerStats, player2.playerStats,
        profile1, profile2,
        percentiles1, percentiles2,
        tsPlusRating1, tsPlusRating2,
        sis1, sis2, sisPx1, sisPx2,
      )
    : [];

  const p1Id = player1?.playerStats.athleteId;
  const p2Id = player2?.playerStats.athleteId;

  const renderDesktopChart = (shots: Shot[], color: string) => {
    switch (courtTab) {
      case "Tirs":  return <ScatterView shots={shots} color={color} />;
      case "Zones": return <ZoneChart shots={shots} />;
      case "Hex":   return <HexChart shots={shots} />;
      case "Heat":  return <HeatMap shots={shots} />;
    }
  };

  return (
    <div className={styles.container}>
      {isNavigating && (
        <div className={styles.loaderOverlay}>
          <Loader />
        </div>
      )}
      <div className={styles.selectGrid}>
        <PlayerSelect players={allPlayers} value={sel1} onChange={handleSel1} label="Joueur 1" excludeId={sel2} />
        <PlayerSelect players={allPlayers} value={sel2} onChange={handleSel2} label="Joueur 2" excludeId={sel1} />
      </div>

      {hasComparison ? (
        <div className={styles.content}>
          {/* ── Player profile cards ── */}
          <div className={styles.profileRow}>
            {/* Player 1 */}
            <div className={styles.profileCard}>
              <PlayerPhotoCard
                photoUrl={`/players/${p1Id}.png`}
                logoUrl={`/uni/${player1.playerStats.team.toLowerCase().replace(/ /g, "-")}.png`}
                name={player1.playerStats.name}
                shadow={shadow1}
                size="sm"
              />
              <div className={styles.profileInfo}>
                <Link href={`/player/${p1Id}`} className={styles.profileName} style={{ color: "#FF6C22" }}>
                  {player1.playerStats.name}
                </Link>
                <span className={styles.profileMeta}>
                  {player1.playerStats.position} · {player1.playerStats.team}
                </span>
              </div>
            </div>

            <span className={styles.vsLabel}>VS</span>

            {/* Player 2 */}
            <div className={styles.profileCard}>
              <PlayerPhotoCard
                photoUrl={`/players/${p2Id}.png`}
                logoUrl={`/uni/${player2.playerStats.team.toLowerCase().replace(/ /g, "-")}.png`}
                name={player2.playerStats.name}
                shadow={shadow2}
                size="sm"
              />
              <div className={styles.profileInfo}>
                <Link href={`/player/${p2Id}`} className={styles.profileName} style={{ color: "#74D0ED" }}>
                  {player2.playerStats.name}
                </Link>
                <span className={styles.profileMeta}>
                  {player2.playerStats.position} · {player2.playerStats.team}
                </span>
              </div>
            </div>
          </div>

          {/* ── Shot chart section ── */}
          <div className={styles.courtSection}>
            <button
              className={`${styles.sectionHeader} ${!collapsedSections.has("shotCharts") ? styles.sectionHeaderOpen : ""}`}
              onClick={() => toggleSection("shotCharts")}
            >
              <span className={styles.sectionLabel}>Shot Charts</span>
              <span className={`${styles.sectionChevron} ${!collapsedSections.has("shotCharts") ? styles.sectionChevronOpen : ""}`}>▾</span>
            </button>

            <AnimatePresence initial={false}>
              {!collapsedSections.has("shotCharts") && (
                <motion.div
                  key="shotCharts"
                  variants={accordionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ overflow: "hidden" }}
                >
                  <div className={styles.sectionBody}>
                    <LayoutGroup id="courtTabs">
                      <div className={styles.courtTabBar}>
                        {COURT_TABS.map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setCourtTab(tab)}
                            className={`${styles.courtTab} ${courtTab === tab ? styles.courtTabActive : ""}`}
                          >
                            {courtTab === tab && (
                              <motion.div
                                layoutId="courtTabIndicator"
                                className={styles.courtTabIndicator}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                              />
                            )}
                            <span className={styles.courtTabText}>{tab}</span>
                          </button>
                        ))}
                      </div>
                    </LayoutGroup>

                    {/* Desktop — two courts side-by-side */}
                    <div className={styles.courtDesktop}>
                      <div className={styles.courtPanel}>
                        <span className={styles.courtPlayerLabel} style={{ color: "#FF6C22" }}>
                          {player1.playerStats.name}
                        </span>
                        {renderDesktopChart(shots1, "#FF6C22")}
                      </div>
                      <div className={styles.courtPanel}>
                        <span className={styles.courtPlayerLabel} style={{ color: "#74D0ED" }}>
                          {player2.playerStats.name}
                        </span>
                        {renderDesktopChart(shots2, "#74D0ED")}
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Stats comparison tables by section ── */}
          {statSections.map((section) => (
            <Fragment key={section.title}>
            <div className={styles.statSection}>
              <button
                className={`${styles.sectionHeader} ${!collapsedSections.has(section.title) ? styles.sectionHeaderOpen : ""}`}
                onClick={() => toggleSection(section.title)}
              >
                <span className={styles.sectionLabel}>{section.title}</span>
                <span className={`${styles.sectionChevron} ${!collapsedSections.has(section.title) ? styles.sectionChevronOpen : ""}`}>▾</span>
              </button>

              <AnimatePresence initial={false}>
                {!collapsedSections.has(section.title) && (
                  <motion.div
                    key={section.title}
                    variants={accordionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ overflow: "hidden" }}
                  >
                    <div className={styles.sectionBody}>
                      <table className={styles.table}>
                        <thead>
                          <tr className={styles.tableHeaderRow}>
                            <th className={styles.thPlayer1}>{player1.playerStats.name}</th>
                            <th className={styles.thStat}>Stat</th>
                            <th className={styles.thPlayer2}>{player2.playerStats.name}</th>
                          </tr>
                        </thead>
                        <motion.tbody
                          variants={tableBodyVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {section.rows.map((row) => {
                            const top1 = row.statKey ? getTopPct(percentiles1?.[row.statKey], row.lowerIsBetter) : null;
                            const top2 = row.statKey ? getTopPct(percentiles2?.[row.statKey], row.lowerIsBetter) : null;
                            return (
                              <motion.tr key={row.label} variants={tableRowVariants} className={styles.dataRow}>
                                <td className={`${styles.tdRight} ${row.better === 1 ? styles.better : styles.notBetter}`}>
                                  <span>{row.v1}</span>
                                  {top1 != null && (
                                    <span className={`${styles.pctBadge} ${pctClass(top1)}`}>(top {Math.max(1, top1)}%)</span>
                                  )}
                                </td>
                                <td className={styles.tdCenter}>{row.label}</td>
                                <td className={`${styles.tdLeft} ${row.better === 2 ? styles.better : styles.notBetter}`}>
                                  <span>{row.v2}</span>
                                  {top2 != null && (
                                    <span className={`${styles.pctBadge} ${pctClass(top2)}`}>(top {Math.max(1, top2)}%)</span>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </motion.tbody>
                      </table>
                      {section.title === "Offensive" && (
                        <div className={styles.radarWrapper}>
                          <RadarChart players={radarPlayers} axes={COMPARE_AXES} size={320} />
                        </div>
                      )}
                      {section.title === "Défensive" && (
                        <div className={styles.radarWrapper}>
                          <RadarChart players={defensiveRadarPlayers} axes={DEFENSIVE_COMPARE_AXES} size={320} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {section.title === "Tirs" && (
              <div className={styles.statSection}>
                <button
                  className={`${styles.sectionHeader} ${!collapsedSections.has("archetypes") ? styles.sectionHeaderOpen : ""}`}
                  onClick={() => toggleSection("archetypes")}
                >
                  <span className={styles.sectionLabel}>Archétypes</span>
                  <span className={`${styles.sectionChevron} ${!collapsedSections.has("archetypes") ? styles.sectionChevronOpen : ""}`}>▾</span>
                </button>
                <AnimatePresence initial={false}>
                  {!collapsedSections.has("archetypes") && (
                    <motion.div
                      key="archetypes"
                      variants={accordionVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ overflow: "hidden" }}
                    >
                      <div className={styles.sectionBody}>
                        <ArchetypeButterfly
                          archetypes1={player1.archetypesHE ?? null}
                          archetypes2={player2.archetypesHE ?? null}
                          name1={player1.playerStats.name}
                          name2={player2.playerStats.name}
                          color1="#FF6C22"
                          color2="#74D0ED"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            </Fragment>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          {sel1 && sel2 ? "Loading players…" : "Select two players to compare"}
        </div>
      )}
    </div>
  );
}
