import type { TeamAbbr } from "./nbaTeams";

/**
 * Résultats RÉELS de la draft NBA 2026 (60 picks).
 * - `playerId` : id d'un joueur tracké (ligne cliquable vers sa fiche)
 * - `playerId: null` : joueur non-NCAA / non tracké → ligne non-cliquable
 *   (affiche seulement n° de pick + logo NBA + nom). `origin` = club/pays.
 *
 * `team` = la franchise qui a réellement sélectionné le joueur (sans notion
 * de trade origin→owner — on garde juste l'équipe qui pick).
 */
/** Stats pro de base pour les joueurs non-NCAA (saison 2025-26). threePct null = pas de tir à 3pts. */
export type IntlStats = {
  pos: string;
  games: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  threePct: number | null;
  ftPct: number;
};

export type DraftResult = {
  pick: number;
  team: TeamAbbr;
  playerId: number | null;
  name: string;
  origin?: string;
  stats?: IntlStats;
};

export const DRAFT_2026: DraftResult[] = [
  { pick: 1, team: "WAS", playerId: 198382, name: "AJ Dybantsa" },
  { pick: 2, team: "UTA", playerId: 199883, name: "Darryn Peterson" },
  { pick: 3, team: "MEM", playerId: 198977, name: "Cameron Boozer" },
  { pick: 4, team: "CHI", playerId: 200988, name: "Caleb Wilson" },
  { pick: 5, team: "LAC", playerId: 199686, name: "Keaton Wagler" },
  { pick: 6, team: "BKN", playerId: 200182, name: "Mikel Brown Jr." },
  { pick: 7, team: "SAC", playerId: 198012, name: "Darius Acuff Jr." },
  { pick: 8, team: "ATL", playerId: 199596, name: "Kingston Flemings" },
  { pick: 9, team: "DAL", playerId: 5647, name: "Morez Johnson Jr." },
  { pick: 10, team: "MIL", playerId: 197982, name: "Brayden Burries" },
  { pick: 11, team: "GSW", playerId: 3951, name: "Yaxel Lendeborg" },
  { pick: 12, team: "OKC", playerId: 535, name: "Aday Mara" },
  { pick: 13, team: "MIL", playerId: 202445, name: "Nate Ament" },
  { pick: 14, team: "CHA", playerId: 203279, name: "Hannes Steinbach" },
  { pick: 15, team: "CHI", playerId: 4065, name: "Dailyn Swain" },
  { pick: 16, team: "OKC", playerId: 3596, name: "Bennett Stirtz" },
  { pick: 17, team: "DET", playerId: 202245, name: "Ebuka Okorie" },
  { pick: 18, team: "CHA", playerId: 7593, name: "Christian Anderson" },
  { pick: 19, team: "TOR", playerId: 833, name: "Allen Graves" },
  { pick: 20, team: "SAS", playerId: 7639, name: "Jayden Quaintance" },
  { pick: 21, team: "MEM", playerId: null, name: "Karim López", origin: "NZ Breakers (NBL)", stats: { pos: "Forward", games: 30, mpg: 25.6, ppg: 11.9, rpg: 6.1, apg: 1.9, fgPct: 49.0, threePct: 32.2, ftPct: 73.9 } },
  { pick: 22, team: "PHI", playerId: 85, name: "Labaron Philon Jr." },
  { pick: 23, team: "ATL", playerId: 1424, name: "Zuby Ejiofor" },
  { pick: 24, team: "LAL", playerId: 309, name: "Cameron Carr" },
  { pick: 25, team: "DAL", playerId: null, name: "Sergio de Larrea", origin: "Valencia (ACB)", stats: { pos: "Guard", games: 28, mpg: 18.0, ppg: 9.6, rpg: 3.0, apg: 3.7, fgPct: 44.3, threePct: 40.7, ftPct: 83.3 } },
  { pick: 26, team: "SAS", playerId: 7799, name: "Tarris Reed Jr." },
  { pick: 27, team: "BOS", playerId: 199595, name: "Chris Cenac Jr." },
  { pick: 28, team: "BKN", playerId: 142, name: "Joshua Jefferson" },
  { pick: 29, team: "SAC", playerId: 7792, name: "Alex Karaban" },
  { pick: 30, team: "PHX", playerId: 197993, name: "Koa Peat" },
  { pick: 31, team: "HOU", playerId: 420, name: "Bruce Thornton" },
  { pick: 32, team: "MEM", playerId: 7673, name: "Richie Saunders" },
  { pick: 33, team: "MIN", playerId: 211, name: "Isaiah Evans" },
  { pick: 34, team: "CLE", playerId: 198026, name: "Meleek Thomas" },
  { pick: 35, team: "DEN", playerId: 7827, name: "Trevon Brazile" },
  { pick: 36, team: "LAC", playerId: 3921, name: "Baba Miller" },
  { pick: 37, team: "MIA", playerId: 4066, name: "Ryan Conwell" },
  { pick: 38, team: "IND", playerId: 368, name: "Braden Smith" },
  { pick: 39, team: "NYK", playerId: null, name: "Jack Kayil", origin: "Alba Berlin (BBL)", stats: { pos: "Guard", games: 26, mpg: 21.1, ppg: 12.2, rpg: 3.0, apg: 3.6, fgPct: 38.4, threePct: 29.9, ftPct: 77.7 } },
  { pick: 40, team: "BOS", playerId: 465, name: "Dillon Mitchell" },
  { pick: 41, team: "OKC", playerId: 562, name: "Otega Oweh" },
  { pick: 42, team: "SAS", playerId: 3290, name: "Ja'Kobi Gillespie" },
  { pick: 43, team: "BKN", playerId: 529, name: "Tyler Bilodeau" },
  { pick: 44, team: "SAS", playerId: 209, name: "Maliq Brown" },
  { pick: 45, team: "SAC", playerId: 115, name: "Emanuel Sharp" },
  { pick: 46, team: "WAS", playerId: 302, name: "Felix Okpara" },
  { pick: 47, team: "NYK", playerId: 4556, name: "Tyler Nickel" },
  { pick: 48, team: "DAL", playerId: 5702, name: "Tobi Lawal" },
  { pick: 49, team: "DEN", playerId: 3147, name: "Bryce Hopkins" },
  { pick: 50, team: "TOR", playerId: 269, name: "Jaden Bradley" },
  { pick: 51, team: "ORL", playerId: 4986, name: "Izaiyah Nelson" },
  { pick: 52, team: "ATL", playerId: 270, name: "Henri Veesaar" },
  { pick: 53, team: "DET", playerId: 7614, name: "Ugonna Onyenso" },
  { pick: 54, team: "GSW", playerId: 2825, name: "Lajae Jones" },
  { pick: 55, team: "LAC", playerId: 5448, name: "Nick Martinelli" },
  { pick: 56, team: "DAL", playerId: null, name: "Vsevolod Ishchenko", origin: "Lokomotiv Kuban (VTB)", stats: { pos: "Forward", games: 43, mpg: 23.7, ppg: 8.7, rpg: 4.7, apg: 2.0, fgPct: 51.6, threePct: 46.3, ftPct: 80.1 } },
  { pick: 57, team: "LAC", playerId: null, name: "Narcisse Ngoy", origin: "Poitiers (Élite 2)", stats: { pos: "Center", games: 47, mpg: 25.0, ppg: 9.8, rpg: 11.6, apg: 1.2, fgPct: 68.0, threePct: null, ftPct: 56.9 } },
  { pick: 58, team: "NOP", playerId: 795, name: "Jaron Pierre Jr." },
  { pick: 59, team: "MIN", playerId: 366, name: "Trey Kaufman-Renn" },
  { pick: 60, team: "MIL", playerId: null, name: "Malique Lewis", origin: "SE Melbourne (NBL)", stats: { pos: "Forward", games: 25, mpg: 21.2, ppg: 7.3, rpg: 4.4, apg: 2.2, fgPct: 45.2, threePct: 37.5, ftPct: 82.6 } },
];

/** id joueur tracké → numéro de pick réel */
export const pickByPlayerId: Record<number, number> = Object.fromEntries(
  DRAFT_2026.filter((d) => d.playerId != null).map((d) => [d.playerId as number, d.pick]),
);

/** numéro de pick → franchise qui a sélectionné */
export const teamByPick: Record<number, TeamAbbr> = Object.fromEntries(
  DRAFT_2026.map((d) => [d.pick, d.team]),
);

/** picks non-NCAA / non trackés (lignes non-cliquables) */
export const internationalPicks: DraftResult[] = DRAFT_2026.filter((d) => d.playerId == null);
