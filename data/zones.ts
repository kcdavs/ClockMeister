// Color zones: groups of clock parts that the customer colors together.
// Defaults are the colors used in Onshape. Stage 6 swaps these for real filament colors.

export type ZoneId =
  | "face"
  | "numerals"
  | "hands"
  | "wheels"
  | "escapement"
  | "plates"
  | "pendant"
  | "accents"
  | "fixed";

export const ZONES: { id: ZoneId; label: string; color: string }[] = [
  { id: "face", label: "Face / front frame", color: "#fab601" },
  { id: "numerals", label: "Numerals", color: "#111111" },
  { id: "hands", label: "Hands", color: "#111111" },
  { id: "wheels", label: "Wheels", color: "#800000" },
  { id: "escapement", label: "Escapement", color: "#0798ef" },
  { id: "plates", label: "Plates & motion works", color: "#eaeaea" },
  { id: "pendant", label: "Pendant", color: "#9dcfed" },
  { id: "accents", label: "Small gray parts", color: "#a5a5a5" },
  { id: "fixed", label: "Hardware (not selectable)", color: "#9aa5af" },
];

// Decide which zone a part belongs to, from its Onshape name.
// three.js rewrites names slightly ("Part 3" becomes "Part_3"; a repeated name gets "_1" added),
// so we turn underscores back into spaces and match on how the name starts.
// isGray tells apart the two parts that are both named "Hour Wheel".
export function zoneForPart(rawName: string, isGray: boolean): ZoneId | null {
  const name = rawName.replace(/_/g, " ");

  if (name === "Part 3") return "face";
  if (name === "Part 4") return "wheels";
  if (name === "Part 2") return "accents";
  if (/^Part \d+$/.test(name)) return "numerals"; // all other unnamed parts are numeral segments

  if (/^(2nd|3rd|4th) Wheel/.test(name)) return "wheels";
  if (name.startsWith("Mirror Esc")) return "escapement";
  if (name.startsWith("Hour Hand") || name.startsWith("Minute Hand")) return "hands";
  if (name.startsWith("Hour Wheel")) return isGray ? "accents" : "plates";
  if (/^(Mirror Front|Mirror Back|Motion Works|Minute Arbor)/.test(name)) return "plates";
  if (name.startsWith("Pendant") || name.startsWith("Spur gear")) return "pendant";
  if (name.startsWith("Hex socket") || name.startsWith("Pendulm Rod")) return "fixed";

  return null; // unknown part: the viewer paints it magenta so it's easy to spot
}
