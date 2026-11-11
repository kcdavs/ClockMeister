"use client";

// Shared store for the clock's chosen colors (a React "context").
// Any component inside <ClockColorsProvider> can read the colors or change them.
// Whenever they change, we also recolor the site's accent variables (--red, --blue, --yellow)
// and the browser toolbar, so the website takes on the clock's color scheme.

import { createContext, useContext, useEffect, useState } from "react";
import { ZONES, ZoneId } from "@/data/zones";
import { isLight } from "@/lib/colors";

export type Colors = Record<ZoneId, string>;

export const DEFAULT_COLORS = Object.fromEntries(
  ZONES.map((z) => [z.id, z.color])
) as Colors;

type Store = {
  colors: Colors;
  setColors: (update: Partial<Colors>) => void;
};

const ClockColorsContext = createContext<Store | null>(null);

export function ClockColorsProvider({ children }: { children: React.ReactNode }) {
  const [colors, setAll] = useState<Colors>(DEFAULT_COLORS);
  const setColors = (update: Partial<Colors>) => setAll((c) => ({ ...c, ...update }));

  useEffect(() => {
    const root = document.documentElement.style;
    for (const zone of ZONES) {
      if (!zone.accent) continue;
      const color = colors[zone.id];
      root.setProperty(zone.accent, color);
      // Text on top of this accent (e.g. button labels): dark on light colors, light on dark ones.
      root.setProperty(`${zone.accent}-text`, isLight(color) ? "var(--ink)" : "var(--paper)");
      if (zone.accent === "--red") {
        document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
      }
    }
  }, [colors]);

  return (
    <ClockColorsContext.Provider value={{ colors, setColors }}>
      {children}
    </ClockColorsContext.Provider>
  );
}

// Read or change the colors from any component: const { colors, setColors } = useClockColors();
export function useClockColors() {
  const store = useContext(ClockColorsContext);
  if (!store) throw new Error("useClockColors must be used inside <ClockColorsProvider>");
  return store;
}
