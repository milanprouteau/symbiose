"use client";

import { useState, type ReactNode } from "react";
import { motion, LayoutGroup } from "motion/react";
import styles from "./PlayerTabs.module.scss";

const TABS = ["Overview", "Offensive", "Defensive", "Game Log"] as const;
type Tab = (typeof TABS)[number];

type Props = {
  overview: ReactNode;
  offensive: ReactNode;
  defensive: ReactNode;
  gameLog: ReactNode;
};

export default function PlayerTabs({ overview, offensive, defensive, gameLog }: Props) {
  const [active, setActive] = useState<Tab>("Overview");

  const content: Record<Tab, ReactNode> = {
    Overview: overview,
    Offensive: offensive,
    Defensive: defensive,
    "Game Log": gameLog,
  };

  return (
    <div className={styles.wrapper}>
      <LayoutGroup id="playerTabs">
        <nav className={styles.nav}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`${styles.tab} ${active === tab ? styles.tabActive : ""}`}
            >
              {tab}
              {active === tab && (
                <motion.div
                  layoutId="tabUnderline"
                  className={styles.tabUnderline}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
            </button>
          ))}
        </nav>
      </LayoutGroup>

      <div className={styles.content}>
        {content[active]}
      </div>
    </div>
  );
}
