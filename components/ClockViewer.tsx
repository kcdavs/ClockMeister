"use client"; // runs in the browser (3D needs the visitor's graphics card), not on the server

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { Bounds, Center, OrbitControls, useBounds, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ZONES, ZoneId, zoneForPart } from "@/data/zones";
import { DESIGN_MODE, nameFor } from "@/lib/colors";
import { Colors, useClockColors } from "./ClockColors";
import PartPicker, { PICKER_WIDTH } from "./PartPicker";
import styles from "./ClockViewer.module.css";

const MODEL_URL = "/models/clock.glb";
const UNMAPPED = "#ff00ff"; // magenta = a part we forgot to put in a zone
const EDGE_ANGLE = 30; // degrees; lower = more outlines, higher = only the sharpest edges
const EDGE_MATERIAL = new THREE.LineBasicMaterial({ color: "#111111" });
const HOVER_GLOW = 0.15; // how much a hovered color group lights up

type ModelProps = {
  colors: Colors;
  hovered: ZoneId | null;
  onHover: (zone: ZoneId | null) => void;
  onPick: (zone: ZoneId, x: number, y: number) => void;
};

// The part's color group, or null for hardware / unknown parts (not clickable).
const pickableZone = (obj: THREE.Object3D) => {
  const zone = obj.userData.zone as ZoneId | null;
  return zone && zone !== "fixed" ? zone : null;
};

// Loads the model once, gives every part its own material, and tags it with its zone.
function ClockModel({ colors, hovered, onHover, onPick }: ModelProps) {
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
      edges.raycast = () => {}; // outlines shouldn't catch clicks; the part underneath should
      obj.add(edges);
    });
    return root;
  }, [scene]);

  // Repaint each part from its zone's color, and make the hovered color group glow slightly.
  useEffect(() => {
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const zone = obj.userData.zone as ZoneId | null;
      const material = obj.material as THREE.MeshStandardMaterial;
      material.color.set((zone && colors[zone]) || UNMAPPED);
      material.emissive.set(zone && zone === hovered ? "#ffffff" : "#000000");
      material.emissiveIntensity = HOVER_GLOW;
    });
  }, [model, colors, hovered]);

  return (
    <primitive
      object={model}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation(); // only the front-most part under the cursor counts
        onHover(pickableZone(e.object));
      }}
      onPointerOut={() => onHover(null)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 4) return; // the mouse moved: that was a drag to rotate, not a click
        e.stopPropagation();
        const zone = pickableZone(e.object);
        if (zone) onPick(zone, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }}
    />
  );
}

export default function ClockViewer() {
  // The current colors come from the shared store (ClockColors.tsx)
  const { colors } = useClockColors();
  const wrapper = useRef<HTMLDivElement>(null);

  // Each click of "Reset view" bumps this number, which tells ResetView to re-frame the clock.
  const [resetCount, setResetCount] = useState(0);

  // "Click / tap to explore": until you click or tap the clock, scrolling (wheel or finger)
  // moves the page. After that, scrolling zooms and one finger rotates. With a mouse it ends
  // when the mouse leaves the viewer; on a phone, when you tap anywhere outside the clock.
  const [active, setActive] = useState(false);
  const touch = useIsTouchDevice();

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setActive(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Which color group the mouse is over, and which one has its popup open (and where).
  const [hovered, setHovered] = useState<ZoneId | null>(null);
  const [picked, setPicked] = useState<{
    zone: ZoneId;
    x: number;
    y: number;
    sheet: boolean;
  } | null>(null);
  const closePicker = useCallback(() => setPicked(null), []);

  // Open the popup just below-right of the click, flipped left if it would run off the edge.
  // On narrow screens (phones) it becomes a full-width panel along the bottom instead.
  function openPicker(zone: ZoneId, x: number, y: number) {
    const width = wrapper.current?.clientWidth ?? 0;
    const height = wrapper.current?.clientHeight ?? 0;
    const sheet = width < 560;
    const left = x + 16 + PICKER_WIDTH > width ? x - 16 - PICKER_WIDTH : x + 16;
    const top = Math.min(y + 16, height - 260); // keep it from running off the bottom
    setPicked({ zone, x: Math.max(8, left), y: Math.max(8, top), sheet });
  }

  const [copied, setCopied] = useState(false);
  async function copyColors() {
    const summary = Object.fromEntries(
      ZONES.filter((z) => z.id !== "fixed").map((z) => [
        z.id,
        `${nameFor(colors[z.id])} (${colors[z.id]})`,
      ]),
    );
    await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      ref={wrapper}
      className={active ? undefined : styles.idle}
      style={{ position: "relative", height: "100%", cursor: hovered ? "pointer" : "grab" }}
      onPointerDown={() => setActive(true)}
      onPointerLeave={(e) => {
        setHovered(null);
        if (e.pointerType === "mouse") setActive(false); // fingers "leave" after every tap
      }}
    >
      <Canvas camera={{ fov: 35 }} dpr={[1, 2]} onPointerMissed={closePicker}>
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
                  <ClockModel
                    colors={colors}
                    hovered={hovered}
                    onHover={setHovered}
                    onPick={openPicker}
                  />
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
          enableRotate={active || !touch} /* phones: one finger scrolls the page until tapped */
          minDistance={0.05}
          maxDistance={2.5}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Canvas>

      {picked && <PartPicker {...picked} onClose={closePicker} />}

      <div className={styles.tools}>
        {DESIGN_MODE && (
          <button onClick={copyColors} className={`${styles.tool} label`}>
            {copied ? "Copied" : "Copy colors"}
          </button>
        )}
        <button onClick={() => setResetCount((n) => n + 1)} className={`${styles.tool} label`}>
          Reset view
        </button>
      </div>
      <p className={`${styles.hint} label`}>
        {touch
          ? active
            ? "Tap a part to recolor · Drag to rotate · Pinch to zoom"
            : "Tap the clock to explore"
          : active
            ? "Click a part to recolor · Scroll to zoom · Drag to rotate"
            : "Click any part to change its color"}
      </p>
    </div>
  );
}

// True on phones/tablets (a "coarse" pointer = finger). useSyncExternalStore is React's way
// to read a browser setting; on the server (no browser) it assumes a mouse.
const COARSE = "(pointer: coarse)";
function useIsTouchDevice() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(COARSE);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(COARSE).matches,
    () => false,
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
