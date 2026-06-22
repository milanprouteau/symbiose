import type { Metadata } from "next";
import { Bowlby_One, Graduate } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NavigationLoaderWrapper from "@/components/layout/NavigationLoaderWrapper";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.scss";
import styles from "./layout.module.scss";

const bowlby = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bowlby",
  display: "swap",
});

const graduate = Graduate({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-graduate",
  display: "swap",
});

const alfabetRegular = localFont({
  src: "./fonts/fonnts.com-Alfabet_Regular.woff2",
  variable: "--font-alfabet-regular",
  display: "swap",
  weight: "400",
});

const alfabetSemiBold = localFont({
  src: "./fonts/fonts.com-Alfabet_SemiBold.woff2",
  variable: "--font-alfabet-semibold",
  display: "swap",
  weight: "600",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://symbiosebbstats.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SymbioseBB Stats",
    template: "%s | SymbioseBB Stats",
  },
  description: "Stats, analyses et comparatifs des joueurs de basketball universitaire — par SymbioseBB.",
  keywords: ["basketball", "stats", "NCAA", "college basketball", "symbiose", "analyse"],
  authors: [{ name: "SymbioseBB", url: "https://symbiosebb.fr" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "SymbioseBB Stats",
    title: "SymbioseBB Stats",
    description: "Stats, analyses et comparatifs des joueurs de basketball universitaire.",
    images: [
      {
        url: "/LOGO/LOGO_mascotte/Assets_LOGO-SYMBIOSE_mascotte.png",
        width: 1200,
        height: 630,
        alt: "SymbioseBB Stats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@SymbioseBB",
    creator: "@SymbioseBB",
    title: "SymbioseBB Stats",
    description: "Stats, analyses et comparatifs des joueurs de basketball universitaire.",
    images: ["/LOGO/LOGO_mascotte/Assets_LOGO-SYMBIOSE_mascotte.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bowlby.variable} ${graduate.variable} ${alfabetRegular.variable} ${alfabetSemiBold.variable}`}
    >
      {/* Anti-FOUC : applique le thème avant le rendu React */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();` }} />
      <body className={styles.body}>
        <PostHogProvider>
          <a href="#main-content" className="skipLink">Aller au contenu</a>
          <Header />
          <main id="main-content" className={styles.main}>
            <NavigationLoaderWrapper />
            {children}
          </main>
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  );
}