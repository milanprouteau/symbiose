// Mock draft predictions basées sur Tankathon big board (2026), NCAA uniquement, renumérotés 1-51
export const mockDraftPredictions: Record<number, number> = {
  198977: 1,   // Cameron Boozer
  199883: 2,   // Darryn Peterson
  198382: 3,   // AJ Dybantsa
  200988: 4,   // Caleb Wilson
  199686: 5,   // Keaton Wagler
  198012: 6,   // Darius Acuff
  199596: 7,   // Kingston Flemings
  197982: 8,   // Brayden Burries
  200182: 9,   // Mikel Brown Jr.
  202445: 10,  // Nate Ament
  85: 11,      // Labaron Philon
  3951: 12,    // Yaxel Lendeborg
  203279: 13,  // Hannes Steinbach
  199595: 14,  // Chris Cenac Jr.
  309: 15,     // Cameron Carr
  5647: 16,    // Morez Johnson Jr.
  535: 17,     // Aday Mara
  197993: 18,  // Koa Peat
  198155: 19,  // Tounde Yessoufou
  7639: 20,    // Jayden Quaintance
  3596: 21,    // Bennett Stirtz
  4065: 22,    // Dailyn Swain
  7593: 23,    // Christian Anderson
  833: 24,     // Allen Graves
  211: 25,     // Isaiah Evans
  202245: 26,  // Ebuka Okorie
  142: 27,     // Joshua Jefferson
  198026: 28,  // Meleek Thomas
  197881: 29,  // Amari Allen
  4562: 30,    // Tyler Tanner
  270: 31,     // Henri Veesaar
  7799: 32,    // Tarris Reed Jr.
  7792: 33,    // Alex Karaban
  1424: 34,    // Zuby Ejiofor
  7673: 35,    // Richie Saunders
  4066: 36,    // Ryan Conwell
  269: 37,     // Jaden Bradley
  53: 38,      // Flory Bidunga
  149: 39,     // Milan Momcilovic
  7827: 40,    // Trevon Brazile
  3921: 41,    // Baba Miller
  420: 42,     // Bruce Thornton
  562: 43,     // Otega Oweh
  115: 44,     // Emanuel Sharp
  114: 45,     // Milos Uzan
  368: 46,     // Braden Smith
  2474: 47,    // Jeremy Fears Jr.
  144: 48,     // Tamin Lipsey
  334: 49,     // Keyshawn Hall
  465: 50,     // Dillon Mitchell
  7241: 51,    // Nate Bittle
};

export function getMockDraftPrediction(playerId: number): string {
  const prediction = mockDraftPredictions[playerId];
  return prediction ? `#${prediction}` : "—";
}
