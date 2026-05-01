"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import styles from "./CompareFab.module.scss";
import Loader from "@/components/ui/Loader";
import overlayStyles from "@/components/ui/NavigationLoader.module.scss";
import { useMounted } from "@/hooks/useMounted";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  currentPlayerId: number;
  allPlayers: IndexEntry[];
};

export default function CompareFab({ currentPlayerId, allPlayers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

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
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen(true)}
        aria-label="Comparer avec un autre joueur"
      >
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7 4 L3 8 L7 12" />
          <path d="M3 8 H17" />
          <path d="M17 20 L21 16 L17 12" />
          <path d="M21 16 H7" />
        </svg>
        <span>Comparer</span>
      </button>

      {open && mounted && createPortal(
        <div
          className={styles.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Choisir un joueur à comparer"
        >
          <div className={styles.modal}>
            <span className={styles.handle} aria-hidden="true" />
            <div className={styles.header}>
              <h2 className={styles.title}>Comparer</h2>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 L6 18" />
                  <path d="M6 6 L18 18" />
                </svg>
              </button>
            </div>
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
        </div>,
        document.body
      )}

      {loading && (
        <div className={overlayStyles.overlay}>
          <Loader />
        </div>
      )}
    </>
  );
}
