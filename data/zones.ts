// Color zones: groups of clock parts that the customer colors together.
// Default colors are real Bambu Lab PLA Basic filaments (see data/filaments.json), chosen to
// match the site palette so the default clock and the site agree. Presets: data/presets.ts.
//
// `accent` links a zone to a site color variable: when the customer recolors that zone,
// the matching blocks, buttons and browser toolbar on the site recolor too.

export type ZoneId =
  | "face"
  | "numerals"
  | "hands"
  | "mainWheel"
  | "wheels"
  | "escWheel"
  | "escPallet"
  | "frontFrame"
  | "rearFrame"
  | "motionWheel"
  | "hourWheel"
  | "minuteArbor"
  | "pendulum"
  | "ratchet"
  | "accents"
  | "fixed";

export type Accent = "--red" | "--blue" | "--yellow";

export const ZONES: {
  id: ZoneId;
  label: string;
  color: string;
  accent?: Accent;
}[] = [
  { id: "face", label: "Face", color: "#fec600", accent: "--yellow" },
  { id: "numerals", label: "Numerals", color: "#000000" },
  { id: "hands", label: "Hands", color: "#000000" },
  { id: "mainWheel", label: "Main wheel", color: "#9d2235" },
  { id: "wheels", label: "Wheels", color: "#9d2235", accent: "--red" },
  { id: "escWheel", label: "Escape wheel", color: "#0056b8", accent: "--blue" },
  { id: "escPallet", label: "Escape pallet", color: "#0056b8" },
  { id: "frontFrame", label: "Front frame", color: "#d1d3d5" },
  { id: "rearFrame", label: "Rear frame", color: "#d1d3d5" },
  { id: "motionWheel", label: "Motion works wheel", color: "#d1d3d5" },
  { id: "hourWheel", label: "Hour wheel", color: "#d1d3d5" },
  { id: "minuteArbor", label: "Minute arbor", color: "#d1d3d5" },
  { id: "pendulum", label: "Pendulum", color: "#0086d6" },
  { id: "ratchet", label: "Ratchet", color: "#0086d6" },
  { id: "accents", label: "Small gray parts", color: "#8e9089" },
  { id: "fixed", label: "Hardware (not selectable)", color: "#9aa5af" },
];

// Decide which zone a part belongs to, from its Onshape name.
// three.js rewrites names slightly ("Part 3" becomes "Part_3"; a repeated name gets "_1" added),
// so we turn underscores back into spaces and match on how the name starts.
// isGray tells apart the two parts that are both named "Hour Wheel".
export function zoneForPart(rawName: string, isGray: boolean): ZoneId | null {
  const name = rawName.replace(/_/g, " ");

  if (name === "Part 3") return "face";
  if (name === "Part 4") return "mainWheel"; // the large first wheel of the train
  if (name === "Part 2") return "accents";
  if (/^Part \d+$/.test(name)) return "numerals"; // all other unnamed parts are numeral segments

  if (/^(2nd|3rd|4th) Wheel/.test(name)) return "wheels";
  if (name.startsWith("Mirror Esc Wheel")) return "escWheel";
  if (name.startsWith("Mirror Esc Pallet")) return "escPallet";
  if (name.startsWith("Hour Hand") || name.startsWith("Minute Hand")) return "hands";
  if (name.startsWith("Hour Wheel")) return isGray ? "accents" : "hourWheel";
  if (name.startsWith("Motion Works")) return "motionWheel";
  if (name.startsWith("Minute Arbor")) return "minuteArbor";
  if (name.startsWith("Mirror Front")) return "frontFrame";
  if (name.startsWith("Mirror Back")) return "rearFrame";
  if (name.startsWith("Pendant")) return "pendulum";
  if (name.startsWith("Spur gear")) return "ratchet";
  if (name.startsWith("Hex socket") || name.startsWith("Pendulm Rod")) return "fixed";

  return null; // unknown part: the viewer paints it magenta so it's easy to spot
}
