"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";
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
      {theme === "dark"
        ? <Sun size={16} aria-hidden="true" />
        : <Moon size={16} aria-hidden="true" />
      }
    </button>
  );
}
