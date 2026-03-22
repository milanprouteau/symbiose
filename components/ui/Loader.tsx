"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import styles from "./Loader.module.scss";

export default function Loader() {
  const text = "Loading...";
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleChars((prev) => {
        if (prev >= text.length) {
          return 0;
        }
        return prev + 1;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <div className={styles.container} id="loader-container">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className={styles.rotatingContainer}
        id="rotating-image-container"
      >
        <img
          src="/MASCOTTE/MASCOTTE-SYMBIOSE_rond.svg"
          alt="Loading Wheel"
          className={styles.image}
          referrerPolicy="no-referrer"
          id="loader-image"
        />
      </motion.div>

      <div className={styles.textContainer} id="loading-text-container">
        {text.split("").map((char, index) => (
          <span
            key={index}
            className={`${styles.char} ${
              index < visibleChars ? styles.charVisible : styles.charHidden
            }`}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
