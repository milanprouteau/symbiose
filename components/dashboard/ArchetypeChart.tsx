"use client";

import { useState } from "react";
import { ARCHETYPE_KEYS, ARCHETYPE_LABELS, type ArchetypeKey, type ArchetypesHE } from "@/types/stats";
import styles from "./ArchetypeChart.module.scss";

type Props = {
  archetypes: ArchetypesHE | null | undefined;
};

const VB_W = 1200;
const VB_H = 440;
const PAD = { top: 24, right: 24, bottom: 84, left: 56 };
const PLOT_W = VB_W - PAD.left - PAD.right;
const PLOT_H = VB_H - PAD.top - PAD.bottom;
const SLOT_W = PLOT_W / ARCHETYPE_KEYS.length;
const BAR_W = 54;

type Tier = "elite" | "good" | "mid" | "bad" | "empty";

function pppTier(ppp: number, freq: number): Tier {
  if (freq < 0.5) return "empty";
  if (ppp >= 1.10) return "elite";
  if (ppp >= 1.00) return "good";
  if (ppp >= 0.85) return "mid";
  return "bad";
}

const TIER_BAR_CLASS: Record<Tier, string> = {
  elite: styles.barElite,
  good:  styles.barGood,
  mid:   styles.barMid,
  bad:   styles.barBad,
  empty: styles.barEmpty,
};

const TIER_PPP_CLASS: Record<Tier, string> = {
  elite: styles.pppElite,
  good:  styles.pppGood,
  mid:   styles.pppMid,
  bad:   styles.pppBad,
  empty: styles.pppEmpty,
};

// Scale: bar height represents PPP. Cap at 2.0 ppp (anything above clips).
const PPP_MAX = 2.0;

/**
 * Position the value label so it's always readable:
 * - Tall bar → text sits inside the bar near the bottom (black on color).
 * - Bar too short to hold the text → text floats just above the bar top
 *   (white on the dark chart bg).
 */
function valueLabelPlacement(barY: number, barH: number, floorY: number, plotTop: number) {
  const NUM_FONT = 12;
  const UNIT_FONT = 9;
  const TOTAL_HEIGHT = NUM_FONT + UNIT_FONT + 4; // ~25 px for both lines
  const onBar = barH >= TOTAL_HEIGHT;

  if (onBar) {
    return {
      onBar: true,
      numY: floorY - 16,
      unitY: floorY - 4,
      showUnit: true,
    };
  }

  // Short bar — float number just above the bar, drop the unit line.
  const numY = Math.max(barY - 4, plotTop + NUM_FONT);
  return {
    onBar: false,
    numY,
    unitY: numY + 12,
    showUnit: barH >= NUM_FONT && numY + 12 <= floorY - 2,
  };
}

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

type HoverState = { key: ArchetypeKey; tier: Tier; x: number; y: number } | null;

export default function ArchetypeChart({ archetypes }: Props) {
  const [hover, setHover] = useState<HoverState>(null);

  if (!archetypes) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Archétypes offensifs</h3>
        <p className={styles.empty}>Données indisponibles pour ce joueur.</p>
      </div>
    );
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const floorY = PAD.top + PLOT_H;

  // Sort archetypes by PPP descending. Null / freq < 0.5 (empty) go last,
  // keeping their relative static order via Array#sort stability.
  const sortedKeys = [...ARCHETYPE_KEYS].sort((a, b) => {
    const ia = archetypes.items[a];
    const ib = archetypes.items[b];
    const pa = ia && ia.freqPer100 >= 0.5 ? ia.ppp : -Infinity;
    const pb = ib && ib.freqPer100 >= 0.5 ? ib.ppp : -Infinity;
    return pb - pa;
  });

  const handleMove = (key: ArchetypeKey, tier: Tier) => (e: React.MouseEvent<SVGGElement>) => {
    setHover({ key, tier, x: e.clientX, y: e.clientY });
  };

  // Clamp tooltip position so it never overflows the viewport (critical on
  // mobile where the cursor x+16 would push the box past the right edge).
  const clampPos = (x: number, y: number) => {
    if (typeof window === "undefined") return { left: x + 16, top: y + 16 };
    const W = 300; // approx tooltip width (max-width 320, min-width 240)
    const H = 200; // approx tooltip height
    const PAD = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(PAD, Math.min(x + 16, vw - W - PAD));
    const top  = Math.max(PAD, Math.min(y + 16, vh - H - PAD));
    return { left, top };
  };

  const hoveredItem = hover ? archetypes.items[hover.key] : null;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Archétypes offensifs</h3>

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

          {sortedKeys.map((key, i) => {
            const item = archetypes.items[key];
            const slotX = PAD.left + i * SLOT_W;
            const cx = slotX + SLOT_W / 2;
            const barX = cx - BAR_W / 2;
            const labelLines = LABEL_LINES[key];
            const xLabelY = floorY + 26;
            const isHovered = hover?.key === key;

            const tier: Tier = item ? pppTier(item.ppp, item.freqPer100) : "empty";

            const xLabel = (
              <g>
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

            const hoverTarget = (
              <rect
                x={slotX}
                y={PAD.top}
                width={SLOT_W}
                height={PLOT_H}
                fill="transparent"
                onMouseMove={handleMove(key, tier)}
                onClick={handleMove(key, tier)}
                style={{ cursor: item ? "pointer" : "default" }}
              />
            );

            if (!item) {
              return (
                <g key={key}>
                  {xLabel}
                  {hoverTarget}
                </g>
              );
            }

            const barH = (Math.min(item.ppp, PPP_MAX) / PPP_MAX) * PLOT_H;
            const barY = floorY - barH;
            const placement = valueLabelPlacement(barY, barH, floorY, PAD.top);

            return (
              <g key={key}>
                {barH > 0.5 && (
                  <rect
                    x={barX}
                    y={barY}
                    width={BAR_W}
                    height={barH}
                    rx={2}
                    className={`${TIER_BAR_CLASS[tier]} ${isHovered ? styles.barHovered : ""}`}
                  />
                )}

                {item.freqPer100 > 0 && (
                  <>
                    <text
                      x={cx}
                      y={placement.numY}
                      fontSize={12}
                      fontWeight={600}
                      className={placement.onBar ? styles.freqText : styles.freqTextOff}
                      textAnchor="middle"
                    >
                      {item.ppp.toFixed(2)}
                    </text>
                    {placement.showUnit && (
                      <text
                        x={cx}
                        y={placement.unitY}
                        fontSize={9}
                        className={placement.onBar ? styles.freqUnit : styles.freqUnitOff}
                        textAnchor="middle"
                      >
                        ppp
                      </text>
                    )}
                  </>
                )}

                {xLabel}
                {hoverTarget}
              </g>
            );
          })}
        </svg>

        {hover && (
          <div
            className={styles.tooltip}
            style={clampPos(hover.x, hover.y)}
          >
            <div className={styles.tipName}>{ARCHETYPE_LABELS[hover.key]}</div>
            <div className={styles.tipDesc}>{ARCHETYPE_DESCRIPTIONS[hover.key]}</div>
            {hoveredItem ? (
              <dl className={styles.tipStats}>
                <div className={styles.tipRow}>
                  <dt>Frequency</dt>
                  <dd><strong>{hoveredItem.freqPer100.toFixed(1)}</strong> / 100 plays</dd>
                </div>
                <div className={styles.tipRow}>
                  <dt>Efficiency</dt>
                  <dd><strong className={TIER_PPP_CLASS[hover.tier]}>{hoveredItem.ppp.toFixed(2)}</strong> ppp</dd>
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
