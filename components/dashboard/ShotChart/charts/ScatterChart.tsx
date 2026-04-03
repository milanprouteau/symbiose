import { Shot } from "@/types/player";

type Props = {
  shot: Shot;
  scaleX: (x: number) => number;
  scaleY: (y: number) => number;
  color?: string;
  index?: number;
};

export default function ScatterChart({ shot, scaleX, scaleY, color, index = 0 }: Props) {
  const cx = scaleX(shot.x);
  const cy = scaleY(shot.y);
  const shotColor = color ?? "var(--color-primary-orange)";
  const delay = `${Math.min(index, 200) * 2.5}ms`;

  if (shot.made) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill={shotColor}
        fillOpacity={0.85}
        stroke={shotColor}
        strokeWidth={1}
        style={{
          transformBox: "fill-box",
          transformOrigin: "center",
          animation: "scatterIn 0.25s ease backwards",
          animationDelay: delay,
        }}
      />
    );
  }

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      style={{
        animation: "chartFadeIn 0.25s ease backwards",
        animationDelay: delay,
      }}
    >
      <line x1={-4} y1={-4} x2={4} y2={4} stroke="var(--color-secondary-beige)" strokeWidth={1.5} strokeOpacity={0.5} />
      <line x1={4} y1={-4} x2={-4} y2={4} stroke="var(--color-secondary-beige)" strokeWidth={1.5} strokeOpacity={0.5} />
    </g>
  );
}
