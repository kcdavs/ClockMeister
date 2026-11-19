// /how-it-works: the clock's mechanism explained in four steps (words in data/content.ts).
import type { Metadata } from "next";
import HowItWorks from "@/components/HowItWorks";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "How it works · ClockMeister",
  description: "How a spring-driven pendulum clock with a deadbeat escapement keeps time.",
};

export default function HowItWorksPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HowItWorks />
      </main>
    </>
  );
}
