#!/usr/bin/env node
// Apply 2026 NBA Draft Combine measurements (height/weight) to player JSONs.
// Source: babcockhoops.com / NBA.com combine-anthro.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const INDEX_PATH = path.join(ROOT, "data/players-index.json");
const PLAYERS_DIR = path.join(ROOT, "data/players");

// name | height (ft'in) | weight (lbs) | wingspan (ft'in)
const COMBINE_RAW = `
Matt Able | 6'3.75 | 195 | 6'8.25
Darius Acuff Jr. | 6'2 | 186 | 6'7
Amari Allen | 6'5.25 | 204 | 6'8
Nate Ament | 6'9.5 | 211 | 6'11.5
Christian Anderson Jr. | 6'0.75 | 180 | 6'6.25
Tobe Awaka | 6'8 | 261 | 7'2.25
Flory Bidunga | 6'7.75 | 228 | 7'3.25
Tyler Bilodeau | 6'7.25 | 228 | 7'0.75
John Blackwell | 6'3.25 | 199 | 6'2.25
Cameron Boozer | 6'8.25 | 253 | 7'1.5
Kylan Boswell | 6'1.25 | 226 | 6'7
Nick Boyd | 6'1 | 176 | 6'2.5
Jaden Bradley | 6'2.5 | 205 | 6'6.25
Trevon Brazile | 6'9.5 | 225 | 7'3.75
Maliq Brown | 6'8 | 216 | 7'0.75
Mikel Brown Jr. | 6'3.5 | 190 | 6'7.5
Brayden Burries | 6'3.75 | 215 | 6'6
Cameron Carr | 6'4.5 | 184 | 7'0.75
Chris Cenac Jr. | 6'10.25 | 240 | 7'5
Rueben Chinyelu | 6'9.25 | 259 | 7'7.5
Ryan Conwell | 6'2 | 214 | 6'7
AJ Dybantsa | 6'8.5 | 217 | 7'0.25
Zuby Ejiofor | 6'7.5 | 245 | 7'2
Isaiah Evans | 6'5.5 | 186 | 6'8.75
Jeremy Fears Jr. | 6'0 | 196 | 6'4
Kingston Flemings | 6'2.5 | 183 | 6'3.5
Ja'Kobi Gillespie | 5'11.75 | 181 | 6'4
Allen Graves | 6'7.75 | 226 | 7'0
Keyshawn Hall | 6'6 | 227 | 6'10.25
Joshua Jefferson | 6'7.75 | 246 | 6'10.75
Morez Johnson Jr. | 6'9 | 251 | 7'3.5
Alex Karaban | 6'6.75 | 225 | 6'11
Tobi Lawal | 6'7.25 | 214 | 6'10.5
Yaxel Lendeborg | 6'8.75 | 241 | 7'3.25
Karim Lopez | 6'8.25 | 222 | 6'11.5
Aday Mara | 7'3 | 260 | 7'6
Nick Martinelli | 6'6.5 | 223 | 6'10
Baba Miller | 6'10.5 | 208 | 7'1.75
Dillon Mitchell | 6'6.75 | 202 | 6'10.5
Milan Momcilovic | 6'8 | 218 | 6'9.25
Malachi Moreno | 6'11.25 | 242 | 7'1.5
Izaiyah Nelson | 6'8.25 | 219 | 7'2.5
Tyler Nickel | 6'6 | 217 | 6'8.5
Ebuka Okorie | 6'1.25 | 186 | 6'7.75
Felix Okpara | 6'10 | 237 | 7'2
Ugonna Onyenso | 6'11 | 236 | 7'4.75
Otega Oweh | 6'4.25 | 216 | 6'8.25
Koa Peat | 6'7 | 245 | 6'11.25
Darryn Peterson | 6'4.5 | 199 | 6'9.75
Labaron Philon Jr. | 6'2.5 | 176 | 6'6.25
Jayden Quaintance | 6'9 | 253 | 7'5.25
Tarris Reed Jr. | 6'9.75 | 263 | 7'4.25
Billy Richmond III | 6'5.75 | 195 | 6'8
Richie Saunders | 6'5 | 204 | 6'8.75
Emanuel Sharp | 6'2.75 | 208 | 6'3
Braden Smith | 5'10.25 | 166 | 6'3.25
Hannes Steinbach | 6'10.25 | 248 | 7'2.25
Bennett Stirtz | 6'2.5 | 186 | 6'6
Andrej Stojaković | 6'5.5 | 206 | 6'8.25
Peter Suder | 6'3.75 | 213 | 6'8
Luigi Suigo | 7'2.75 | 289 | 7'5.5
Dailyn Swain | 6'6.5 | 211 | 6'10
Tyler Tanner | 5'10.75 | 167 | 6'4.25
Meleek Thomas | 6'3 | 189 | 6'6.75
Bruce Thornton | 6'0 | 223 | 6'5
Milos Uzan | 6'3 | 185 | 6'5
Henri Veesaar | 6'11.25 | 227 | 7'2
Keaton Wagler | 6'5 | 188 | 6'6.25
Caleb Wilson | 6'9.25 | 211 | 7'0.25
Tounde Yessoufou | 6'4.25 | 219 | 6'10
`;

function parseFtIn(s) {
  // "6'8.5" -> 80.5 inches
  const m = s.trim().match(/^(\d+)'(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const ft = parseInt(m[1], 10);
  const inches = parseFloat(m[2]);
  return ft * 12 + inches;
}

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’`]/g, "")
    .replace(/\bjr\b/g, "")
    .replace(/\biii\b/g, "")
    .replace(/\bii\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const combine = COMBINE_RAW.trim().split("\n").map((line) => {
  const [name, ht, wt, ws] = line.split("|").map((s) => s.trim());
  return {
    name,
    height: parseFtIn(ht),
    weight: parseInt(wt, 10),
    wingspan: parseFtIn(ws),
  };
});

const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
const byNorm = new Map();
for (const p of index) byNorm.set(normalizeName(p.name), p);

let matched = 0;
const unmatched = [];

for (const c of combine) {
  const key = normalizeName(c.name);
  const player = byNorm.get(key);
  if (!player) {
    unmatched.push(c.name);
    continue;
  }
  const file = path.join(PLAYERS_DIR, `${player.id}.json`);
  if (!fs.existsSync(file)) {
    unmatched.push(`${c.name} (no file ${player.id}.json)`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.profile = data.profile ?? {};
  data.profile.height = c.height;
  data.profile.weight = c.weight;
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  matched++;
  console.log(`✓ ${c.name} (#${player.id}) → ${c.height}" / ${c.weight} lbs`);
}

console.log(`\n${matched}/${combine.length} matched.`);
if (unmatched.length) {
  console.log("\nUnmatched:");
  for (const u of unmatched) console.log(`  - ${u}`);
}
