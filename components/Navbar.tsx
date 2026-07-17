"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Save } from "lucide-react";
import { useLanguage } from "@/app/LanguageContext";

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
  const { lang, toggleLang, t } = useLanguage();

  const closeMenu = () => setMenuOpen(false);
  const saveLabel = saveState === "saved"
    ? t.nav.saveSaved
    : saveState === "saving"
      ? t.nav.saveSaving
      : saveState === "unavailable"
        ? t.nav.saveUnavailable
        : t.nav.saveIdle;

  return (
    <nav className="site-nav" aria-label={t.nav.mainNavLabel}>
      <div className="nav-inner page-frame">
        <button type="button" className="brand-lockup brand-button" onClick={() => { onNavigate("landing"); closeMenu(); }} aria-label={t.nav.backToHome}>
          <Image src={`${BASE}/fox-icon.png`} alt="" width={30} height={30} priority />
          <span>snowfox <b>AI</b></span>
        </button>

        <div className="nav-context">
          {screen === "landing" && <span className="nav-context-label">{t.nav.contextLanding}</span>}
          {screen === "quiz" && <><span className="nav-context-label">{t.nav.contextQuiz}</span><span className="nav-context-divider" />{sectionLabel}</>}
          {screen === "results" && <span className="nav-context-label">{t.nav.contextResults}</span>}
        </div>

        <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen(current => !current)} aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu} aria-expanded={menuOpen}>
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>

        <div className={`nav-actions${menuOpen ? " is-open" : ""}`}>
          {screen === "landing" && (
            <>
              <a href="#how-it-works" onClick={closeMenu}>{t.nav.howItWorks}</a>
              <a href="#landing-dimensions" onClick={closeMenu}>{t.nav.dimensions}</a>
              <button type="button" className="nav-cta" onClick={() => { onNavigate("quiz"); closeMenu(); }}>
                {t.nav.startAssessment} <ArrowLeft size={14} aria-hidden="true" className="nav-cta-arrow" />
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
              <ArrowLeft size={15} aria-hidden="true" /> {t.nav.backToStart}
            </button>
          )}
          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label={t.nav.langToggleLabel}
            title={t.nav.langToggleLabel}
          >
            <span className={lang === "pt" ? "is-active" : ""}>PT</span>
            <span className={lang === "en" ? "is-active" : ""}>EN</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
