// "Before you buy": the few things a buyer needs to know, as a simple list.
// Words in data/content.ts.
import Link from "next/link";
import { DETAILS, INSTALL_VIDEO_URL } from "@/data/content";
import styles from "./Sections.module.css";

export default function Details() {
  return (
    <section id="details" className={styles.section}>
      <div className={styles.heading}>
        <p className="label">Before you buy</p>
        <h2 className={styles.title}>What to expect.</h2>
        <Link href="/how-it-works" className={`${styles.more} label`}>
          How it works →
        </Link>
      </div>
      <div className={styles.body}>
        <dl className={styles.rows}>
          {DETAILS.map(([name, value]) => (
            <div key={name} className={styles.row}>
              <dt className="label">{name}</dt>
              <dd>
                {value}
                {name === "Setup" && INSTALL_VIDEO_URL && (
                  <>
                    {" "}
                    <a href={INSTALL_VIDEO_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Watch the install video →
                    </a>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
