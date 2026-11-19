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
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ZONES, ZoneId, isFrameBolt, zoneForPart } from "@/data/zones";
import { stackIndex } from "@/data/explode";
import { DESIGN_MODE, nameFor } from "@/lib/colors";
import { Colors, useClockColors } from "./ClockColors";
import PartPicker, { PICKER_WIDTH } from "./PartPicker";
import styles from "./ClockViewer.module.css";

const MODEL_URL = "/models/clock.glb";
const UNMAPPED = "#ff00ff"; // magenta = a part we forgot to put in a zone
const EDGE_ANGLE = 30; // degrees; lower = more outlines, higher = only the sharpest edges
const EDGE_MATERIAL = new THREE.LineBasicMaterial({ color: "#111111" });
const HOVER_GLOW = 0.15; // how much a hovered color group lights up
const STEEL = "#b1b6bb"; // bought hardware (screws, bolts, pins, rod): stainless steel
const FIT_MARGIN = 1.12; // 1 = clock exactly fills the viewer; bigger = more space around it
const MIN_DISTANCE = 0.05; // closest and farthest the camera can zoom, in meters
const MAX_DISTANCE = 2.5;

// Exploded view, like lifting the layers of a sandwich: the back frame stays put, and every
// printed part lifts out in its assembly order (data/explode.ts), one per layer, with the same gap
// (EXPLODE_GAP) between each part's back face and the previous part's front face: first the
// going train, then the time train, then the dial (numerals printed on it), and the hands on top.
// Pins and screws stay locked to the part they go through. Only the frame bolts go out the back.
// Meanwhile the clock turns EXPLODE_TURN to a three-quarter view and shrinks to fit its box.
const EXPLODE_GAP = 0.015; // meters between layers
const BOLTS_BACK = 0.07; // meters the frame bolts slide out the back
const EXPLODE_TURN = THREE.MathUtils.degToRad(40);
// Extra room when shrinking the exploded clock to fit: parts nearer the camera look bigger
// than they measure (perspective), so aim for a bit less than the assembled width
const EXPLODE_FIT = 0.75;
// The time train: between the going train and the dial (the hands sit in front of the dial)
const TIME_TRAIN: (ZoneId | null)[] = ["motionWheel", "hourWheel", "minuteArbor"];
const EXPLODE_SPEED = 3; // higher = snappier animation

