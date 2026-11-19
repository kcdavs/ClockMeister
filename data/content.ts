// All the words for the home page's content sections (How it works, Specs, FAQ).
// Edit text here; the layout lives in components/HowItWorks.tsx, Specs.tsx, Faq.tsx.
// Lines marked CONFIRM are Claude's best guesses: the owner checks them before launch.

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

// Specs table. Size measured from the 3D model (public/models/clock.glb), pendulum included.
export const SPECS = [
  ["Price", "$350, shipping within the US included"],
  ["Movement", "Spring driven, four-wheel train, deadbeat escapement"],
  ["Run time", "About 36 hours per winding"], // CONFIRM (from the Stripe product description)
  ["Size", "25 × 54 × 7 cm (9.8 × 21.3 × 2.7 in), pendulum included"],
  ["Mounting", "Hangs on the wall"], // CONFIRM
  ["Colors", "Any of 30 Bambu Lab PLA Basic colors, for each of 15 parts"],
  ["Hardware", "Stainless steel screws, pins and pendulum rod"],
  ["Build", "89 printed pieces, assembled and tested by hand"],
];

// Questions and answers. Shipping lives here too.
export const FAQ = [
  {
    q: "How often do I wind it?",
    a: "About once a day. It runs for roughly 36 hours on a full wind, so winding it at the same time each day keeps it going.", // CONFIRM run time + how it winds
  },
  {
    q: "Does it tick?",
    a: "Yes. It's a fully mechanical clock, so you'll hear a soft, steady tick. Most people love it, but light sleepers may want it outside the bedroom.",
  },
  {
    q: "How accurate is it?",
    a: "Like any pendulum clock, it can gain or lose a few minutes a week. Raising the pendulum makes it run faster; lowering it makes it run slower.", // CONFIRM: is the pendulum adjustable?
  },
  {
    q: "Does it arrive assembled?",
    a: "Yes. Every clock is assembled and tested by hand before it ships. You hang it, wind it, and give the pendulum a nudge.", // CONFIRM
  },
  {
    q: "When will my clock ship?",
    a: "Each clock is printed in your colors after you order. Most ship within 2–3 weeks.", // CONFIRM: lead time
  },
  {
    q: "Where do you ship?",
    a: "Anywhere in the United States, for now. Shipping is included in the price.",
  },
  {
    q: "Can I change my colors after ordering?",
    a: "Yes, as long as printing hasn't started. Get in touch soon after you order.", // CONFIRM + needs a contact email
  },
  {
    q: "What if something's wrong with it?",
    a: "If your clock arrives damaged or stops working because of a defect, we'll repair or replace it.", // CONFIRM: returns / warranty policy
  },
  {
    q: "How do I take care of it?",
    a: "PLA plastic softens with heat, so keep the clock out of direct sun and away from heaters. Dust it gently with a soft, dry brush.",
  },
  {
    q: "How can I pay?",
    a: "Card, Apple Pay, or pay-over-time options like Klarna and Affirm, all through Stripe's secure checkout. Have a promo code? Enter it at checkout.",
  },
];
