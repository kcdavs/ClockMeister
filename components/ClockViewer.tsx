"use client"; // runs in the browser (3D needs the visitor's graphics card), not on the server

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  OrbitControls,
  useBounds,
  useGLTF,
} from "@react-three/drei";
import * as THREE from "three";
import { ZoneId, zoneForPart } from "@/data/zones";
import { Colors, useClockColors } from "./ClockColors";
import ColorPresets from "./ColorPresets";
import styles from "./ClockViewer.module.css";

const MODEL_URL = "/models/clock.glb";
const UNMAPPED = "#ff00ff"; // magenta = a part we forgot to put in a zone
const EDGE_ANGLE = 30; // degrees; lower = more outlines, higher = only the sharpest edges
const EDGE_MATERIAL = new THREE.LineBasicMaterial({ color: "#111111" });

// Loads the model once, gives every part its own material, and tags it with its zone.
function ClockModel({ colors }: { colors: Colors }) {
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const original = obj.material as THREE.MeshStandardMaterial;
      const isGray = original.color.r > 0.5 && original.color.r < 0.8;
      const zone = zoneForPart(obj.name, isGray);
      if (!zone) console.warn("Part not in any color zone:", obj.name);
      obj.userData.zone = zone;
      obj.material = new THREE.MeshStandardMaterial({
        roughness: 0.55,
        metalness: 0,
        // nudge the surfaces back a hair so the outlines draw cleanly on top
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });

      // Outline every sharp edge (where faces meet at more than EDGE_ANGLE degrees),
      // like a technical drawing. Computed once per part when the model loads.
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(obj.geometry, EDGE_ANGLE),
        EDGE_MATERIAL,
      );
      obj.add(edges);
    });
    return root;
  }, [scene]);

  // Whenever the chosen colors change, repaint each part from its zone's color.
  useEffect(() => {
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const zone = obj.userData.zone as ZoneId | null;
      (obj.material as THREE.MeshStandardMaterial).color.set(
        (zone && colors[zone]) || UNMAPPED,
      );
    });
  }, [model, colors]);

  return <primitive object={model} />;
}

export default function ClockViewer() {
  // The current colors come from the shared store (ClockColors.tsx)
  const { colors } = useClockColors();

  // Each click of "Reset view" bumps this number, which tells ResetView to re-frame the clock.
  const [resetCount, setResetCount] = useState(0);

  // "Click to explore": until you click the clock, the scroll wheel scrolls the page.
  // After a click, scrolling zooms the clock, until the mouse leaves the viewer.
  const [active, setActive] = useState(false);

  return (
    <div
      style={{ position: "relative", height: "100%" }}
      onPointerDown={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <Canvas camera={{ fov: 35 }} dpr={[1, 2]}>
        {/* Soft overall light plus two directional "lamps" so the gear teeth read clearly */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />

        {/* Suspense shows nothing until the model has downloaded */}
        <Suspense fallback={null}>
          {/* Bounds moves the camera so the whole clock fits; Center puts it in the middle */}
          <Bounds fit clip observe margin={1.05}>
            <Center>
              {/* Onshape exports with Z pointing up; three.js uses Y as up, so stand the clock
                upright (inner group), then turn it around so the face is toward us (outer group) */}
              <group rotation={[0, Math.PI, 0]}>
                <group rotation={[-Math.PI / 2, 0, 0]}>
                  <ClockModel colors={colors} />
                </group>
              </group>
            </Center>
            <ResetView signal={resetCount} />
          </Bounds>
        </Suspense>

        {/* Onshape-style controls: scroll zooms toward the cursor, left/right-drag rotates,
            middle-drag (or Shift + drag) pans. Distances are in meters. */}
        <OrbitControls
          makeDefault
          zoomToCursor
          enableZoom={active}
          minDistance={0.05}
          maxDistance={2.5}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Canvas>

      <button
        onClick={() => setResetCount((n) => n + 1)}
        className={`${styles.reset} label`}
      >
        Reset view
      </button>
      <ColorPresets />
      <p className={`${styles.hint} label`}>
        {active
          ? "Scroll to zoom · Drag to rotate · Shift + drag to pan"
          : "Click the clock to explore"}
      </p>
    </div>
  );
}

// Lives inside <Bounds> so it can ask Bounds to smoothly re-frame the whole clock.
function ResetView({ signal }: { signal: number }) {
  const bounds = useBounds();
  useEffect(() => {
    if (signal > 0) bounds.refresh().clip().fit();
  }, [signal, bounds]);
  return null;
}

useGLTF.preload(MODEL_URL); // start downloading the model as soon as the page loads
