export type TeamAbbr =
  | "ATL" | "BOS" | "BKN" | "CHA" | "CHI" | "CLE" | "DAL" | "DEN"
  | "DET" | "GSW" | "HOU" | "IND" | "LAC" | "LAL" | "MEM" | "MIA"
  | "MIL" | "MIN" | "NOP" | "NYK" | "OKC" | "ORL" | "PHI" | "PHX"
  | "POR" | "SAC" | "SAS" | "TOR" | "UTA" | "WAS";

export type Team = {
  abbr: TeamAbbr;
  name: string;
  city: string;
  primary: string;
};

export const NBA_TEAMS: Record<TeamAbbr, Team> = {
  ATL: { abbr: "ATL", name: "Hawks",         city: "Atlanta",      primary: "#E03A3E" },
  BOS: { abbr: "BOS", name: "Celtics",       city: "Boston",       primary: "#007A33" },
  BKN: { abbr: "BKN", name: "Nets",          city: "Brooklyn",     primary: "#000000" },
  CHA: { abbr: "CHA", name: "Hornets",       city: "Charlotte",    primary: "#1D1160" },
  CHI: { abbr: "CHI", name: "Bulls",         city: "Chicago",      primary: "#CE1141" },
  CLE: { abbr: "CLE", name: "Cavaliers",     city: "Cleveland",    primary: "#860038" },
  DAL: { abbr: "DAL", name: "Mavericks",     city: "Dallas",       primary: "#00538C" },
  DEN: { abbr: "DEN", name: "Nuggets",       city: "Denver",       primary: "#0E2240" },
  DET: { abbr: "DET", name: "Pistons",       city: "Detroit",      primary: "#C8102E" },
  GSW: { abbr: "GSW", name: "Warriors",      city: "Golden State", primary: "#1D428A" },
  HOU: { abbr: "HOU", name: "Rockets",       city: "Houston",      primary: "#CE1141" },
  IND: { abbr: "IND", name: "Pacers",        city: "Indiana",      primary: "#002D62" },
  LAC: { abbr: "LAC", name: "Clippers",      city: "LA",           primary: "#C8102E" },
  LAL: { abbr: "LAL", name: "Lakers",        city: "LA",           primary: "#552583" },
  MEM: { abbr: "MEM", name: "Grizzlies",     city: "Memphis",      primary: "#5D76A9" },
  MIA: { abbr: "MIA", name: "Heat",          city: "Miami",        primary: "#98002E" },
  MIL: { abbr: "MIL", name: "Bucks",         city: "Milwaukee",    primary: "#00471B" },
  MIN: { abbr: "MIN", name: "Timberwolves",  city: "Minnesota",    primary: "#0C2340" },
  NOP: { abbr: "NOP", name: "Pelicans",      city: "New Orleans",  primary: "#0C2340" },
  NYK: { abbr: "NYK", name: "Knicks",        city: "New York",     primary: "#006BB6" },
  OKC: { abbr: "OKC", name: "Thunder",       city: "Oklahoma City",primary: "#007AC1" },
  ORL: { abbr: "ORL", name: "Magic",         city: "Orlando",      primary: "#0077C0" },
  PHI: { abbr: "PHI", name: "76ers",         city: "Philadelphia", primary: "#006BB6" },
  PHX: { abbr: "PHX", name: "Suns",          city: "Phoenix",      primary: "#1D1160" },
  POR: { abbr: "POR", name: "Trail Blazers", city: "Portland",     primary: "#E03A3E" },
  SAC: { abbr: "SAC", name: "Kings",         city: "Sacramento",   primary: "#5A2D81" },
  SAS: { abbr: "SAS", name: "Spurs",         city: "San Antonio",  primary: "#000000" },
  TOR: { abbr: "TOR", name: "Raptors",       city: "Toronto",      primary: "#CE1141" },
  UTA: { abbr: "UTA", name: "Jazz",          city: "Utah",         primary: "#002B5C" },
  WAS: { abbr: "WAS", name: "Wizards",       city: "Washington",   primary: "#002B5C" },
};

export const teamLogo = (abbr: TeamAbbr) => `/nba/${abbr}.svg`;
