import type { Metadata } from "next";
import "./globals.css";

// Text shown in the browser tab and in search results / link previews.
export const metadata: Metadata = {
  title: "ClockMeister",
  description: "A 3D-printed mechanical pendulum clock you configure yourself.",
};

// The root layout wraps every page on the site. {children} is the page itself.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
