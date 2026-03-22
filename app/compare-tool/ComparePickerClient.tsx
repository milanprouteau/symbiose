"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ComparePicker.module.scss";

type IndexEntry = { id: number; name: string; team: string };

type Props = { allPlayers: IndexEntry[] };

export default function ComparePickerClient({ allPlayers }: Props) {
  const router = useRouter();
  const [sel1, setSel1] = useState("");
  const [sel2, setSel2] = useState("");

  const canCompare = sel1 && sel2 && sel1 !== sel2;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Compare Players
      </h1>

      <div className={styles.selectGrid}>
        <div className={styles.selectGroup}>
          <label className={styles.label}>
            Player 1
          </label>
          <select
            value={sel1}
            onChange={(e) => setSel1(e.target.value)}
            className={styles.select}
          >
            <option value="">Select a player</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name} — {p.team}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.label}>
            Player 2
          </label>
          <select
            value={sel2}
            onChange={(e) => setSel2(e.target.value)}
            className={styles.select}
          >
            <option value="">Select a player</option>
            {allPlayers.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name} — {p.team}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        disabled={!canCompare}
        onClick={() => router.push(`/compare-tool/${sel1}/${sel2}`)}
        className={`${styles.button} ${
          canCompare ? styles.buttonEnabled : styles.buttonDisabled
        }`}
      >
        Compare
      </button>

      {sel1 && sel2 && sel1 === sel2 && (
        <p className={styles.error}>
          Please select two different players.
        </p>
      )}
    </div>
  );
}
