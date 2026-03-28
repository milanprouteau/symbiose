// Mock draft predictions based on PlayerList.md order (1-60)
export const mockDraftPredictions: Record<number, number> = {
  198382: 1,   // AJ Dybantsa
  199883: 2,   // Darryn Peterson
  198977: 3,   // Cameron Boozer
  200988: 4,   // Caleb Wilson
  199596: 5,   // Kingston Flemings
  199686: 6,   // Keaton Wagler
  202445: 7,   // Nate Ament
  198012: 8,   // Darius Acuff
  200182: 9,   // Mikel Brown Jr.
  85: 10,      // Labaron Philon
  203279: 11,  // Hannes Steinbach
  3951: 12,    // Yaxel Lendeborg
  216: 13,     // Patrick Ngongba II
  202778: 14,  // Braylon Mullins
  7639: 15,    // Jayden Quaintance
  502: 16,     // Thomas Haugh
  197993: 17,  // Koa Peat
  197982: 18,  // Brayden Burries
  3596: 19,    // Bennett Stirtz
  7593: 20,    // Christian Anderson
  199595: 21,  // Chris Cenac Jr.
  142: 22,     // Joshua Jefferson
  198155: 23,  // Tounde Yessoufou
  535: 24,     // Aday Mara
  309: 25,     // Cameron Carr
  5647: 26,    // Morez Johnson Jr.
  4562: 27,    // Tyler Tanner
  197881: 28,  // Amari Allen
  202245: 29,  // Ebuka Okorie
  199963: 30,  // Malachi Moreno
  211: 31,     // Isaiah Evans
  4065: 32,    // Dailyn Swain
  202954: 33,  // Alijah Arenas
  53: 34,      // Flory Bidunga
  270: 35,     // Henri Veesaar
  198026: 36,  // Meleek Thomas
  5773: 37,    // Juke Harris
  7673: 38,    // Richie Saunders
  368: 39,     // Braden Smith
  7792: 40,    // Alex Karaban
  1424: 41,    // Zuby Ejiofor
  4066: 42,    // Ryan Conwell
  7581: 43,    // JT Toppin
  112: 44,     // Joseph Tugler
  496: 45,     // Alex Condon
  7799: 46,    // Tarris Reed Jr.
  274: 47,     // Motiejus Krivas
  497: 48,     // Rueben Chinyelu
  420: 49,     // Bruce Thornton
  149: 50,     // Milan Momcilovic
  269: 51,     // Jaden Bradley
  2862: 52,    // Paul McNeil Jr.
  144: 53,     // Tamin Lipsey
  7241: 54,    // Nate Bittle
  8457: 55,    // Miles Byrd
  334: 56,     // Keyshawn Hall
  203192: 57,  // Johann Grunloh
};

export function getMockDraftPrediction(playerId: number): string {
  const prediction = mockDraftPredictions[playerId];
  return prediction ? `#${prediction}` : "—";
}
