import type { Metadata } from "next";
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
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          Aggie Connect is a student project and is not affiliated with or
          endorsed by North Carolina A&amp;T State University or its alumni
          association.
        </footer>
      </body>
    </html>
  );
}
