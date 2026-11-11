import { ClockColorsProvider } from "@/components/ClockColors";
import Hero from "@/components/Hero";
import SiteHeader from "@/components/SiteHeader";

// The home page. Next.js turns this file (app/page.tsx) into the "/" route.
// ClockColorsProvider wraps everything so any part of the page can read or change the clock colors.
export default function Home() {
  return (
    <ClockColorsProvider>
      <SiteHeader />
      <main>
        <Hero />
        {/* Temporary filler so there's something to scroll to; replaced by real sections in Stage 4 */}
        <section id="how" style={{ padding: "4rem 2.5rem", minHeight: "60vh" }}>
          <h2>How it works</h2>
          <p>More sections coming soon.</p>
        </section>
      </main>
    </ClockColorsProvider>
  );
}
