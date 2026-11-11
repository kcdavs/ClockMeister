"use client";

// The small popup that appears where you click a part of the clock.
// Shows the part's color group, its current filament, and swatches to change it.

import { useEffect } from "react";
import { ZONES, ZoneId } from "@/data/zones";
import { DESIGN_MODE, contrast, filaments, nameFor } from "@/lib/colors";
import { useClockColors } from "./ClockColors";
import styles from "./PartPicker.module.css";

export const PICKER_WIDTH = 236; // px; the viewer uses this to keep the popup on screen

type Props = { zone: ZoneId; x: number; y: number; onClose: () => void };

export default function PartPicker({ zone, x, y, onClose }: Props) {
  const { colors, setColors } = useClockColors();
  const label = ZONES.find((z) => z.id === zone)?.label;
  const current = colors[zone];

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hardToRead =
    (zone === "numerals" || zone === "face") && contrast(colors.numerals, colors.face) < 0.25;

  return (
    <div className={styles.picker} style={{ left: x, top: y, width: PICKER_WIDTH }}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>{label}</div>
          <div className={`${styles.current} label`}>{nameFor(current)}</div>
        </div>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.swatches}>
        {filaments.map((f) => (
          <button
            key={f.id}
            title={f.name}
            aria-label={f.name}
            aria-pressed={current.toLowerCase() === f.hex.toLowerCase()}
            className={styles.swatch}
            style={{ background: f.hex }}
            onClick={() => setColors({ [zone]: f.hex })}
          />
        ))}
        {DESIGN_MODE && (
          <input
            type="color"
            title="Custom color (design mode only)"
            className={styles.custom}
            value={current}
            onChange={(e) => setColors({ [zone]: e.target.value })}
          />
        )}
      </div>

      {hardToRead && (
        <p className={`${styles.warning} label`}>Numerals may be hard to read on this face</p>
      )}
    </div>
  );
}
