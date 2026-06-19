import draftData from "@/data/nba-draft-2026.json";
import type { TeamAbbr } from "./nbaTeams";

export type PickSlot = {
  pick: number;
  round: 1 | 2;
  origin: TeamAbbr;
  owner: TeamAbbr;
};

const PICKS = draftData.picks as PickSlot[];

export function getDraftOrder(): PickSlot[] {
  return PICKS;
}
