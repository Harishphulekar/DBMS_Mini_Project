import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliShop - Intelligent Online Shopping",
  description:
    "An intelligent online shopping platform with semantic product search, cart, wishlist and personalized shopping experience.",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}