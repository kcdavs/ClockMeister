import { ClockColorsProvider } from "@/components/ClockColors";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import SiteHeader from "@/components/SiteHeader";
import Specs from "@/components/Specs";

// The home page. Next.js turns this file (app/page.tsx) into the "/" route.
// ClockColorsProvider wraps everything so any part of the page can read or change the clock colors.
export default function Home() {
  return (
    <ClockColorsProvider>
      <SiteHeader />
      <main>
        <Hero />
        {/* Content sections; their words live in data/content.ts */}
        <HowItWorks />
        <Specs />
        <Faq />
      </main>
    </ClockColorsProvider>
  );
}
