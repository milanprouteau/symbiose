"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import styles from "./CompareButton.module.scss";
import Loader from "@/components/ui/Loader";
import overlayStyles from "@/components/ui/NavigationLoader.module.scss";
import { useMounted } from "@/hooks/useMounted";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  currentPlayerId: number;
  allPlayers: IndexEntry[];
  /** Dropdown alignment relative to the button. Defaults to left. */
  align?: "left" | "right";
};

export default function CompareButton({ currentPlayerId, allPlayers, align = "left" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const mounted = useMounted();
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inWrapper = ref.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inWrapper && !inDropdown) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const btn = ref.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const dropdownWidth = 260;
      const left = align === "right"
        ? rect.right - dropdownWidth
        : rect.left;
      setPosition({ top: rect.bottom + 6, left, width: dropdownWidth });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

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
      <button
        className={`${styles.button} ${open ? styles.buttonOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Comparer avec un autre joueur"
        aria-expanded={open}
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
        <span className={styles.label}>Comparer</span>
      </button>

      {open && mounted && position && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{ top: position.top, left: position.left, width: position.width }}
        >
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
        </div>,
        document.body
      )}
      {loading && mounted && createPortal(
        <div className={overlayStyles.overlay}>
          <Loader />
        </div>,
        document.body
      )}
    </div>
  );
}
