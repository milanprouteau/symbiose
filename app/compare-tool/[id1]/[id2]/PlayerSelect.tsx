import styles from "./CompareClient.module.scss";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  players: IndexEntry[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  excludeId?: string;
};

export default function PlayerSelect({ players, value, onChange, label, excludeId }: Props) {
  const sorted = [...players]
    .filter((p) => String(p.id) !== excludeId)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.selectGroup}>
      <label className={styles.label}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Sélectionner un joueur</option>
        {sorted.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {p.name} — {p.team}
          </option>
        ))}
      </select>
    </div>
  );
}
