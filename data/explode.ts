// Exploded view: the order the parts lift out, from closest to the back frame to the front,
// which is also the order they're assembled in. Each entry is one layer: the start of a part's
// Onshape name ("Mirror " and underscores are ignored), or a list of names for parts that share
// a layer (fine when they don't touch). Edit the order here; the view follows.
//
// After these come the time train, then the dial, then the hands (see ClockViewer).
// A printed part not listed here goes at the end of this list, by its depth.
export const STACK_ORDER: (string | string[])[] = [
  "Mainspring Barrel",
  "Spur gear", // the ratchet
  "3rd Wheel",
  "4th Wheel",
  ["Esc Wheel", "Drive Wheel"], // side by side, they don't touch
  "2nd Wheel",
  ["Esc Pallet", "Pendant"], // the pallet and the pendulum (with its rod), in one plane
];

// Which layer of STACK_ORDER a part belongs to (or -1 if it isn't listed)
export function stackIndex(rawName: string) {
  const name = rawName.replace(/_/g, " ").replace(/^Mirror /, "");
  return STACK_ORDER.findIndex((entry) =>
    (Array.isArray(entry) ? entry : [entry]).some((start) => name.startsWith(start)),
  );
}
