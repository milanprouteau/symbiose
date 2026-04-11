"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Scale, Users } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import styles from "./Header.module.scss";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>

      {/* Gauche : espace vide pour équilibrer */}
      <div className={styles.spacer} />

      {/* Centre : Logo */}
      <Link href="/" className={styles.logoLink}>
        <Image
          src="/LOGO/LOGO_mascotte/LOGO-SYMBIOSE_mascotte.svg"
          alt="Symbiose"
          width={180}
          height={180}
          priority
        />
      </Link>

      {/* Droite : Navigation */}
      <div className={styles.navContainer}>
        <nav className={styles.nav}>
          <Link href="/compare-tool" className={styles.navLink} aria-label="Comparer joueurs">
            <span className={styles.desktopLabel} aria-hidden="true">Comparer joueurs</span>
            <Scale className={styles.mobileIcon} aria-hidden="true" />
          </Link>
          <ThemeToggle />
        </nav>
      </div>

    </header>
  );
}
