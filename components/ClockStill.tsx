"use client"; // 3D runs in the browser

// A still, straight-on picture of a clock in the given colors (used on the /success page).
// Reuses the configurator's model and framing (ClockViewer), with no controls or clicking.
// It only redraws when something changes ("demand"), so it doesn't keep the phone busy.

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import type { Colors } from "./ClockColors";
import { ClockModel, FitCamera } from "./ClockViewer";

const ASSEMBLED = { current: 0 }; // exploded-view amount: always fully assembled
const ignore = () => {};

export default function ClockStill({ colors }: { colors: Colors }) {
  const clockRef = useRef<THREE.Group>(null);
  return (
    // pointer-events: none — it's a picture, so scrolling and tapping go straight to the page
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }} aria-hidden="true">
      <Canvas camera={{ fov: 35 }} dpr={[1, 2]} frameloop="demand">
        {/* Same lights as the configurator */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />
        <Suspense fallback={null}>
          {/* Same turns as ClockViewer: stand it upright, face toward us */}
          <group ref={clockRef} rotation={[0, Math.PI, 0]}>
            <Center>
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <ClockModel
                  explodeAmount={ASSEMBLED}
                  colors={colors}
                  hovered={null}
                  onHover={ignore}
                  onPick={ignore}
                />
              </group>
            </Center>
          </group>
          <FitCamera target={clockRef} signal={0} />
          <RedrawOnce />
        </Suspense>
      </Canvas>
    </div>
  );
}

// With frameloop="demand" nothing redraws by itself. FitCamera moves the camera after the
// model appears, so ask for one more frame once everything is in place.
function RedrawOnce() {
  const invalidate = useThree((s) => s.invalidate);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  useEffect(() => {
    const id = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(id);
  }, [invalidate, width, height]);
  return null;
}
