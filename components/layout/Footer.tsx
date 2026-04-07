import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";
import styles from "./Footer.module.scss";

const SOCIAL_LINKS = [
  {
    label: "Site principal",
    href: "https://symbiosebb.fr/",
    icon: <Globe size={18} />,
  },
  {
    label: "X / Twitter",
    href: "https://x.com/SymbioseBB",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/symbiosebb/",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.01" strokeWidth={3} />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCWjNcRXGJ9MRrwYbW4udo9w",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: "Spotify",
    href: "https://open.spotify.com/show/0xvfA4SvYSmHYHqa3o3XVC",
    icon: (
      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    ),
  },
  {
    label: "Deezer",
    href: "https://www.deezer.com/fr/show/3428922",
    icon: <Image src="/logo/deezer.svg" alt="Deezer" width={18} height={18} unoptimized style={{ filter: "brightness(0) invert(1)", opacity: 0.45 }} />,
  },
];

const NAV_LINKS = [
  { label: "symbiosebb.fr", href: "https://symbiosebb.fr/", external: true },
  { label: "Mentions légales", href: "/mentions-legales", external: false },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>

        {/* Top row */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <Image
              src="/logo/LOGO_maxi/LOGO-SYMBIOSE_maxi.svg"
              alt="SymbioseBB"
              width={160}
              height={48}
              unoptimized
              className={styles.brandLogo}
            />
          </div>

          <div className={styles.socials}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom row */}
        <div className={styles.bottom}>
          <nav className={styles.nav}>
            {NAV_LINKS.map((l) =>
              l.external ? (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.navLink}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className={styles.navLink}>
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <p className={styles.copy}>© {new Date().getFullYear()} SymbioseBB. Tous droits réservés.</p>
        </div>

      </div>
    </footer>
  );
}
