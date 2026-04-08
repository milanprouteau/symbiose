import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";
import ComparePickerClient from "./ComparePickerClient";

export const metadata: Metadata = {
  title: "Comparatif joueurs",
  description: "Comparez les statistiques de deux joueurs de basketball universitaire côte à côte.",
  openGraph: {
    title: "Comparatif joueurs — SymbioseBB Stats",
    description: "Comparez les statistiques de deux joueurs côte à côte.",
  },
};

type IndexEntry = { id: number; name: string; team: string };

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players-index.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch (err) {
    console.error("[loadIndex] Failed to read player index:", err);
    return [];
  }
}

export default async function CompareToolLanding() {
  const allPlayers = await loadIndex();
  return <ComparePickerClient allPlayers={allPlayers} />;
}
