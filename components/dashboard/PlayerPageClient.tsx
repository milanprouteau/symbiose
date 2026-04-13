"use client";

import { useRef, type ReactNode } from "react";
import PlayerStickyHeader from "./PlayerStickyHeader";

type Props = {
  hero: ReactNode;
  tabs: ReactNode;
  // Player data for sticky header
  name: string;
  photoUrl: string;
  team: string;
  position: string;
  ppg: string;
  rpg: string;
  apg: string;
};

export default function PlayerPageClient({ hero, tabs, name, photoUrl, team, position, ppg, rpg, apg }: Props) {
  const heroRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <PlayerStickyHeader
        name={name}
        photoUrl={photoUrl}
        team={team}
        position={position}
        ppg={ppg}
        rpg={rpg}
        apg={apg}
        heroRef={heroRef as React.RefObject<HTMLElement | null>}
      />
      {/* Observer uniquement sur le hero — quand il sort du viewport, le sticky header apparaît */}
      <div ref={heroRef}>
        {hero}
      </div>
      {tabs}
    </>
  );
}
