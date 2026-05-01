"use client";

import { useRef, type ReactNode } from "react";
import PlayerStickyHeader from "./PlayerStickyHeader";
import CompareFab from "./CompareFab";

type IndexEntry = { id: number; name: string; team: string };

type Props = {
  hero: ReactNode;
  tabs: ReactNode;
  // Player data for sticky header
  id: number;
  name: string;
  photoUrl: string;
  team: string;
  teamAbbreviation: string;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
  allPlayers: IndexEntry[];
};

export default function PlayerPageClient({ hero, tabs, id, name, photoUrl, team, teamAbbreviation, position, ppg, rpg, apg, allPlayers }: Props) {
  const heroRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <PlayerStickyHeader
        id={id}
        name={name}
        photoUrl={photoUrl}
        team={team}
        teamAbbreviation={teamAbbreviation}
        position={position}
        ppg={ppg}
        rpg={rpg}
        apg={apg}
        allPlayers={allPlayers}
        heroRef={heroRef as React.RefObject<HTMLElement | null>}
      />
      {/* Observer uniquement sur le hero — quand il sort du viewport, le sticky header apparaît */}
      <div ref={heroRef}>
        {hero}
      </div>
      {tabs}
      {allPlayers.length > 0 && (
        <CompareFab currentPlayerId={id} allPlayers={allPlayers} />
      )}
    </>
  );
}
