import { promises as fs } from "fs";
import path from "path";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://symbiosebbstats.fr";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), priority: 1 },
    { url: `${siteUrl}/compare-tool`, lastModified: new Date(), priority: 0.8 },
    { url: `${siteUrl}/sis-sispx`, lastModified: new Date(), priority: 0.6 },
  ];

  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", "index.json"),
      "utf-8"
    );
    const players: { id: number }[] = JSON.parse(raw);
    const playerRoutes: MetadataRoute.Sitemap = players.map((p) => ({
      url: `${siteUrl}/player/${p.id}`,
      lastModified: new Date(),
      priority: 0.7,
    }));
    return [...staticRoutes, ...playerRoutes];
  } catch {
    return staticRoutes;
  }
}
