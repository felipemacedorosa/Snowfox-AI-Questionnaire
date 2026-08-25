import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./LanguageContext";

// The app is served from a sub-path in production (/assessments/ai-readiness).
// A root-absolute icon href resolves against the domain root instead, where
// nothing is served, so the favicon must carry the base path like every other
// static asset. Navbar.tsx and ResultsScreen.tsx already do this.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Avaliação de Prontidão para IA | Snowfox AI",
  description: "Avalie o quão preparada sua organização está para adotar, escalar e gerar valor de negócio mensurável com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href={`${BASE}/fox-icon.png`} />
        <link rel="apple-touch-icon" href={`${BASE}/fox-icon.png`} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
