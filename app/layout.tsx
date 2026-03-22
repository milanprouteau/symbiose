import type { Metadata } from "next";
import { Bowlby_One } from "next/font/google";
import localFont from "next/font/local";
import Header from "@/components/layout/Header";
import NavigationLoaderWrapper from "@/components/layout/NavigationLoaderWrapper";
import "./globals.scss";
import styles from "./layout.module.scss";

const bowlby = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bowlby",
  display: "swap",
});

const alfabetHairline = localFont({
  src: "./fonts/fonts.com-Alfabet_Hairline.woff2",
  variable: "--font-alfabet-hairline",
  display: "swap",
  weight: "100",
});

const alfabetSemiBold = localFont({
  src: "./fonts/fonts.com-Alfabet_SemiBold.woff2",
  variable: "--font-alfabet-semibold",
  display: "swap",
  weight: "600",
});

export const metadata: Metadata = {
  title: "Symbiose",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bowlby.variable} ${alfabetHairline.variable} ${alfabetSemiBold.variable}`}
    >
      <body className={styles.body}>
        <Header />
        <main className={styles.main}>
          <NavigationLoaderWrapper />
          {children}
        </main>
      </body>
    </html>
  );
}