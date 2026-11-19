// Exploded view: the order the parts lift out, from closest to the back frame to the front,
// which is also the order they're assembled in. Each line is the start of a part's Onshape
// name ("Mirror " and underscores are ignored). Edit the order here; the view follows.
//
// After these come the time train, then the dial, then the hands (see ClockViewer).
// A printed part not listed here goes at the end of this list, by its depth.
export const STACK_ORDER = [
  "Mainspring Barrel",
  "Spur gear", // the ratchet
  "3rd Wheel",
  "4th Wheel",
  "Esc Wheel",
  "Drive Wheel",
  "2nd Wheel",
  "Esc Pallet",
  "Pendant", // the pendulum
];

// Where a part goes in STACK_ORDER (or -1 if it isn't listed)
export function stackIndex(rawName: string) {
  const name = rawName.replace(/_/g, " ").replace(/^Mirror /, "");
  return STACK_ORDER.findIndex((start) => name.startsWith(start));
}
