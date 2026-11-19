import Link from "next/link";
import styles from "./SiteHeader.module.css";

// Top bar: wordmark, section links, and a red "Configure" cell.
// Link is Next.js's version of <a> for pages on our own site (it loads them faster).
// Section links point at the home page (/#details) so they also work from other pages.
export default function SiteHeader() {
  return (
    <header className={styles.header}>
      <span className={styles.square} aria-hidden="true" />
      <Link href="/" className={styles.wordmark}>
        ClockMeister
      </Link>
      <nav className={`${styles.nav} label`}>
        <Link href="/how-it-works">How it works</Link>
        <Link href="/#details">Details</Link>
      </nav>
      <Link href="/#configure" className={`${styles.cta} label`}>
        Configure
      </Link>
    </header>
  );
}
