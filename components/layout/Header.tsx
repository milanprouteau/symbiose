import Image from "next/image";
import Link from "next/link";
import { Scale } from "lucide-react";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      
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
          <Link
            href="/compare-tool"
            className={styles.navLink}
          >
            {/* Desktop */}
            <span className={styles.desktopLabel}>Compare tool</span>

            {/* Mobile */}
            <Scale className={styles.mobileIcon} />
          </Link>
        </nav>
      </div>

    </header>
  );
}