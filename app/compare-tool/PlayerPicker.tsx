"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";
import styles from "./PlayerPicker.module.scss";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  allPlayers: IndexEntry[];
  excludeId?: string;
  placeholder?: string;
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function PlayerPicker({
  label,
  value,
  onChange,
  allPlayers,
  excludeId,
  placeholder = "Choisir un joueur",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mounted = useMounted();

  const selected = allPlayers.find((p) => String(p.id) === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!wrapRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const btn = wrapRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setSearch("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const q = normalize(search.trim());
  const filtered = allPlayers
    .filter((p) => String(p.id) !== excludeId)
    .filter((p) => q === "" || normalize(p.name).includes(q) || normalize(p.team).includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  function pick(id: number) {
    onChange(String(id));
    setOpen(false);
  }

  return (
    <div className={styles.group}>
      <label className={styles.label}>{label}</label>
      <div className={styles.wrap} ref={wrapRef}>
        <button
          type="button"
          className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={selected ? styles.triggerValue : styles.triggerPlaceholder}>
            {selected ? `${selected.name} — ${selected.team}` : placeholder}
          </span>
          <ChevronDown size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} aria-hidden="true" />
        </button>
      </div>

      {open && mounted && position && createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          <input
            ref={inputRef}
            type="text"
            className={styles.search}
            placeholder="Rechercher un joueur…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className={styles.list} role="listbox">
            {filtered.length === 0 && (
              <li className={styles.empty}>Aucun résultat</li>
            )}
            {filtered.map((p) => (
              <li
                key={p.id}
                role="option"
                aria-selected={String(p.id) === value}
                className={`${styles.item} ${String(p.id) === value ? styles.itemSelected : ""}`}
                onClick={() => pick(p.id)}
              >
                <span className={styles.itemName}>{p.name}</span>
                <span className={styles.itemTeam}>{p.team}</span>
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </div>
  );
}
