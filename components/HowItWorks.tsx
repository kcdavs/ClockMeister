// "How it works": the four stages power travels through, from the spring to the hands.
// Words in data/content.ts. The little squares use the accent colors, which follow the
// clock's colors, so they always match the matching part of the clock above.
import { STEPS } from "@/data/content";
import styles from "./Sections.module.css";

export default function HowItWorks() {
  return (
    <section id="how" className={styles.section}>
      <div className={styles.heading}>
        <p className="label">01 · How it works</p>
        <h2 className={styles.title}>From spring to hands, all in plain sight.</h2>
        <p className={styles.intro}>
          No batteries, no circuit board. Just four stages you can watch.
        </p>
      </div>
      <ol className={`${styles.body} ${styles.steps}`}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={styles.step}>
            <div className={`${styles.stepHead} label`}>
              <span className={styles.square} style={{ background: step.color }} aria-hidden="true" />
              {String(i + 1).padStart(2, "0")} · {step.part}
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.text}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
