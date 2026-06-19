import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content Intelligence Engine | AIO",
  description: "Find what competitors publish. Build what they missed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
