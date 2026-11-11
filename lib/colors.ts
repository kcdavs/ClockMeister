// Small color helpers shared by the color store, the part picker and the viewer.

import filaments from "@/data/filaments.json";

export { filaments };

// On your Mac (npm run dev) you get extra design tools: a free color picker and "Copy colors".
// Next.js sets NODE_ENV to "production" on the live site, so customers never see them.
export const DESIGN_MODE = process.env.NODE_ENV === "development";

// Filament name for a color, or "Custom #xxxxxx" if it isn't a stocked filament.
export function nameFor(hex: string) {
  const match = filaments.find((f) => f.hex.toLowerCase() === hex.toLowerCase());
  return match ? match.name : `Custom ${hex}`;
}

// Perceived brightness of a hex color: 0 = black, 1 = white (standard luminance weights).
export function brightness(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export const isLight = (hex: string) => brightness(hex) > 0.6;

// Difference in brightness between two colors: 0 (same) to 1 (black vs white).
export const contrast = (a: string, b: string) => Math.abs(brightness(a) - brightness(b));
