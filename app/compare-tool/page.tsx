import { promises as fs } from "fs";
import path from "path";
import ComparePickerClient from "./ComparePickerClient";

type IndexEntry = { id: number; name: string; team: string };

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "players", "index.json"),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export default async function CompareToolLanding() {
  const allPlayers = await loadIndex();
  return <ComparePickerClient allPlayers={allPlayers} />;
}
