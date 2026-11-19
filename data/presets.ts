// Ready-made color schemes ("presets") that visitors can apply with one click.
// Each one names a Bambu Lab PLA Basic filament (exact name from data/filaments.json)
// for every color zone. To tweak one: change a name, save, and check it in the browser.
// A misspelled filament name stops the site from building, with an error saying which one.

import filaments from "./filaments.json";
import type { ZoneId } from "./zones";

type Zone = Exclude<ZoneId, "fixed">; // hardware isn't colorable
type Scheme = Record<Zone, string>; // zone → filament name

// Listed in the order the buttons appear: most colors first.
// strip = the little color squares on the button (filament names, left to right).
const SCHEMES: { id: string; name: string; strip: string[]; scheme: Scheme }[] = [
  {
    id: "mondrian",
    name: "Mondrian",
    strip: ["Red", "Sunflower Yellow", "Cyan", "Black", "Jade White"],
    // The default clock: the Onshape colors, matched to the nearest Bambu filaments
    scheme: {
      barrel: "Jade White",
      numerals: "Black",
      hands: "Black",
      driveWheel: "Red",
      goingTrain: "Red",
      escWheel: "Sunflower Yellow",
      escPallet: "Sunflower Yellow",
      frontFrame: "Jade White",
      rearFrame: "Jade White",
      motionWheel: "Cyan",
      hourWheel: "Jade White",
      minuteArbor: "Jade White",
      pendulum: "Black",
      ratchet: "Black",
      accents: "Light Gray",
    },
  },
  {
    // Purple, black and metallic gold
    id: "ravens",
    name: "Ravens",
    strip: ["Indigo Purple", "Gold", "Black", "Jade White"],
    scheme: {
      barrel: "Indigo Purple",
      numerals: "Jade White",
      hands: "Jade White",
      driveWheel: "Jade White",
      goingTrain: "Black",
      escWheel: "Indigo Purple",
      escPallet: "Indigo Purple",
      frontFrame: "Indigo Purple",
      rearFrame: "Jade White",
      motionWheel: "Gold",
      hourWheel: "Gold",
      minuteArbor: "Gold",
      pendulum: "Gold",
      ratchet: "Gold",
      accents: "Black",
    },
  },
  {
    // The state flag: black and gold (Calvert) with red and white (Crossland)
    id: "maryland",
    name: "Maryland",
    strip: ["Sunflower Yellow", "Red", "Black", "Jade White"],
    scheme: {
      barrel: "Jade White",
      numerals: "Red",
      hands: "Black",
      driveWheel: "Black",
      goingTrain: "Red",
      escWheel: "Jade White",
      escPallet: "Red",
      frontFrame: "Jade White",
      rearFrame: "Jade White",
      motionWheel: "Sunflower Yellow",
      hourWheel: "Sunflower Yellow",
      minuteArbor: "Black",
      pendulum: "Sunflower Yellow",
      ratchet: "Red",
      accents: "Black",
    },
  },
  {
    id: "pink",
    name: "Pink",
    strip: ["Black", "Jade White", "Pink"],
    // Picked by the owner on localhost (2026-11-18)
    scheme: {
      barrel: "Black",
      numerals: "Jade White",
      hands: "Black",
      driveWheel: "Jade White",
      goingTrain: "Jade White",
      escWheel: "Black",
      escPallet: "Black",
      frontFrame: "Pink",
      rearFrame: "Hot Pink",
      motionWheel: "Jade White",
      hourWheel: "Hot Pink",
      minuteArbor: "Magenta",
      pendulum: "Black",
      ratchet: "Jade White",
      accents: "Jade White",
    },
  },
  {
    // Orange, black and white
    id: "orioles",
    name: "Orioles",
    strip: ["Orange", "Black", "Jade White"],
    scheme: {
      barrel: "Orange",
      numerals: "Black",
      hands: "Black",
      driveWheel: "Black",
      goingTrain: "Orange",
      escWheel: "Black",
      escPallet: "Orange",
      frontFrame: "Jade White",
      rearFrame: "Black",
      motionWheel: "Orange",
      hourWheel: "Black",
      minuteArbor: "Orange",
      pendulum: "Orange",
      ratchet: "Black",
      accents: "Black",
    },
  },
];

// Turn a filament name into its hex color (what the 3D viewer uses)
function hexOf(presetName: string, filament: string) {
  const match = filaments.find((f) => f.name === filament);
  if (!match) throw new Error(`Preset "${presetName}": no filament named "${filament}"`);
  return match.hex;
}

export const PRESETS = SCHEMES.map((p) => ({
  ...p,
  colors: Object.fromEntries(
    Object.entries(p.scheme).map(([zone, filament]) => [zone, hexOf(p.name, filament)]),
  ) as Record<Zone, string>,
  stripColors: p.strip.map((filament) => hexOf(p.name, filament)),
}));
