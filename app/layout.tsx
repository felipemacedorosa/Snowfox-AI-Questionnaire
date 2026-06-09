import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Readiness Assessment | Snowfox AI",
  description: "Evaluate how prepared your organization is to adopt, scale, and generate measurable business value from AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/fox-icon.png" />
        <link rel="apple-touch-icon" href="/fox-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
