"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./ComparePicker.module.scss";
import Loader from "@/components/ui/Loader";
import overlayStyles from "@/components/ui/NavigationLoader.module.scss";
import PlayerPicker from "./PlayerPicker";

type IndexEntry = { id: number; name: string; team: string };

type Props = { allPlayers: IndexEntry[] };

export default function ComparePickerClient({ allPlayers }: Props) {
  const router = useRouter();
  const [sel1, setSel1] = useState("");
  const [sel2, setSel2] = useState("");
  const [loading, setLoading] = useState(false);

  const canCompare = sel1 && sel2 && sel1 !== sel2;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Comparer des joueurs
      </h1>

      <div className={styles.selectGrid}>
        <PlayerPicker
          label="Joueur 1"
          value={sel1}
          onChange={setSel1}
          allPlayers={allPlayers}
          excludeId={sel2}
        />
        <PlayerPicker
          label="Joueur 2"
          value={sel2}
          onChange={setSel2}
          allPlayers={allPlayers}
          excludeId={sel1}
        />
      </div>

      <button
        disabled={!canCompare}
        onClick={() => {
          setLoading(true);
          router.push(`/compare-tool/${sel1}/${sel2}`);
        }}
        className={`${styles.button} ${
          canCompare ? styles.buttonEnabled : styles.buttonDisabled
        }`}
      >
        Comparer
      </button>

      {sel1 && sel2 && sel1 === sel2 && (
        <p className={styles.error}>
          Choisissez deux joueurs différents.
        </p>
      )}

      {loading && (
        <div className={overlayStyles.overlay}>
          <Loader />
        </div>
      )}
    </div>
  );
}
