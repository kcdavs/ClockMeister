"use client";

// A row of ready-made color schemes. Clicking one recolors the whole clock (and the site).
// The schemes themselves live in data/presets.ts.

import { PRESETS } from "@/data/presets";
import { useClockColors } from "./ClockColors";
import styles from "./Presets.module.css";

// The zones shown in each button's little color strip
const PREVIEW = ["face", "wheels", "escWheel", "frontFrame"] as const;

export default function Presets() {
  const { colors, setColors } = useClockColors();

  return (
    <div className={styles.presets}>
      <p className="label">Start from a preset</p>
      <div className={styles.list}>
        {PRESETS.map((preset) => {
          // Highlighted while the clock still matches this preset exactly
          const active = Object.entries(preset.colors).every(
            ([zone, hex]) => colors[zone as keyof typeof colors] === hex,
          );
          return (
            <button
              key={preset.id}
              className={`${styles.preset} label`}
              aria-pressed={active}
              onClick={() => setColors(preset.colors)}
            >
              <span className={styles.strip} aria-hidden="true">
                {PREVIEW.map((zone) => (
                  <span key={zone} style={{ background: preset.colors[zone] }} />
                ))}
              </span>
              {preset.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
