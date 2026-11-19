// "Specs": a simple two-column table. Words in data/content.ts.
import { SPECS } from "@/data/content";
import styles from "./Sections.module.css";

export default function Specs() {
  return (
    <section id="specs" className={styles.section}>
      <div className={styles.heading}>
        <p className="label">02 · Specs</p>
        <h2 className={styles.title}>The numbers.</h2>
      </div>
      <div className={styles.body}>
        <dl className={styles.rows}>
          {SPECS.map(([name, value]) => (
            <div key={name} className={styles.row}>
              <dt className="label">{name}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
