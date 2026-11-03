import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliShop — Curated Intelligent Commerce",
  description:
    "An intelligent online shopping platform with vector semantic search, cart, wishlist, and personalized recommendations.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#F7F5F0]">
      <body className="min-h-screen bg-[#F7F5F0] text-[#25231F] selection:bg-[#9B8065]/20 selection:text-[#25231F]">
        {children}
      </body>
    </html>
  );
}
