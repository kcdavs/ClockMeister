// "Questions": click a question to open its answer. Words (including shipping) in
// data/content.ts. <details> is built into the browser, so this needs no JavaScript.
import { FAQ } from "@/data/content";
import styles from "./Sections.module.css";

export default function Faq() {
  return (
    <section id="faq" className={styles.section}>
      <div className={styles.heading}>
        <p className="label">03 · Questions</p>
        <h2 className={styles.title}>Good to know.</h2>
        <p className={styles.intro}>Winding, shipping, care, and everything else.</p>
      </div>
      <div className={styles.body}>
        <div className={styles.rows}>
          {FAQ.map(({ q, a }) => (
            <details key={q} className={styles.question}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
