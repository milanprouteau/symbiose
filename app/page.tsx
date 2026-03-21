import { promises as fs } from "fs";
import path from "path";
import PlayerTable, { type PlayerEntry } from "@/components/dashboard/PlayerTable";

export default async function HomePage() {
  const indexPath = path.join(process.cwd(), "data", "players", "index.json");
  const raw = await fs.readFile(indexPath, "utf-8");
  const players: PlayerEntry[] = JSON.parse(raw);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-display text-4xl text-primary-orange mb-2">
        Top NCAA Prospects
      </h1>
      <PlayerTable players={players} />
    </div>
  );
}