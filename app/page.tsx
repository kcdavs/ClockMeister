import { ClockColorsProvider } from "@/components/ClockColors";
import Details from "@/components/Details";
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
        {/* "Before you buy": size, setup, shipping (words in data/content.ts) */}
        <Details />
      </main>
    </ClockColorsProvider>
  );
}
