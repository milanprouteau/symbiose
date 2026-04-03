"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./CompareButton.module.scss";
import Loader from "@/components/ui/Loader";
import overlayStyles from "@/components/ui/NavigationLoader.module.scss";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  currentPlayerId: number;
  allPlayers: IndexEntry[];
};

export default function CompareButton({ currentPlayerId, allPlayers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = allPlayers
    .filter((p) => p.id !== currentPlayerId)
    .filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleSelect = (targetId: number) => {
    setOpen(false);
    setSearch("");
    setLoading(true);
    router.push(`/compare-tool/${currentPlayerId}/${targetId}`);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.button} onClick={() => setOpen((v) => !v)}>
        Comparer avec
      </button>

      {open && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.search}
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className={styles.list}>
            {filtered.length === 0 && (
              <li className={styles.empty}>Aucun résultat</li>
            )}
            {filtered.map((p) => (
              <li
                key={p.id}
                className={styles.item}
                onClick={() => handleSelect(p.id)}
              >
                <span className={styles.itemName}>{p.name}</span>
                <span className={styles.itemTeam}>{p.team}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {loading && (
        <div className={overlayStyles.overlay}>
          <Loader />
        </div>
      )}
    </div>
  );
}
