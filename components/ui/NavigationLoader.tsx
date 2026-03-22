"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Loader from "./Loader";
import styles from "./NavigationLoader.module.scss";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Démarre le loader dès le clic sur un lien
  const handleClick = useCallback((e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a");
    if (!target) return;

    const href = target.getAttribute("href");
    if (!href) return;

    // Ignore les liens externes, ancres, et liens ouverts dans un nouvel onglet
    const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);
    const isNewTab = target.target === "_blank";
    const isAnchor = href.startsWith("#");
    const isSamePage = href === window.location.pathname;

    if (isInternal && !isNewTab && !isAnchor && !isSamePage) {
      setLoading(true);
    }
  }, []);

  // Stop le loader quand l'URL change (nouvelle page rendue)
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  if (!loading) return null;

  return (
    <div className={styles.overlay}>
      <Loader />
    </div>
  );
}