"use client";

import { useState } from "react";
import Image from "next/image";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function Navbar({ screen, onSave }: { screen: "quiz" | "results"; onSave: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    onSave();
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[200] h-16"
      style={{ background: "rgba(5,1,22,0.86)", backdropFilter: "blur(28px)", boxShadow: "0 1px 0 rgba(255,255,255,0.06)" }}
      aria-label="Navegação principal"
    >
      <div style={{ maxWidth: "100%", paddingInline: "clamp(20px,4vw,72px)" }}>
        <div className="flex h-16 items-center justify-between">
          <a href="/" aria-label="Snowfox AI">
            <Image src={`${BASE}/logo-dark.png`} alt="Snowfox AI" width={120} height={28} style={{ height: 28, width: "auto" }} />
          </a>

          <button
            className="flex flex-col justify-center gap-[5px] w-10 h-10 rounded-lg p-1.5 md:hidden"
            style={{ background: menuOpen ? "rgba(255,255,255,0.06)" : "none" }}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(m => !m)}
          >
            {[22, 16, 22].map((w, i) => (
              <span key={i} className="block h-0.5 rounded-sm" style={{
                width: w,
                background: "rgba(255,255,255,0.80)",
                transition: "transform .22s ease, opacity .18s ease",
                transformOrigin: "center",
                transform: menuOpen && i === 0 ? "translateY(7px) rotate(45deg)" : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" : undefined,
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>

          <ul
            className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row items-start md:items-center list-none gap-0.5
              md:static absolute top-16 left-0 right-0
              md:bg-transparent md:border-0 md:p-0 md:shadow-none
            `}
            style={menuOpen ? { background: "rgba(5,1,22,0.97)", backdropFilter: "blur(28px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px 16px" } : {}}
            role="list"
          >
            {["Sobre","Serviços","Soluções","Casos de Sucesso","Fale com um especialista"].map(item => (
              <li key={item}>
                <a href="#" className="flex items-center gap-1 px-3.5 py-2 md:py-2 text-[14.5px] font-medium rounded-lg no-underline transition-colors w-full md:w-auto"
                  style={{ color: "rgba(255,255,255,0.76)", fontFamily: "Poppins, sans-serif" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.76)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >{item}</a>
              </li>
            ))}

            {screen === "quiz" && (
              <li>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 text-xs font-medium rounded-full min-h-[36px] px-4 py-1.5 transition-colors"
                  style={{
                    border: saved ? "1px solid rgba(110,231,183,0.35)" : "1px solid rgba(255,255,255,0.11)",
                    background: saved ? "rgba(110,231,183,0.06)" : "rgba(255,255,255,0.04)",
                    color: saved ? "#6ee7b7" : "rgba(210,198,255,0.82)",
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M13 14.5H3a1 1 0 01-1-1V2.5a1 1 0 011-1h8l3 3v9.5a1 1 0 01-1 1z"/>
                    <path d="M10.5 1.5V5.5H4V1.5M4 14.5v-5h8v5"/>
                  </svg>
                  {saved ? "Salvo" : "Salvar progresso"}
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
