// Ready-made color schemes ("presets") that visitors can apply with one click.
// Each one names a Bambu Lab PLA Basic filament (exact name from data/filaments.json)
// for every color zone. To tweak one: change a name, save, and check it in the browser.
// A misspelled filament name stops the site from building, with an error saying which one.

import filaments from "./filaments.json";
import type { ZoneId } from "./zones";

type Zone = Exclude<ZoneId, "fixed">; // hardware isn't colorable
type Scheme = Record<Zone, string>; // zone → filament name

const SCHEMES: { id: string; name: string; scheme: Scheme }[] = [
  {
    id: "classic",
    name: "ClockMeister",
    // The default clock: the Onshape colors, matched to the nearest Bambu filaments
    scheme: {
      face: "Jade White",
      numerals: "Black",
      hands: "Black",
      mainWheel: "Red",
      wheels: "Red",
      escWheel: "Yellow",
      escPallet: "Yellow",
      frontFrame: "Jade White",
      rearFrame: "Jade White",
      motionWheel: "Turquoise",
      hourWheel: "Jade White",
      minuteArbor: "Jade White",
      pendulum: "Dark Gray",
      ratchet: "Dark Gray",
      accents: "Light Gray",
    },
  },
  {
    // The state flag: black and gold (Calvert) with red and white (Crossland)
    id: "maryland",
    name: "Maryland",
    scheme: {
      face: "Sunflower Yellow",
      numerals: "Black",
      hands: "Black",
      mainWheel: "Red",
      wheels: "Red",
      escWheel: "Black",
      escPallet: "Red",
      frontFrame: "Jade White",
      rearFrame: "Black",
      motionWheel: "Sunflower Yellow",
      hourWheel: "Red",
      minuteArbor: "Black",
      pendulum: "Sunflower Yellow",
      ratchet: "Red",
      accents: "Black",
    },
  },
  {
    id: "pink",
    name: "Pink",
    scheme: {
      face: "Pink",
      numerals: "Jade White",
      hands: "Jade White",
      mainWheel: "Magenta",
      wheels: "Magenta",
      escWheel: "Hot Pink",
      escPallet: "Magenta",
      frontFrame: "Pink",
      rearFrame: "Beige",
      motionWheel: "Hot Pink",
      hourWheel: "Jade White",
      minuteArbor: "Magenta",
      pendulum: "Magenta",
      ratchet: "Pink",
      accents: "Jade White",
    },
  },
  {
    // Orange, black and white
    id: "orioles",
    name: "Orioles",
    scheme: {
      face: "Orange",
      numerals: "Black",
      hands: "Black",
      mainWheel: "Black",
      wheels: "Orange",
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
  {
    // Purple, black and metallic gold
    id: "ravens",
    name: "Ravens",
    scheme: {
      face: "Purple",
      numerals: "Gold",
      hands: "Gold",
      mainWheel: "Black",
      wheels: "Indigo Purple",
      escWheel: "Gold",
      escPallet: "Black",
      frontFrame: "Black",
      rearFrame: "Indigo Purple",
      motionWheel: "Gold",
      hourWheel: "Black",
      minuteArbor: "Gold",
      pendulum: "Gold",
      ratchet: "Purple",
      accents: "Black",
    },
  },
];

// Turn filament names into hex colors (what the 3D viewer uses)
function toHex(presetName: string, scheme: Scheme) {
  return Object.fromEntries(
    Object.entries(scheme).map(([zone, filament]) => {
      const match = filaments.find((f) => f.name === filament);
      if (!match) throw new Error(`Preset "${presetName}": no filament named "${filament}"`);
      return [zone, match.hex];
    }),
  ) as Record<Zone, string>;
}

export const PRESETS = SCHEMES.map((p) => ({ ...p, colors: toHex(p.name, p.scheme) }));
