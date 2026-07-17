import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./LanguageContext";

export const metadata: Metadata = {
  title: "Avaliação de Prontidão para IA | Snowfox AI",
  description: "Avalie o quão preparada sua organização está para adotar, escalar e gerar valor de negócio mensurável com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href="/fox-icon.png" />
        <link rel="apple-touch-icon" href="/fox-icon.png" />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
