import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Jost } from "next/font/google";
import "./globals.css";

// Fonts are downloaded at build time and served from our own site (fast, no Google request).
// Each one is exposed as a CSS variable that globals.css plugs into --font-sans / --font-mono.
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

// Text shown in the browser tab and in search results / link previews.
export const metadata: Metadata = {
  title: "ClockMeister",
  description: "A 3D-printed mechanical pendulum clock you configure yourself.",
};

// Tints the browser toolbar (Safari, phones) burgundy, matching --red in globals.css.
export const viewport: Viewport = {
  themeColor: "#9b1c2e",
};

// The root layout wraps every page on the site. {children} is the page itself.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
