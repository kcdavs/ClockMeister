import ClockViewer from "./ClockViewer";
import styles from "./Hero.module.css";

const SPECS = [
  "$350",
  "Spring driven",
  "Deadbeat escapement",
  "Four-wheel train",
  "3D printed, hand assembled",
];

// The first screen: a narrow column on the left (headline, specs, an empty cell reserved
// for a background illustration, and color blocks), and the live 3D clock on the right,
// taking 75% of the width and running taller than the screen so scrolling reveals the pendulum.
export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.intro}>
        <p className="label">Mechanical pendulum clock · No. 01</p>
        <h1 className={styles.title}>A clock you can watch think.</h1>
        <p className={styles.lede}>
          Every gear on display. 3D printed in the colors you choose, assembled
          by hand, and simple enough to understand at a glance.
        </p>
        <a href="#configure" className={`${styles.button} label`}>
          Configure yours →
        </a>
      </div>

      <ul className={`${styles.specs} label`}>
        {SPECS.map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>

      {/* Reserved for the "window" background illustration */}
      <div className={styles.window} aria-hidden="true" />

      <div className={styles.block} aria-hidden="true" />
      <div className={styles.blueBlock} aria-hidden="true" />
      <div className={styles.spacer} aria-hidden="true" />

      {/* Click any part of the clock to change its color (see ClockViewer / PartPicker) */}
      <div className={styles.viewer} id="configure">
        <ClockViewer />
      </div>
    </section>
  );
}
