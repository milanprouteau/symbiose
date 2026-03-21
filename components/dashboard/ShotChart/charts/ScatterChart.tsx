import { Shot } from "@/types/player";

type Props = {
  shot: Shot;
  scaleX: (x: number) => number;
  scaleY: (y: number) => number;
};

export default function ScatterChart({ shot, scaleX, scaleY }: Props) {
  const cx = scaleX(shot.x);
  const cy = scaleY(shot.y);

  if (shot.made) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="var(--color-primary-orange)"
        fillOpacity={0.85}
        stroke="var(--color-primary-orange)"
        strokeWidth={1}
      >
      </circle>
    );
  }

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <line x1={-4} y1={-4} x2={4} y2={4} stroke="var(--color-secondary-beige)" strokeWidth={1.5} strokeOpacity={0.5} />
      <line x1={4} y1={-4} x2={-4} y2={4} stroke="var(--color-secondary-beige)" strokeWidth={1.5} strokeOpacity={0.5} />
    </g>
  );
}