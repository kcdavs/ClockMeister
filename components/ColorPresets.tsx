"use client";

// TEMPORARY: a few preset color schemes to demo the clock-and-site color sync.
// Replaced by the real configurator (per-zone filament picker) in Stage 6.

import { Colors, DEFAULT_COLORS, useClockColors } from "./ClockColors";

const PRESETS: { name: string; colors: Partial<Colors> }[] = [
  { name: "Classic", colors: DEFAULT_COLORS },
  { name: "Pink", colors: { wheels: "#e86a9a", escapement: "#3a3a3a", face: "#f7d6e0" } },
  { name: "Forest", colors: { wheels: "#2f5d3a", escapement: "#c9772b", face: "#e8dcc0" } },
  { name: "Mono", colors: { wheels: "#2b2b2b", escapement: "#8a8a8a", face: "#f2ede3" } },
];

export default function ColorPresets() {
  const { setColors } = useClockColors();
  return (
    <div
      className="label"
      style={{ position: "absolute", bottom: "1rem", left: "1.5rem", display: "flex", gap: "0.5rem" }}
    >
      {PRESETS.map((p) => (
        <button
          key={p.name}
          onClick={() => setColors(p.colors)}
          style={{
            font: "inherit",
            padding: "0.35rem 0.6rem",
            border: "2px solid var(--ink)",
            background: "var(--paper)",
            cursor: "pointer",
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