type ModelProps = {
  explodeAmount: React.RefObject<number>; // 0 = assembled, 1 = fully exploded
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

// Works out, once, where every part goes in the exploded view. Stores on each part its home
// position (userData.home) and its full exploded movement (userData.explode, in the part's
// parent's coordinates); ClockModel blends between them.
function planExplode(root: THREE.Object3D) {
  // The clock's front-to-back axis is its thinnest dimension; the other two are "across"
  const whole = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  const axis = whole.x < whole.y && whole.x < whole.z ? "x" : whole.y < whole.z ? "y" : "z";
  const [acrossA, acrossB] = (["x", "y", "z"] as const).filter((a) => a !== axis);

  type Part = { mesh: THREE.Mesh; zone: ZoneId | null; box: THREE.Box3; travel?: number };
  const parts: Part[] = [];
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.parent)
      parts.push({ mesh: obj, zone: obj.userData.zone, box: new THREE.Box3().setFromObject(obj) });
  });
  const rear = parts.find((p) => p.zone === "rearFrame");
  const front = parts.find((p) => p.zone === "frontFrame");
  if (!rear || !front) return;

  // Measure depth so it grows toward the dial: lo = back face, hi = front face
  const centerOf = (p: Part) => (p.box.min[axis] + p.box.max[axis]) / 2;
  const sign = Math.sign(centerOf(front) - centerOf(rear)) || 1;
  const lo = (p: Part) => Math.min(p.box.min[axis] * sign, p.box.max[axis] * sign);
  const hi = (p: Part) => Math.max(p.box.min[axis] * sign, p.box.max[axis] * sign);
  const across = (p: Part) =>
    new THREE.Vector2((p.box.min[acrossA] + p.box.max[acrossA]) / 2, (p.box.min[acrossB] + p.box.max[acrossB]) / 2);

  const onDial = (p: Part) => p.zone === "frontFrame" || p.zone === "numerals";
  // (the gray "Hour Wheel" is in the accents zone, but it's part of the time train)
  const inTimeTrain = (p: Part) => TIME_TRAIN.includes(p.zone) || p.mesh.name.startsWith("Hour_Wheel");
  const isHardware = (p: Part) => p.zone === "fixed";
  const byDepth = (a: Part, b: Part) => lo(a) + hi(a) - (lo(b) + hi(b)); // back to front

  // Stacks parts one after another from `cursor` (where the next back face goes), each with
  // the same gap in front of the last; returns where the next part would go.
  const stack = (layer: Part[], cursor: number) => {
    for (const p of layer) {
      p.travel = cursor - lo(p);
      cursor = hi(p) + p.travel + EXPLODE_GAP;
    }
    return cursor;
  };

  // 1. Back frame stays; frame bolts slide out the back
  rear.travel = 0;
  for (const p of parts) if (isFrameBolt(p.mesh.name)) p.travel = -BOLTS_BACK;

  // 2. The going train etc.: every other printed part gets its own layer, in the owner's
  //    assembly order (data/explode.ts; unlisted parts after, by depth), starting just in
  //    front of the back frame
  const order = (p: Part) => {
    const i = stackIndex(p.mesh.name);
    return i < 0 ? Infinity : i;
  };
  const train = parts
    .filter((p) => p !== rear && !isHardware(p) && !onDial(p) && !inTimeTrain(p) && p.zone !== "hands")
    .sort((a, b) => order(a) - order(b) || byDepth(a, b));
  let cursor = stack(train, hi(rear) + EXPLODE_GAP);

  // 3. The time train (each part its own layer), then the dial with its numerals as one
  //    layer, then the hands on top, each its own layer
  cursor = stack(parts.filter(inTimeTrain).sort(byDepth), cursor);
  const dial = parts.filter(onDial);
  const dialTravel = cursor - Math.min(...dial.map(lo));
  for (const p of dial) p.travel = dialTravel;
  cursor = Math.max(...dial.map(hi)) + dialTravel + EXPLODE_GAP;
  stack(parts.filter((p) => p.zone === "hands").sort(byDepth), cursor);

  // 4. Pins, tube and small screws stay locked to the printed part they go through:
  //    first choice, a part centered on the pin (a gear on its arbor); otherwise the
  //    smallest part the screw sits inside. The pendulum rod goes with the pendulum.
  const printed = parts.filter((p) => !isHardware(p) && p !== rear && p !== front);
  for (const pin of parts.filter((p) => isHardware(p) && p.travel === undefined)) {
    const overlaps = (p: Part) => Math.min(hi(p), hi(pin)) - Math.max(lo(p), lo(pin));
    const offCenter = (p: Part) => across(p).distanceTo(across(pin));
    const size = (p: Part) => (p.box.max[acrossA] - p.box.min[acrossA]) * (p.box.max[acrossB] - p.box.min[acrossB]);
    const inside = (p: Part) => {
      const c = across(pin);
      return c.x > p.box.min[acrossA] && c.x < p.box.max[acrossA] && c.y > p.box.min[acrossB] && c.y < p.box.max[acrossB];
    };
    const host =
      (pin.mesh.name.startsWith("Pendulm") && parts.find((p) => p.zone === "pendulum")) ||
      printed
        .filter((p) => offCenter(p) < 0.01 && overlaps(p) > 0)
        .sort((a, b) => offCenter(a) - offCenter(b) || overlaps(b) - overlaps(a))[0] ||
      printed.filter((p) => inside(p) && overlaps(p) > 0).sort((a, b) => size(a) - size(b))[0];
    pin.travel = host?.travel ?? 0;
  }

  // Store each part's home and its movement, converted into its parent's coordinates
  for (const p of parts) {
    const move = new THREE.Vector3().setComponent("xyz".indexOf(axis), sign * (p.travel ?? 0));
    p.mesh.userData.home = p.mesh.position.clone();
    p.mesh.userData.explode = p.mesh.parent!
      .worldToLocal(move)
      .sub(p.mesh.parent!.worldToLocal(new THREE.Vector3()));
  }
}

