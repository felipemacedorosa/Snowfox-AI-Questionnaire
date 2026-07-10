import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Avaliação de Prontidão para IA | Snowfox AI",
  description: "Avalie o quão preparada sua organização está para adotar, escalar e gerar valor de negócio mensurável com IA.",
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href={`${BASE}/fox-icon.png`} />
        <link rel="apple-touch-icon" href={`${BASE}/fox-icon.png`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
