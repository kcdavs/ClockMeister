import ClockViewer from "@/components/ClockViewer";

// The home page. Next.js turns this file (app/page.tsx) into the "/" route.
export default function Home() {
  return (
    <main>
      <h1 style={{ padding: "2rem 2rem 0" }}>ClockMeister</h1>
      {/* The 3D canvas fills whatever box it's placed in, so the box needs a height */}
      <div style={{ height: "80vh" }}>
        <ClockViewer />
      </div>
      {/* Temporary filler so there's something to scroll to; replaced by real sections in Stage 4 */}
      <section style={{ padding: "2rem", minHeight: "60vh" }}>
        <h2>How it works</h2>
        <p>More sections coming soon.</p>
      </section>
    </main>
  );
}
