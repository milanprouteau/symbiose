"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import playersIndex from "@/data/players-index.json";
import Loader from "@/components/ui/Loader";
import overlayStyles from "@/components/ui/NavigationLoader.module.scss";
import styles from "./PlayerSearch.module.scss";

type IndexEntry = { id: number; name: string; team: string };

const MIN_CHARS = 2;
const MAX_RESULTS = 8;

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function PlayerSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const allPlayers = playersIndex as IndexEntry[];

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < MIN_CHARS) return [];
    return allPlayers
      .filter((p) => normalize(p.name).includes(q) || normalize(p.team).includes(q))
      .slice(0, MAX_RESULTS);
  }, [query, allPlayers]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      mobileInputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(id: number) {
    setOpen(false);
    setMobileOpen(false);
    setQuery("");
    setLoading(true);
    router.push(`/player/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIdx].id);
    }
  }

  const showDropdown = open && query.trim().length >= MIN_CHARS;

  const listItems = (onPick: (id: number) => void) => (
    <ul className={styles.list} role="listbox">
      {results.length === 0 ? (
        <li className={styles.empty}>Aucun joueur trouvé</li>
      ) : (
        results.map((p, i) => (
          <li
            key={p.id}
            role="option"
            aria-selected={i === activeIdx}
            className={`${styles.item} ${i === activeIdx ? styles.itemActive : ""}`}
            onMouseEnter={() => setActiveIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); onPick(p.id); }}
          >
            <span className={styles.itemName}>{p.name}</span>
            <span className={styles.itemTeam}>{p.team}</span>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <>
      {/* Desktop : input inline */}
      <div ref={containerRef} className={styles.desktop}>
        <div className={styles.inputWrap}>
          <Search size={14} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un joueur"
            className={styles.input}
            aria-label="Rechercher un joueur"
          />
        </div>
        {showDropdown && (
          <div className={styles.dropdown}>{listItems(go)}</div>
        )}
      </div>

      {/* Mobile : icon trigger */}
      <button
        type="button"
        className={styles.mobileTrigger}
        aria-label="Rechercher un joueur"
        onClick={() => setMobileOpen(true)}
      >
        <Search size={22} aria-hidden="true" />
      </button>

      {loading && (
        <div className={overlayStyles.overlay}>
          <Loader />
        </div>
      )}

      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileOpen(false);
          }}
        >
          <div className={styles.mobilePanel}>
            <div className={styles.mobileBar}>
              <Search size={18} className={styles.searchIcon} aria-hidden="true" />
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Rechercher un joueur"
                className={styles.mobileInput}
                aria-label="Rechercher un joueur"
              />
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="Fermer la recherche"
                onClick={() => setMobileOpen(false)}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {query.trim().length >= MIN_CHARS && (
              <div className={styles.mobileResults}>{listItems(go)}</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
