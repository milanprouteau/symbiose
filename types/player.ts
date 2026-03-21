export type Shot = {
  id: string;
  x: number;        // coordonnée terrain -250 à 250
  y: number;        // coordonnée terrain -47.5 à 422.5
  made: boolean;
  type: "2PT" | "3PT" | "FT";
  zone: string;
};

export type Player = {
  id: string;
  name: string;
  number: string;
  position: string;
  team: string;
  age: number;
  height: string;
  weight: string;
  photo?: string;
  stats: {
    ppg: number;
    rpg: number;
    apg: number;
    mpg: number;
      // ... autant de stats que nécessaire
  };
  shots: Shot[];
  overview: string[];
};