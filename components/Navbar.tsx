"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Menu, Save, X } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type AppScreen = "landing" | "quiz" | "results";
export type SaveState = "idle" | "saving" | "saved" | "unavailable";

export function Navbar({
  screen,
  sectionLabel,
  saveState,
  onSave,
  onNavigate,
}: {
  screen: AppScreen;
  sectionLabel: string;
  saveState: SaveState;
  onSave: () => void;
  onNavigate: (screen: AppScreen) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const saveLabel = saveState === "saved"
    ? "Salvo agora"
    : saveState === "saving"
      ? "Salvando"
      : saveState === "unavailable"
        ? "Apenas nesta sessão"
        : "Salvar progresso";

  return (
    <nav className="site-nav" aria-label="Navegação principal">
      <div className="nav-inner page-frame">
        <button type="button" className="brand-lockup brand-button" onClick={() => { onNavigate("landing"); closeMenu(); }} aria-label="snowfox AI, voltar para o início">
          <Image src={`${BASE}/fox-icon.png`} alt="" width={30} height={30} priority />
          <span>snowfox <b>AI</b></span>
        </button>

        <div className="nav-context">
          {screen === "landing" && <span className="nav-context-label">AI readiness studio</span>}
          {screen === "quiz" && <><span className="nav-context-label">Avaliação</span><span className="nav-context-divider" />{sectionLabel}</>}
          {screen === "results" && <span className="nav-context-label">Relatório de prontidão</span>}
        </div>

        <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(current => !current)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <div className={`nav-actions${menuOpen ? " is-open" : ""}`}>
          {screen === "landing" && (
            <>
              <a href="#how-it-works" onClick={closeMenu}>Como funciona</a>
              <a href="#landing-dimensions" onClick={closeMenu}>Dimensões</a>
              <button type="button" className="nav-cta" onClick={() => { onNavigate("quiz"); closeMenu(); }}>
                Iniciar avaliação <ArrowLeft size={14} aria-hidden="true" className="nav-cta-arrow" />
              </button>
            </>
          )}
          {screen === "quiz" && (
            <button type="button" className={`save-button${saveState === "saved" ? " is-saved" : ""}`} onClick={onSave} disabled={saveState === "saving"}>
              <Save size={15} aria-hidden="true" /> {saveLabel}
            </button>
          )}
          {screen === "results" && (
            <button type="button" className="nav-back-button" onClick={() => { onNavigate("landing"); closeMenu(); }}>
              <ArrowLeft size={15} aria-hidden="true" /> Voltar ao início
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
