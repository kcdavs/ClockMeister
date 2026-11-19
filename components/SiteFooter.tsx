import Link from "next/link";
import { FOOTER_LINKS } from "@/data/content";
import styles from "./SiteFooter.module.css";

// Bottom band on every page (added in app/layout.tsx): wordmark, links, small print.
// Links without a destination yet (FOOTER_LINKS in data/content.ts) show grayed out as "soon".
export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <span className={styles.square} aria-hidden="true" />
      <Link href="/" className={styles.wordmark}>
        ClockMeister
      </Link>
      <nav className={`${styles.links} label`} aria-label="Footer">
        {FOOTER_LINKS.map(({ label, href }) =>
          href ? (
            <Link key={label} href={href} {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}>
              {label}
            </Link>
          ) : (
            <span key={label} className={styles.soon}>
              {label} <small>soon</small>
            </span>
          ),
        )}
      </nav>
      {/* Fixed year (the year the site launched); reading today's date would stop Next.js pre-building pages */}
      <p className={`${styles.fine} label`}>© 2026 ClockMeister</p>
    </footer>
  );
}
