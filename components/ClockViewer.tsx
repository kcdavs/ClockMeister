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
import { Canvas, ThreeEvent, useThree } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
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
const FIT_MARGIN = 1.12; // 1 = clock exactly fills the viewer; bigger = more space around it
const MIN_DISTANCE = 0.05; // closest and farthest the camera can zoom, in meters
const MAX_DISTANCE = 2.5;

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

  // Each click of "Reset view" bumps this number, which tells FitCamera to re-frame the clock.
  const clockRef = useRef<THREE.Group>(null);
  const [resetCount, setResetCount] = useState(0);

  // Mouse: "click to explore". Until you click the clock, the scroll wheel moves the page;
  // after that it zooms, until the mouse leaves the viewer.
  // Touch: there's no mode to get stuck in. One finger up/down always scrolls the page,
  // sideways turns the clock; two fingers zoom and move it (see TwoFingerGestures).
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
  // On narrow screens (phones) it becomes a full-width panel pinned to the bottom of the screen.
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
      className={touch ? styles.touch : undefined}
      style={{
        position: "absolute", // fill the cell without affecting its size (see Hero.module.css)
        inset: 0,
        cursor: hovered ? "pointer" : "grab",
      }}
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
          {/* Center puts the clock in the middle; FitCamera moves the camera so it fills the view */}
          <Center>
            {/* Onshape exports with Z pointing up; three.js uses Y as up, so stand the clock
                upright (inner group), then turn it around so the face is toward us (outer group) */}
            <group ref={clockRef} rotation={[0, Math.PI, 0]}>
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
          <FitCamera target={clockRef} signal={resetCount} />
          {touch && <TwoFingerGestures />}
        </Suspense>

        {/* Onshape-style controls: scroll zooms toward the cursor, left/right-drag rotates,
            middle-drag (or Shift + drag) pans. Distances are in meters. */}
        <OrbitControls
          makeDefault
          zoomToCursor
          enableZoom={active}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
          /* Fingers: one turns the clock; two are handled by TwoFingerGestures instead
             (an unknown value here switches off the built-in two-finger handling) */
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: -1 as unknown as THREE.TOUCH }}
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
        <button
          onClick={() => setResetCount((n) => n + 1)}
          className={`${styles.tool} label`}
        >
          Reset view
        </button>
      </div>
      <p className={`${styles.hint} label`}>
        {touch
          ? "Tap a part to recolor · Pinch to zoom"
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

// Points the camera straight at the clock's face, from just far enough away that the clock's
// real height AND width both fit (whichever is the tighter limit), plus FIT_MARGIN.
// Runs when the model appears, when the viewer is resized, and on "Reset view".
type Controls = { target: THREE.Vector3; update: () => void } | null;
function FitCamera({
  target,
  signal,
}: {
  target: React.RefObject<THREE.Group | null>;
  signal: number;
}) {
  // We re-run when the viewer's width/height or controls change, and read the live camera with
  // get() at the moment we move it (react-three-fiber's recommended way to change the camera).
  // Only width and height on purpose: the full `size` also holds the canvas's position on the
  // page, which changes on every scroll — depending on it snapped the view back while scrolling.
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const controls = useThree((s) => s.controls);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const camera = get().camera;
    if (!target.current || !(camera instanceof THREE.PerspectiveCamera)) return;
    // Bring every part's on-screen position up to date first (including the centering done by
    // <Center>); otherwise we can measure a stale position and aim the camera off to one side.
    target.current.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(target.current);
    const dims = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // How much the camera sees per meter of distance (from its field of view)
    const view = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const aspect = width / height;
    const fitHeight = dims.y / 2 / view;
    const fitWidth = dims.x / 2 / (view * aspect);
    const distance = FIT_MARGIN * Math.max(fitHeight, fitWidth) + dims.z / 2;

    camera.position.set(center.x, center.y, center.z + distance);
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    const orbit = get().controls as unknown as Controls;
    orbit?.target.copy(center);
    orbit?.update();
  }, [get, width, height, controls, target, signal]);

  return null;
}

// Phones: two-finger gestures on the clock.
//   pinch            → zoom in/out, toward the point between your fingers
//   slide sideways   → move the clock left/right
//   slide up/down    → scroll the page (so you can never get stuck on the clock)
// One finger is left to the browser (scroll) and OrbitControls (sideways = turn the clock).
function TwoFingerGestures() {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);

  useEffect(() => {
    const el = gl.domElement;
    type Fingers = { x: number; y: number; spread: number };
    let last: Fingers | null = null;
    const read = (t: TouchList): Fingers | null =>
      t.length === 2
        ? {
            x: (t[0].clientX + t[1].clientX) / 2,
            y: (t[0].clientY + t[1].clientY) / 2,
            spread: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY),
          }
        : null;

    const onStartOrEnd = (e: TouchEvent) => (last = read(e.touches));
    const onMove = (e: TouchEvent) => {
      const now = read(e.touches);
      if (!now || !last) return;
      if (e.cancelable) e.preventDefault(); // we handle it, not the browser's own pinch-zoom

      const camera = get().camera;
      const orbit = get().controls as unknown as Controls;
      if (orbit && camera instanceof THREE.PerspectiveCamera) {
        const rect = el.getBoundingClientRect();
        const offset = camera.position.clone().sub(orbit.target); // target → camera
        const distance = offset.length();
        // Size of one screen pixel, in meters, at the clock's depth
        const perPixel = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / rect.height;
        const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);

        // The point on the clock between the fingers, so zooming heads toward it
        const pinch = orbit.target
          .clone()
          .addScaledVector(right, (now.x - rect.left - rect.width / 2) * perPixel)
          .addScaledVector(up, (rect.top + rect.height / 2 - now.y) * perPixel);

        // Zoom: fingers apart = closer. Scale everything around the pinch point.
        const newDistance = THREE.MathUtils.clamp(
          (distance * last.spread) / now.spread,
          MIN_DISTANCE,
          MAX_DISTANCE,
        );
        const scale = newDistance / distance;
        orbit.target.sub(pinch).multiplyScalar(scale).add(pinch);

        // Slide sideways: move the clock with the fingers
        orbit.target.addScaledVector(right, -(now.x - last.x) * perPixel * scale);
        camera.position.copy(orbit.target).addScaledVector(offset, scale);
        orbit.update();
      }

      window.scrollBy(0, last.y - now.y); // up/down scrolls the page, following the fingers
      last = now;
    };

    el.addEventListener("touchstart", onStartOrEnd, { passive: true });
    el.addEventListener("touchend", onStartOrEnd, { passive: true });
    el.addEventListener("touchcancel", onStartOrEnd, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false }); // passive: false lets us preventDefault
    return () => {
      el.removeEventListener("touchstart", onStartOrEnd);
      el.removeEventListener("touchend", onStartOrEnd);
      el.removeEventListener("touchcancel", onStartOrEnd);
      el.removeEventListener("touchmove", onMove);
    };
  }, [gl, get]);

  return null;
}

useGLTF.preload(MODEL_URL); // start downloading the model as soon as the page loads