// Loads the model once, gives every part its own material, and tags it with its zone.
function ClockModel({ explodeAmount, colors, hovered, onHover, onPick }: ModelProps) {
  const { scene } = useGLTF(MODEL_URL);

  // Metal only looks like metal if it has something to reflect. This builds a soft, blurred
  // "room" (part of three.js, nothing to download) that only the steel parts reflect.
  const gl = useThree((s) => s.gl);
  const steelReflections = useMemo(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const texture = generator.fromScene(new RoomEnvironment(), 0.01).texture;
    generator.dispose();
    return texture;
  }, [gl]);

  const model = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const original = obj.material as THREE.MeshStandardMaterial;
      const isGray = original.color.r > 0.5 && original.color.r < 0.8;
      const zone = zoneForPart(obj.name, isGray);
      if (!zone) console.warn("Part not in any color zone:", obj.name);
      obj.userData.zone = zone;
      const steel = zone === "fixed";
      obj.material = new THREE.MeshStandardMaterial({
        ...(steel
          ? { color: STEEL, metalness: 1, roughness: 0.18, envMap: steelReflections, envMapIntensity: 0.9 }
          : { roughness: 0.55, metalness: 0 }),
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

    root.updateMatrixWorld(true);
    planExplode(root);
    return root;
  }, [scene, steelReflections]);

  // Repaint each part from its zone's color, and make the hovered color group glow slightly.
  useEffect(() => {
    model.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const zone = obj.userData.zone as ZoneId | null;
      if (zone === "fixed") return; // steel hardware keeps its look and can't be recolored
      const material = obj.material as THREE.MeshStandardMaterial;
      material.color.set((zone && colors[zone]) || UNMAPPED);
      material.emissive.set(zone && zone === hovered ? "#ffffff" : "#000000");
      material.emissiveIntensity = HOVER_GLOW;
    });
  }, [model, colors, hovered]);

  // Every frame: place each part between home and its exploded position.
  const applied = useRef(0);
  useFrame(() => {
    const t = explodeAmount.current;
    if (Math.abs(t - applied.current) < 1e-4) return; // nothing moving: skip the work
    applied.current = t;
    model.traverse((obj) => {
      if (obj.userData.home) obj.position.copy(obj.userData.home).addScaledVector(obj.userData.explode, t);
    });
  });

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

  // Exploded view: the slider's value (0 = assembled, 1 = fully exploded), and where the
  // animation currently is on its way there (updated every frame, so a ref, not state)
  const [explode, setExplode] = useState(0);
  const explodeAmount = useRef(0);

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
          {/* Onshape exports with Z pointing up; three.js uses Y as up, so stand the clock
              upright (inner group), then turn it around so the face is toward us (outer group).
              Center (inside the turning group) puts the clock's middle at the pivot, so the
              exploded view turns it in place. FitCamera moves the camera so it fills the view. */}
          <group ref={clockRef} rotation={[0, Math.PI, 0]}>
            <Center>
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <ClockModel
                  explodeAmount={explodeAmount}
                  colors={colors}
                  hovered={hovered}
                  onHover={setHovered}
                  onPick={openPicker}
                />
              </group>
            </Center>
          </group>
          <FitCamera target={clockRef} signal={resetCount} />
          <ExplodeAnimator targetRef={clockRef} amountRef={explodeAmount} goal={explode} />
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
      {/* Exploded-view slider. The track is the full height of the viewer; the bar inside
          sticks to the bottom of the screen, so it's visible even when the viewer is taller
          than the screen. */}
      <div className={styles.explodeTrack}>
        <label className={`${styles.explode} label`}>
          Assembled
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={explode}
            onChange={(e) => setExplode(Number(e.target.value))}
            aria-label="Exploded view"
          />
          Exploded
        </label>
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

// Eases the exploded-view amount toward the slider's value each frame (so dragging feels
// smooth), and turns and shrinks the whole clock with it (ClockModel moves the parts).
function ExplodeAnimator({
  targetRef,
  amountRef,
  goal,
}: {
  targetRef: React.RefObject<THREE.Group | null>;
  amountRef: React.RefObject<number>;
  goal: number; // 0–1, from the slider
}) {
  const assembled = useRef<{ width: number; halfHeight: number } | null>(null); // measured once

  useFrame((_, delta) => {
    const clock = targetRef.current;
    if (amountRef.current === goal || !clock) return;
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    if (!assembled.current) {
      box.setFromObject(clock).getSize(size);
      assembled.current = { width: size.x, halfHeight: size.y / 2 };
    }
    // damp = smooth approach that slows down near the end; snap when close enough
    let t = THREE.MathUtils.damp(amountRef.current, goal, EXPLODE_SPEED, delta);
    if (Math.abs(t - goal) < 0.001) t = goal;
    amountRef.current = t;

    // Turn, then measure how wide the (partly) exploded clock is at full size, and shrink it
    // just enough to stay as wide as the assembled clock, so it always fits its box
    clock.rotation.y = Math.PI + EXPLODE_TURN * t;
    clock.scale.setScalar(1);
    clock.position.set(0, 0, 0);
    clock.updateMatrixWorld(true);
    box.setFromObject(clock);
    const fit = (assembled.current.width / box.getSize(size).x) * (1 - (1 - EXPLODE_FIT) * t);
    const scale = Math.min(1, fit);
    const centerX = box.getCenter(new THREE.Vector3()).x;
    clock.scale.setScalar(scale);
    // Shrink toward (just below) the top, so the gears and dial stay on screen, and keep
    // it centered left-to-right (the stack only grows forward)
    clock.position.set(-centerX * scale, 0.85 * assembled.current.halfHeight * (1 - scale), 0);
  });

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
