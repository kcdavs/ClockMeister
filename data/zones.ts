// Color zones: groups of clock parts that the customer colors together.
// Default colors are real Bambu Lab PLA Basic filaments (see data/filaments.json),
// matched to the colors set in Onshape (2026-11-18 export). Presets: data/presets.ts.
//
// `accent` links a zone to a site color variable: when the customer recolors that zone,
// the matching blocks, buttons and browser toolbar on the site recolor too.

export type ZoneId =
  | "barrel"
  | "numerals"
  | "hands"
  | "driveWheel"
  | "goingTrain"
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
  { id: "barrel", label: "Mainspring barrel", color: "#ffffff" },
  { id: "numerals", label: "Numerals", color: "#000000" },
  { id: "hands", label: "Hands", color: "#000000" },
  { id: "driveWheel", label: "Drive wheel", color: "#c12e1f" },
  { id: "goingTrain", label: "Going train", color: "#c12e1f", accent: "--red" },
  { id: "escWheel", label: "Escape wheel", color: "#fec600", accent: "--yellow" },
  { id: "escPallet", label: "Escape pallet", color: "#fec600" },
  { id: "frontFrame", label: "Front frame", color: "#ffffff" },
  { id: "rearFrame", label: "Rear frame", color: "#ffffff" },
  { id: "motionWheel", label: "Motion works wheel", color: "#0086d6", accent: "--blue" },
  { id: "hourWheel", label: "Hour wheel", color: "#ffffff" },
  { id: "minuteArbor", label: "Minute arbor", color: "#ffffff" },
  { id: "pendulum", label: "Pendulum", color: "#000000" },
  { id: "ratchet", label: "Ratchet", color: "#000000" },
  { id: "accents", label: "Small gray parts", color: "#d1d3d5" },
  { id: "fixed", label: "Stainless hardware (not selectable)", color: "#d4d8dc" },
];

// Decide which zone a part belongs to, from its Onshape name.
// three.js rewrites names slightly ("Part 3" becomes "Part_3"; a repeated name gets "_1" added),
// so we turn underscores back into spaces and match on how the name starts.
// A leading "Mirror " is dropped: it only marks the mirrored copy of a part in Onshape,
// so "Front" and "Front" are the same part.
// isGray tells apart the two parts that are both named "Hour Wheel".
export function zoneForPart(rawName: string, isGray: boolean): ZoneId | null {
  const name = rawName.replace(/_/g, " ").replace(/^Mirror /, "");

  if (/^Part \d+$/.test(name)) return "numerals"; // unnamed parts are the numeral segments

  if (name.startsWith("Mainspring Barrel")) return "barrel";
  if (name.startsWith("Drive Wheel")) return "driveWheel"; // the large first wheel of the train

  if (/^(2nd|3rd|4th) Wheel/.test(name)) return "goingTrain"; // the going train: 2nd, 3rd and 4th wheels
  if (name.startsWith("Esc Wheel")) return "escWheel";
  if (name.startsWith("Esc Pallet")) return "escPallet";
  if (name.startsWith("Hour Hand") || name.startsWith("Minute Hand")) return "hands";
  if (name.startsWith("Hour Wheel")) return isGray ? "accents" : "hourWheel";
  if (name.startsWith("Motion Works")) return "motionWheel";
  if (name.startsWith("Minute Arbor")) return "minuteArbor";
  if (name.startsWith("Front")) return "frontFrame";
  if (name.startsWith("Back")) return "rearFrame";
  if (name.startsWith("Pendant")) return "pendulum";
  if (name.startsWith("Spur gear")) return "ratchet";
  // Bought stainless hardware: shown as steel, can't be selected or recolored
  if (name.startsWith("Hex socket") || name.startsWith("Shoulder Bolt")) return "fixed";
  if (name.startsWith("Pendulm Rod")) return "fixed";
  if (/^\d+mm (Dowel|Tube)/.test(name)) return "fixed"; // dowel pins and tube

  return null; // unknown part: the viewer paints it magenta so it's easy to spot
}
