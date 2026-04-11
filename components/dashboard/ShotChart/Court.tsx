export default function Court() {
  const stroke = "var(--color-border)";
  const sw = 1;

  /* Coordonnées calées sur les zone-paths */
  const cx = 254;          // centre du terrain
  const baseline = 278.9;  // ligne de fond
  const paintL = 209.77;   // bord gauche raquette (cx - 44.23, matches raquette circle)
  const paintR = 298.23;   // bord droit raquette (cx + 44.23)
  const ftLine = 172.44;   // ligne lancers francs
  const cornerL = 94.61;   // corner gauche 3pts
  const cornerR = 413.39;  // corner droit 3pts

  const paintW = paintR - paintL;           // 88.46
  const ftRadius = paintW / 2;              // 44.23
  const arcRadius = 164;                    // 3PT arc radius (matches zone boundaries)
  const arcStartY = 201.7;                  // where arc meets corner straight lines

  return (
    <g>
      {/* Raquette */}
      <rect x={paintL} y={ftLine} width={paintW} height={baseline - ftLine} fill="none" stroke={stroke} strokeWidth={sw} />

      {/* Demi-cercle lancers francs */}
      <path
        d={`M ${paintL} ${ftLine} A ${ftRadius} ${ftRadius} 0 0 1 ${paintR} ${ftLine}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />

      {/* Panier */}
      <circle cx={cx} cy={baseline - 8} r={5} fill="none" stroke="var(--color-border)" strokeWidth={1.5} />

      {/* Panneau */}
      <line x1={cx - 15} y1={baseline - 2} x2={cx + 15} y2={baseline - 2} stroke="var(--color-border)" strokeWidth={1.5} />

      {/* Arc 3 points */}
      <path
        d={`M ${cornerL} ${baseline} L ${cornerL} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 1 ${cornerR} ${arcStartY} L ${cornerR} ${baseline}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
    </g>
  );
}