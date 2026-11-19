// The site's words, kept apart from the layout so they're easy to edit.
// Home page "Before you buy": components/Details.tsx. How it works page: app/how-it-works.

// Paste the YouTube install video's link here when it's up (e.g. "https://youtu.be/...").
// While it's empty, the "Watch the install video" link stays hidden.
export const INSTALL_VIDEO_URL = "";

// Business contact email for the footer's Contact link (e.g. "orders@clockmeisterclocks.com").
// While it's empty, Contact shows as "soon". Never a personal address.
export const CONTACT_EMAIL = "support@clockmeisterclocks.com"; // ImprovMX alias → owner's inbox

// Footer links, in order. href null = not set up yet: shown grayed out with "soon".
export const FOOTER_LINKS: { label: string; href: string | null }[] = [
  { label: "About", href: null }, // TODO: about page in the owner's words
  { label: "How it works", href: "/how-it-works" },
  { label: "Install video", href: INSTALL_VIDEO_URL || null },
  { label: "Contact", href: CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : null },
];

// "Before you buy": only what a buyer needs. Size measured from the 3D model, pendulum included.
export const DETAILS = [
  ["Size", "25 × 54 × 7 cm (9.8 × 21.3 × 2.7 in), pendulum included"],
  ["Run time", "About 36 hours per winding"],
  ["Arrives", "Fully assembled, except the pendulum"],
  [
    "Setup",
    "Hang it on the wall with drywall screws, then slot the pendulum into the bottom of the escape pallet. That's it: it's ready to run.",
  ],
  [
    "Tuning",
    "Running fast or slow? Loosen the grub screws in the pendulum and slide it up to speed up, or down to slow down.",
  ],
  ["Shipping", "Ships within 5 days, anywhere in the US. Included in the price."],
];

// How it works: follow the energy from the spring to the hands.
// `color` is the CSS variable for the little square (the accents follow the clock's colors).
export const STEPS = [
  {
    title: "Power",
    part: "Mainspring",
    color: "var(--ink)",
    text: "Winding the clock tightens the mainspring coiled inside its barrel. As the spring slowly unwinds, it turns the drive wheel, the big gear at the start of everything.",
  },
  {
    title: "Gearing",
    part: "Going train",
    color: "var(--red)", // follows the 2nd/3rd/4th wheels
    text: "The drive wheel turns the 2nd, 3rd and 4th wheels, each smaller and faster than the last. Four wheels turn the spring's slow, strong pull into quick, light motion.",
  },
  {
    title: "Timekeeping",
    part: "Deadbeat escapement",
    color: "var(--yellow)", // follows the escape wheel
    text: "The pallet rocks with the pendulum and lets the escape wheel slip forward one tooth per swing. That's the tick. Each tooth also gives the pendulum a small push to keep it swinging. “Deadbeat” means the wheel stops dead between ticks, without bouncing back, so the timing stays steady.",
  },
  {
    title: "Telling time",
    part: "Motion works",
    color: "var(--blue)", // follows the motion works wheel
    text: "Behind the dial, the motion works wheel and the hour wheel gear the minute hand down twelve to one, so the hour hand goes around once for every twelve turns of the minute hand.",
  },
];
