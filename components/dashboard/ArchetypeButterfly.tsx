"use client";

import { useState } from "react";
import { ARCHETYPE_KEYS, ARCHETYPE_LABELS, type ArchetypeKey, type ArchetypesHE, type ArchetypeEntry } from "@/types/stats";
import styles from "./ArchetypeButterfly.module.scss";

type Props = {
  archetypes1: ArchetypesHE | null | undefined;
  archetypes2: ArchetypesHE | null | undefined;
  name1: string;
  name2: string;
  color1: string;
  color2: string;
};

const VB_W = 1200;
const VB_H = 440;
const PAD = { top: 24, right: 24, bottom: 84, left: 56 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const SLOT_W = PLOT_W / ARCHETYPE_KEYS.length;
const BAR_W = 24;
const BAR_GAP = 4;

const PPP_MAX = 2.0;

const LABEL_LINES: Record<ArchetypeKey, string[]> = {
  rimAttack:       ["Rim", "Attack"],
  attackKick:      ["Attack &", "Kick"],
  perimeterSniper: ["Perimeter", "Sniper"],
  dribbleJumper:   ["Dribble", "Jumper"],
  midRange:        ["Mid -", "Range"],
  hitsCutter:      ["Hits", "Cutter"],
  perimeterCut:    ["Perimeter", "Cut"],
  pnrPasser:       ["PnR", "Passer"],
  bigCutRoll:      ["Big Cut &", "Roll"],
  postUp:          ["Post", "- Up"],
  insideOut:       ["Inside", "Out"],
  pickAndPop:      ["Pick &", "Pop"],
  highLow:         ["High", "- Low"],
  rebScramble:     ["Reb. &", "Scramble"],
  transition:      ["Transition"],
};

const ARCHETYPE_DESCRIPTIONS: Record<ArchetypeKey, string> = {
  rimAttack:       "A guard or wing creates his own shot at the rim.",
  attackKick:      "A guard/wing assists a teammate's three after attacking the rim.",
  perimeterSniper: "A spot-up shooter knocks down a catch-and-shoot three.",
  dribbleJumper:   "A player creates his own pull-up or step-back jumper.",
  midRange:        "Any midrange jumper — pull-up, post fadeaway, runner.",
  hitsCutter:      "A passer hits a cutter for a finish at the rim.",
  perimeterCut:    "A guard or wing finishes at the rim off a cut or assist.",
  pnrPasser:       "A ball-handler dishes to a roller or popper out of pick-and-roll.",
  bigCutRoll:      "A big finishes at the rim as a roller or off-ball cut.",
  postUp:          "A frontcourt player backs his defender down to the rim.",
  insideOut:       "A big kicks out for a three from a post-up or paint touch.",
  pickAndPop:      "A big pops out for a catch-and-shoot jumper or three.",
  highLow:         "A big finds another big at the rim from the high post.",
  rebScramble:     "An offensive rebound putback or scramble finish.",
  transition:      "Any shot in the first 7 seconds of a possession.",
};

type HoverTarget = {
  key: ArchetypeKey;
  player: 1 | 2;
  x: number;
  y: number;
} | null;

export default function ArchetypeButterfly({
  archetypes1, archetypes2, name1, name2, color1, color2,
}: Props) {
  const [hover, setHover] = useState<HoverTarget>(null);

  if (!archetypes1 && !archetypes2) {
    return (
      <p className={styles.empty}>Données indisponibles pour ces deux joueurs.</p>
    );
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const floorY = PAD.top + PLOT_H;

  const handleMove = (key: ArchetypeKey, player: 1 | 2) => (e: React.MouseEvent<SVGRectElement>) => {
    setHover({ key, player, x: e.clientX, y: e.clientY });
  };

  // Clamp tooltip position so it never overflows the viewport (critical on
  // mobile where the cursor x+16 would push the box past the right edge).
  const clampPos = (x: number, y: number) => {
    if (typeof window === "undefined") return { left: x + 16, top: y + 16 };
    const W = 300;
    const H = 220;
    const PAD = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(PAD, Math.min(x + 16, vw - W - PAD));
    const top  = Math.max(PAD, Math.min(y + 16, vh - H - PAD));
    return { left, top };
  };

  const hoveredItem: ArchetypeEntry = hover
    ? (hover.player === 1 ? archetypes1?.items?.[hover.key] : archetypes2?.items?.[hover.key]) ?? null
    : null;
  const hoveredName = hover ? (hover.player === 1 ? name1 : name2) : "";
  const hoveredColor = hover ? (hover.player === 1 ? color1 : color2) : "";

  const renderBar = (
    item: ArchetypeEntry,
    barX: number,
    color: string,
    isHovered: boolean,
  ) => {
    if (!item || item.freqPer100 <= 0) return null;
    const ppp = Math.min(item.ppp, PPP_MAX);
    const barH = (ppp / PPP_MAX) * PLOT_H;
    if (barH <= 0.5) return null;
    const barY = floorY - barH;
    return (
      <rect
        x={barX}
        y={barY}
        width={BAR_W}
        height={barH}
        rx={2}
        fill={color}
        stroke={isHovered ? "#FFFFFF" : "transparent"}
        strokeWidth={isHovered ? 2 : 0}
      />
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color1 }} />
          <span>{name1}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: color2 }} />
          <span>{name2}</span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className={styles.svg}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHover(null)}
        >
          <rect width={VB_W} height={VB_H} className={styles.bg} />

          <text
            x={18}
            y={PAD.top + PLOT_H / 2}
            fontSize={14}
            className={styles.axisTitle}
            textAnchor="middle"
            transform={`rotate(-90 18 ${PAD.top + PLOT_H / 2})`}
          >
            Points per Play
          </text>

          {yTicks.map((t) => {
            const y = floorY - (t / PPP_MAX) * PLOT_H;
            return (
              <g key={`y${t}`}>
                <line
                  x1={PAD.left}
                  x2={VB_W - PAD.right}
                  y1={y}
                  y2={y}
                  className={styles.gridH}
                  strokeDasharray="4 5"
                />
                <text
                  x={PAD.left - 10}
                  y={y + 4}
                  fontSize={12}
                  className={styles.axisTick}
                  textAnchor="end"
                >
                  {t.toFixed(2)}
                </text>
              </g>
            );
          })}

          {Array.from({ length: ARCHETYPE_KEYS.length + 1 }, (_, i) => {
            const x = PAD.left + i * SLOT_W;
            return (
              <line
                key={`v${i}`}
                x1={x}
                x2={x}
                y1={PAD.top}
                y2={floorY}
                className={styles.gridV}
                strokeDasharray="4 5"
              />
            );
          })}

          {ARCHETYPE_KEYS.map((key, i) => {
            const slotX = PAD.left + i * SLOT_W;
            const cx = slotX + SLOT_W / 2;
            const barX1 = cx - BAR_W - BAR_GAP / 2;
            const barX2 = cx + BAR_GAP / 2;
            const labelLines = LABEL_LINES[key];
            const xLabelY = floorY + 26;
            const isHovered = hover?.key === key;
            const item1 = archetypes1?.items?.[key] ?? null;
            const item2 = archetypes2?.items?.[key] ?? null;

            return (
              <g key={key}>
                {renderBar(item1, barX1, color1, isHovered && hover?.player === 1)}
                {renderBar(item2, barX2, color2, isHovered && hover?.player === 2)}

                {/* Hover targets — one per player, full plot height */}
                <rect
                  x={barX1}
                  y={PAD.top}
                  width={BAR_W + BAR_GAP / 2}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseMove={handleMove(key, 1)}
                  onClick={handleMove(key, 1)}
                  style={{ cursor: item1 ? "pointer" : "default" }}
                />
                <rect
                  x={barX2 - BAR_GAP / 2}
                  y={PAD.top}
                  width={BAR_W + BAR_GAP / 2}
                  height={PLOT_H}
                  fill="transparent"
                  onMouseMove={handleMove(key, 2)}
                  onClick={handleMove(key, 2)}
                  style={{ cursor: item2 ? "pointer" : "default" }}
                />

                {labelLines.map((line, li) => (
                  <text
                    key={li}
                    x={cx}
                    y={xLabelY + li * 16}
                    fontSize={13}
                    className={isHovered ? styles.xLabelActive : styles.xLabel}
                    textAnchor="middle"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>

        {hover && (
          <div
            className={styles.tooltip}
            style={clampPos(hover.x, hover.y)}
          >
            <div className={styles.tipName}>
              <span className={styles.tipDot} style={{ background: hoveredColor }} />
              {hoveredName}
            </div>
            <div className={styles.tipArchetype}>{ARCHETYPE_LABELS[hover.key]}</div>
            <div className={styles.tipDesc}>{ARCHETYPE_DESCRIPTIONS[hover.key]}</div>
            {hoveredItem ? (
              <dl className={styles.tipStats}>
                <div className={styles.tipRow}>
                  <dt>Frequency</dt>
                  <dd><strong>{hoveredItem.freqPer100.toFixed(1)}</strong> / 100 plays</dd>
                </div>
                <div className={styles.tipRow}>
                  <dt>Efficiency</dt>
                  <dd><strong>{hoveredItem.ppp.toFixed(2)}</strong> ppp</dd>
                </div>
                <div className={styles.tipRow}>
                  <dt>Efficiency Pctile</dt>
                  <dd><strong>{hoveredItem.percentile.toFixed(1)}%</strong></dd>
                </div>
              </dl>
            ) : (
              <p className={styles.tipEmpty}>Aucune donnée.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
