"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

export default function NavigationLoader() {
  const pathname = usePathname();
  const prevRef = useRef(pathname);
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  const handleClick = useCallback((e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    const href = a.getAttribute("href") ?? "";
    if (
      !href.startsWith("/") ||
      a.target === "_blank" ||
      href.startsWith("#") ||
      href === window.location.pathname
    ) return;
    setPhase("loading");
  }, []);

  useEffect(() => {
    if (prevRef.current !== pathname) {
      prevRef.current = pathname;
      if (phase === "loading") {
        const t1 = setTimeout(() => setPhase("done"), 0);
        const t2 = setTimeout(() => setPhase("idle"), 450);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    }
  }, [pathname, phase]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return (
    <AnimatePresence>
      {phase !== "idle" && (
        <motion.div
          key="bar"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "var(--color-primary-orange)",
            zIndex: 9999,
            transformOrigin: "left center",
          }}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={phase === "done" ? { scaleX: 1, opacity: 1 } : { scaleX: 0.75, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={
            phase === "done"
              ? { duration: 0.15, ease: "easeOut" }
              : { duration: 2, ease: [0.22, 1, 0.36, 1] }
          }
        />
      )}
    </AnimatePresence>
  );
}
