import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderShell } from "@/components/site-header";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Aggie Connect", template: "%s · Aggie Connect" },
  description: "Where NC A&T students and alumni find each other.",
};

export const viewport: Viewport = {
  // Browser chrome: Aggie Blue in light mode, the dark surface in dark mode.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#004684" },
    { media: "(prefers-color-scheme: dark)", color: "#121a24" },
  ],
  // Lets the bottom tab bar reach the screen edge and pad itself with
  // env(safe-area-inset-bottom) above the iPhone home indicator.
  viewportFit: "cover",
  // Pinch-zoom in still works (for accessibility); zooming out past the
  // screen width doesn't, so the layout can't slide off-center.
  minimumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={<SiteHeaderShell />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted sm:py-6 sm:text-sm">
          Aggie Connect is a student project and is not affiliated with or
          endorsed by North Carolina A&amp;T State University or its alumni
          association.
        </footer>
      </body>
    </html>
  );
}
