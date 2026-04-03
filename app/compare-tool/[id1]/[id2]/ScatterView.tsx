import type { Shot } from "@/types/player";
import { VIEW_BOX, scaleX, scaleY } from "@/components/dashboard/ShotChart/utils/scales";
import Court from "@/components/dashboard/ShotChart/Court";
import ScatterChart from "@/components/dashboard/ShotChart/charts/ScatterChart";
import styles from "./CompareClient.module.scss";

export default function ScatterView({ shots, color }: { shots: Shot[]; color: string }) {
  const made = shots.filter((s) => s.made).length;
  return (
    <svg viewBox={VIEW_BOX} preserveAspectRatio="xMidYMid meet" className={styles.courtSvg}>
      <Court />
      {shots.map((shot) => (
        <ScatterChart key={shot.id} shot={shot} scaleX={scaleX} scaleY={scaleY} color={color} />
      ))}
      <text x="254" y="22" textAnchor="middle" fill="#888" fontSize="10" fontFamily="var(--font-heading)">
        {made}/{shots.length} ({shots.length > 0 ? Math.round((made / shots.length) * 100) : 0}%)
      </text>
    </svg>
  );
}
