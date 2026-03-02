import type { Metadata } from "next";
import "./globals.css";
import { Providers } from '@/components/providers/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: "FrameVault — Cinematic Tracking Platform",
  description: "A cinematic tracking platform for modern film curation. Rate, review, and organize your collection.",
  keywords: ["movies", "tracking", "reviews", "ratings", "framevault", "film curation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
