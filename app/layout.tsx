import type { Metadata } from "next";
import "./globals.css";
import "../components/game/BugBrawler.css";

export const metadata: Metadata = {
  title: "Bug Brawler",
  description: "A wave-based bug hunting action game.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
