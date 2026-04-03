import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SymbioseBB Stats",
    short_name: "SymbioseBB",
    description: "Stats et analyses des joueurs de basketball universitaire.",
    start_url: "/",
    display: "standalone",
    background_color: "#1D1D1B",
    theme_color: "#FF6C22",
    icons: [
      {
        src: "/LOGO/LOGO_mini/LOGO-SYMBIOSE_mini.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/LOGO/LOGO_mascotte/Assets_LOGO-SYMBIOSE_mascotte.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
