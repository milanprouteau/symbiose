export default function Court() {
  const stroke = "#ffffff40";
  const sw = 1;

  /* Coordonnées calées sur les zone-paths */
  const cx = 254;          // centre du terrain
  const baseline = 278.9;  // ligne de fond
  const paintL = 166.33;   // bord gauche raquette
  const paintR = 341.67;   // bord droit raquette
  const ftLine = 172.44;   // ligne lancers francs
  const cornerL = 94.61;   // corner gauche 3pts
  const cornerR = 413.39;  // corner droit 3pts

  const paintW = paintR - paintL;           // 175.34
  const ftRadius = paintW / 2;              // 87.67
  const arcRadius = (cornerR - cornerL) / 2; // 159.39

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
      <circle cx={cx} cy={baseline - 8} r={5} fill="none" stroke="#ffffff50" strokeWidth={1.5} />

      {/* Panneau */}
      <line x1={cx - 15} y1={baseline - 2} x2={cx + 15} y2={baseline - 2} stroke="#ffffff50" strokeWidth={1.5} />

      {/* Arc 3 points */}
      <path
        d={`M ${cornerL} ${baseline} L ${cornerL} ${baseline - 50} A ${arcRadius} ${arcRadius} 0 0 1 ${cornerR} ${baseline - 50} L ${cornerR} ${baseline}`}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
    </g>
  );
}