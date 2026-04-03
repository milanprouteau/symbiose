import styles from "./Skeleton.module.scss";

type Props = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
};

export default function Skeleton({ width = "100%", height = 16, borderRadius = 6, className }: Props) {
  return (
    <div
      className={`${styles.skeleton} ${className ?? ""}`}
      style={{ width, height, borderRadius }}
    />
  );
}
