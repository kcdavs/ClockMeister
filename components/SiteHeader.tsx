import Link from "next/link";
import styles from "./SiteHeader.module.css";

// Top bar: wordmark, section links, and a red "Configure" cell.
// Link is Next.js's version of <a> for pages on our own site (it loads them faster);
// plain <a> is fine for jumping to a section on the same page (#how).
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.square} aria-hidden="true" />
      <Link href="/" className={styles.wordmark}>
        ClockMeister
      </Link>
      <nav className={`${styles.nav} label`}>
        <a href="#how">How it works</a>
        <a href="#specs">Specs</a>
      </nav>
      <a href="#configure" className={`${styles.cta} label`}>
        Configure
      </a>
    </header>
  );
}
