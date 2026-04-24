"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import styles from "./ThemeToggle.module.scss";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (document.documentElement.getAttribute("data-theme") ?? "dark") as "dark" | "light";
  });

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <button
      onClick={toggle}
      className={styles.btn}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          className={styles.iconWrap}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
          {theme === "dark"
            ? <Sun size={16} aria-hidden="true" />
            : <Moon size={16} aria-hidden="true" />
          }
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
